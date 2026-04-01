from ultralytics import YOLO
import cv2
import numpy as np

# YOLOv8n (Nano) — essential for 512MB RAM cloud hosting
model = YOLO('yolov8n.pt')


def _preprocess(image):
    """CLAHE contrast enhancement — helps in dim/backlit classrooms."""
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    return cv2.cvtColor(cv2.merge([l, a, b]), cv2.COLOR_LAB2BGR)


def count_people(image):
    """
    Single-pass person detection optimised for CPU.
    Fast (~3s), accurate, no tiling overhead.
    """
    enhanced = _preprocess(image)

    # Single prediction — conf=0.20 catches most people without false positives
    results = model.predict(
        enhanced,
        conf=0.20,
        iou=0.45,
        imgsz=640,
        classes=[0],   # class 0 = person
        verbose=False,
    )

    person_count   = 0
    standing_count = 0
    sitting_count  = 0
    areas          = []

    for result in results:
        if result.boxes is None:
            continue
        for box in result.boxes:
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
            bh = float(y2 - y1)
            bw = float(x2 - x1)
            person_count += 1
            areas.append(bw * bh)
            # Taller than wide → standing
            if bh / max(bw, 1) > 1.3:
                standing_count += 1
            else:
                sitting_count += 1

    # Teacher heuristic — one person significantly larger than the rest
    teacher_present = False
    if areas:
        sorted_areas = sorted(areas, reverse=True)
        if len(sorted_areas) >= 2 and sorted_areas[0] > sorted_areas[1] * 1.6:
            teacher_present = True
        if person_count <= 2:
            teacher_present = True

    return image, {
        "total":    int(person_count),
        "standing": int(standing_count),
        "sitting":  int(sitting_count),
        "teacher":  bool(teacher_present),
    }
