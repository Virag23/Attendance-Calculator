import cv2, time, sys
sys.path.insert(0, r'e:\Attendance\ai_engine')

img = cv2.imread(r'e:\Attendance\ai_engine\test_people.jpg')
print('Image:', img.shape, flush=True)

from detect_logic import count_people

t = time.time()
_, data = count_people(img)
elapsed = round(time.time() - t, 2)

print(f'Count: {data["total"]}', flush=True)
print(f'Standing: {data["standing"]}', flush=True)
print(f'Sitting: {data["sitting"]}', flush=True)
print(f'Teacher: {data["teacher"]}', flush=True)
print(f'Time: {elapsed}s', flush=True)
