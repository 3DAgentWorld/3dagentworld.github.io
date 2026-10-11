window.CAMERAVLM_CONTENT = {
  "cases": [
    {
      "id": "shotbench_3345",
      "label": "Subject motion",
      "detail": "A moving subject can obscure the camera's lateral movement.",
      "question": "Which camera movement best describes this shot?",
      "original_question": "What's the camera movement in this movie shot?\nA. Move to the left\nB. Boom up\nC. Pull out\nD. Zoom in\nAnswer with only the letter of the correct option.",
      "options": {
        "A": "Move to the left",
        "B": "Boom up",
        "C": "Pull out",
        "D": "Zoom in"
      },
      "gold": "A",
      "answers": [
        {
          "model": "CameraVLM",
          "choice": "A",
          "correct": true
        },
        {
          "model": "Qwen3.5-9B",
          "choice": "C",
          "correct": false
        },
        {
          "model": "Claude Opus 4.8",
          "choice": "C",
          "correct": false
        },
        {
          "model": "Gemini 3.5 Flash",
          "choice": "C",
          "correct": false
        },
        {
          "model": "Cambrian-P",
          "choice": "C",
          "correct": false
        }
      ],
      "video": "assets/shotbench_3345.mp4",
      "poster": "assets/shotbench_3345-1.webp",
      "frames": [
        {
          "src": "assets/shotbench_3345-0.webp",
          "time": 0.194
        },
        {
          "src": "assets/shotbench_3345-1.webp",
          "time": 0.847
        },
        {
          "src": "assets/shotbench_3345-2.webp",
          "time": 1.572
        },
        {
          "src": "assets/shotbench_3345-3.webp",
          "time": 2.226
        }
      ],
      "duration": 2.419083333333333
    },
    {
      "id": "cinetech_118",
      "label": "Left or right?",
      "detail": "The direction of image motion is not the direction of the camera.",
      "question": "Which camera movement best describes this shot?",
      "original_question": "You are an experienced cinematographer and cameramovement expert, deeply knowledgeable about various cameratechniques and their visual effects. Carefully analyze this filmclip, paying close attention to how the camera frame changesrelative to the scene or subject. Focus on identifying the primarytype of physical movement the camera itself undergoes (e.g.moving along a track, rotating from a fixed point, or onlychanging focal length), or determine if the camera remainsstatic, ldentify the most dominant camera movement technique used throughout the entire clip. Select the option that mostaccurately describes the core camera movement technique inthis clip from the following choices:\nA. Trucking Right Shot\nB. Trucking Left Shot\nC. Zoom In Shot\nD. Dolly In Shot, then adds Trucking Left Shot\nRespond only with the letter corresponding to your chosen option (A-D). Do not include any explanation or additional text.",
      "options": {
        "A": "Trucking Right Shot",
        "B": "Trucking Left Shot",
        "C": "Zoom In Shot",
        "D": "Dolly In Shot, then adds Trucking Left Shot"
      },
      "gold": "A",
      "answers": [
        {
          "model": "CameraVLM",
          "choice": "A",
          "correct": true
        },
        {
          "model": "Qwen3.5-9B",
          "choice": "B",
          "correct": false
        },
        {
          "model": "Claude Opus 4.8",
          "choice": "B",
          "correct": false
        },
        {
          "model": "Gemini 3.5 Flash",
          "choice": "B",
          "correct": false
        },
        {
          "model": "Cambrian-P",
          "choice": "A",
          "correct": true
        }
      ],
      "video": "assets/cinetech_118.mp4",
      "poster": "assets/cinetech_118-1.webp",
      "frames": [
        {
          "src": "assets/cinetech_118-0.webp",
          "time": 0.32
        },
        {
          "src": "assets/cinetech_118-1.webp",
          "time": 1.4
        },
        {
          "src": "assets/cinetech_118-2.webp",
          "time": 2.6
        },
        {
          "src": "assets/cinetech_118-3.webp",
          "time": 3.68
        }
      ],
      "duration": 4.0
    },
    {
      "id": "cinetech_095",
      "label": "Compound motion",
      "detail": "A leftward pan is followed by a crane move.",
      "question": "Which camera movement best describes this shot?",
      "original_question": "You are an experienced cinematographer and cameramovement expert, deeply knowledgeable about various cameratechniques and their visual effects. Carefully analyze this filmclip, paying close attention to how the camera frame changesrelative to the scene or subject. Focus on identifying the primarytype of physical movement the camera itself undergoes (e.g.moving along a track, rotating from a fixed point, or onlychanging focal length), or determine if the camera remainsstatic, ldentify the most dominant camera movement technique used throughout the entire clip. Select the option that mostaccurately describes the core camera movement technique inthis clip from the following choices:\nA. Pan Right Shot\nB. Pan Left Shot with Crane Shot\nC. Pan Left Shot, then Crane Shot\nD. Pan Right Shot, then Crane Shot\nRespond only with the letter corresponding to your chosen option (A-D). Do not include any explanation or additional text.",
      "options": {
        "A": "Pan Right Shot",
        "B": "Pan Left Shot with Crane Shot",
        "C": "Pan Left Shot, then Crane Shot",
        "D": "Pan Right Shot, then Crane Shot"
      },
      "gold": "C",
      "answers": [
        {
          "model": "CameraVLM",
          "choice": "C",
          "correct": true
        },
        {
          "model": "Qwen3.5-9B",
          "choice": "C",
          "correct": true
        },
        {
          "model": "Claude Opus 4.8",
          "choice": "D",
          "correct": false
        },
        {
          "model": "Gemini 3.5 Flash",
          "choice": "B",
          "correct": false
        },
        {
          "model": "Cambrian-P",
          "choice": "B",
          "correct": false
        }
      ],
      "video": "assets/cinetech_095.mp4",
      "poster": "assets/cinetech_095-1.webp",
      "frames": [
        {
          "src": "assets/cinetech_095-0.webp",
          "time": 0.4
        },
        {
          "src": "assets/cinetech_095-1.webp",
          "time": 1.752
        },
        {
          "src": "assets/cinetech_095-2.webp",
          "time": 3.253
        },
        {
          "src": "assets/cinetech_095-3.webp",
          "time": 4.605
        }
      ],
      "duration": 5.005
    },
    {
      "id": "camerabench_11490",
      "label": "Arc motion",
      "detail": "Direction and camera shake must be judged together.",
      "question": "Does the camera arc clockwise with minimal shake?",
      "original_question": "Does the camera movement in this video match the following description: 'The camera arcs smoothly in a clockwise direction, maintaining minimal shaking throughout the movement.'?\nAnswer with only Yes or No.",
      "options": {},
      "gold": "No",
      "answers": [
        {
          "model": "CameraVLM",
          "choice": "No",
          "correct": true
        },
        {
          "model": "Qwen3.5-9B",
          "choice": "Yes",
          "correct": false
        },
        {
          "model": "Claude Opus 4.8",
          "choice": "No",
          "correct": true
        },
        {
          "model": "Gemini 3.5 Flash",
          "choice": "Yes",
          "correct": false
        },
        {
          "model": "Cambrian-P",
          "choice": "Yes",
          "correct": false
        }
      ],
      "video": "assets/camerabench_11490.mp4",
      "poster": "assets/camerabench_11490-1.webp",
      "frames": [
        {
          "src": "assets/camerabench_11490-0.webp",
          "time": 1.478
        },
        {
          "src": "assets/camerabench_11490-1.webp",
          "time": 6.467
        },
        {
          "src": "assets/camerabench_11490-2.webp",
          "time": 12.01
        },
        {
          "src": "assets/camerabench_11490-3.webp",
          "time": 16.999
        }
      ],
      "duration": 18.476791666666664
    },
    {
      "id": "cinetech_094",
      "label": "Pan direction",
      "detail": "Camera rotation must be distinguished from sideways translation.",
      "question": "Which camera movement best describes this shot?",
      "original_question": "You are an experienced cinematographer and cameramovement expert, deeply knowledgeable about various cameratechniques and their visual effects. Carefully analyze this filmclip, paying close attention to how the camera frame changesrelative to the scene or subject. Focus on identifying the primarytype of physical movement the camera itself undergoes (e.g.moving along a track, rotating from a fixed point, or onlychanging focal length), or determine if the camera remainsstatic, ldentify the most dominant camera movement technique used throughout the entire clip. Select the option that mostaccurately describes the core camera movement technique inthis clip from the following choices:\nA. Pan Right Shot\nB. Trucking Left Shot\nC. Pan Left Shot\nD. Tracking Shot with Crane Shot\nRespond only with the letter corresponding to your chosen option (A-D). Do not include any explanation or additional text.",
      "options": {
        "A": "Pan Right Shot",
        "B": "Trucking Left Shot",
        "C": "Pan Left Shot",
        "D": "Tracking Shot with Crane Shot"
      },
      "gold": "A",
      "answers": [
        {
          "model": "CameraVLM",
          "choice": "A",
          "correct": true
        },
        {
          "model": "Qwen3.5-9B",
          "choice": "C",
          "correct": false
        },
        {
          "model": "Claude Opus 4.8",
          "choice": "D",
          "correct": false
        },
        {
          "model": "Gemini 3.5 Flash",
          "choice": "C",
          "correct": false
        },
        {
          "model": "Cambrian-P",
          "choice": "C",
          "correct": false
        }
      ],
      "video": "assets/cinetech_094.mp4",
      "poster": "assets/cinetech_094-1.webp",
      "frames": [
        {
          "src": "assets/cinetech_094-0.webp",
          "time": 0.16
        },
        {
          "src": "assets/cinetech_094-1.webp",
          "time": 0.701
        },
        {
          "src": "assets/cinetech_094-2.webp",
          "time": 1.301
        },
        {
          "src": "assets/cinetech_094-3.webp",
          "time": 1.842
        }
      ],
      "duration": 2.002
    },
    {
      "id": "camerabench_7668",
      "label": "Vertical rotation",
      "detail": "Tilt-up recognition requires tracking the camera's changing view.",
      "question": "Does the camera tilt upward?",
      "original_question": "Does the camera tilt upward?\nAnswer with only Yes or No.",
      "options": {},
      "gold": "Yes",
      "answers": [
        {
          "model": "CameraVLM",
          "choice": "Yes",
          "correct": true
        },
        {
          "model": "Qwen3.5-9B",
          "choice": "No",
          "correct": false
        },
        {
          "model": "Claude Opus 4.8",
          "choice": "No",
          "correct": false
        },
        {
          "model": "Gemini 3.5 Flash",
          "choice": "No",
          "correct": false
        },
        {
          "model": "Cambrian-P",
          "choice": "No",
          "correct": false
        }
      ],
      "video": "assets/camerabench_7668.mp4",
      "poster": "assets/camerabench_7668-1.webp",
      "frames": [
        {
          "src": "assets/camerabench_7668-0.webp",
          "time": 0.25
        },
        {
          "src": "assets/camerabench_7668-1.webp",
          "time": 1.092
        },
        {
          "src": "assets/camerabench_7668-2.webp",
          "time": 2.028
        },
        {
          "src": "assets/camerabench_7668-3.webp",
          "time": 2.87
        }
      ],
      "duration": 3.12
    },
    {
      "id": "shotbench_3494",
      "label": "Pan + push in",
      "detail": "Recognizing a lateral pan combined with forward camera travel.",
      "question": "Which camera movement best describes this shot?",
      "original_question": "What's the camera movement in this movie shot?\nA. Push in and Boom up\nB. Pan right and Tilt down\nC. Pan left and Push in\nD. Arc and Push in\nAnswer with only the letter of the correct option.",
      "options": {
        "A": "Push in and Boom up",
        "B": "Pan right and Tilt down",
        "C": "Pan left and Push in",
        "D": "Arc and Push in"
      },
      "gold": "C",
      "answers": [
        {
          "model": "CameraVLM",
          "choice": "C",
          "correct": true
        },
        {
          "model": "Qwen3.5-9B",
          "choice": "A",
          "correct": false
        },
        {
          "model": "Claude Opus 4.8",
          "choice": "A",
          "correct": false
        },
        {
          "model": "Gemini 3.5 Flash",
          "choice": "A",
          "correct": false
        },
        {
          "model": "Cambrian-P",
          "choice": "A",
          "correct": false
        }
      ],
      "video": "assets/shotbench_3494.mp4",
      "poster": "assets/shotbench_3494-1.webp",
      "frames": [
        {
          "src": "assets/shotbench_3494-0.webp",
          "time": 0.557
        },
        {
          "src": "assets/shotbench_3494-1.webp",
          "time": 2.438
        },
        {
          "src": "assets/shotbench_3494-2.webp",
          "time": 4.527
        },
        {
          "src": "assets/shotbench_3494-3.webp",
          "time": 6.408
        }
      ],
      "duration": 6.965291666666666
    },
    {
      "id": "shotbench_3540",
      "label": "Boom upward",
      "detail": "Distinguishing vertical translation from moving toward the subject.",
      "question": "Which camera movement best describes this shot?",
      "original_question": "What's the camera movement in this movie shot?\nA. Boom up\nB. Pull out\nC. Push in\nD. Move to the left\nAnswer with only the letter of the correct option.",
      "options": {
        "A": "Boom up",
        "B": "Pull out",
        "C": "Push in",
        "D": "Move to the left"
      },
      "gold": "A",
      "answers": [
        {
          "model": "CameraVLM",
          "choice": "A",
          "correct": true
        },
        {
          "model": "Qwen3.5-9B",
          "choice": "B",
          "correct": false
        },
        {
          "model": "Claude Opus 4.8",
          "choice": "C",
          "correct": false
        },
        {
          "model": "Gemini 3.5 Flash",
          "choice": "B",
          "correct": false
        },
        {
          "model": "Cambrian-P",
          "choice": "C",
          "correct": false
        }
      ],
      "video": "assets/shotbench_3540.mp4",
      "poster": "assets/shotbench_3540-1.webp",
      "frames": [
        {
          "src": "assets/shotbench_3540-0.webp",
          "time": 0.407
        },
        {
          "src": "assets/shotbench_3540-1.webp",
          "time": 1.781
        },
        {
          "src": "assets/shotbench_3540-2.webp",
          "time": 3.307
        },
        {
          "src": "assets/shotbench_3540-3.webp",
          "time": 4.681
        }
      ],
      "duration": 5.088416666666666
    },
    {
      "id": "cinetech_101",
      "label": "Dolly + zoom",
      "detail": "Separating simultaneous dolly-out and zoom-in from a sequence of movements.",
      "question": "Which camera movement best describes this shot?",
      "original_question": "You are an experienced cinematographer and cameramovement expert, deeply knowledgeable about various cameratechniques and their visual effects. Carefully analyze this filmclip, paying close attention to how the camera frame changesrelative to the scene or subject. Focus on identifying the primarytype of physical movement the camera itself undergoes (e.g.moving along a track, rotating from a fixed point, or onlychanging focal length), or determine if the camera remainsstatic, ldentify the most dominant camera movement technique used throughout the entire clip. Select the option that mostaccurately describes the core camera movement technique inthis clip from the following choices:\nA. Dolly Out Shot, then Zoom In Shot\nB. Dolly Out Shot with Zoom In Shot\nC. Zoom In Shot\nD. Dolly In Shot with Zoom In Shot\nRespond only with the letter corresponding to your chosen option (A-D). Do not include any explanation or additional text.",
      "options": {
        "A": "Dolly Out Shot, then Zoom In Shot",
        "B": "Dolly Out Shot with Zoom In Shot",
        "C": "Zoom In Shot",
        "D": "Dolly In Shot with Zoom In Shot"
      },
      "gold": "B",
      "answers": [
        {
          "model": "CameraVLM",
          "choice": "B",
          "correct": true
        },
        {
          "model": "Qwen3.5-9B",
          "choice": "C",
          "correct": false
        },
        {
          "model": "Claude Opus 4.8",
          "choice": "C",
          "correct": false
        },
        {
          "model": "Gemini 3.5 Flash",
          "choice": "B",
          "correct": true
        },
        {
          "model": "Cambrian-P",
          "choice": "D",
          "correct": false
        }
      ],
      "video": "assets/cinetech_101.mp4",
      "poster": "assets/cinetech_101-1.webp",
      "frames": [
        {
          "src": "assets/cinetech_101-0.webp",
          "time": 0.16
        },
        {
          "src": "assets/cinetech_101-1.webp",
          "time": 0.701
        },
        {
          "src": "assets/cinetech_101-2.webp",
          "time": 1.301
        },
        {
          "src": "assets/cinetech_101-3.webp",
          "time": 1.842
        }
      ],
      "duration": 2.0020000000000002
    },
    {
      "id": "cinetech_124",
      "label": "Clockwise roll",
      "detail": "Recognizing rotation around the viewing axis and its direction.",
      "question": "Which camera movement best describes this shot?",
      "original_question": "You are an experienced cinematographer and cameramovement expert, deeply knowledgeable about various cameratechniques and their visual effects. Carefully analyze this filmclip, paying close attention to how the camera frame changesrelative to the scene or subject. Focus on identifying the primarytype of physical movement the camera itself undergoes (e.g.moving along a track, rotating from a fixed point, or onlychanging focal length), or determine if the camera remainsstatic, ldentify the most dominant camera movement technique used throughout the entire clip. Select the option that mostaccurately describes the core camera movement technique inthis clip from the following choices:\nA. Rolling Clockwise Shot\nB. Crane Shot\nC. Rolling Counterclockwise Shot\nD. Trucking Left Shot with Rolling Counterclockwise Shot\nRespond only with the letter corresponding to your chosen option (A-D). Do not include any explanation or additional text.",
      "options": {
        "A": "Rolling Clockwise Shot",
        "B": "Crane Shot",
        "C": "Rolling Counterclockwise Shot",
        "D": "Trucking Left Shot with Rolling Counterclockwise Shot"
      },
      "gold": "A",
      "answers": [
        {
          "model": "CameraVLM",
          "choice": "A",
          "correct": true
        },
        {
          "model": "Qwen3.5-9B",
          "choice": "C",
          "correct": false
        },
        {
          "model": "Claude Opus 4.8",
          "choice": "C",
          "correct": false
        },
        {
          "model": "Gemini 3.5 Flash",
          "choice": "C",
          "correct": false
        },
        {
          "model": "Cambrian-P",
          "choice": "C",
          "correct": false
        }
      ],
      "video": "assets/cinetech_124.mp4",
      "poster": "assets/cinetech_124-1.webp",
      "frames": [
        {
          "src": "assets/cinetech_124-0.webp",
          "time": 0.176
        },
        {
          "src": "assets/cinetech_124-1.webp",
          "time": 0.77
        },
        {
          "src": "assets/cinetech_124-2.webp",
          "time": 1.43
        },
        {
          "src": "assets/cinetech_124-3.webp",
          "time": 2.024
        }
      ],
      "duration": 2.2
    },
    {
      "id": "cinetech_006",
      "label": "Truck left",
      "detail": "Separating sideways camera travel from a zoom or a turn.",
      "question": "Which camera movement best describes this shot?",
      "original_question": "You are an experienced cinematographer and cameramovement expert, deeply knowledgeable about various cameratechniques and their visual effects. Carefully analyze this filmclip, paying close attention to how the camera frame changesrelative to the scene or subject. Focus on identifying the primarytype of physical movement the camera itself undergoes (e.g.moving along a track, rotating from a fixed point, or onlychanging focal length), or determine if the camera remainsstatic, ldentify the most dominant camera movement technique used throughout the entire clip. Select the option that mostaccurately describes the core camera movement technique inthis clip from the following choices:\nA. Pan Left Shot, then adds Zoom In Shot\nB. Trucking Right Shot\nC. Trucking Left Shot\nD. Zoom Out Shot\nRespond only with the letter corresponding to your chosen option (A-D). Do not include any explanation or additional text.",
      "options": {
        "A": "Pan Left Shot, then adds Zoom In Shot",
        "B": "Trucking Right Shot",
        "C": "Trucking Left Shot",
        "D": "Zoom Out Shot"
      },
      "gold": "C",
      "answers": [
        {
          "model": "CameraVLM",
          "choice": "C",
          "correct": true
        },
        {
          "model": "Qwen3.5-9B",
          "choice": "A",
          "correct": false
        },
        {
          "model": "Claude Opus 4.8",
          "choice": "D",
          "correct": false
        },
        {
          "model": "Gemini 3.5 Flash",
          "choice": "C",
          "correct": true
        },
        {
          "model": "Cambrian-P",
          "choice": "C",
          "correct": true
        }
      ],
      "video": "assets/cinetech_006.mp4",
      "poster": "assets/cinetech_006-1.webp",
      "frames": [
        {
          "src": "assets/cinetech_006-0.webp",
          "time": 0.24
        },
        {
          "src": "assets/cinetech_006-1.webp",
          "time": 1.051
        },
        {
          "src": "assets/cinetech_006-2.webp",
          "time": 1.952
        },
        {
          "src": "assets/cinetech_006-3.webp",
          "time": 2.763
        }
      ],
      "duration": 3.0029999999999997
    },
    {
      "id": "cinetech_080",
      "label": "Pan right",
      "detail": "Recognizing rightward camera rotation rather than vertical travel.",
      "question": "Which camera movement best describes this shot?",
      "original_question": "You are an experienced cinematographer and cameramovement expert, deeply knowledgeable about various cameratechniques and their visual effects. Carefully analyze this filmclip, paying close attention to how the camera frame changesrelative to the scene or subject. Focus on identifying the primarytype of physical movement the camera itself undergoes (e.g.moving along a track, rotating from a fixed point, or onlychanging focal length), or determine if the camera remainsstatic, ldentify the most dominant camera movement technique used throughout the entire clip. Select the option that mostaccurately describes the core camera movement technique inthis clip from the following choices:\nA. Pan Right Shot\nB. Pan Left Shot\nC. Crane Shot\nD. Crane Shot, then Pan Left Shot\nRespond only with the letter corresponding to your chosen option (A-D). Do not include any explanation or additional text.",
      "options": {
        "A": "Pan Right Shot",
        "B": "Pan Left Shot",
        "C": "Crane Shot",
        "D": "Crane Shot, then Pan Left Shot"
      },
      "gold": "A",
      "answers": [
        {
          "model": "CameraVLM",
          "choice": "A",
          "correct": true
        },
        {
          "model": "Qwen3.5-9B",
          "choice": "B",
          "correct": false
        },
        {
          "model": "Claude Opus 4.8",
          "choice": "A",
          "correct": true
        },
        {
          "model": "Gemini 3.5 Flash",
          "choice": "B",
          "correct": false
        },
        {
          "model": "Cambrian-P",
          "choice": "A",
          "correct": true
        }
      ],
      "video": "assets/cinetech_080.mp4",
      "poster": "assets/cinetech_080-1.webp",
      "frames": [
        {
          "src": "assets/cinetech_080-0.webp",
          "time": 0.4
        },
        {
          "src": "assets/cinetech_080-1.webp",
          "time": 1.752
        },
        {
          "src": "assets/cinetech_080-2.webp",
          "time": 3.253
        },
        {
          "src": "assets/cinetech_080-3.webp",
          "time": 4.605
        }
      ],
      "duration": 5.005
    }
  ],
  "apps": [
    {
      "id": "shots:shots/mzc00200j7h7ix8/t4100gkloxj-storyid91-shot0011.mp4",
      "name": "dolly-zoom",
      "title": "Dolly out. Zoom in.",
      "answer": "The camera smoothly moves backward while simultaneously zooming in, maintaining a steady and fluid motion throughout.",
      "prompt_mode": "Short description",
      "short": "The camera smoothly moves backward while simultaneously zooming in, maintaining a steady and fluid motion throughout.",
      "cutAware": "The camera smoothly moves backward while simultaneously zooming in, maintaining a steady and fluid motion throughout.",
      "structured": "{\n  \"primary_motion\": \"dolly\",\n  \"secondary_motion\": \"none\",\n  \"temporal_pattern\": \"continuous\",\n  \"camera_static\": false,\n  \"direction\": \"in\",\n  \"evidence\": \"The camera smoothly moves forward toward the subject, causing the subject to become larger in the frame while the background remains fixed. This clear change in scale and perspective confirms an inward dolly.\",\n  \"confidence\": \"high\"\n}",
      "video": "assets/app-dolly-zoom.mp4",
      "poster": "assets/app-dolly-zoom-1.webp",
      "frames": [
        {
          "src": "assets/app-dolly-zoom-0.webp",
          "time": 0.283
        },
        {
          "src": "assets/app-dolly-zoom-1.webp",
          "time": 1.24
        },
        {
          "src": "assets/app-dolly-zoom-2.webp",
          "time": 2.302
        },
        {
          "src": "assets/app-dolly-zoom-3.webp",
          "time": 3.258
        }
      ],
      "duration": 3.5416666666666665
    },
    {
      "id": "shots:shots/mzc00200etzfunn/r41014bl1i3-storyid34-shot0004.mp4",
      "name": "arc-shot",
      "title": "Counterclockwise arc",
      "answer": "The camera arcs counterclockwise with a smooth, steady motion, exhibiting minimal shaking.",
      "prompt_mode": "Short description",
      "short": "The camera arcs counterclockwise with a smooth, steady motion, exhibiting minimal shaking.",
      "cutAware": "The camera arcs counterclockwise around two people talking, with a slightly unsteady movement that includes some shaking.",
      "structured": "{\n  \"primary_motion\": \"arc\",\n  \"secondary_motion\": \"none\",\n  \"temporal_pattern\": \"continuous\",\n  \"camera_static\": false,\n  \"direction\": \"counterclockwise\",\n  \"evidence\": \"The camera smoothly arcs counterclockwise around two central figures—a man in a military uniform and a man in a straw hat—while they converse. As the camera moves, the background shifts continuously: starting with a crowd and hills on the right, it transitions to show fishermen, nets, and coastal buildings on the left, confirming a deliberate arcing motion rather than random shaking or simple panning. No other objects move independently; all background changes are due to the camera's movement.\",\n  \"confidence\": \"high\"\n}",
      "video": "assets/app-arc-shot.mp4",
      "poster": "assets/app-arc-shot-1.webp",
      "frames": [
        {
          "src": "assets/app-arc-shot-0.webp",
          "time": 1.893
        },
        {
          "src": "assets/app-arc-shot-1.webp",
          "time": 8.283
        },
        {
          "src": "assets/app-arc-shot-2.webp",
          "time": 15.383
        },
        {
          "src": "assets/app-arc-shot-3.webp",
          "time": 21.773
        }
      ],
      "duration": 23.666666666666668
    },
    {
      "id": "media:media/8gauj96ao3/reference_04/video_000.mp4",
      "name": "previs",
      "title": "Previsualization",
      "answer": "The camera smoothly dollies forward toward the subject, incorporating a slight upward tilt while maintaining a steady and fluid motion throughout the shot.",
      "prompt_mode": "Cut-aware description",
      "short": "The camera smoothly moves forward while moderately panning to the right and tilting upward, maintaining a steady and fluid motion throughout.",
      "cutAware": "The camera smoothly dollies forward toward the subject, incorporating a slight upward tilt while maintaining a steady and fluid motion throughout the shot.",
      "structured": "{\n  \"primary_motion\": \"dolly\",\n  \"secondary_motion\": \"none\",\n  \"temporal_pattern\": \"sequential\",\n  \"camera_static\": false,\n  \"direction\": \"in\",\n  \"evidence\": \"The camera smoothly moves forward toward the human figure, causing the subject to grow larger in the frame without any lateral or vertical shifting.\",\n  \"confidence\": \"high\"\n}",
      "video": "assets/app-previs.mp4",
      "poster": "assets/app-previs-1.webp",
      "frames": [
        {
          "src": "assets/app-previs-0.webp",
          "time": 0.621
        },
        {
          "src": "assets/app-previs-1.webp",
          "time": 2.718
        },
        {
          "src": "assets/app-previs-2.webp",
          "time": 5.048
        },
        {
          "src": "assets/app-previs-3.webp",
          "time": 7.145
        }
      ],
      "duration": 7.766666666666667
    },
    {
      "id": "media:media/8gauj96ao3/winner/winner.mp4",
      "name": "rendered",
      "title": "Rendered clip",
      "answer": "The camera begins with a wide shot of a cityscape at night, then smoothly dollies forward and pedestals upward while simultaneously arcing counterclockwise around a humanoid figure, gradually transitioning into a medium close-up of the figure's face.",
      "prompt_mode": "Short description",
      "short": "The camera begins with a wide shot of a cityscape at night, then smoothly dollies forward and pedestals upward while simultaneously arcing counterclockwise around a humanoid figure, gradually transitioning into a medium close-up of the figure's face.",
      "cutAware": "The camera smoothly pans left and tilts up to focus on the man, then slightly zooms in to highlight his hand, before seamlessly transitioning into the next scene.",
      "structured": "{\n  \"primary_motion\": \"crane/boom (up/down)\",\n  \"secondary_motion\": \"pan\",\n  \"temporal_pattern\": \"sequential\",\n  \"camera_static\": false,\n  \"direction\": \"The camera begins with a wide cityscape view, then smoothly cranes up and pans left to focus on the person, tilting up slightly as it closes in for a close-up. After delivering the close-up, it reverses the crane motion and pans back to the right, returning to the original wide view. The movement is fluid and continuous throughout.\",\n  \"evidence\": \"The camera smoothly moves upward to approach the person, then pans and tilts up for a close-up. It reverses the crane motion and pans back to the right, returning to the initial wide view, all in one continuous, fluid motion.\",\n  \"confidence\": \"high\"\n}",
      "video": "assets/app-rendered.mp4",
      "poster": "assets/app-rendered-1.webp",
      "frames": [
        {
          "src": "assets/app-rendered-0.webp",
          "time": 0.643
        },
        {
          "src": "assets/app-rendered-1.webp",
          "time": 2.815
        },
        {
          "src": "assets/app-rendered-2.webp",
          "time": 5.227
        },
        {
          "src": "assets/app-rendered-3.webp",
          "time": 7.398
        }
      ],
      "duration": 8.041666666666666
    }
  ],
  "categories": {
    "CATS": [
      "Pan",
      "Tilt",
      "Crane",
      "Dolly",
      "Zoom",
      "Static",
      "Shake",
      "Composite"
    ],
    "DATA": {
      "Qwen3.5 (backbone)": [
        60.71,
        54.48,
        29.73,
        50.41,
        71.32,
        66.11,
        70.18,
        50.0
      ],
      "Cambrian-P": [
        61.61,
        67.59,
        32.43,
        52.48,
        58.14,
        74.06,
        54.39,
        59.18
      ],
      "Cosmos3-Nano": [
        71.88,
        72.41,
        33.78,
        61.98,
        61.24,
        79.5,
        64.91,
        63.27
      ],
      "Claude Opus 4.8": [
        51.34,
        55.86,
        62.16,
        62.4,
        55.81,
        53.56,
        77.19,
        64.29
      ],
      "Gemini 3.5 Flash": [
        64.29,
        60.69,
        47.3,
        61.98,
        72.09,
        68.62,
        64.91,
        62.24
      ],
      "GPT-6 (high)": [
        85.8,
        86.79,
        73.81,
        77.88,
        83.05,
        82.02,
        91.23,
        72.73
      ],
      "Ours": [
        90.63,
        83.45,
        74.32,
        83.88,
        82.95,
        84.1,
        91.23,
        79.59
      ]
    },
    "OVERALL": {
      "Qwen3.5 (backbone)": 57.77,
      "Cambrian-P": 58.72,
      "Cosmos3-Nano": 66.27,
      "Claude Opus 4.8": 58.47,
      "Gemini 3.5 Flash": 64.05,
      "GPT-6 (high)": 81.55,
      "Ours": 85.48
    }
  },
  "paperModels": [
    {
      "model": "Qwen2.5-VL",
      "params": 7,
      "scores": [
        60.0,
        48.67,
        38.36,
        49.01
      ]
    },
    {
      "model": "Qwen3-VL",
      "params": 8,
      "scores": [
        62.3,
        37.17,
        40.73,
        46.73
      ]
    },
    {
      "model": "Qwen3.5 backbone",
      "params": 9,
      "scores": [
        63.64,
        54.87,
        46.98,
        55.16
      ]
    },
    {
      "model": "Qwen3.5 + CoT",
      "params": 9,
      "scores": [
        69.2,
        53.98,
        45.47,
        56.22
      ]
    },
    {
      "model": "Orca",
      "params": 4,
      "scores": [
        62.2,
        52.21,
        36.85,
        50.42
      ]
    },
    {
      "model": "DepthVLM",
      "params": 4,
      "scores": [
        59.3,
        56.64,
        40.09,
        52.01
      ]
    },
    {
      "model": "Cosmos3-Edge",
      "params": 4,
      "scores": [
        57.6,
        56.64,
        47.41,
        53.88
      ]
    },
    {
      "model": "Cosmos3-Nano",
      "params": 16,
      "scores": [
        70.3,
        67.26,
        57.33,
        64.96
      ]
    },
    {
      "model": "Hy-Embodied-VLM",
      "params": 30,
      "scores": [
        65.7,
        53.1,
        47.63,
        55.48
      ]
    },
    {
      "model": "RynnBrain1.1",
      "params": 9,
      "scores": [
        65.8,
        56.64,
        43.32,
        55.25
      ]
    },
    {
      "model": "Cambrian-P",
      "params": 7,
      "scores": [
        64.3,
        53.09,
        48.06,
        55.15
      ]
    },
    {
      "model": "CamDistill",
      "params": 8,
      "scores": [
        40.6,
        42.48,
        43.97,
        42.35
      ]
    },
    {
      "model": "CamInject",
      "params": 8,
      "scores": [
        45.5,
        46.9,
        41.81,
        44.74
      ]
    },
    {
      "model": "Spatial-MLLM",
      "params": null,
      "scores": [
        57.7,
        37.17,
        32.11,
        42.33
      ]
    },
    {
      "model": "VLM-3R-7B",
      "params": 7,
      "scores": [
        57.0,
        33.63,
        39.66,
        43.43
      ]
    },
    {
      "model": "CameraModel-7B",
      "params": 7,
      "scores": [
        70.9,
        52.21,
        44.83,
        55.98
      ]
    },
    {
      "model": "ACaM",
      "params": 8,
      "scores": [
        63.0,
        57.52,
        56.03,
        58.85
      ]
    },
    {
      "model": "CamReasoner-7B",
      "params": 7,
      "scores": [
        68.0,
        48.67,
        44.83,
        53.83
      ]
    },
    {
      "model": "ShotVL-7B",
      "params": 7,
      "scores": [
        66.1,
        42.48,
        61.21,
        56.6
      ]
    },
    {
      "model": "Claude Opus 4.8",
      "params": null,
      "scores": [
        63.49,
        54.87,
        49.03,
        55.8
      ]
    },
    {
      "model": "Gemini 3.5 Flash",
      "params": null,
      "scores": [
        66.7,
        61.95,
        58.84,
        62.5
      ]
    },
    {
      "model": "GPT-6 Astra (high)",
      "params": null,
      "scores": [
        82.5,
        83.19,
        79.09,
        81.59
      ]
    },
    {
      "model": "Human",
      "params": null,
      "scores": [
        76.19,
        77.61,
        87.34,
        80.38
      ]
    },
    {
      "model": "CameraVLM",
      "params": 9,
      "scores": [
        88.2,
        77.88,
        81.47,
        82.52
      ]
    }
  ],
  "benchmarkRows": [
    [
      "Qwen2.5-VL",
      60.0,
      48.67,
      38.36,
      49.01
    ],
    [
      "Qwen3-VL",
      62.3,
      37.17,
      40.73,
      46.73
    ],
    [
      "Qwen3.5 backbone",
      63.64,
      54.87,
      46.98,
      55.16
    ],
    [
      "Qwen3.5 + CoT",
      69.2,
      53.98,
      45.47,
      56.22
    ],
    [
      "Orca",
      62.2,
      52.21,
      36.85,
      50.42
    ],
    [
      "DepthVLM",
      59.3,
      56.64,
      40.09,
      52.01
    ],
    [
      "Cosmos3-Edge",
      57.6,
      56.64,
      47.41,
      53.88
    ],
    [
      "Cosmos3-Nano",
      70.3,
      67.26,
      57.33,
      64.96
    ],
    [
      "Hy-Embodied-VLM",
      65.7,
      53.1,
      47.63,
      55.48
    ],
    [
      "RynnBrain1.1",
      65.8,
      56.64,
      43.32,
      55.25
    ],
    [
      "Cambrian-P",
      64.3,
      53.09,
      48.06,
      55.15
    ],
    [
      "CamDistill",
      40.6,
      42.48,
      43.97,
      42.35
    ],
    [
      "CamInject",
      45.5,
      46.9,
      41.81,
      44.74
    ],
    [
      "Spatial-MLLM",
      57.7,
      37.17,
      32.11,
      42.33
    ],
    [
      "VLM-3R-7B",
      57.0,
      33.63,
      39.66,
      43.43
    ],
    [
      "CameraModel-7B",
      70.9,
      52.21,
      44.83,
      55.98
    ],
    [
      "ACaM",
      63.0,
      57.52,
      56.03,
      58.85
    ],
    [
      "CamReasoner-7B",
      68.0,
      48.67,
      44.83,
      53.83
    ],
    [
      "ShotVL-7B",
      66.1,
      42.48,
      61.21,
      56.6
    ],
    [
      "Claude Opus 4.8",
      63.49,
      54.87,
      49.03,
      55.8
    ],
    [
      "Gemini 3.5 Flash",
      66.7,
      61.95,
      58.84,
      62.5
    ],
    [
      "GPT-6 Astra (high)",
      82.5,
      83.19,
      79.09,
      81.59
    ],
    [
      "Human",
      76.19,
      77.61,
      87.34,
      80.38
    ],
    [
      "CameraVLM",
      88.2,
      77.88,
      81.47,
      82.52
    ]
  ],
  "directionPaper": [
    [
      "Qwen3.5",
      42.3
    ],
    [
      "Claude Opus",
      44.2
    ],
    [
      "Gemini Flash",
      55.8
    ],
    [
      "GPT-6 Astra",
      82.7
    ],
    [
      "Human",
      86.0
    ],
    [
      "CameraVLM",
      85.8
    ]
  ],
  "authors": [],
  "shotIndex": [
    {
      "id": "v000_s001",
      "title": "Control room",
      "caption": "The camera moves laterally while people take their seats.",
      "group": "Moving camera",
      "fields": [
        {
          "key": "camera_move",
          "label": "Camera movement",
          "value": "Truck right",
          "original": "truck_right"
        },
        {
          "key": "shot_size",
          "label": "Shot size",
          "value": "Full shot",
          "original": "Full shot"
        },
        {
          "key": "camera_angle",
          "label": "Camera angle",
          "value": "Eye-level",
          "original": "Eye-level"
        },
        {
          "key": "composition",
          "label": "Composition",
          "value": "Scatter",
          "original": "Scatter"
        },
        {
          "key": "color_tone",
          "label": "Color tone",
          "value": "Cool tone",
          "original": "Cool tone"
        },
        {
          "key": "focal_length",
          "label": "Focal look",
          "value": "Wide-angle look",
          "original": "广角24-35mm"
        },
        {
          "key": "lighting",
          "label": "Lighting look",
          "value": "Artificial-light look",
          "original": "人工光"
        }
      ],
      "raw": {
        "keyframe_index": 0,
        "shot_caption": "人群在高科技房间内有序地各自就座",
        "character_layout": "people are sitting down one by one in the front and back rows",
        "technique": {
          "shot_size": "Full shot",
          "camera_angle": "Eye-level",
          "composition": "Scatter",
          "camera_move": "truck_right",
          "color_tone": "Cool tone",
          "focal_length": "广角24-35mm",
          "lighting": "人工光"
        }
      },
      "video": "assets/indexed-v000_s001.mp4",
      "poster": "assets/indexed-v000_s001-1.webp",
      "frames": [
        {
          "src": "assets/indexed-v000_s001-0.webp",
          "time": 0.915
        },
        {
          "src": "assets/indexed-v000_s001-1.webp",
          "time": 4.004
        },
        {
          "src": "assets/indexed-v000_s001-2.webp",
          "time": 7.436
        },
        {
          "src": "assets/indexed-v000_s001-3.webp",
          "time": 10.525
        }
      ],
      "duration": 11.44
    },
    {
      "id": "v043_s002",
      "title": "Candlelit interior",
      "caption": "A leftward pan follows a woman through an interior.",
      "group": "Moving camera",
      "fields": [
        {
          "key": "camera_move",
          "label": "Camera movement",
          "value": "Pan left",
          "original": "pan_left"
        },
        {
          "key": "shot_size",
          "label": "Shot size",
          "value": "Medium full shot",
          "original": "Medium full shot"
        },
        {
          "key": "camera_angle",
          "label": "Camera angle",
          "value": "Eye-level",
          "original": "Eye-level"
        },
        {
          "key": "composition",
          "label": "Composition",
          "value": "Leading Lines",
          "original": "Leading Lines"
        },
        {
          "key": "color_tone",
          "label": "Color tone",
          "value": "Warm tone",
          "original": "Warm tone"
        },
        {
          "key": "focal_length",
          "label": "Focal look",
          "value": "Standard look",
          "original": "标准40-50mm"
        },
        {
          "key": "lighting",
          "label": "Lighting look",
          "value": "Artificial-light look",
          "original": "人工光"
        }
      ],
      "raw": {
        "keyframe_index": 0,
        "shot_caption": "一名宫女端着烛台在室内行走，背景是古色古香的房间。",
        "character_layout": "center",
        "technique": {
          "shot_size": "Medium full shot",
          "camera_angle": "Eye-level",
          "composition": "Leading Lines",
          "camera_move": "pan_left",
          "color_tone": "Warm tone",
          "focal_length": "标准40-50mm",
          "lighting": "人工光"
        }
      },
      "video": "assets/indexed-v043_s002.mp4",
      "poster": "assets/indexed-v043_s002-1.webp",
      "frames": [
        {
          "src": "assets/indexed-v043_s002-0.webp",
          "time": 0.461
        },
        {
          "src": "assets/indexed-v043_s002-1.webp",
          "time": 2.016
        },
        {
          "src": "assets/indexed-v043_s002-2.webp",
          "time": 3.744
        },
        {
          "src": "assets/indexed-v043_s002-3.webp",
          "time": 5.299
        }
      ],
      "duration": 5.76
    },
    {
      "id": "v070_s002",
      "title": "Street pursuit",
      "caption": "The camera retreats as the figure runs toward it.",
      "group": "Moving camera",
      "fields": [
        {
          "key": "camera_move",
          "label": "Camera movement",
          "value": "Dolly out",
          "original": "dolly_out"
        },
        {
          "key": "shot_size",
          "label": "Shot size",
          "value": "Full shot",
          "original": "Full shot"
        },
        {
          "key": "camera_angle",
          "label": "Camera angle",
          "value": "Eye-level",
          "original": "Eye-level"
        },
        {
          "key": "composition",
          "label": "Composition",
          "value": "Center",
          "original": "Center"
        },
        {
          "key": "color_tone",
          "label": "Color tone",
          "value": "Mixed tone",
          "original": "Mixed tone"
        },
        {
          "key": "focal_length",
          "label": "Focal look",
          "value": "Wide-angle look",
          "original": "广角24-35mm"
        },
        {
          "key": "lighting",
          "label": "Lighting look",
          "value": "Mixed-light look",
          "original": "混合光"
        }
      ],
      "raw": {
        "keyframe_index": 0,
        "shot_caption": "一个穿着黑色斗篷的人拿着两把弯刀在街上奔跑",
        "character_layout": "center",
        "technique": {
          "shot_size": "Full shot",
          "camera_angle": "Eye-level",
          "composition": "Center",
          "camera_move": "dolly_out",
          "color_tone": "Mixed tone",
          "focal_length": "广角24-35mm",
          "lighting": "混合光"
        }
      },
      "video": "assets/indexed-v070_s002.mp4",
      "poster": "assets/indexed-v070_s002-1.webp",
      "frames": [
        {
          "src": "assets/indexed-v070_s002-0.webp",
          "time": 0.273
        },
        {
          "src": "assets/indexed-v070_s002-1.webp",
          "time": 1.196
        },
        {
          "src": "assets/indexed-v070_s002-2.webp",
          "time": 2.221
        },
        {
          "src": "assets/indexed-v070_s002-3.webp",
          "time": 3.143
        }
      ],
      "duration": 3.4166666666666665
    },
    {
      "id": "v105_s001",
      "title": "Low-angle warrior",
      "caption": "The character and lighting change while the camera stays still.",
      "group": "Static camera",
      "fields": [
        {
          "key": "camera_move",
          "label": "Camera movement",
          "value": "Static",
          "original": "static"
        },
        {
          "key": "shot_size",
          "label": "Shot size",
          "value": "Medium full shot",
          "original": "Medium full shot"
        },
        {
          "key": "camera_angle",
          "label": "Camera angle",
          "value": "Low angle",
          "original": "Low angle"
        },
        {
          "key": "composition",
          "label": "Composition",
          "value": "Rule of thirds",
          "original": "Rule of thirds"
        },
        {
          "key": "color_tone",
          "label": "Color tone",
          "value": "Mixed tone",
          "original": "Mixed tone"
        },
        {
          "key": "focal_length",
          "label": "Focal look",
          "value": "Wide-angle look",
          "original": "广角24-35mm"
        },
        {
          "key": "lighting",
          "label": "Lighting look",
          "value": "Mixed-light look",
          "original": "混合光"
        }
      ],
      "raw": {
        "keyframe_index": 0,
        "shot_caption": "一位身披铠甲的战士手持金色龙形武器，周围环绕着蓝色和红色的闪电，背景是阴沉的天空和古老的建筑。",
        "character_layout": "center",
        "technique": {
          "shot_size": "Medium full shot",
          "camera_angle": "Low angle",
          "focal_length": "广角24-35mm",
          "composition": "Rule of thirds",
          "camera_move": "static",
          "color_tone": "Mixed tone",
          "lighting": "混合光"
        }
      },
      "video": "assets/indexed-v105_s001.mp4",
      "poster": "assets/indexed-v105_s001-1.webp",
      "frames": [
        {
          "src": "assets/indexed-v105_s001-0.webp",
          "time": 0.293
        },
        {
          "src": "assets/indexed-v105_s001-1.webp",
          "time": 1.283
        },
        {
          "src": "assets/indexed-v105_s001-2.webp",
          "time": 2.383
        },
        {
          "src": "assets/indexed-v105_s001-3.webp",
          "time": 3.373
        }
      ],
      "duration": 3.6666666666666665
    }
  ]
};
