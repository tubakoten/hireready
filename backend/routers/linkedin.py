from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from routers.cv import get_current_user
from routers.analyze import client
from routers.interview import parse_json_response
from models.database import User
from PyPDF2 import PdfReader
import io
import traceback

router = APIRouter(prefix="/linkedin", tags=["linkedin"])


@router.post("/analyze")
async def analyze_linkedin(
    position: str = Form(...),
    company: str = Form(None),
    sector: str = Form(None),
    level: str = Form("junior"),
    language: str = Form("tr"),
    profile_text: str = Form(None),
    file: UploadFile = File(None),
    current_user: User = Depends(get_current_user)
):
    # Kullanıcı ya PDF olarak dışa aktarılmış LinkedIn profilini yükler
    # ya da profil metnini elle yapıştırır. İkisinden biri yeterli.
    text = ""
    if file is not None:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Sadece PDF dosyası yükleyebilirsiniz")
        content = await file.read()
        pdf = PdfReader(io.BytesIO(content))
        for page in pdf.pages:
            text += page.extract_text() or ""
    elif profile_text:
        text = profile_text

    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="LinkedIn profil metni veya PDF gerekli")

    lang_instruction = (
        "ÖNEMLİ: Tüm cevabı SADECE TÜRKÇE dilinde yaz. İngilizce kullanma."
        if language == "tr"
        else "IMPORTANT: Write the entire response in English only."
    )

    prompt = f"""
{lang_instruction}

Aşağıdaki LinkedIn profilini şu pozisyon için değerlendir: {position}
{f"Şirket: {company}" if company else ""}
{f"Sektör: {sector}" if sector else ""}
Seviye: {level}

LinkedIn Profil İçeriği:
{text[:3000]}

{lang_instruction}

Profili şu açılardan değerlendir:
- Başlık (headline) pozisyona göre ne kadar etkili
- Hakkında (about) bölümünün ikna ediciliği
- Deneyim açıklamalarında ölçülebilir/somut başarı var mı
- Pozisyonla anahtar kelime uyumu
- Beceriler (skills) bölümünün yeterliliği

Şu formatta JSON döndür:
{{
    "score": 75,
    "summary": "Kısa genel değerlendirme",
    "headline_suggestion": "Pozisyona uygun, daha güçlü örnek bir başlık öner",
    "strengths": ["güçlü yan 1", "güçlü yan 2"],
    "gaps": ["eksik 1", "eksik 2"],
    "suggestions": ["öneri 1", "öneri 2", "öneri 3"]
}}

Sadece JSON döndür, başka hiçbir şey yazma. {lang_instruction}
"""
    try:
        response = client.chat.completions.create(
            model="qwen2.5-1.5b-instruct-generic-gpu:4",
            max_tokens=1000,
            temperature=0.2,
            messages=[
                {
                    "role": "system",
                    "content": f"Sen bir LinkedIn profil optimizasyon uzmanı ve kariyer koçusun. {lang_instruction} Sadece JSON formatında cevap ver."
                },
                {"role": "user", "content": prompt}
            ]
        )
        result = response.choices[0].message.content
        return parse_json_response(result)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"LinkedIn analizi başarısız: {str(e)}")