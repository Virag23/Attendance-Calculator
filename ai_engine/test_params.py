import cv2, numpy as np, time
from ultralytics import YOLO

img = cv2.imread(r'e:\Attendance\ai_engine\test_people.jpg')
print('Image size:', img.shape, flush=True)

m = YOLO(r'e:\Attendance\ai_engine\yolov8m.pt')

for imgsz in [640, 1280]:
    for conf in [0.10, 0.15, 0.20, 0.25]:
        t = time.time()
        r = m.predict(img, conf=conf, iou=0.45, imgsz=imgsz, classes=[0], verbose=False)
        c = sum(len(x.boxes) for x in r if x.boxes)
        print(f'imgsz={imgsz} conf={conf} -> count={c}  time={round(time.time()-t,2)}s', flush=True)
