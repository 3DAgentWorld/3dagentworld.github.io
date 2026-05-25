#!/usr/bin/env python3
"""Convert HorizonStream GLB point-cloud comparisons to Viser playback files.

The generated .viser files are gzip-compressed MessagePack payloads consumed by
the bundled Viser client in ../vggt4d/viser.html via ?playbackPath=...
"""

from __future__ import annotations

import argparse
import gzip
import json
import math
import struct
import sys
from array import array
from pathlib import Path
from typing import Any


COMPONENT_FORMAT = {
    5120: ("b", 1),
    5121: ("B", 1),
    5122: ("h", 2),
    5123: ("H", 2),
    5125: ("I", 4),
    5126: ("f", 4),
}
TYPE_SIZE = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}


def pack_msgpack(value: Any, out: bytearray) -> None:
    if value is None:
        out.append(0xC0)
    elif value is False:
        out.append(0xC2)
    elif value is True:
        out.append(0xC3)
    elif isinstance(value, int):
        if value >= 0:
            if value <= 0x7F:
                out.append(value)
            elif value <= 0xFF:
                out.extend((0xCC, value))
            elif value <= 0xFFFF:
                out.append(0xCD)
                out.extend(struct.pack(">H", value))
            elif value <= 0xFFFFFFFF:
                out.append(0xCE)
                out.extend(struct.pack(">I", value))
            else:
                out.append(0xCF)
                out.extend(struct.pack(">Q", value))
        else:
            if value >= -32:
                out.append(0x100 + value)
            elif value >= -128:
                out.append(0xD0)
                out.extend(struct.pack(">b", value))
            elif value >= -32768:
                out.append(0xD1)
                out.extend(struct.pack(">h", value))
            elif value >= -2147483648:
                out.append(0xD2)
                out.extend(struct.pack(">i", value))
            else:
                out.append(0xD3)
                out.extend(struct.pack(">q", value))
    elif isinstance(value, float):
        out.append(0xCB)
        out.extend(struct.pack(">d", value))
    elif isinstance(value, str):
        data = value.encode("utf-8")
        n = len(data)
        if n <= 31:
            out.append(0xA0 | n)
        elif n <= 0xFF:
            out.extend((0xD9, n))
        elif n <= 0xFFFF:
            out.append(0xDA)
            out.extend(struct.pack(">H", n))
        else:
            out.append(0xDB)
            out.extend(struct.pack(">I", n))
        out.extend(data)
    elif isinstance(value, (bytes, bytearray, memoryview)):
        data = bytes(value)
        n = len(data)
        if n <= 0xFF:
            out.extend((0xC4, n))
        elif n <= 0xFFFF:
            out.append(0xC5)
            out.extend(struct.pack(">H", n))
        else:
            out.append(0xC6)
            out.extend(struct.pack(">I", n))
        out.extend(data)
    elif isinstance(value, (list, tuple)):
        n = len(value)
        if n <= 15:
            out.append(0x90 | n)
        elif n <= 0xFFFF:
            out.append(0xDC)
            out.extend(struct.pack(">H", n))
        else:
            out.append(0xDD)
            out.extend(struct.pack(">I", n))
        for item in value:
            pack_msgpack(item, out)
    elif isinstance(value, dict):
        n = len(value)
        if n <= 15:
            out.append(0x80 | n)
        elif n <= 0xFFFF:
            out.append(0xDE)
            out.extend(struct.pack(">H", n))
        else:
            out.append(0xDF)
            out.extend(struct.pack(">I", n))
        for key, item in value.items():
            pack_msgpack(key, out)
            pack_msgpack(item, out)
    else:
        raise TypeError(f"Unsupported MessagePack value: {type(value)!r}")


def parse_glb(path: Path) -> tuple[dict[str, Any], bytes]:
    data = path.read_bytes()
    if data[:4] != b"glTF":
        raise ValueError(f"{path} is not a GLB file")

    offset = 12
    gltf = None
    binary = None
    while offset < len(data):
        length, chunk_type = struct.unpack_from("<II", data, offset)
        offset += 8
        chunk = data[offset : offset + length]
        offset += length
        if chunk_type == 0x4E4F534A:
            gltf = json.loads(chunk)
        elif chunk_type == 0x004E4942:
            binary = bytes(chunk)

    if gltf is None or binary is None:
        raise ValueError(f"{path} is missing JSON or BIN chunks")
    return gltf, binary


def accessor_layout(gltf: dict[str, Any], accessor_index: int) -> tuple[dict[str, Any], dict[str, Any], int, int, int, str, int]:
    accessor = gltf["accessors"][accessor_index]
    view = gltf["bufferViews"][accessor["bufferView"]]
    component_type = accessor["componentType"]
    fmt, component_size = COMPONENT_FORMAT[component_type]
    item_size = TYPE_SIZE[accessor["type"]]
    byte_offset = (view.get("byteOffset") or 0) + (accessor.get("byteOffset") or 0)
    stride = view.get("byteStride") or component_size * item_size
    return accessor, view, byte_offset, stride, item_size, fmt, component_size


def read_float_vec3(gltf: dict[str, Any], binary: bytes, accessor_index: int) -> array:
    accessor, _view, offset, stride, item_size, fmt, component_size = accessor_layout(gltf, accessor_index)
    if accessor["componentType"] != 5126 or item_size < 3:
        raise ValueError("Expected FLOAT VEC3 positions")

    count = accessor["count"]
    values = array("f")
    if item_size == 3 and stride == 3 * component_size:
        values.frombytes(binary[offset : offset + count * 12])
        return values

    unpacker = struct.Struct("<" + fmt * item_size)
    for i in range(count):
        values.extend(unpacker.unpack_from(binary, offset + i * stride)[:3])
    return values


def read_indices(gltf: dict[str, Any], binary: bytes, accessor_index: int) -> list[int]:
    accessor, _view, offset, stride, item_size, fmt, component_size = accessor_layout(gltf, accessor_index)
    if item_size != 1:
        raise ValueError("Expected scalar indices")
    count = accessor["count"]
    if stride == component_size:
        unpacker = struct.Struct("<" + fmt * count)
        return list(unpacker.unpack_from(binary, offset))
    unpacker = struct.Struct("<" + fmt)
    return [int(unpacker.unpack_from(binary, offset + i * stride)[0]) for i in range(count)]


def read_rgb_bytes(gltf: dict[str, Any], binary: bytes, accessor_index: int, count: int) -> bytes:
    accessor, _view, offset, stride, item_size, fmt, component_size = accessor_layout(gltf, accessor_index)
    component_type = accessor["componentType"]

    if component_type == 5121 and item_size == 3 and stride == 3:
        return binary[offset : offset + count * 3]

    colors = bytearray(count * 3)
    unpacker = struct.Struct("<" + fmt * item_size)
    for i in range(count):
        raw = unpacker.unpack_from(binary, offset + i * stride)
        for j in range(3):
            value = raw[j] if j < len(raw) else raw[-1]
            if component_type == 5126:
                value = max(0.0, min(1.0, float(value))) * 255.0
            colors[i * 3 + j] = max(0, min(255, int(round(value))))
    return bytes(colors)


def bounds_from_positions(values: array) -> tuple[list[float], list[float]]:
    mins = [math.inf, math.inf, math.inf]
    maxs = [-math.inf, -math.inf, -math.inf]
    for i in range(0, len(values), 3):
        x, y, z = float(values[i]), float(values[i + 1]), float(values[i + 2])
        if x < mins[0]:
            mins[0] = x
        if y < mins[1]:
            mins[1] = y
        if z < mins[2]:
            mins[2] = z
        if x > maxs[0]:
            maxs[0] = x
        if y > maxs[1]:
            maxs[1] = y
        if z > maxs[2]:
            maxs[2] = z
    return mins, maxs


def expand_line_segments(positions: array, mode: int, indices: list[int] | None) -> array:
    if indices is not None:
        ordered = array("f")
        for index in indices:
            base = index * 3
            ordered.extend(positions[base : base + 3])
        positions = ordered

    segments = array("f")
    point_count = len(positions) // 3
    if mode == 1:
        usable = point_count - (point_count % 2)
        segments.extend(positions[: usable * 3])
    elif mode == 3:
        for i in range(max(0, point_count - 1)):
            a = i * 3
            b = (i + 1) * 3
            segments.extend(positions[a : a + 3])
            segments.extend(positions[b : b + 3])
    return segments


def line_color_for_path(path: Path) -> tuple[int, int, int]:
    if path.stem == "ours":
        return (0, 230, 170)
    if path.stem == "lingbot-map":
        return (47, 111, 237)
    return (245, 142, 44)


def point_size_for_radius(radius: float) -> float:
    return max(0.035, radius * 0.003)


def convert_glb_to_viser(path: Path, output: Path) -> tuple[int, int]:
    gltf, binary = parse_glb(path)
    messages: list[list[Any]] = [
        [0.0, {"type": "SetSceneNodeVisibilityMessage", "name": "/WorldAxes", "visible": False}],
        [0.0, {"type": "BackgroundImageMessage", "format": "png", "rgb_data": None, "depth_data": None}],
    ]

    merged_mins = [math.inf, math.inf, math.inf]
    merged_maxs = [-math.inf, -math.inf, -math.inf]
    point_count_total = 0
    line_count_total = 0
    line_color = line_color_for_path(path)

    for mesh_index, mesh in enumerate(gltf.get("meshes", [])):
        for prim_index, primitive in enumerate(mesh.get("primitives", [])):
            attrs = primitive.get("attributes", {})
            position_accessor = attrs.get("POSITION")
            if position_accessor is None:
                continue

            mode = primitive.get("mode", 4)
            positions = read_float_vec3(gltf, binary, position_accessor)
            indices = read_indices(gltf, binary, primitive["indices"]) if "indices" in primitive else None

            if mode == 0:
                count = len(positions) // 3
                point_count_total += count
                mins, maxs = bounds_from_positions(positions)
                for i in range(3):
                    merged_mins[i] = min(merged_mins[i], mins[i])
                    merged_maxs[i] = max(merged_maxs[i], maxs[i])

                color_accessor = attrs.get("COLOR_0")
                colors = (
                    read_rgb_bytes(gltf, binary, color_accessor, count)
                    if color_accessor is not None
                    else bytes((235, 245, 255)) * count
                )
                name = "/point_cloud" if point_count_total == count else f"/point_cloud_{mesh_index}_{prim_index}"
                radius = math.sqrt(sum((merged_maxs[i] - merged_mins[i]) ** 2 for i in range(3))) * 0.5
                messages.extend(
                    [
                        [
                            0.0,
                            {
                                "type": "PointCloudMessage",
                                "name": name,
                                "props": {
                                    "points": positions.tobytes(),
                                    "colors": colors,
                                    "point_size": point_size_for_radius(radius),
                                    "point_shape": "rounded",
                                    "precision": "float32",
                                },
                            },
                        ],
                        [0.0, {"type": "SetSceneNodeVisibilityMessage", "name": name, "visible": True}],
                    ]
                )
            elif mode in (1, 3):
                segments = expand_line_segments(positions, mode, indices)
                if not segments:
                    continue
                segment_vertices = len(segments) // 3
                colors = bytes(line_color) * segment_vertices
                name = f"/camera_pose_{line_count_total}"
                line_count_total += segment_vertices // 2
                messages.extend(
                    [
                        [
                            0.0,
                            {
                                "type": "LineSegmentsMessage",
                                "name": name,
                                "props": {
                                    "points": segments.tobytes(),
                                    "colors": colors,
                                    "line_width": 3.0 if path.stem == "ours" else 2.4,
                                },
                            },
                        ],
                        [0.0, {"type": "SetSceneNodeVisibilityMessage", "name": name, "visible": True}],
                    ]
                )

    if point_count_total == 0:
        raise ValueError(f"No POINTS primitives found in {path}")

    center = [(merged_mins[i] + merged_maxs[i]) * 0.5 for i in range(3)]
    diag = math.sqrt(sum((merged_maxs[i] - merged_mins[i]) ** 2 for i in range(3)))
    radius = max(diag * 0.5, 1.0)
    distance = radius * 2.0
    camera_position = [
        center[0] + distance * 0.85,
        center[1] + distance * 0.45,
        center[2] + distance * 0.9,
    ]
    messages.extend(
        [
            [0.0, {"type": "SetCameraNearMessage", "near": max(0.01, radius / 10000.0)}],
            [0.0, {"type": "SetCameraFarMessage", "far": max(1000.0, radius * 12.0)}],
            [0.0, {"type": "SetCameraFovMessage", "fov": math.radians(56.0)}],
            [0.0, {"type": "SetCameraLookAtMessage", "look_at": center}],
            [0.0, {"type": "SetCameraPositionMessage", "position": camera_position}],
        ]
    )

    payload = {
        "durationSeconds": 0.0,
        "messages": messages,
        "viserVersion": "1.0.13",
    }
    packed = bytearray()
    pack_msgpack(payload, packed)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(gzip.compress(bytes(packed), compresslevel=6))
    return point_count_total, line_count_total


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "paths",
        nargs="*",
        type=Path,
        help="GLB files or directories. Directories are searched recursively for full .glb files.",
    )
    parser.add_argument("--overwrite", action="store_true", help="Regenerate existing .viser files.")
    args = parser.parse_args()

    inputs = args.paths or [Path(__file__).resolve().parents[1] / "example" / "qualitative"]
    glbs: list[Path] = []
    for item in inputs:
        if item.is_dir():
            glbs.extend(path for path in item.rglob("*.glb") if not path.name.endswith(".web.glb"))
        elif item.suffix == ".glb" and not item.name.endswith(".web.glb"):
            glbs.append(item)

    if not glbs:
        print("No full .glb files found.", file=sys.stderr)
        return 1

    for glb in sorted(glbs):
        output = glb.with_suffix(".viser")
        if output.exists() and not args.overwrite:
            print(f"skip {output}")
            continue
        points, lines = convert_glb_to_viser(glb, output)
        print(f"{output}: {points:,} points, {lines:,} line segments")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
