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

@app.post("/process")
async def process_image(file: UploadFile = File(...)):
  contents = await file.read()
  nparr    = np.frombuffer(contents, np.uint8)
  img      = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

  # 1. Brightness check
  avg_brightness = float(np.mean(img))
  low_light      = avg_brightness < 50

  # 2. Count people (sliced inference)
  _, data = count_people(img)

  # 3. Privacy Blurring Removed as requested
  # Image remains clear for analysis and institutional records
  
  # 4. Encode original image as base64
  _, buffer   = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 92])
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

@app.get("/health")
def health():
  return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
