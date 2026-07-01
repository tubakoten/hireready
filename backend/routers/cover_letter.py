from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.database import get_db, CV, User
from routers.cv import get_current_user
from routers.analyze import client
from pydantic import BaseModel
import traceback

router = APIRouter(prefix="/cover-letter", tags=["cover-letter"])

class CoverLetterRequest(BaseModel):
    cv_id: int
    position: str
    company: str
    language: str = "tr"

@router.post("/generate")
def generate_cover_letter(
    request: CoverLetterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cv = db.query(CV).filter(CV.id == request.cv_id, CV.user_id == current_user.id).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV bulunamadı")

    if request.language == "tr":
        lang_instruction = "ÖNEMLİ: Kapak mektubunu SADECE TÜRKÇE yaz. İngilizce kullanma. TÜRKÇE YAZ."
        prompt = f"""
{lang_instruction}

{request.company} şirketine {request.position} pozisyonu için TÜRKÇE kapak mektubu yaz.

CV İçeriği:
{cv.content[:2000]}

Kurallar:
- SADECE TÜRKÇE yaz
- Profesyonel ve samimi ton
- CV'deki gerçek deneyimlere atıfta bulun
- 3-4 paragraf
- Güçlü kapanış

{lang_instruction}
"""
    else:
        lang_instruction = "Write the cover letter ONLY in English."
        prompt = f"""
{lang_instruction}

Write a professional cover letter for the position of {request.position} at {request.company} based on the following CV.

CV Content:
{cv.content[:2000]}

The cover letter should:
- Use a professional and warm tone
- Reference real experience and skills from the CV
- Be 3-4 paragraphs
- Express interest in the company
- End with a strong closing

{lang_instruction}
"""

    try:
        response = client.chat.completions.create(
            model="qwen2.5-1.5b-instruct-generic-gpu:4",
            max_tokens=1000,
            temperature=0.4,
            messages=[
                {"role": "system", "content": f"Sen profesyonel bir kariyer danışmanısın. {lang_instruction}"},
                {"role": "user", "content": prompt}
            ]
        )
        cover_letter = response.choices[0].message.content.strip()
        return {"cover_letter": cover_letter}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Kapak mektubu üretimi başarısız: {str(e)}")