import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Camera, Upload, Video, ShieldCheck, Scan, Info, RefreshCw, Save, X, CheckCircle, AlertTriangle, Plus } from 'lucide-react';

import { API, AI_URL } from '../config.js';

const C = {
  indigo:  { text: 'var(--indigo)',  bg: 'var(--indigo-dim)',  border: 'rgba(99,120,255,0.2)'  },
  emerald: { text: 'var(--emerald)', bg: 'var(--emerald-dim)', border: 'rgba(16,217,138,0.2)'  },
  rose:    { text: 'var(--rose)',    bg: 'var(--rose-dim)',    border: 'rgba(244,63,94,0.2)'   },
  amber:   { text: 'var(--amber)',   bg: 'var(--amber-dim)',   border: 'rgba(245,158,11,0.2)'  },
  cyan:    { text: 'var(--cyan)',    bg: 'var(--cyan-dim)',    border: 'rgba(34,211,238,0.2)'  },
};

function densityInfo(count, capacity) {
  if (count > capacity)            return { label: 'Overcrowded', color: 'rose'    };
  if (count > capacity * 0.66)     return { label: 'High',        color: 'amber'   };
  if (count > capacity * 0.33)     return { label: 'Medium',      color: 'cyan'    };
  return                                  { label: 'Low',          color: 'emerald' };
}

// Processing steps shown during the overlay
const STEPS = [
  'Initialising sensors...',
  'Running YOLOv8 detection...',
  'Analysing classroom density...',
  'Extracting visual evidence...',
  'Finalising institutional record...',
];

export default function LiveStream() {
  const [rooms, setRooms]               = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isLive, setIsLive]             = useState(false);
  const [showAddRoom, setShowAddRoom]   = useState(false);
  const [roomForm, setRoomForm]         = useState({ name: '', capacity: '' });
  const [addingRoom, setAddingRoom]     = useState(false);
  const [teachers, setTeachers]         = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  // Processing overlay
  const [isProcessing, setIsProcessing] = useState(false);
  const [stepIndex, setStepIndex]       = useState(0);

  // Result state — populated after AI returns, cleared on discard
  const [result, setResult] = useState(null);
  // { count, imageUrl (blob URL), timestamp }

  // Save state
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [saveError, setSaveError] = useState('');

  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const fileRef   = useRef(null);
  const stepTimer = useRef(null);

  const loadRooms = () => {
    axios.get(`${API}/rooms`).then(r => {
      setRooms(r.data);
      if (r.data.length > 0) setSelectedRoom(prev => prev ?? r.data[0]);
    }).catch(console.error);
  };

  const loadTeachers = () => {
    axios.get(`${API}/teachers`).then(r => {
      setTeachers(r.data);
      if (r.data.length > 0) setSelectedTeacher(prev => prev ?? r.data[0]);
    }).catch(console.error);
  };

  useEffect(() => {
    loadRooms();
    loadTeachers();
    return () => clearInterval(stepTimer.current);
  }, []);

  const addRoom = async (e) => {
    e.preventDefault();
    if (!roomForm.name || !roomForm.capacity) return;
    setAddingRoom(true);
    try {
      const { data } = await axios.post(`${API}/rooms`, {
        name: roomForm.name,
        capacity: parseInt(roomForm.capacity),
      });
      setRoomForm({ name: '', capacity: '' });
      setShowAddRoom(false);
      loadRooms();
      setSelectedRoom(data);
    } catch (err) { console.error(err); }
    finally { setAddingRoom(false); }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 1920 }, height: { ideal: 1080 } } 
      });
      if (videoRef.current) { videoRef.current.srcObject = stream; setIsLive(true); }
    } catch (err) { console.error('Camera error:', err); }
  };

  const stopCamera = () => {
    videoRef.current?.srcObject?.getTracks().forEach(t => t.stop());
    setIsLive(false);
  };

  const startStepAnimation = () => {
    setStepIndex(0);
    let i = 0;
    stepTimer.current = setInterval(() => {
      i += 1;
      if (i < STEPS.length) setStepIndex(i);
      else clearInterval(stepTimer.current);
    }, 600);
  };

  const processBlob = async (blob) => {
    setIsProcessing(true);
    setSaved(false);
    setSaveError('');
    setResult(null);
    startStepAnimation();

    const fd = new FormData();
    fd.append('file', blob, 'capture.jpg');

    try {
      const res = await axios.post(`${AI_URL}/process`, fd, {
        timeout: 120000, // 2 minute timeout
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (!res.data || res.data.status !== 'success') {
        throw new Error('Invalid response from AI engine');
      }

      setResult({
        count:    res.data.count,
        standing: res.data.standing,
        sitting:  res.data.sitting,
        teacher:  res.data.teacher_present,
        lowLight: res.data.low_light,
        imageUrl: res.data.image,
        timestamp: new Date(),
      });
      setIsLive(false);

      // Voice announcement
      try {
        const speech = new SpeechSynthesisUtterance(
          `Detection complete. ${res.data.count} students found in the classroom.`
        );
        window.speechSynthesis.speak(speech);
      } catch (_) {}

    } catch (err) {
      console.error('Processing failed:', err);
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setSaveError('Request timed out. The AI engine is taking too long — try a smaller image.');
      } else if (err.code === 'ERR_NETWORK' || err.message?.includes('Network')) {
        setSaveError('Cannot reach AI engine. Make sure Python server is running: python server.py');
      } else {
        setSaveError(`Processing failed: ${err.response?.data?.detail || err.message}`);
      }
    } finally {
      clearInterval(stepTimer.current);
      setIsProcessing(false);
    }
  };

  const captureFromCamera = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width  = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg'));
    stopCamera();
    processBlob(blob);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';           // allow re-uploading same file
    stopCamera();
    processBlob(file);
  };

  const saveRecord = async () => {
    if (!result) return;
    setSaving(true);
    setSaveError('');
    try {
      await axios.post(`${API}/attendance`, {
        roomId:         selectedRoom?._id ?? undefined,
        teacherId:      selectedTeacher?._id ?? undefined,
        detectedCount:  result.count,
        totalStrength:  selectedRoom?.capacity ?? capacity,
        imageUrl:       result.imageUrl,
        standingCount:  result.standing,
        sittingCount:   result.sitting,
        teacherPresent: result.teacher,
        lowLight:       result.lowLight,
      });
      setSaved(true);
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to save record.');
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    setResult(null);
    setSaved(false);
    setSaveError('');
  };

  const capacity = selectedRoom?.capacity ?? 60;
  const { label: densLabel, color: densColor } = result
    ? densityInfo(result.count, capacity)
    : densityInfo(0, capacity);
  const dc = C[densColor];
  const attendancePct = result ? ((result.count / capacity) * 100).toFixed(1) : '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* ── Processing Overlay ── */}
      {isProcessing && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(5,7,15,0.88)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 20, padding: '48px 52px', textAlign: 'center',
            boxShadow: '0 0 80px rgba(99,120,255,0.2)',
            minWidth: 340,
          }}>
            {/* Spinner */}
            <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 28px' }}>
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                border: '3px solid var(--border)',
              }} />
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                border: '3px solid transparent',
                borderTopColor: 'var(--indigo)',
                borderRightColor: 'var(--cyan)',
                animation: 'spin 0.9s linear infinite',
              }} />
              <div style={{
                position: 'absolute', inset: 10, borderRadius: '50%',
                border: '2px solid transparent',
                borderTopColor: 'var(--emerald)',
                animation: 'spin 1.4s linear infinite reverse',
              }} />
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Scan size={22} color="var(--indigo)" />
              </div>
            </div>

            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
              AI <span className="gradient-text">Processing</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>
              YOLOv8 is analysing your image
            </div>

            {/* Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
              {STEPS.map((step, i) => {
                const done    = i < stepIndex;
                const active  = i === stepIndex;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: done ? 'var(--emerald-dim)' : active ? 'var(--indigo-dim)' : 'var(--bg-elevated)',
                      border: `1px solid ${done ? 'rgba(16,217,138,0.3)' : active ? 'rgba(99,120,255,0.3)' : 'var(--border)'}`,
                      transition: 'all 0.3s',
                    }}>
                      {done
                        ? <CheckCircle size={11} color="var(--emerald)" />
                        : active
                          ? <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--indigo)', animation: 'pulse-dot 1s infinite' }} />
                          : <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--border)' }} />
                      }
                    </div>
                    <span style={{
                      fontSize: 12,
                      color: done ? 'var(--emerald)' : active ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontWeight: active ? 600 : 400,
                      transition: 'color 0.3s',
                    }}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4 }}>
            Real-Time <span className="gradient-text">Counter</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>AI-assisted student counting with face-blur privacy</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select
            value={selectedRoom?._id ?? ''}
            onChange={e => setSelectedRoom(rooms.find(r => r._id === e.target.value))}
            style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '8px 14px', fontSize: 13,
              color: 'var(--text-primary)', outline: 'none', cursor: 'pointer',
            }}
          >
            {rooms.length === 0
              ? <option value=''>No rooms yet</option>
              : rooms.map(r => <option key={r._id} value={r._id}>{r.name} (cap: {r.capacity})</option>)
            }
          </select>
          <select
            value={selectedTeacher?._id ?? ''}
            onChange={e => setSelectedTeacher(teachers.find(t => t._id === e.target.value))}
            style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '8px 14px', fontSize: 13,
              color: 'var(--text-primary)', outline: 'none', cursor: 'pointer',
            }}
          >
            {teachers.length === 0
              ? <option value=''>No teachers yet</option>
              : teachers.map(t => <option key={t._id} value={t._id}>{t.name} ({t.subject})</option>)
            }
          </select>
          <button onClick={() => setShowAddRoom(v => !v)} title="Add room" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)',
            background: showAddRoom ? 'var(--indigo-dim)' : 'var(--bg-elevated)',
            color: showAddRoom ? 'var(--indigo)' : 'var(--text-secondary)',
            fontSize: 13, cursor: 'pointer', fontWeight: 500,
          }}>
            <Plus size={15} /> Room
          </button>
          <button onClick={isLive ? stopCamera : startCamera} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 20px', borderRadius: 8, fontWeight: 600, fontSize: 13,
            cursor: 'pointer', border: 'none', transition: 'all 0.15s',
            background: isLive ? 'var(--rose-dim)' : 'var(--indigo)',
            color: isLive ? 'var(--rose)' : '#fff',
            boxShadow: isLive ? 'none' : '0 0 20px rgba(99,120,255,0.4)',
          }}>
            {isLive ? <RefreshCw size={16} /> : <Video size={16} />}
            {isLive ? 'Stop Stream' : 'Start Camera'}
          </button>
        </div>
      </div>

      {/* Add Room inline panel */}
      {showAddRoom && (
        <div className="card card-glow" style={{ padding: '18px 20px' }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14, color: 'var(--indigo)' }}>Add New Room</div>
          <form onSubmit={addRoom} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 2, minWidth: 160 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Room Name</label>
              <input
                value={roomForm.name}
                onChange={e => setRoomForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Room A, Lab 1"
                required
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 7,
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  color: 'var(--text-primary)', fontSize: 13, outline: 'none',
                  boxSizing: 'border-box', fontFamily: 'inherit',
                }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 120 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Capacity</label>
              <input
                type="number" min="1" max="500"
                value={roomForm.capacity}
                onChange={e => setRoomForm(f => ({ ...f, capacity: e.target.value }))}
                placeholder="e.g. 60"
                required
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 7,
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  color: 'var(--text-primary)', fontSize: 13, outline: 'none',
                  boxSizing: 'border-box', fontFamily: 'inherit',
                }}
              />
            </div>
            <button type="submit" disabled={addingRoom} style={{
              padding: '8px 20px', borderRadius: 7, border: 'none',
              background: 'var(--indigo)', color: '#fff',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 0 14px rgba(99,120,255,0.3)',
            }}>
              {addingRoom ? 'Adding...' : 'Add Room'}
            </button>
            <button type="button" onClick={() => setShowAddRoom(false)} style={{
              padding: '8px 14px', borderRadius: 7,
              border: '1px solid var(--border)', background: 'transparent',
              color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
            }}>
              Cancel
            </button>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>

        {/* ── Left: Image / Camera ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Viewport */}
          <div className="card" style={{
            aspectRatio: '16/9', overflow: 'hidden', position: 'relative',
            background: 'var(--bg-surface)',
            boxShadow: '0 0 0 1px var(--border), 0 20px 60px rgba(0,0,0,0.5)',
          }}>
            {/* Empty state */}
            {!isLive && !result && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 14,
              }}>
                <div style={{
                  width: 76, height: 76, borderRadius: '50%',
                  background: 'var(--indigo-dim)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Camera size={30} color="var(--text-muted)" />
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Start camera or upload an image to begin</p>
                <button onClick={() => fileRef.current?.click()} style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '9px 20px', borderRadius: 8, border: '1px solid var(--border)',
                  background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
                  fontSize: 13, cursor: 'pointer',
                }}>
                  <Upload size={15} /> Upload Image
                </button>
              </div>
            )}

            {/* Live camera */}
            <video ref={videoRef} autoPlay playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: isLive ? 'block' : 'none' }} />

            {/* Result image preview */}
            {result && !isLive && (
              <img src={result.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Processed" />
            )}

            {/* LIVE badge */}
            {isLive && (
              <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', gap: 8 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '4px 10px', borderRadius: 6,
                  background: 'rgba(16,217,138,0.2)', border: '1px solid rgba(16,217,138,0.3)',
                  fontSize: 11, fontWeight: 700, color: 'var(--emerald)',
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--emerald)', animation: 'pulse-dot 1.2s infinite' }} />
                  LIVE
                </div>
                {selectedRoom && (
                  <div style={{
                    padding: '4px 10px', borderRadius: 6,
                    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    fontSize: 11, fontWeight: 600, color: '#fff',
                  }}>
                    {selectedRoom.name}
                  </div>
                )}
              </div>
            )}

            {result && result.lowLight && (
              <div style={{
                position: 'absolute', top: 14, left: 14, zIndex: 10,
                padding: '6px 12px', borderRadius: 8, background: 'var(--amber)', color: '#000',
                fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: '0 4px 12px rgba(245,158,11,0.4)',
              }}>
                <AlertTriangle size={14} /> IMAGE QUALITY LOW
              </div>
            )}
            {result && (
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '10px 14px',
                background: 'linear-gradient(0deg, rgba(5,7,15,0.85) 0%, transparent 100%)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
              }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
                  📅 {result.timestamp.toLocaleString()}
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '3px 9px', borderRadius: 6,
                  background: 'rgba(99,120,255,0.2)', border: '1px solid rgba(99,120,255,0.3)',
                  fontSize: 10, fontWeight: 700, color: 'var(--indigo)',
                }}>
                  <ShieldCheck size={10} /> INSTITUTIONAL RECORD
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            {/* Capture from camera */}
            <button
              disabled={!isLive || isProcessing}
              onClick={captureFromCamera}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                padding: '13px', borderRadius: 10, border: 'none',
                cursor: isLive && !isProcessing ? 'pointer' : 'not-allowed',
                background: isLive ? 'var(--indigo)' : 'var(--bg-elevated)',
                color: isLive ? '#fff' : 'var(--text-muted)',
                fontWeight: 700, fontSize: 13, opacity: isLive ? 1 : 0.45,
                boxShadow: isLive ? '0 0 22px rgba(99,120,255,0.35)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              <Scan size={17} /> Capture & Count
            </button>

            {/* Upload */}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={isProcessing}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '13px 18px', borderRadius: 10,
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, fontWeight: 500,
              }}
            >
              <Upload size={17} /> Upload
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
          </div>

          {/* ── Save / Discard bar — shown only after result ── */}
          {result && !saved && (
            <div style={{
              display: 'flex', gap: 10,
              padding: '16px 18px', borderRadius: 12,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-bright)',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>
                  Ready to save — {result.count} students detected
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {result.timestamp.toLocaleString()} · {selectedRoom?.name ?? '—'} · Faces blurred ✓
                </div>
                {saveError && (
                  <div style={{ fontSize: 11, color: 'var(--rose)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <AlertTriangle size={11} /> {saveError}
                  </div>
                )}
              </div>
              <button onClick={discard} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', borderRadius: 8, border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--text-muted)',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
              }}>
                <X size={15} /> Discard
              </button>
              <button onClick={saveRecord} disabled={saving} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 20px', borderRadius: 8, border: 'none',
                background: saving ? 'var(--bg-elevated)' : 'var(--emerald)',
                color: saving ? 'var(--text-muted)' : '#fff',
                fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: saving ? 'none' : '0 0 18px rgba(16,217,138,0.35)',
                transition: 'all 0.15s',
              }}>
                {saving
                  ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
                  : <><Save size={14} /> Save Record</>
                }
              </button>
            </div>
          )}

          {/* Saved confirmation */}
          {saved && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '14px 18px', borderRadius: 12,
              background: 'var(--emerald-dim)', border: '1px solid rgba(16,217,138,0.3)',
              color: 'var(--emerald)',
            }}>
              <CheckCircle size={18} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Record saved successfully</div>
                <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>
                  {result.count} students · {result.timestamp.toLocaleString()} · {selectedRoom?.name}
                </div>
              </div>
              <button onClick={discard} style={{
                padding: '6px 14px', borderRadius: 7, border: '1px solid rgba(16,217,138,0.3)',
                background: 'transparent', color: 'var(--emerald)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>
                New Scan
              </button>
            </div>
          )}
        </div>

        {/* ── Right: Results Panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Count Card */}
          <div className="card card-glow" style={{
            padding: '26px 20px', textAlign: 'center',
            borderTop: `3px solid ${result ? dc.text : 'var(--indigo)'}`,
            background: 'linear-gradient(180deg, rgba(99,120,255,0.05) 0%, var(--bg-surface) 100%)',
            transition: 'border-color 0.4s',
          }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
              Detected Count
            </div>
            <div className="mono gradient-text" style={{ fontSize: 72, fontWeight: 900, lineHeight: 1 }}>
              {result ? result.count : '—'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>Students in Frame</div>

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Row label="Room"         value={selectedRoom?.name ?? '—'}  vc="var(--text-primary)" />
              <Row label="Teacher"      value={selectedTeacher?.name ?? '—'} vc="var(--indigo)" />
              <Row label="Sitting"      value={result ? result.sitting : '—'} vc="var(--indigo)" />
              <Row label="Standing"     value={result ? result.standing : '—'} vc="var(--indigo)" />
              <Row label="Teacher Detect" value={result ? (result.teacher ? 'Yes' : 'No') : '—'} vc={result?.teacher ? 'var(--emerald)' : 'var(--text-muted)'} />
              <Row label="Capacity"     value={capacity}                    vc="var(--text-primary)" />
              <Row label="Attendance %" value={result ? `${attendancePct}%` : '—'} vc="var(--indigo)" />
              <Row label="Absent"       value={result ? Math.max(0, capacity - result.count) : '—'} vc="var(--rose)" />
              {result && (
                <Row label="Captured" value={result.timestamp.toLocaleTimeString()} vc="var(--text-muted)" />
              )}
            </div>

            {result && (
              <div style={{
                marginTop: 14, padding: '8px 14px', borderRadius: 8,
                background: dc.bg, border: `1px solid ${dc.border}`,
                fontSize: 12, fontWeight: 700, color: dc.text,
              }}>
                {densLabel === 'Overcrowded' ? '⚠ Overcrowded' : `Density: ${densLabel}`}
              </div>
            )}
          </div>

          {/* Audit Integrity Card */}
          <div className="card card-glow" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <ShieldCheck size={15} color="var(--indigo)" />
              <span style={{ fontWeight: 700, fontSize: 13 }}>Audit Integrity</span>
              <span style={{
                marginLeft: 'auto', fontSize: 10, fontWeight: 700,
                color: 'var(--indigo)', background: 'var(--indigo-dim)',
                padding: '2px 8px', borderRadius: 20, border: '1px solid rgba(99,120,255,0.2)',
              }}>VERIFIED</span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Images are stored in Ultra-HD as original institutional evidence for attendance audits and session verification.
            </p>
          </div>

          {/* Info */}
          <div style={{
            padding: '12px 14px', borderRadius: 10,
            background: 'var(--indigo-dim)', border: '1px solid rgba(99,120,255,0.2)',
            display: 'flex', gap: 10, fontSize: 11, color: 'var(--indigo)',
          }}>
            <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ lineHeight: 1.6 }}>
              YOLOv8n detects persons in the image. Results are held for review before saving to the database.
            </span>
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.7); }
        }
      `}</style>
    </div>
  );
}

function Row({ label, value, vc }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="mono" style={{ fontWeight: 700, color: vc }}>{value}</span>
    </div>
  );
}
