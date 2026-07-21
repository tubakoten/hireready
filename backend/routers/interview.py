from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.database import get_db, CV, User
from routers.cv import get_current_user
from routers.analyze import client
import json
import traceback

router = APIRouter(prefix="/interview", tags=["interview"])

def parse_json_response(result: str):
    result = result.strip()
    if result.startswith("```"):
        result = result.split("```")[1]
        if result.startswith("json"):
            result = result[4:]
    decoder = json.JSONDecoder()
    result_obj, _ = decoder.raw_decode(result.strip())
    return result_obj

@router.post("/questions")
def generate_questions(
    cv_id: int,
    position: str,
    level: str = "junior",
    language: str = "tr",
    company: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cv = db.query(CV).filter(CV.id == cv_id, CV.user_id == current_user.id).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV bulunamadı")

    lang_instruction = "ÖNEMLİ: Tüm soruları SADECE TÜRKÇE dilinde yaz. İngilizce kullanma." if language == "tr" else "IMPORTANT: Write all questions in English only."
    company_instruction = (
        f"Sorulardan en az 2 tanesi {company} şirketinin kültürüne, değerlerine ve bu şirkette bu pozisyonda "
        f"aranan niteliklere özel olsun (genel sorular değil, {company}'ye özgü olsun)."
        if company else ""
    )

    prompt = f"""
{lang_instruction}

Aşağıdaki CV'ye ve pozisyona göre 5 adet mülakat sorusu üret: {position}
{f"Şirket: {company}" if company else ""}
Seviye: {level}
{company_instruction}

CV İçeriği:
{cv.content[:2000]}

{lang_instruction}

Şu formatta JSON döndür:
{{
    "questions": ["soru 1", "soru 2", "soru 3", "soru 4", "soru 5"]
}}

Sadece JSON döndür, başka hiçbir şey yazma. {lang_instruction}
"""
    try:
        response = client.chat.completions.create(
            model="qwen2.5-1.5b-instruct-generic-gpu:4",
            max_tokens=800,
            temperature=0.3,
            messages=[
                {"role": "system", "content": f"Sen bir mülakat uzmanısın. {lang_instruction} Sadece JSON formatında cevap ver."},
                {"role": "user", "content": prompt}
            ]
        )
        result = response.choices[0].message.content
        parsed = parse_json_response(result)
        questions = parsed.get("questions", [])
        clean_questions = []
        for q in questions:
            if isinstance(q, dict):
                clean_questions.append(q.get("question", str(q)))
            else:
                clean_questions.append(str(q))
        return {"questions": clean_questions}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Soru üretimi başarısız: {str(e)}")


@router.post("/company-prep")
def company_prep(
    company: str,
    position: str,
    sector: str = None,
    level: str = "junior",
    language: str = "tr",
    current_user: User = Depends(get_current_user)
):
    lang_instruction = "ÖNEMLİ: Tüm cevabı SADECE TÜRKÇE dilinde yaz. İngilizce kullanma." if language == "tr" else "IMPORTANT: Write the entire response in English only."

    prompt = f"""
{lang_instruction}

Bir aday {company} şirketinde {position} pozisyonu için mülakata hazırlanıyor.
{f"Sektör: {sector}" if sector else ""}
Seviye: {level}

Bildiğin kadarıyla {company} şirketinin kültürü, değerleri ve bu pozisyonda mülakatlarda
öne çıkan odak noktaları hakkında adaya yol gösterici, pratik bir hazırlık brifingi hazırla.
Şirket hakkında emin olmadığın çok spesifik detaylar yerine, bu sektördeki ve bu ölçekteki
şirketlerde genel olarak geçerli olan gerçekçi ve faydalı bilgiler ver.

{lang_instruction}

Şu formatta JSON döndür:
{{
    "company_overview": "Şirketin bilinen kültürü/değerleri hakkında 2-3 cümlelik özet",
    "culture_values": ["değer 1", "değer 2", "değer 3"],
    "focus_areas": ["mülakatta öne çıkan odak alanı 1", "odak alanı 2", "odak alanı 3"],
    "prep_tips": ["hazırlık ipucu 1", "hazırlık ipucu 2", "hazırlık ipucu 3"]
}}

Sadece JSON döndür, başka hiçbir şey yazma. {lang_instruction}
"""
    try:
        response = client.chat.completions.create(
            model="qwen2.5-1.5b-instruct-generic-gpu:4",
            max_tokens=800,
            temperature=0.3,
            messages=[
                {"role": "system", "content": f"Sen bir kariyer koçu ve mülakat hazırlık uzmanısın. {lang_instruction} Sadece JSON formatında cevap ver."},
                {"role": "user", "content": prompt}
            ]
        )
        result = response.choices[0].message.content
        return parse_json_response(result)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Şirket brifingi üretimi başarısız: {str(e)}")


@router.post("/evaluate")
def evaluate_answer(
    question: str,
    answer: str,
    position: str,
    language: str = "tr",
    current_user: User = Depends(get_current_user)
):
    lang_instruction = "Değerlendirmeyi Türkçe yap." if language == "tr" else "Provide the evaluation in English."

    prompt = f"""
{lang_instruction}
Pozisyon: {position}
Soru: {question}
Aday Cevabı: {answer}

Bu cevabı değerlendir. Şu formatta JSON döndür:
{{
    "score": 75,
    "feedback": "Kısa geri bildirim",
    "improvement": "Geliştirme önerisi"
}}

Sadece JSON döndür.
"""
    try:
        response = client.chat.completions.create(
            model="qwen2.5-1.5b-instruct-generic-gpu:4",
            max_tokens=500,
            temperature=0.3,
            messages=[
                {"role": "system", "content": f"Sen bir mülakat değerlendiricisin. {lang_instruction} Sadece JSON formatında cevap ver."},
                {"role": "user", "content": prompt}
            ]
        )
        result = response.choices[0].message.content
        return parse_json_response(result)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Değerlendirme başarısız: {str(e)}")