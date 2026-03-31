import requests, json

with open(r'e:\Attendance\ai_engine\test_people.jpg', 'rb') as f:
    r = requests.post(
        'http://localhost:8000/process',
        files={'file': ('test.jpg', f, 'image/jpeg')},
        timeout=120
    )

data = r.json()
print('HTTP status:', r.status_code, flush=True)
print('count:', data.get('count'), flush=True)
print('standing:', data.get('standing'), flush=True)
print('sitting:', data.get('sitting'), flush=True)
print('status:', data.get('status'), flush=True)
print('image present:', bool(data.get('image')), flush=True)
if 'detail' in data:
    print('ERROR detail:', data['detail'], flush=True)
