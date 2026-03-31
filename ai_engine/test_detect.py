import cv2
import sys

img = cv2.imread(r'e:\Attendance\ai_engine\test_people.jpg')
print('Image shape:', img.shape, flush=True)

from ultralytics import YOLO

print('Testing yolov8n...', flush=True)
model = YOLO(r'e:\Attendance\ai_engine\yolov8n.pt')
results = model.predict(img, conf=0.20, classes=[0], verbose=False)
count = sum(len(r.boxes) for r in results if r.boxes is not None)
print('yolov8n count:', count, flush=True)

print('Testing yolov8m...', flush=True)
model2 = YOLO(r'e:\Attendance\ai_engine\yolov8m.pt')
results2 = model2.predict(img, conf=0.20, classes=[0], verbose=False)
count2 = sum(len(r.boxes) for r in results2 if r.boxes is not None)
print('yolov8m count:', count2, flush=True)

print('Testing detect_logic...', flush=True)
sys.path.insert(0, r'e:\Attendance\ai_engine')
from detect_logic import count_people
_, data = count_people(img.copy())
print('detect_logic result:', data, flush=True)
