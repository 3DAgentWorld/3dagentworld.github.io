#!/usr/bin/env python3
"""Build GLB files for the HorizonStream comparison viewer.

Usage:
    python scripts/build_glbs.py          # rebuild all
    python scripts/build_glbs.py kitti07  # rebuild one scene
"""

import struct, json, sys, os
import numpy as np

BASELINE = "/Users/cc/Downloads/horizon-stream/horizon-stream/baseline"
OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "example", "qualitative")

MAX_POINTS = 1_000_000
SKY_Y_THRESHOLD = 0.4  # in glTF coords (after Y flip), filter points with Y > this AND bright color

SCENES = {
    "kitti07": {
        "ours":        f"{BASELINE}/ours/kitti/kitti_4kda_lc/07/02",
        "longstream":  f"{BASELINE}/longstream/kitti/07",
        "lingbot-map": f"{BASELINE}/lingbot-map/kitti/07",
    },
    "kitti09": {
        "ours":        f"{BASELINE}/ours/kitti/kitti_4kda_lc/09/02",
        "longstream":  f"{BASELINE}/longstream/kitti/09",
        "lingbot-map": f"{BASELINE}/lingbot-map/kitti/09",
    },
    "oxford-college": {
        "ours":        f"{BASELINE}/ours/oxford/2024-03-12-keble-college-05",
        "longstream":  f"{BASELINE}/longstream/oxford/2024-03-12-keble-college-05",
        "lingbot-map": f"{BASELINE}/lingbot-map/oxford_spires/2024-03-12-keble-college-05",
    },
}

TRAJ_COLORS = {
    "ours":        [0.0, 0.90, 0.67, 1.0],   # teal
    "longstream":  [0.96, 0.56, 0.17, 1.0],   # orange
    "lingbot-map": [0.18, 0.44, 0.93, 1.0],   # blue
}


def read_ply(path):
    """Read binary PLY with x,y,z,r,g,b."""
    with open(path, "rb") as f:
        header = b""
        vertex_count = 0
        while True:
            line = f.readline()
            header += line
            if b"element vertex" in line:
                vertex_count = int(line.split()[-1])
            if b"end_header" in line:
                break
        dt = np.dtype([("x", "<f4"), ("y", "<f4"), ("z", "<f4"),
                        ("r", "u1"), ("g", "u1"), ("b", "u1")])
        data = np.frombuffer(f.read(vertex_count * dt.itemsize), dtype=dt)
    positions = np.column_stack([data["x"], data["y"], data["z"]])
    colors = np.column_stack([data["r"], data["g"], data["b"]])
    return positions, colors


def read_poses(path):
    """Read w2c poses → camera positions in world coords."""
    positions = []
    with open(path) as f:
        for line in f:
            if line.startswith("#"):
                continue
            parts = line.strip().split()
            if len(parts) < 13:
                continue
            vals = [float(x) for x in parts[1:]]
            R = np.array(vals[:9]).reshape(3, 3)
            t = np.array(vals[9:12])
            # w2c: cam_pos = -R^T @ t
            cam_pos = -R.T @ t
            positions.append(cam_pos)
    return np.array(positions, dtype=np.float32)


def flip_y(positions):
    """Camera coords (Y-down) → glTF coords (Y-up): negate Y."""
    out = positions.copy()
    out[:, 1] = -out[:, 1]
    return out


def filter_sky(positions, colors, threshold=SKY_Y_THRESHOLD):
    """Remove sky points: high Y (above camera) AND bright color."""
    high_y = positions[:, 1] > threshold
    brightness = colors[:, 0].astype(int) + colors[:, 1].astype(int) + colors[:, 2].astype(int)
    bright = brightness > 550
    sky_mask = high_y & bright
    keep = ~sky_mask
    return positions[keep], colors[keep]


def subsample(positions, colors, max_points=MAX_POINTS):
    """Stride-based subsampling."""
    if len(positions) <= max_points:
        return positions, colors
    stride = max(1, len(positions) // max_points)
    idx = np.arange(0, len(positions), stride)[:max_points]
    return positions[idx], colors[idx]


def build_glb(points_pos, points_col, traj_pos, traj_color, frustum_pos=None, frustum_color=None):
    """Build a GLB binary from point cloud + trajectory data."""
    # Prepare binary buffers
    buffers = []
    accessors = []
    buffer_views = []
    meshes = []
    nodes = []
    materials = []
    current_offset = 0

    def add_buffer_view(data_bytes):
        nonlocal current_offset
        bv_index = len(buffer_views)
        buffer_views.append({
            "buffer": 0,
            "byteOffset": current_offset,
            "byteLength": len(data_bytes),
        })
        buffers.append(data_bytes)
        current_offset += len(data_bytes)
        return bv_index

    def add_accessor(bv_index, component_type, count, acc_type, min_val=None, max_val=None):
        acc_index = len(accessors)
        acc = {
            "bufferView": bv_index,
            "componentType": component_type,
            "count": count,
            "type": acc_type,
        }
        if min_val is not None:
            acc["min"] = min_val
        if max_val is not None:
            acc["max"] = max_val
        accessors.append(acc)
        return acc_index

    # --- Point cloud ---
    pos_data = points_pos.astype(np.float32).tobytes()
    pos_bv = add_buffer_view(pos_data)
    pos_acc = add_accessor(pos_bv, 5126, len(points_pos), "VEC3",
                           points_pos.min(axis=0).tolist(),
                           points_pos.max(axis=0).tolist())

    col_data = points_col.astype(np.uint8).tobytes()
    col_bv = add_buffer_view(col_data)
    col_acc = add_accessor(col_bv, 5121, len(points_col), "VEC3")

    meshes.append({
        "name": "PointCloud",
        "primitives": [{
            "mode": 0,
            "attributes": {"POSITION": pos_acc, "COLOR_0": col_acc},
        }],
    })
    nodes.append({"name": "PointCloud", "mesh": 0})

    # --- Trajectory ---
    if traj_pos is not None and len(traj_pos) > 1:
        traj_data = traj_pos.astype(np.float32).tobytes()
        traj_bv = add_buffer_view(traj_data)
        traj_acc = add_accessor(traj_bv, 5126, len(traj_pos), "VEC3",
                                traj_pos.min(axis=0).tolist(),
                                traj_pos.max(axis=0).tolist())

        mat_index = len(materials)
        materials.append({
            "name": "TrajectoryMat",
            "pbrMetallicRoughness": {
                "baseColorFactor": traj_color,
                "metallicFactor": 0.0,
                "roughnessFactor": 1.0,
            },
        })

        meshes.append({
            "name": "CameraTrajectory",
            "primitives": [{
                "mode": 3,  # LINE_STRIP
                "attributes": {"POSITION": traj_acc},
                "material": mat_index,
            }],
        })
        nodes.append({"name": "CameraTrajectory", "mesh": 1})

    # --- Build glTF JSON ---
    total_bin_length = current_offset
    gltf = {
        "asset": {"version": "2.0", "generator": "HorizonStream/build_glbs"},
        "scene": 0,
        "scenes": [{"nodes": list(range(len(nodes)))}],
        "nodes": nodes,
        "meshes": meshes,
        "accessors": accessors,
        "bufferViews": buffer_views,
        "buffers": [{"byteLength": total_bin_length}],
    }
    if materials:
        gltf["materials"] = materials

    json_str = json.dumps(gltf, separators=(",", ":"))
    # Pad JSON to 4-byte alignment
    while len(json_str) % 4 != 0:
        json_str += " "
    json_bytes = json_str.encode("utf-8")

    # Concatenate binary buffer
    bin_bytes = b"".join(buffers)
    # Pad binary to 4-byte alignment
    while len(bin_bytes) % 4 != 0:
        bin_bytes += b"\x00"

    # GLB header
    total_length = 12 + 8 + len(json_bytes) + 8 + len(bin_bytes)
    header = struct.pack("<III", 0x46546C67, 2, total_length)
    json_chunk = struct.pack("<II", len(json_bytes), 0x4E4F534A) + json_bytes
    bin_chunk = struct.pack("<II", len(bin_bytes), 0x004E4942) + bin_bytes

    return header + json_chunk + bin_chunk


def patch_existing_glb(path, out_path=None):
    """Read an existing GLB and flip Y in all position accessors."""
    with open(path, "rb") as f:
        data = f.read()

    view = memoryview(bytearray(data))
    magic, version, length = struct.unpack_from("<III", view, 0)
    if magic != 0x46546C67:
        raise ValueError(f"Not a GLB: {path}")

    offset = 12
    json_chunk = None
    bin_offset = None
    bin_length = None

    while offset < len(data):
        chunk_len, chunk_type = struct.unpack_from("<II", view, offset)
        offset += 8
        if chunk_type == 0x4E4F534A:
            json_chunk = json.loads(bytes(view[offset:offset + chunk_len]))
        elif chunk_type == 0x004E4942:
            bin_offset = offset
            bin_length = chunk_len
        offset += chunk_len

    if not json_chunk or bin_offset is None:
        raise ValueError(f"Missing chunks in {path}")

    buf = bytearray(data)

    # Flip Y for all VEC3 float32 position accessors
    for mesh in json_chunk["meshes"]:
        for prim in mesh["primitives"]:
            pos_idx = prim["attributes"].get("POSITION")
            if pos_idx is None:
                continue
            acc = json_chunk["accessors"][pos_idx]
            if acc["type"] != "VEC3" or acc["componentType"] != 5126:
                continue
            bv = json_chunk["bufferViews"][acc["bufferView"]]
            bv_off = bv.get("byteOffset", 0) + acc.get("byteOffset", 0)
            abs_off = bin_offset + bv_off
            count = acc["count"]
            for i in range(count):
                y_off = abs_off + i * 12 + 4  # Y is second float
                y_val = struct.unpack_from("<f", buf, y_off)[0]
                struct.pack_into("<f", buf, y_off, -y_val)

    out = out_path or path
    with open(out, "wb") as f:
        f.write(buf)
    print(f"  Patched (Y-flipped): {out}")


def build_scene_method(scene_name, method_name, scene_dir, out_dir):
    """Build a GLB for one method in one scene."""
    ply_path = os.path.join(scene_dir, "points", "full.ply")
    pose_path = os.path.join(scene_dir, "poses", "abs_pose.txt")

    if not os.path.exists(ply_path):
        print(f"  SKIP {method_name}: no {ply_path}")
        return False
    if not os.path.exists(pose_path):
        print(f"  SKIP {method_name}: no {pose_path}")
        return False

    print(f"  Reading PLY: {ply_path}")
    positions, colors = read_ply(ply_path)
    print(f"    Raw points: {len(positions)}")

    # Flip Y: camera coords → glTF Y-up
    positions = flip_y(positions)

    # Filter sky for lingbot-map
    if method_name == "lingbot-map":
        before = len(positions)
        positions, colors = filter_sky(positions, colors)
        print(f"    After sky filter: {len(positions)} (removed {before - len(positions)})")

    # Subsample
    positions, colors = subsample(positions, colors)
    print(f"    After subsample: {len(positions)}")

    if len(positions) == 0:
        print(f"    ERROR: no points left after filtering!")
        return False

    # Read trajectory
    print(f"  Reading poses: {pose_path}")
    traj = read_poses(pose_path)
    traj = flip_y(traj)
    print(f"    Trajectory points: {len(traj)}")

    # Build GLB
    traj_color = TRAJ_COLORS.get(method_name, [1.0, 0.6, 0.1, 1.0])
    glb_data = build_glb(positions, colors, traj, traj_color)

    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, f"{method_name}.glb")
    with open(out_path, "wb") as f:
        f.write(glb_data)
    print(f"    Written: {out_path} ({len(glb_data) / 1e6:.1f} MB)")
    return True


def main():
    target_scene = sys.argv[1] if len(sys.argv) > 1 else None
    scenes_to_build = {target_scene: SCENES[target_scene]} if target_scene else SCENES

    for scene_name, methods in scenes_to_build.items():
        print(f"\n=== Scene: {scene_name} ===")
        scene_out = os.path.join(OUT_DIR, scene_name)

        for method_name, scene_dir in methods.items():
            existing_glb = os.path.join(scene_out, f"{method_name}.glb")

            if method_name == "lingbot-map":
                # Always regenerate lingbot-map from source
                print(f"\n  [{method_name}] Regenerating from source...")
                build_scene_method(scene_name, method_name, scene_dir, scene_out)
            else:
                # For ours/longstream: patch existing GLB if present, else rebuild
                if os.path.exists(existing_glb):
                    print(f"\n  [{method_name}] Patching existing GLB (flip Y)...")
                    patch_existing_glb(existing_glb)
                else:
                    print(f"\n  [{method_name}] Building from source...")
                    build_scene_method(scene_name, method_name, scene_dir, scene_out)


if __name__ == "__main__":
    main()
