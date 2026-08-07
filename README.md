# HireReady 🚀

**AI-powered job application and interview preparation platform — powered by 100% local AI inference via Microsoft Azure Foundry Local.**

Built during a Microsoft Summer Internship (2026). HireReady is the tool I wish I had when applying for my own internship: a single platform that helps you go from "here's my CV" to "I'm ready for the interview," with an AI model that runs entirely on your own device — no cloud API calls, no data leaving your machine.

🔗 **Live demo:** [hireready-mu.vercel.app](https://hireready-mu.vercel.app)
*(Note: the frontend is deployed on Vercel; the backend runs locally with Azure Foundry Local, exposed via Cloudflare Tunnel — see [Architecture](#architecture) below for why.)*

---

## ✨ Features

| Feature | Description |
|---|---|
| **CV Analysis** | Upload a CV, enter a target position/company, and get an AI-generated compatibility score, strengths, gaps, and improvement suggestions |
| **Voice Interview Simulator** | AI-generated interview questions tailored to your CV and role. Answer by typing **or speaking** — live speech-to-text, auto-mode (question is read aloud, mic opens automatically), silence detection, and graceful fallback from Azure neural TTS to browser TTS |
| **LinkedIn Profile Analysis** | Paste your profile text or upload a LinkedIn PDF export; get headline suggestions, keyword alignment, and concrete improvement tips |
| **Company-Specific Prep** | Enter a target company to get an AI-generated briefing (culture/values, likely interview focus areas, prep tips) and interview questions tailored to that company |
| **Cover Letter Generator** | Auto-generates a position-specific cover letter |
| **Learning Roadmap** | Personalized skill-gap roadmap based on your CV and target role |
| **AI Coach ("Maya")** | In-app assistant that guides you through the interview flow |
| **Dashboard** | Manage multiple CVs, track previous analyses |
| **i18n & theming** | Turkish/English language toggle, dark/light mode, mobile-responsive |

---

## 🧠 Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌────────────────────────┐
│  React + Vite    │ ───▶ │  FastAPI Backend  │ ───▶ │  Azure Foundry Local     │
│  Tailwind CSS     │      │  JWT Auth · SQLite│      │  qwen2.5-1.5b-instruct   │
│  (Vercel)         │      │  (local machine)  │      │  (runs on-device)        │
└─────────────────┘      └──────────────────┘      └────────────────────────┘
                                    ▲
                                    │ Cloudflare Tunnel
                                    │ (exposes localhost:8000 publicly)
                                    ▼
                          Vercel frontend calls the
                          tunnel URL via VITE_API_URL
```

**Why local AI instead of a cloud LLM API?** The core premise of this project is demonstrating on-device inference with Azure Foundry Local — user data (CVs, interview answers, LinkedIn profiles) never leaves the device, and there's no per-token API cost. This does mean the backend needs to run wherever Foundry Local runs (i.e., the developer's machine) rather than on a traditional cloud host — solved here via a Cloudflare Tunnel so the Vercel-hosted frontend can still reach it live.

Optional: if `AZURE_SPEECH_KEY` / `AZURE_SPEECH_REGION` are configured, the voice interview feature uses Azure's neural TTS for realistic speech instead of the browser's built-in (more robotic) TTS — the app detects this automatically and falls back gracefully if not configured.

---

## 🛠️ Tech Stack

**Backend**
- FastAPI + SQLAlchemy + SQLite
- JWT Authentication (python-jose + bcrypt), secret loaded from environment (never hardcoded)
- PyPDF2 for CV / LinkedIn PDF parsing
- Azure Foundry Local (`qwen2.5-1.5b-instruct`) — OpenAI-compatible local endpoint, **port auto-discovered at startup** (Foundry Local assigns a different port on each run)
- Optional: Azure Speech Service (neural TTS) via REST API
- python-dotenv for configuration

**Frontend**
- React 18 + Vite + Tailwind CSS + React Router
- Web Speech API (`SpeechRecognition` for voice input, `speechSynthesis` as TTS fallback)

**Deployment**
- Frontend → Vercel
- Backend → runs locally with Foundry Local, exposed via Cloudflare Tunnel

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- [Microsoft Foundry Local](https://learn.microsoft.com/en-us/azure/foundry-local/get-started)

### 1. Install & start Foundry Local (macOS)
```bash
brew tap microsoft/foundrylocal
brew install foundrylocal
foundry service start
foundry model run qwen2.5-1.5b
```

### 2. Backend setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# generate a secret and paste it into .env as JWT_SECRET_KEY:
python3 -c "import secrets; print(secrets.token_hex(32))"

uvicorn main:app --reload
```
> The backend auto-detects Foundry Local's endpoint on startup — just make sure Foundry Local is already running first.

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Open
Navigate to `http://localhost:5173`

---

## 📁 Project Structure

```
hireready/
├── backend/
│   ├── main.py
│   ├── auth_config.py          # JWT secret/config, loaded from .env
│   ├── .env.example
│   ├── models/
│   │   ├── database.py
│   │   └── schemas.py
│   └── routers/
│       ├── auth.py
│       ├── cv.py
│       ├── analyze.py          # CV analysis + Foundry Local client (port auto-discovery)
│       ├── interview.py        # Question generation, evaluation, company-prep
│       ├── cover_letter.py
│       ├── roadmap.py
│       ├── speech.py           # Azure Speech (neural TTS) endpoint
│       └── linkedin.py         # LinkedIn profile analysis
└── frontend/
    ├── vercel.json              # SPA rewrite rule for client-side routing
    └── src/
        ├── api.js                # baseURL configurable via VITE_API_URL
        ├── pages/
        │   ├── Home.jsx
        │   ├── Analyze.jsx
        │   ├── Interview.jsx     # incl. voice mode
        │   ├── LinkedIn.jsx
        │   ├── CoverLetter.jsx
        │   ├── Roadmap.jsx
        │   ├── Dashboard.jsx
        │   ├── Login.jsx
        │   └── Register.jsx
        └── components/
            ├── Navbar.jsx
            └── Footer.jsx
```

---

## 🔧 Engineering notes

A few real problems solved along the way (see project video for the full story):

- **Dynamic port discovery** — Foundry Local binds to a different port on every restart. `analyze.py` runs `foundry service status` at import time to detect the live endpoint, instead of hardcoding a port.
- **Small local model, big prompt-engineering lessons** — `qwen2.5-1.5b` is small enough to sometimes copy a prompt's example JSON verbatim instead of generating real content. Fixed by giving concrete filled examples (never bare placeholders) and repeating key instructions.
- **Security hardening** — JWT secret and the SQLite database were originally committed to the repo; both were moved out (`.env` + `.gitignore`) after a security review.
- **Hybrid deployment** — since the AI runs on-device, a traditional "deploy backend to a cloud host" approach doesn't apply. Solved with Vercel (frontend) + Cloudflare Tunnel (backend), with `VITE_API_URL` injected at build time.

---

## 🙏 Motivation

Built during a Microsoft Summer Internship. The idea came from personal experience navigating job applications and interview prep — HireReady is the tool I wish I had.

**Tuba Köten**
