📌 Overview

This project implements an end-to-end accident detection system using state-of-the-art computer vision. It processes uploaded video footage frame by frame, detects vehicles using YOLOv8, identifies potential collisions via Intersection over Union (IoU) logic, and instantly dispatches alerts — complete with image snapshots — to a Telegram bot.
The system is designed as a full AI-powered pipeline, integrating inference, backend processing, and real-time notification into a single cohesive application.

🔥 Features

FeatureDescription🚘 Vehicle DetectionYOLOv8 (Ultralytics) for fast, accurate object detection
📹 Frame AnalysisFrame-by-frame video processing at configurable intervals

⚠️ Collision DetectionIoU-based bounding box overlap logic

⏱️ False Positive ReductionDelayed confirmation before raising an alert

📩 Instant AlertsReal-time Telegram notifications with accident frame snapshots

🖥️ Web InterfaceClean Flask UI for video upload and monitoring

🧠 How It Works

## 🧠 How It Works

1. Upload video via Flask UI  
2. Extract frames at fixed intervals  
3. Detect vehicles using YOLOv8  
4. Compute IoU between bounding boxes  
5. If IoU > threshold → potential collision  
6. Apply delay to confirm detection  
7. Send Telegram alert with snapshot  

⚙️ Tech Stack

LayerTechnology

AI / Inference              YOLOv8 — Ultralytics

Computer Vision             OpenCV

Backend / API               Flask

Numerical Processing        NumPy

NotificationsTelegram Bot   API

Language                    Python 3.8+


## 📊 Detection Logic

Collision detection is based on **Intersection over Union (IoU)** — a standard computer vision metric used to measure bounding box overlap.

IoU = Area of Overlap / Area of Union

### 🚨 Collision Criteria
A potential collision is flagged when:

```
IoU > threshold (e.g., 0.6)
```

### ⚙️ Additional Logic
- Delay-based confirmation to reduce false positives  
- Multi-frame consistency check  
- Snapshot captured for alerts  
False Positive Mitigation:

*The IoU threshold filters out near-miss scenarios
*A confirmation delay requires the overlap to persist across multiple consecutive frames before an alert is raised — preventing single-frame noise from triggering notifications



## 📁 Project Structure

```
AI-Accident-Detection/
│── app.py                # 🚀 Main Flask app + detection pipeline
│── templates/
│   └── index.html       # 🖥️ Upload UI
│── static/              # 🎨 CSS, JS, assets
│── uploads/             # 📥 Uploaded videos
│── frames/              # 🖼️ Extracted frames & snapshots
│── requirements.txt     # 📦 Dependencies
│── README.md
```


▶️ Getting Started
Prerequisites

Python 3.8+
A Telegram bot token and chat ID (create one via @BotFather)

1. Clone the Repository
bash
git clone https://github.com/your-username/AI-Accident-Detection.git
cd AI-Accident-Detection

2. Install Dependencies
bash
pip install -r requirements.txt

3. Configure Environment Variables
Create a .env file in the project root (never commit this file):
bash
TELEGRAM_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here

⚠️ Tokens are not included in this repository. Keep your .env in .gitignore.

4. Run the Application
bashpython app.py

6. Open in Browser
http://127.0.0.1:5000

Upload a video and the system will begin processing automatically.

🔐 Security Notes

Store all secrets in environment variables — never hardcode tokens
Add .env to your .gitignore
Consider rate-limiting the Flask upload endpoint in production


⚠️ Limitations

1.Physics-agnostic: Detection relies on bounding box geometry (IoU), not real-world collision physics

2.Video quality dependent: Performance degrades in low-light, low-resolution, or heavily occluded footage

3.Batch processing only: Not currently optimised for live CCTV stream ingestion

4.Single-frame context: No multi-frame tracking of individual vehicles across time


🚀 Roadmap

 Live CCTV / RTSP stream integration
 
 Multi-object tracking (DeepSORT / ByteTrack) across frames
 
 ML-based collision severity classification
 
 Dockerised deployment for cloud/edge environments
 
 Dashboard for historical alert review
 
 Support for additional alert channels (email, SMS, webhook)


💡 Key Takeaways

Built a complete AI-powered pipeline — not just a model, but a production-style system

Integrated computer vision, a web backend, and a real-time notification service

Designed explicit logic to reduce false positives in a safety-critical context

Demonstrated end-to-end real-world problem solving with accessible tooling


👤 Author

Aditi Lal

📄 License
This project is open-source. 
