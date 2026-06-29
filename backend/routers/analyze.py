from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.database import get_db, CV, User
from models.schemas import AnalyzeRequest
from routers.cv import get_current_user
from openai import OpenAI
import json
import traceback

router = APIRouter(prefix="/analyze", tags=["analyze"])

client = OpenAI(
    base_url="http://127.0.0.1:50033/v1",
    api_key="local"
)

def get_llm_response(prompt: str) -> str:
    response = client.chat.completions.create(
        model="Phi-3.5-mini-instruct-generic-gpu:2",
        max_tokens=1000,
        temperature=0.1,
        messages=[
            {
                "role": "system",
                "content": "Sen bir kariyer koçusun. Sadece JSON formatında cevap ver, başka hiçbir şey yazma."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    )
    return response.choices[0].message.content

@router.post("/cv")
def analyze_cv(
    request: AnalyzeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cv = db.query(CV).filter(CV.id == request.cv_id, CV.user_id == current_user.id).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV bulunamadı")
    
    prompt = f"""
Aşağıdaki CV'yi analiz et ve şu pozisyon için değerlendir: {request.position}
{f"Şirket: {request.company}" if request.company else ""}
{f"Sektör: {request.sector}" if request.sector else ""}
Seviye: {request.level}

CV İçeriği:
{cv.content[:3000]}

Şu formatta JSON cevap ver:
{{
    "score": 75,
    "summary": "Kısa özet",
    "strengths": ["güçlü yan 1", "güçlü yan 2"],
    "gaps": ["eksik 1", "eksik 2"],
    "suggestions": ["öneri 1", "öneri 2"]
}}

Sadece JSON döndür, başka hiçbir şey yazma.
"""
    
    try:
        print(f"LLM isteği gönderiliyor...")
        result = get_llm_response(prompt)
        print(f"LLM cevabı: {result[:200]}")
        result = result.strip()
        if result.startswith("```"):
            result = result.split("```")[1]
            if result.startswith("json"):
                result = result[4:]
        return json.loads(result)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"AI analizi başarısız: {str(e)}")