from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.database import get_db, CV, User
from routers.cv import get_current_user
from routers.analyze import client
from pydantic import BaseModel
import json
import traceback

router = APIRouter(prefix="/roadmap", tags=["roadmap"])

class RoadmapRequest(BaseModel):
    cv_id: int
    position: str
    language: str = "tr"

@router.post("/generate")
def generate_roadmap(
    request: RoadmapRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cv = db.query(CV).filter(CV.id == request.cv_id, CV.user_id == current_user.id).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV bulunamadı")

    if request.language == "tr":
        lang_inst = "ÖNEMLİ: SADECE TÜRKÇE yaz. İngilizce kullanma. ÖNEMLİ: SADECE TÜRKÇE yaz."
    else:
        lang_inst = "IMPORTANT: Write ONLY in English."

    prompt = f"""
{lang_inst}

Aşağıdaki CV'yi analiz et ve {request.position} pozisyonu için eksik becerileri tespit et.
Her eksik beceri için somut bir öğrenme yol haritası oluştur.

CV İçeriği:
{cv.content[:2000]}

Şu formatta JSON döndür:
{{
    "position": "{request.position}",
    "steps": [
        {{
            "skill": "Beceri adı",
            "priority": "yüksek",
            "duration": "2 hafta",
            "resources": ["Kaynak 1", "Kaynak 2"],
            "description": "Bu beceriyi neden öğrenmelisin ve nasıl başlamalısın"
        }}
    ]
}}

Maksimum 5 adım, öncelik sırasına göre sırala. Sadece JSON döndür.
{lang_inst}
"""

    try:
        response = client.chat.completions.create(
            model="qwen2.5-1.5b-instruct-generic-gpu:4",
            max_tokens=1000,
            temperature=0.2,
            messages=[
                {"role": "system", "content": f"Sen bir kariyer koçusun. {lang_inst} Sadece JSON formatında cevap ver."},
                {"role": "user", "content": prompt}
            ]
        )
        result = response.choices[0].message.content.strip()
        if result.startswith("```"):
            result = result.split("```")[1]
            if result.startswith("json"):
                result = result[4:]
        decoder = json.JSONDecoder()
        result_obj, _ = decoder.raw_decode(result.strip())
        return result_obj
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Yol haritası üretimi başarısız: {str(e)}")