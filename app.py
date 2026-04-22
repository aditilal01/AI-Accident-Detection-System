import os
import cv2
import time
from flask import Flask, render_template, request, jsonify
from ultralytics import YOLO
import requests

app = Flask(__name__)

UPLOAD_FOLDER = "uploads"
FRAMES_FOLDER = "frames"
DETECTED_FOLDER = "static/detected_frames"

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(FRAMES_FOLDER, exist_ok=True)
os.makedirs(DETECTED_FOLDER, exist_ok=True)

model = YOLO("yolov8n.pt")

VEHICLE_CLASSES = ["car", "bus", "truck", "motorcycle"]


# ---------------------------
# IoU Calculation Function
# ---------------------------
def calculate_iou(box1, box2):

    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])

    intersection = max(0, x2 - x1) * max(0, y2 - y1)

    area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
    area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])

    union = area1 + area2 - intersection

    if union == 0:
        return 0

    return intersection / union

def send_telegram_alert(image_path):

   import os

   TOKEN = os.environ.get("TELEGRAM_TOKEN", "YOUR TELERAM TOKEN")
   CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID", "YOUR CHAT ID")

   url = f"https://api.telegram.org/bot{TOKEN}/sendPhoto"

   with open(image_path, "rb") as photo:
      requests.post(
          url,
          data={
                "chat_id": CHAT_ID,
                "caption": "🚨 Accident Detected!"
            },
            files={"photo": photo}
        )


# ---------------------------
# Core Detection Logic
# ---------------------------
def process_video(filepath):
    """Process a video file and return detection results + stats."""
    start_time = time.time()

    # Clear previous frames
    for f in os.listdir(FRAMES_FOLDER):
        os.remove(os.path.join(FRAMES_FOLDER, f))

    for f in os.listdir(DETECTED_FOLDER):
        os.remove(os.path.join(DETECTED_FOLDER, f))

    # ---------------------------
    # Frame Extraction
    # ---------------------------
    cap = cv2.VideoCapture(filepath)

    frame_count = 0
    saved_frames = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_count % 5 == 0:
            frame_path = os.path.join(FRAMES_FOLDER, f"frame_{saved_frames}.jpg")
            cv2.imwrite(frame_path, frame)
            saved_frames += 1

        frame_count += 1

    cap.release()

    # ---------------------------
    # Vehicle Detection
    # ---------------------------
    accident_detected = False
    collision_frame_index = None
    delay_frames = 2
    frame_index = 0
    annotated_frame = None

    for frame_file in sorted(os.listdir(FRAMES_FOLDER)):
        frame_index += 1
        frame_path = os.path.join(FRAMES_FOLDER, frame_file)
        results = model(frame_path)

        vehicle_boxes = []

        for r in results:

            boxes = r.boxes

            for box in boxes:

                cls_id = int(box.cls[0])
                class_name = model.names[cls_id]

                if class_name in VEHICLE_CLASSES:

                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    vehicle_boxes.append([x1, y1, x2, y2])

            annotated_frame = r.plot()

        # ---------------------------
        # Accident Detection (Improved)
        # ---------------------------

        collision_detected = False

        for i in range(len(vehicle_boxes)):
            for j in range(i + 1, len(vehicle_boxes)):
            
                iou = calculate_iou(vehicle_boxes[i], vehicle_boxes[j])

                # higher threshold to avoid early trigger
                if iou > 0.6:
                    collision_detected = True
                    break
                
            if collision_detected:
                break
            
            
        # If collision detected, wait one frame before capturing
        if collision_detected and collision_frame_index is None:
            collision_frame_index = frame_index

        if accident_detected:
            break         

        if collision_frame_index is not None and frame_index >= collision_frame_index + delay_frames:

            accident_detected = True

            save_path = os.path.join(DETECTED_FOLDER, "accident.jpg")
            cv2.imwrite(save_path, annotated_frame)

            send_telegram_alert(save_path)

            break

    processing_time = round(time.time() - start_time, 2)

    return {
        "accident": accident_detected,
        "image_path": "static/detected_frames/accident.jpg" if accident_detected else None,
        "stats": {
            "frames_analyzed": frame_index,
            "processing_time": processing_time
        }
    }


# ---------------------------
# Routes
# ---------------------------
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/upload", methods=["POST"])
def upload():
    """AJAX endpoint — accepts video, returns JSON with results."""
    if "video" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["video"]

    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    filepath = os.path.join(app.config["UPLOAD_FOLDER"], file.filename)
    file.save(filepath)

    result = process_video(filepath)
    return jsonify(result)


@app.route("/result")
def result():
    """Render the result page (called after AJAX upload completes)."""
    accident = request.args.get("accident", "false").lower() == "true"
    image_path = request.args.get("image_path", None)
    frames_analyzed = request.args.get("frames", "0")
    processing_time = request.args.get("time", "0")

    return render_template(
        "result.html",
        accident=accident,
        image_path=image_path,
        frames_analyzed=frames_analyzed,
        processing_time=processing_time
    )


if __name__ == "__main__":
    app.run(debug=True)