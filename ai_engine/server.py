from fastapi import FastAPI, UploadFile, File
import cv2
import numpy as np
from blur_logic import blur_faces
from detect_logic import count_people
from fastapi.middleware.cors import CORSMiddleware
import base64

app = FastAPI()

app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_credentials=False,
  allow_methods=["*"],
  allow_headers=["*"],
)

@app.get("/")
def home():
  return {"name": "AttendAI Engine", "status": "active"}

@app.get("/health")
def health():
  return {"status": "ok"}

@app.post("/process")
async def process_image(file: UploadFile = File(...)):
  contents = await file.read()
  nparr    = np.frombuffer(contents, np.uint8)
  img      = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

  # 1. Memory Safety: Downscale if image is too large for 512MB RAM
  h, w = img.shape[:2]
  max_dim = 800
  if h > max_dim or w > max_dim:
      scale = max_dim / max(h, w)
      new_w, new_h = int(w * scale), int(h * scale)
      img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)

  # 2. Brightness check
  avg_brightness = float(np.mean(img))
  low_light      = avg_brightness < 50

  # 3. Count people
  _, data = count_people(img)

  # 4. Encode as base64 (slightly lower quality for speed/memory)
  _, buffer   = cv2.imencode('.jpg', img, [cv2.WRITE_JPEG_QUALITY, 85])
  img_base64  = base64.b64encode(buffer).decode('utf-8')

  return {
    "count":          int(data["total"]),
    "standing":       int(data["standing"]),
    "sitting":        int(data["sitting"]),
    "teacher_present": bool(data["teacher"]),
    "low_light":      bool(low_light),
    "image":          f"data:image/jpeg;base64,{img_base64}",
    "status":         "success",
  }

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
