#!/usr/bin/env python3
"""
Download YOLOv8 model weights if not already present.
Called automatically before server starts on Render.
"""
import os
from ultralytics import YOLO

MODEL = 'yolov8m.pt'

if not os.path.exists(MODEL):
    print(f'Downloading {MODEL}...', flush=True)
    YOLO(MODEL)   # ultralytics auto-downloads from official source
    print(f'{MODEL} ready.', flush=True)
else:
    print(f'{MODEL} already present.', flush=True)
