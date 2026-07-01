from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from models.database import get_db, CV, User
from models.schemas import CVResponse
from jose import JWTError, jwt
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from PyPDF2 import PdfReader
import io

router = APIRouter(prefix="/cv", tags=["cv"])

SECRET_KEY = "hireready-secret-key-2024"
ALGORITHM = "HS256"
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    try:
        print(f"Token: {credentials.credentials[:20]}...")
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"Payload: {payload}")
        user_id = int(payload.get("sub"))
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="Kullanıcı bulunamadı")
        return user
    except JWTError as e:
        print(f"JWT Error: {e}")
        raise HTTPException(status_code=401, detail="Geçersiz token")

@router.post("/upload", response_model=CVResponse)
async def upload_cv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Sadece PDF dosyası yükleyebilirsiniz")
    
    content = await file.read()
    pdf = PdfReader(io.BytesIO(content))
    text = ""
    for page in pdf.pages:
        text += page.extract_text() or ""
    
    cv = CV(
        user_id=current_user.id,
        filename=file.filename,
        content=text
    )
    db.add(cv)
    db.commit()
    db.refresh(cv)
    return cv

@router.get("/list", response_model=list[CVResponse])
def list_cvs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(CV).filter(CV.user_id == current_user.id).all()

@router.delete("/{cv_id}")
def delete_cv(
    cv_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cv = db.query(CV).filter(CV.id == cv_id, CV.user_id == current_user.id).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV bulunamadı")
    db.delete(cv)
    db.commit()
    return {"message": "CV silindi"}