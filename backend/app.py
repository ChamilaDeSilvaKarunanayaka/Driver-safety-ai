from flask import Flask, Response, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import onnxruntime as ort
import os
import mediapipe as mp

# ==========================================
# 1. HIGH-ACCURACY MEDIAPIPE INITIALIZATION
# ==========================================
mp_face_mesh = mp.solutions.face_mesh
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

if hasattr(mp_face_mesh, 'FACEMESH_CONTOURS'):
    FACE_CONNECTIONS = mp_face_mesh.FACEMESH_CONTOURS
else:
    FACE_CONNECTIONS = mp_face_mesh.FACE_CONNECTIONS

# ==========================================
# 2. LOAD TRAINED AI MODEL VIA ONNX RUNTIME
# ==========================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "..", "models", "drowsiness_model.onnx")

ort_session = ort.InferenceSession(MODEL_PATH)
input_name = ort_session.get_inputs()[0].name

# ==========================================
# 3. CONFIGURATION AND CONFIG CONSTANTS
# ==========================================
LEFT_EYE_VERT_1 = [160, 144]
LEFT_EYE_VERT_2 = [158, 153]
LEFT_EYE_HORIZ  = [33, 133]
RIGHT_EYE_VERT_1 = [385, 380]
RIGHT_EYE_VERT_2 = [387, 373]
RIGHT_EYE_HORIZ  = [362, 263]

LEFT_EYE_CROP_INDICES = [33, 160, 158, 133, 153, 144]
RIGHT_EYE_CROP_INDICES = [362, 385, 387, 263, 373, 380]

# --- 🎯 TUNED HYPERPARAMETERS FOR PRODUCTION ---
EAR_THRESHOLD = 0.17           
AI_THRESHOLD = 0.75            

DROWSY_LIMIT = 10        
PHONE_LIMIT = 12         
SIDE_LIMIT = 75          

app = Flask(__name__)
CORS(app) 

# --- EXTENDED EXPANDED STATS OBJECT FOR CAR DASHBOARD UI ---
stats = {
    "drowsy_events": 0,
    "phone_events": 0,
    "side_events": 0,
    "current_drowsy_score": 0,
    "current_phone_score": 0,
    "current_side_score": 0,
    "l_ear": 0.0,
    "r_ear": 0.0,
    "v_gaze": 0.0
}

drowsy_counter = 0
phone_counter = 0
side_counter = 0

# ==========================================
# 4. HELPER FUNCTIONS
# ==========================================
def calculate_ear(landmarks, vert_1, vert_2, horiz, img_w, img_h):
    try:
        p_v1_top = np.array([landmarks[vert_1[0]].x * img_w, landmarks[vert_1[0]].y * img_h])
        p_v1_bot = np.array([landmarks[vert_1[1]].x * img_w, landmarks[vert_1[1]].y * img_h])
        p_v2_top = np.array([landmarks[vert_2[0]].x * img_w, landmarks[vert_2[0]].y * img_h])
        p_v2_bot = np.array([landmarks[vert_2[1]].x * img_w, landmarks[vert_2[1]].y * img_h])
        p_h_left  = np.array([landmarks[horiz[0]].x * img_w, landmarks[horiz[0]].y * img_h])
        p_h_right = np.array([landmarks[horiz[1]].x * img_w, landmarks[horiz[1]].y * img_h])
        
        dist_v1 = np.linalg.norm(p_v1_top - p_v1_bot)
        dist_v2 = np.linalg.norm(p_v2_top - p_v2_bot)
        dist_h  = np.linalg.norm(p_h_left - p_h_right)
        return (dist_v1 + dist_v2) / (2.0 * dist_h)
    except Exception:
        return 1.0 

def check_gaze_distraction(landmarks, img_w, img_h):
    try:
        l_left = np.array([landmarks[33].x * img_w, landmarks[33].y * img_h])
        l_right = np.array([landmarks[133].x * img_w, landmarks[133].y * img_h])
        l_iris = np.array([landmarks[468].x * img_w, landmarks[468].y * img_h])
        
        r_left = np.array([landmarks[362].x * img_w, landmarks[362].y * img_h])
        r_right = np.array([landmarks[263].x * img_w, landmarks[263].y * img_h])
        r_iris = np.array([landmarks[473].x * img_w, landmarks[473].y * img_h])
        
        gaze_ratio_l = np.linalg.norm(l_iris - l_left) / (np.linalg.norm(l_left - l_right) + 1e-6)
        gaze_ratio_r = np.linalg.norm(r_iris - r_left) / (np.linalg.norm(r_left - r_right) + 1e-6)
        avg_gaze_horizontal = (gaze_ratio_l + gaze_ratio_r) / 2.0
        
        l_top = np.array([landmarks[159].x * img_w, landmarks[159].y * img_h])
        l_bottom = np.array([landmarks[145].x * img_w, landmarks[145].y * img_h])
        v_dist_total = np.linalg.norm(l_top - l_bottom) + 1e-6
        v_dist_iris = np.linalg.norm(l_top - l_iris)
        vertical_gaze_ratio = v_dist_iris / v_dist_total

        return avg_gaze_horizontal, vertical_gaze_ratio
    except Exception:
        return 0.5, 0.5

def crop_eye_region(image, landmarks, eye_indices, img_w, img_h):
    try:
        x_coords = [int(landmarks[i].x * img_w) for i in eye_indices]
        y_coords = [int(landmarks[i].y * img_h) for i in eye_indices]
        xmin, xmax = min(x_coords), max(x_coords)
        ymin, ymax = min(y_coords), max(y_coords)
        xmin, ymin = max(0, xmin - 5), max(0, ymin - 5)
        xmax, ymax = min(img_w, xmax + 5), min(img_h, ymax + 5)
        return image[ymin:ymax, xmin:xmax]
    except Exception:
        return None

def preprocess_eye_onnx(eye_img):
    try:
        resized = cv2.resize(eye_img, (64, 64))
        rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
        img_array = np.array(rgb, dtype=np.float32)
        img_array = np.expand_dims(img_array, axis=0)  
        return img_array
    except Exception:
        return None

# ==========================================
# 5. CORE CAMERA RUNTIME LOOP
# ==========================================
def generate_frames():
    global drowsy_counter, phone_counter, side_counter, stats
    cap = cv2.VideoCapture(0)

    with mp_face_mesh.FaceMesh(
        max_num_faces=1,
        refine_landmarks=True, 
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    ) as face_mesh:
        while True:
            success, image = cap.read()
            if not success: break

            img_h, img_w, _ = image.shape
            image.flags.writeable = False
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            results = face_mesh.process(image)

            image.flags.writeable = True
            image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

            if not results.multi_face_landmarks:
                side_counter += 1
                phone_counter = 0
                drowsy_counter = 0
                if side_counter >= SIDE_LIMIT:
                    stats["side_events"] += 1
            
            else:
                for face_landmarks in results.multi_face_landmarks:
                    landmarks = face_landmarks.landmark
                    
                    left_ear = calculate_ear(landmarks, LEFT_EYE_VERT_1, LEFT_EYE_VERT_2, LEFT_EYE_HORIZ, img_w, img_h)
                    right_ear = calculate_ear(landmarks, RIGHT_EYE_VERT_1, RIGHT_EYE_VERT_2, RIGHT_EYE_HORIZ, img_w, img_h)
                    h_gaze, v_gaze = check_gaze_distraction(landmarks, img_w, img_h)

                    # Update real-time metric floats for UI gauges
                    stats["l_ear"] = round(float(left_ear), 2)
                    stats["r_ear"] = round(float(right_ear), 2)
                    stats["v_gaze"] = round(float(v_gaze), 2)

                    # Head Pose Features
                    nose = np.array([landmarks[1].x * img_w, landmarks[1].y * img_h])
                    left_bound = np.array([landmarks[234].x * img_w, landmarks[234].y * img_h]) 
                    right_bound = np.array([landmarks[454].x * img_w, landmarks[454].y * img_h]) 
                    forehead_mid = np.array([landmarks[9].x * img_w, landmarks[9].y * img_h]) 
                    chin_top = np.array([landmarks[11].x * img_w, landmarks[11].y * img_h])     

                    turn_ratio = abs(nose[0] - left_bound[0]) / (abs(nose[0] - left_bound[0]) + abs(nose[0] - right_bound[0]) + 1e-6)
                    vertical_ratio = abs(nose[1] - forehead_mid[1]) / (abs(chin_top[1] - nose[1]) + 1e-6)

                    # AI Model Inference
                    ai_sleepy_trigger = False
                    left_eye_crop = crop_eye_region(image, landmarks, LEFT_EYE_CROP_INDICES, img_w, img_h)
                    right_eye_crop = crop_eye_region(image, landmarks, RIGHT_EYE_CROP_INDICES, img_w, img_h)
                    
                    if left_eye_crop is not None and right_eye_crop is not None:
                        prep_left = preprocess_eye_onnx(left_eye_crop)
                        prep_right = preprocess_eye_onnx(right_eye_crop)
                        if prep_left is not None and prep_right is not None:
                            pred_l = ort_session.run(None, {input_name: prep_left})[0][0][0]
                            pred_r = ort_session.run(None, {input_name: prep_right})[0][0][0]
                            if pred_l > AI_THRESHOLD and pred_r > AI_THRESHOLD:
                                ai_sleepy_trigger = True

                    # State machine checks
                    is_looking_sideways = (turn_ratio < 0.28 or turn_ratio > 0.72 or h_gaze < 0.33 or h_gaze > 0.67)
                    is_both_eyes_closed = (left_ear < EAR_THRESHOLD and right_ear < EAR_THRESHOLD)
                    
                    if (is_both_eyes_closed or ai_sleepy_trigger) and not is_looking_sideways:
                        drowsy_counter += 1
                    else:
                        drowsy_counter = max(0, drowsy_counter - 1)
                        
                    is_looking_at_phone = (vertical_ratio < 0.90 or v_gaze > 0.65)
                    
                    if is_looking_at_phone and not is_both_eyes_closed and not is_looking_sideways:
                        phone_counter += 1
                    else:
                        phone_counter = 0

                    if is_looking_sideways:
                        side_counter += 1
                    else:
                        side_counter = 0

                    # --- SET LIVE TICK SCORES TO SYNC WITH CAR UI ---
                    stats["current_drowsy_score"] = drowsy_counter
                    stats["current_phone_score"] = phone_counter
                    stats["current_side_score"] = side_counter

                    # --- TRIGGER CRITICAL SYSTEMS ---
                    if drowsy_counter == DROWSY_LIMIT:
                        stats["drowsy_events"] += 1
                    
                    if phone_counter == PHONE_LIMIT:
                        stats["phone_events"] += 1
                    
                    if side_counter == SIDE_LIMIT:
                        stats["side_events"] += 1

                    # Draw high-end facial grid
                    try:
                        mp_drawing.draw_landmarks(
                            image=image, landmark_list=face_landmarks,
                            connections=FACE_CONNECTIONS, landmark_drawing_spec=None,
                            connection_drawing_spec=mp_drawing_styles.get_default_face_mesh_contours_style()
                        )
                    except Exception:
                        pass

            ret, buffer = cv2.imencode('.jpg', image)
            frame_bytes = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/api/stats')
def get_stats():
    return jsonify(stats)

if __name__ == "__main__":
    app.run(port=5000)