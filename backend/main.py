from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models.database import create_tables
from routers import auth, cv, analyze, interview, cover_letter
from foundry_local_sdk import FoundryLocalManager, Configuration

app = FastAPI(title="HireReady API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

config = Configuration(app_name="hireready")
FoundryLocalManager.initialize(config)

create_tables()

app.include_router(auth.router)
app.include_router(cv.router)
app.include_router(analyze.router)
app.include_router(interview.router)
app.include_router(cover_letter.router)

@app.get("/")
def root():
    return {"message": "HireReady API çalışıyor! 🚀"}

@app.get("/health")
def health():
    return {"status": "ok"}