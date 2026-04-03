# Posture Coach

A real-time posture monitoring web app that uses computer vision to detect and correct poor posture during desk work.

**Live Demo:** https://posture-coach-beta.vercel.app

---

## What it does

- Detects posture in real time using your webcam — no data leaves your browser
- Tracks neck tilt, shoulder level, and side lean
- Alerts after sustained bad posture (3 consecutive bad checks)
- Saves session data to MongoDB and shows progress over time
- Generates a weekly AI report with personalized tips using GPT-4o

---

## Tech Stack

### Frontend
- React 18 + TypeScript
- MediaPipe BlazePose — pose estimation running in-browser via WebAssembly
- Canvas API — real-time skeleton overlay
- Recharts — session history graphs
- React Router — client-side routing
- Axios — HTTP client with JWT interceptor

### Backend
- Node.js + Express — REST API
- MongoDB + Mongoose — session and user data
- JWT + bcrypt — stateless authentication
- OpenAI GPT-4o — weekly AI report generation

### Infrastructure
- Vercel — frontend deployment
- Render — backend deployment
- MongoDB Atlas — cloud database

---

## DSA Concepts Applied

| Concept | Usage |
|---|---|
| Circular Buffer | Smooths noisy MediaPipe landmark data over last 10 frames |
| Sliding Window / Moving Average | Stabilizes posture angle readings |
| Finite State Machine | Models GOOD → BAD → ALERTING posture state transitions |
| Queue-based throttling | Alerts only after N consecutive bad posture frames |
| Time Series | MongoDB stores posture snapshots with timestamps |

---

## GenAI Concepts Applied

| Concept | Usage |
|---|---|
| Prompt Engineering | Controls tone, format, and specificity of AI tips |
| Context Injection | Real MongoDB session data fed into GPT-4o prompt |
| Structured Output | Forces JSON response: { tips[], trend, summary } |
| Few-shot Rules | Prompt rules ensure consistent, non-generic output |

---

## Architecture

```
Browser (React)
  ├── MediaPipe WASM — runs pose model locally, no server needed
  ├── Canvas API — draws skeleton overlay at 30fps
  └── Axios — sends snapshots to Express every 60s

Express API
  ├── /api/auth     — register, login, JWT
  ├── /api/sessions — start session, save snapshots, history
  └── /api/reports  — generate AI weekly report via GPT-4o

MongoDB Atlas
  ├── users      — auth data
  ├── sessions   — posture snapshots + scores
  └── reports    — AI generated weekly reports
```

---

## Running Locally

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- OpenAI or Gemini API key

### Frontend
```bash
npm install
npm run dev
```

### Backend
```bash
cd server
npm install
```

Create `server/.env`:
```
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
OPENAI_API_KEY=your_key
CLIENT_URL=http://localhost:5173
PORT=5000
```

```bash
npm run dev
```

---

## CV Detection — How it Works

MediaPipe BlazePose outputs 33 body landmarks per frame as normalized (x, y, z) coordinates. The app calculates:

- **Neck tilt** — asymmetry between left/right ear-to-shoulder vertical distance
- **Shoulder level** — Y-axis difference between left and right shoulders  
- **Side lean** — horizontal offset between shoulder midpoint and hip midpoint (when hips visible)

Raw values are smoothed via a Circular Buffer (last 10 frames) before evaluation. A Finite State Machine tracks state transitions and prevents alert-spamming by requiring 3 consecutive bad evaluations (every 2s) before triggering ALERTING state.

---

## Limitations

- Forward head posture detection is unreliable from a front-facing camera (requires Z-axis depth which is approximate in 2D pose estimation)
- Detection accuracy depends on lighting and camera quality
- Render free tier sleeps after 15 minutes of inactivity — first request may take 30-60s