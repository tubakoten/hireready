# HireReady 🚀

AI-powered job application and interview preparation platform built with Azure Foundry Local.

## What is HireReady?

HireReady helps job seekers prepare for their dream jobs by providing:

- **CV Analysis** — Upload your CV, enter a target position, and get an AI-generated compatibility score, strengths, gaps, and improvement suggestions
- **Interview Simulator** — Practice with AI-generated interview questions tailored to your CV and target position, get instant feedback on your answers
- **Cover Letter Generator** — Coming soon

All AI inference runs **100% locally** using Microsoft Azure Foundry Local — no internet connection required, no data leaves your device.

## Tech Stack

**Backend**
- FastAPI + SQLAlchemy + SQLite
- JWT Authentication (python-jose + bcrypt)
- PyPDF2 for CV parsing
- Azure Foundry Local (qwen2.5-1.5b-instruct) for AI inference

**Frontend**
- React 18 + Vite
- Tailwind CSS
- React Router

**AI Layer**
- Microsoft Azure Foundry Local
- Model: qwen2.5-1.5b-instruct-generic-gpu
- OpenAI-compatible API at `http://127.0.0.1:50033/v1`

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- Microsoft Foundry Local ([install guide](https://learn.microsoft.com/en-us/azure/foundry-local/get-started))

### 1. Install Foundry Local (macOS)
```bash
brew tap microsoft/foundrylocal
brew install foundrylocal
foundry service start
foundry model run qwen2.5-1.5b
```

### 2. Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Open
Navigate to `http://localhost:5173`

## Features

- User registration and login
- Upload and manage multiple CVs
- AI-powered CV analysis with compatibility scoring
- Interview simulation with real-time answer evaluation
- Turkish and English language support
- Fully offline — no cloud API required

## Project Structure
hireready/
├── backend/
│   ├── main.py
│   ├── models/
│   │   ├── database.py
│   │   └── schemas.py
│   └── routers/
│       ├── auth.py
│       ├── cv.py
│       ├── analyze.py
│       └── interview.py
└── frontend/
└── src/
├── pages/
│   ├── Home.jsx
│   ├── Analyze.jsx
│   ├── Interview.jsx
│   ├── Login.jsx
│   └── Register.jsx
└── components/
└── Navbar.jsx

## Motivation

Built during a Microsoft internship program. The idea came from personal experience navigating job applications — HireReady is the tool I wish I had when applying for my own internship.