# Object Detection and Tracking System — CodeAlpha Task 4

A complete, browser-based object detection and tracking web application built with **TensorFlow.js** and the **COCO-SSD** pretrained model. It runs entirely in the browser — no Python server, no backend, no API keys required.

## Features

- **Upload Image** — Select a JPG, JPEG, or PNG image from your computer and instantly see detected objects with bounding boxes, labels, and confidence scores.
- **Start Camera** — Use your webcam for real-time object detection and tracking.
- **Stop Camera** — Stop the live camera feed at any time.
- **Reset** — Clear the canvas, reset trackers, and return to the start screen.
- **Object Detection** — Powered by COCO-SSD (recognizes 80 common object classes: person, car, dog, chair, etc.).
- **Object Tracking** — Moving objects are tracked across frames with unique tracking IDs using an IoU-based tracker.
- **Live Stats Panel** showing:
  - Camera Status (Off / Starting / Live / Stopped / Error)
  - FPS (frames per second)
  - Detected Objects count
  - Tracked Objects count
  - Detections list with class names, confidence scores, and tracking IDs

## Tech Stack

| Technology | Purpose |
|------------|---------|
| TensorFlow.js | Machine learning inference in the browser |
| COCO-SSD Model | Pretrained object detection (80 classes) |
| HTML5 Canvas | Drawing bounding boxes and labels |
| getUserMedia API | Webcam access |
| Vanilla JavaScript | Application logic |
| CSS3 | Styling and layout |

## How to Run

### In Bolt Preview
The app runs automatically in the Bolt Preview. The `npm run dev` script serves the static `index.html` file on port 5173.

### Locally
1. Download the project files.
2. Open `index.html` in a modern browser (Chrome, Edge, Firefox).
3. Allow camera access when prompted for webcam mode.

> **Note:** Webcam access requires HTTPS or localhost. Opening the file via `file://` will work for image upload but may block camera access in some browsers.

## How It Works

1. **Model Loading** — On page load, TensorFlow.js downloads the COCO-SSD model (lite MobileNet v2 variant for speed) to the browser.
2. **Image Detection** — When you upload an image, it's drawn to a canvas and passed through the model. Detected objects get bounding boxes, class labels, and confidence scores.
3. **Camera Detection** — When you start the camera, each video frame is processed through the model in real time using `requestAnimationFrame`.
4. **Tracking** — An IoU (Intersection over Union) tracker matches detections across frames. Each new object gets a unique ID. Objects not seen for 15 consecutive frames are removed. Each tracked object gets a consistent color.
5. **Stats Display** — FPS is calculated from frame timestamps. Detection and tracking counts update every frame.

## Project Structure

```
.
├── index.html        # Complete app (HTML + CSS + JavaScript)
├── package.json      # Dev script to serve in Bolt Preview
├── README.md         # This file
└── .gitignore        # Files to ignore in version control
```

## Browser Requirements

- Modern browser with WebGL support (Chrome, Edge, Firefox, Safari)
- Camera access permission for webcam mode
- ~10MB download for the model on first load (cached afterwards)

## License

This project is for educational purposes as part of the CodeAlpha AI Internship program.
