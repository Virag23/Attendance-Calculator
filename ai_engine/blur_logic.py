import cv2
import numpy as np

_face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
_eye_cascade  = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')
_profile_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_profileface.xml')


def _blur_region(image, x, y, w, h, strength=55):
    """Blur a rectangular region with Gaussian blur."""
    roi = image[y:y+h, x:x+w]
    # Kernel must be odd
    k = max(strength | 1, 21)
    image[y:y+h, x:x+w] = cv2.GaussianBlur(roi, (k, k), 0)


def blur_faces(image):
    """
    Multi-cascade face blur:
    1. Frontal face detection  → blur full face
    2. Profile face detection  → blur full face
    3. Eye detection on unblurred regions → blur eye area as fallback
    """
    gray    = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray_eq = cv2.equalizeHist(gray)   # improve detection in varied lighting

    blurred_regions = []  # list of (x, y, w, h) already blurred

    # ── Frontal faces ─────────────────────────────────────────────────────
    frontal = _face_cascade.detectMultiScale(
        gray_eq, scaleFactor=1.05, minNeighbors=4, minSize=(20, 20)
    )
    for (x, y, w, h) in (frontal if len(frontal) > 0 else []):
        # Expand region slightly for better coverage
        pad = int(w * 0.15)
        x1 = max(0, x - pad)
        y1 = max(0, y - pad)
        x2 = min(image.shape[1], x + w + pad)
        y2 = min(image.shape[0], y + h + pad)
        _blur_region(image, x1, y1, x2 - x1, y2 - y1)
        blurred_regions.append((x1, y1, x2 - x1, y2 - y1))

    # ── Profile faces ─────────────────────────────────────────────────────
    profile = _profile_cascade.detectMultiScale(
        gray_eq, scaleFactor=1.05, minNeighbors=4, minSize=(20, 20)
    )
    for (x, y, w, h) in (profile if len(profile) > 0 else []):
        pad = int(w * 0.15)
        x1 = max(0, x - pad)
        y1 = max(0, y - pad)
        x2 = min(image.shape[1], x + w + pad)
        y2 = min(image.shape[0], y + h + pad)
        _blur_region(image, x1, y1, x2 - x1, y2 - y1)
        blurred_regions.append((x1, y1, x2 - x1, y2 - y1))

    # ── Eye fallback: blur eye regions not already covered ────────────────
    eyes = _eye_cascade.detectMultiScale(
        gray_eq, scaleFactor=1.1, minNeighbors=5, minSize=(10, 10)
    )
    for (ex, ey, ew, eh) in (eyes if len(eyes) > 0 else []):
        # Check if this eye region is already inside a blurred face
        already_blurred = any(
            ex >= rx and ey >= ry and
            ex + ew <= rx + rw and ey + eh <= ry + rh
            for (rx, ry, rw, rh) in blurred_regions
        )
        if not already_blurred:
            # Expand eye region to cover brow and nose bridge
            pad_x = int(ew * 0.5)
            pad_y = int(eh * 0.8)
            x1 = max(0, ex - pad_x)
            y1 = max(0, ey - pad_y)
            x2 = min(image.shape[1], ex + ew + pad_x)
            y2 = min(image.shape[0], ey + eh + pad_y)
            _blur_region(image, x1, y1, x2 - x1, y2 - y1, strength=45)

    total_blurred = len(blurred_regions)
    return image, total_blurred
