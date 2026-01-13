# Face Recognition Attendance System

## Overview
The Library Management System now includes real face recognition for attendance marking using face-api.js, a JavaScript face recognition library that runs entirely in the browser.

## Features
- **Face Registration**: Users can register their face for future verification
- **Face Verification**: Real-time face matching with stored face descriptors
- **Secure Storage**: Face descriptors stored securely in the database
- **Fallback Options**: QR code attendance available as alternative

## Technical Implementation

### Backend Changes
- **User Model**: Added `faceDescriptor`, `faceRegistered`, and `faceRegistrationDate` fields
- **API Endpoints**:
  - `POST /api/auth/register-face`: Register user's face descriptor
  - `POST /api/auth/verify-face`: Verify face against stored descriptor
  - `GET /api/auth/face-status`: Check if user has registered face

### Frontend Changes
- **Face Recognition Component**: New `FaceRecognition` component using face-api.js
- **Model Loading**: Loads TinyFaceDetector, FaceLandmark68Net, and FaceRecognitionNet models
- **Real-time Processing**: Captures video, detects faces, and extracts descriptors
- **Integration**: Updated student and staff dashboards with face recognition options

### Face Recognition Process
1. **Registration**:
   - User clicks "Face Recognition" button
   - If not registered, system prompts for face registration
   - Camera captures face, extracts 128-dimensional descriptor
   - Descriptor stored in database

2. **Verification**:
   - User clicks "Face Recognition" for attendance
   - Camera captures face in real-time
   - System compares with stored descriptor using Euclidean distance
   - Threshold-based matching (default: 0.6)
   - Success triggers attendance marking

### Security Considerations
- Face descriptors are stored as arrays of numbers (not images)
- Face matching happens client-side for privacy
- Verification results sent to server for attendance recording
- No actual face images stored on server

### Dependencies
- `face-api.js`: Face detection and recognition library
- Models loaded from CDN for development (should be hosted locally in production)

### Usage
1. **For Students/Staff**: Click "Face Recognition" button on dashboard
2. **First Time**: Register face by following on-screen instructions
3. **Subsequent Uses**: Face verification happens automatically
4. **Attendance**: Successful verification marks attendance immediately

### Error Handling
- Camera permission denied
- Face not detected clearly
- Network errors during verification
- Model loading failures
- Face matching confidence too low

### Performance
- Models load once per session (~2-3 MB total)
- Face detection runs at 10 FPS
- Descriptor extraction takes ~100-200ms
- Matching is near-instantaneous