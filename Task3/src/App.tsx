import { useCallback, useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

// ---- Types ----
type BBox = [number, number, number, number]; // [x, y, w, h]

interface Detection {
  bbox: BBox;
  class: string;
  score: number;
  id: number | null;
}

interface Tracker {
  id: number;
  bbox: BBox;
  class: string;
  score: number;
  missed: number;
}

type Mode = "idle" | "image" | "camera";
type StatusState = "off" | "on" | "loading";

// ---- Color palette for tracker IDs ----
const COLORS = [
  "#ef4444", "#f59e0b", "#22c55e", "#06b6d4",
  "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6",
  "#f97316", "#84cc16", "#0ea5e9", "#a855f7",
];

function colorFor(id: number): string {
  return COLORS[(id - 1) % COLORS.length];
}

// ---- IoU (Intersection over Union) for tracker matching ----
function iou(a: BBox, b: BBox): number {
  // Convert [x,y,w,h] to [x1,y1,x2,y2]
  const aX2 = a[0] + a[2];
  const aY2 = a[1] + a[3];
  const bX2 = b[0] + b[2];
  const bY2 = b[1] + b[3];
  const xL = Math.max(a[0], b[0]);
  const yT = Math.max(a[1], b[1]);
  const xR = Math.min(aX2, bX2);
  const yB = Math.min(aY2, bY2);
  const interW = Math.max(0, xR - xL);
  const interH = Math.max(0, yB - yT);
  const interArea = interW * interH;
  const areaA = a[2] * a[3];
  const areaB = b[2] * b[3];
  const union = areaA + areaB - interArea;
  return union > 0 ? interArea / union : 0;
}

export default function App() {
  // ---- Refs (mutable values that don't trigger re-render) ----
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);
  const modeRef = useRef<Mode>("idle");
  const trackersRef = useRef<Tracker[]>([]);
  const nextTrackerIdRef = useRef(1);
  const frameTimesRef = useRef<number[]>([]);
  const currentImageRef = useRef<HTMLImageElement | null>(null);

  // ---- State (drives re-renders) ----
  const [modelLoaded, setModelLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [cameraStatus, setCameraStatus] = useState("Off");
  const [statusState, setStatusState] = useState<StatusState>("off");
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<Mode>("idle");
  const [fps, setFps] = useState(0);
  const [detectedCount, setDetectedCount] = useState(0);
  const [trackedCount, setTrackedCount] = useState(0);
  const [detectionList, setDetectionList] = useState<Detection[]>([]);
  const [showPlaceholder, setShowPlaceholder] = useState(true);

  // ---- Status helper ----
  const setStatus = useCallback((text: string, state: StatusState) => {
    setCameraStatus(text);
    setStatusState(state);
  }, []);

  // ---- FPS update ----
  const updateFPS = useCallback(() => {
    const now = performance.now();
    frameTimesRef.current.push(now);
    while (frameTimesRef.current.length > 0 && frameTimesRef.current[0] < now - 1000) {
      frameTimesRef.current.shift();
    }
    setFps(frameTimesRef.current.length);
  }, []);

  // ---- Tracker update ----
  const updateTrackers = useCallback((detections: Detection[]): Detection[] => {
    const IOU_THRESHOLD = 0.3;
    const usedTrackers = new Set<number>();

    detections.forEach((det) => {
      let bestIdx = -1;
      let bestIou = IOU_THRESHOLD;
      trackersRef.current.forEach((tr, idx) => {
        if (usedTrackers.has(idx)) return;
        const score = iou(det.bbox, tr.bbox);
        if (score > bestIou) {
          bestIou = score;
          bestIdx = idx;
        }
      });
      if (bestIdx >= 0) {
        trackersRef.current[bestIdx].bbox = det.bbox;
        trackersRef.current[bestIdx].class = det.class;
        trackersRef.current[bestIdx].score = det.score;
        trackersRef.current[bestIdx].missed = 0;
        det.id = trackersRef.current[bestIdx].id;
        usedTrackers.add(bestIdx);
      } else {
        det.id = nextTrackerIdRef.current++;
        trackersRef.current.push({
          id: det.id,
          bbox: det.bbox,
          class: det.class,
          score: det.score,
          missed: 0,
        });
      }
    });

    trackersRef.current = trackersRef.current.filter((tr, idx) => {
      if (!usedTrackers.has(idx)) {
        tr.missed++;
        return tr.missed < 15;
      }
      return true;
    });

    return detections;
  }, []);

  // ---- Drawing ----
  const drawDetections = useCallback(
    (detections: Detection[], sourceWidth: number, sourceHeight: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = sourceWidth;
      canvas.height = sourceHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (modeRef.current === "image" && currentImageRef.current) {
        ctx.drawImage(currentImageRef.current, 0, 0, canvas.width, canvas.height);
      }

      detections.forEach((det) => {
        const [x, y, w, h] = det.bbox;
        const color = colorFor(det.id || 1);

        ctx.lineWidth = Math.max(2, sourceWidth / 400);
        ctx.strokeStyle = color;
        ctx.strokeRect(x, y, w, h);

        const label =
          det.class +
          " " +
          (det.score * 100).toFixed(0) +
          "%" +
          (det.id ? "  #" + det.id : "");
        ctx.font = Math.max(14, sourceWidth / 50) + "px Inter, sans-serif";
        const textW = ctx.measureText(label).width;
        const labelH = Math.max(20, sourceWidth / 35);
        ctx.fillStyle = color;
        ctx.fillRect(x, y - labelH, textW + 12, labelH);

        ctx.fillStyle = "#0f172a";
        ctx.fillText(label, x + 6, y - 6);
      });
    },
    []
  );

  // ---- Update stats in React state ----
  const updateStats = useCallback((detections: Detection[]) => {
    setDetectedCount(detections.length);
    const trackedSet = new Set<number>();
    detections.forEach((d) => {
      if (d.id) trackedSet.add(d.id);
    });
    setTrackedCount(trackedSet.size);
    setDetectionList(detections);
  }, []);

  // ---- Detection pipeline ----
  const detectAndDraw = useCallback(
    async (
      source: HTMLVideoElement | HTMLImageElement
    ): Promise<void> => {
      const model = modelRef.current;
      if (!model) return;

      const predictions = await model.detect(source);
      const detections: Detection[] = predictions.map((p) => ({
        bbox: p.bbox as BBox,
        class: p.class,
        score: p.score,
        id: null,
      }));

      const tracked = updateTrackers(detections);
      const sw =
        (source as HTMLVideoElement).videoWidth ||
        (source as HTMLImageElement).naturalWidth ||
        (source as HTMLElement).clientWidth;
      const sh =
        (source as HTMLVideoElement).videoHeight ||
        (source as HTMLImageElement).naturalHeight ||
        (source as HTMLElement).clientHeight;

      drawDetections(tracked, sw, sh);
      updateStats(tracked);
      updateFPS();
    },
    [updateTrackers, drawDetections, updateStats, updateFPS]
  );

  // ---- Camera loop ----
  const cameraLoop = useCallback(() => {
    if (!isRunningRef.current) return;
    const video = videoRef.current;
    if (!video) return;

    detectAndDraw(video).then(() => {
      if (isRunningRef.current) {
        rafIdRef.current = requestAnimationFrame(cameraLoop);
      }
    });
  }, [detectAndDraw]);

  // ---- Stop camera ----
  const stopCamera = useCallback(() => {
    isRunningRef.current = false;
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    const video = videoRef.current;
    if (video) video.srcObject = null;
    setIsRunning(false);
  }, []);

  // ---- Load model on mount ----
  useEffect(() => {
    async function init() {
      try {
        try {
          await tf.setBackend("webgl");
        } catch {
          /* fallback to default */
        }
        try {
          await tf.ready();
        } catch {
          /* ignore */
        }
        modelRef.current = await cocoSsd.load({ base: "lite_mobilenet_v2" });
        setModelLoaded(true);
        setStatus("Ready", "off");
      } catch (err) {
        console.error("Model load error:", err);
        setLoadError(true);
      }
    }
    init();
    // Cleanup on unmount
    return () => {
      isRunningRef.current = false;
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [setStatus]);

  // ---- Sync modeRef with mode state ----
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // ---- Button handlers ----
  const handleUploadClick = () => {
    if (isRunningRef.current) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (isRunningRef.current) return;

    const img = new Image();
    img.onload = () => {
      currentImageRef.current = img;
      modeRef.current = "image";
      setMode("image");
      setShowPlaceholder(false);
      trackersRef.current = [];
      nextTrackerIdRef.current = 1;
      frameTimesRef.current = [];
      detectAndDraw(img);
      setStatus("Image loaded", "on");
    };
    img.src = URL.createObjectURL(file);
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleStartCamera = async () => {
    if (isRunningRef.current) return;
    const video = videoRef.current;
    if (!video) return;

    try {
      setStatus("Starting…", "loading");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();

      trackersRef.current = [];
      nextTrackerIdRef.current = 1;
      frameTimesRef.current = [];

      modeRef.current = "camera";
      setMode("camera");
      currentImageRef.current = null;
      isRunningRef.current = true;
      setIsRunning(true);
      setShowPlaceholder(false);

      setStatus("Live", "on");
      cameraLoop();
    } catch (err) {
      console.error("Camera error:", err);
      setStatus("Error", "off");
      alert(
        "Could not access the camera. Please make sure your browser has permission and a camera is connected."
      );
    }
  };

  const handleStopCamera = () => {
    stopCamera();
    setStatus("Stopped", "off");
  };

  const handleReset = () => {
    stopCamera();
    modeRef.current = "idle";
    setMode("idle");
    currentImageRef.current = null;
    trackersRef.current = [];
    nextTrackerIdRef.current = 1;
    frameTimesRef.current = [];
    setShowPlaceholder(true);
    setStatus("Off", "off");
    setFps(0);
    setDetectedCount(0);
    setTrackedCount(0);
    setDetectionList([]);
  };

  // ---- Derived button disabled states ----
  const btnUploadDisabled = isRunning || !modelLoaded;
  const btnStartDisabled = isRunning || !modelLoaded;
  const btnStopDisabled = !isRunning;
  const btnResetDisabled = mode === "idle";

  return (
    <>
      {/* Loading overlay */}
      {!modelLoaded && (
        <div className={`loading-overlay${loadError ? " hidden" : ""}`}>
          <div className="spinner"></div>
          <div className="loading-text">
            {loadError
              ? "Failed to load the AI model. Please refresh the page."
              : "Loading AI model…"}
          </div>
        </div>
      )}

      <div className="app">
        <header>
          <h1>Object Detection &amp; Tracking System</h1>
          <p>CodeAlpha AI Internship — Task 4</p>
          <div className="model-badge">
            <span className="dot"></span>
            <span>COCO-SSD · TensorFlow.js</span>
          </div>
        </header>

        <div className="layout">
          {/* Left: canvas + controls */}
          <div>
            <div className="canvas-wrapper">
              {showPlaceholder && (
                <div className="placeholder">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                  <p>Upload an image or start the camera to begin detection</p>
                </div>
              )}
              <video ref={videoRef} autoPlay playsInline muted />
              <canvas
                ref={canvasRef}
                style={{ display: showPlaceholder ? "none" : "block" }}
              />
            </div>

            <div className="controls">
              <input
                type="file"
                ref={fileInputRef}
                className="file-input"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleFileChange}
              />
              <button
                className="btn btn-primary"
                id="btnUpload"
                onClick={handleUploadClick}
                disabled={btnUploadDisabled}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Upload Image
              </button>
              <button
                className="btn btn-success"
                id="btnStart"
                onClick={handleStartCamera}
                disabled={btnStartDisabled}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" />
                </svg>
                Start Camera
              </button>
              <button
                className="btn btn-danger"
                id="btnStop"
                onClick={handleStopCamera}
                disabled={btnStopDisabled}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <rect x="6" y="6" width="12" height="12" rx="1" />
                </svg>
                Stop Camera
              </button>
              <button
                className="btn btn-warning"
                id="btnReset"
                onClick={handleReset}
                disabled={btnResetDisabled}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
                </svg>
                Reset
              </button>
            </div>
          </div>

          {/* Right: stats panel */}
          <aside className="panel">
            <h2>Live Stats</h2>

            <div className="stat-row">
              <span className="stat-label">Camera Status</span>
              <span className="stat-value">
                <span className={`status-dot ${statusState}`}></span>
                {cameraStatus}
              </span>
            </div>

            <div className="stat-row">
              <span className="stat-label">FPS</span>
              <span className="stat-value">{fps}</span>
            </div>

            <div className="stat-row">
              <span className="stat-label">Detected Objects</span>
              <span className="stat-value">{detectedCount}</span>
            </div>

            <div className="stat-row">
              <span className="stat-label">Tracked Objects</span>
              <span className="stat-value">{trackedCount}</span>
            </div>

            <div>
              <div className="stat-label" style={{ marginBottom: "8px" }}>
                Detections List
              </div>
              <div className="object-list">
                {detectionList.length === 0 ? (
                  <div className="empty-text">No detections yet</div>
                ) : (
                  detectionList.map((d, i) => {
                    const color = colorFor(d.id || 1);
                    return (
                      <div
                        key={i}
                        className="object-item"
                        style={{ borderLeftColor: color }}
                      >
                        <span className="name">{d.class}</span>
                        <span
                          style={{
                            display: "flex",
                            gap: "6px",
                            alignItems: "center",
                          }}
                        >
                          <span className="conf">
                            {(d.score * 100).toFixed(0)}%
                          </span>
                          {d.id && (
                            <span
                              className="tid"
                              style={{ background: color }}
                            >
                              #{d.id}
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </aside>
        </div>

        <footer>
          Powered by TensorFlow.js + COCO-SSD &nbsp;·&nbsp; Runs entirely in
          your browser
        </footer>
      </div>
    </>
  );
}
