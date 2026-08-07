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
        f"Sorulardan tam olarak 1 tanesi {company} şirketiyle ilgili olsun — örneğin "
        f"adayın {company} hakkında ne bildiğini ya da neden orada çalışmak istediğini sorsun. "
        f"Bu soru kısa ve net bir cümle olsun, karmaşık olmasın."
        if company else ""
    )
    no_placeholder = (
        "ÖNEMLİ: Aşağıdaki örnek sadece FORMAT göstermek içindir, örnekteki soruları ASLA "
        "olduğu gibi kopyalama. Tam olarak 5 tane, birbirinden farklı, gerçek ve anlamlı "
        "mülakat sorusu üret."
    )

    prompt = f"""
{lang_instruction}
{no_placeholder}

Aşağıdaki CV'ye ve pozisyona göre TAM OLARAK 5 adet mülakat sorusu üret: {position}
{f"Şirket: {company}" if company else ""}
Seviye: {level}
{company_instruction}

CV İçeriği:
{cv.content[:2000]}

{no_placeholder}

Format örneği (SADECE yapıyı göstermek amaçlı, bu soruları asla kopyalama):
{{
    "questions": [
        "Bu pozisyona başvurma nedeninizi ve kariyer hedeflerinizi anlatır mısınız?",
        "CV'nizde bahsettiğiniz bir projede karşılaştığınız en büyük zorluk neydi, nasıl çözdünüz?",
        "Takım içinde bir anlaşmazlık yaşadığınız bir durumu ve nasıl yönettiğinizi anlatın.",
        "Bu alandaki teknik bilginizi geliştirmek için neler yapıyorsunuz?",
        "Beş yıl sonra kendinizi nerede görüyorsunuz?"
    ]
}}

Şimdi SIRA SENDE: {position} pozisyonu ve yukarıdaki CV için, TAM OLARAK 5 tane kendi
ürettiğin özgün soru içeren JSON döndür. {company_instruction}

Sadece JSON döndür, başka hiçbir şey yazma. {no_placeholder} {lang_instruction}
"""
    try:
        response = client.chat.completions.create(
            model="qwen2.5-1.5b-instruct-generic-gpu:4",
            max_tokens=900,
            temperature=0.4,
            messages=[
                {"role": "system", "content": f"Sen bir mülakat uzmanısın. {lang_instruction} {no_placeholder} Sadece JSON formatında cevap ver."},
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
    no_placeholder = (
        "ÖNEMLİ: Aşağıdaki örnek sadece FORMAT göstermek içindir, örnekteki cümleleri veya "
        "'değer 1', 'odak alanı 2' gibi ifadeleri ASLA olduğu gibi kopyalama. Her alanı "
        f"{company} şirketine ve {position} pozisyonuna göre gerçek, özgün içerikle doldur."
    )

    prompt = f"""
{lang_instruction}
{no_placeholder}

Bir aday {company} şirketinde {position} pozisyonu için mülakata hazırlanıyor.
{f"Sektör: {sector}" if sector else ""}
Seviye: {level}

Bildiğin kadarıyla {company} şirketinin kültürü, değerleri ve bu pozisyonda mülakatlarda
öne çıkan odak noktaları hakkında adaya yol gösterici, pratik bir hazırlık brifingi hazırla.
Şirket hakkında emin olmadığın çok spesifik detaylar yerine, bu sektördeki ve bu ölçekteki
şirketlerde genel olarak geçerli olan gerçekçi ve faydalı bilgiler ver.

{no_placeholder}

Format örneği (farklı bir şirket için, SADECE yapıyı göstermek amaçlı — içeriği asla kopyalama):
{{
    "company_overview": "Örnek A.Ş., hızlı büyüyen ürün odaklı bir teknoloji şirketi olarak biliniyor; takım içi otonomiye ve veri odaklı karar almaya önem veriyor.",
    "culture_values": ["Sahiplenme kültürü", "Hız ve deneysellik", "Müşteri odaklılık"],
    "focus_areas": ["Problem çözme yaklaşımın ve düşünce sürecin", "Takım içinde çatışma/işbirliği örnekleri", "Temel teknik yetkinliklerin"],
    "prep_tips": ["Şirketin ürününü kullanıcı gibi deneyimleyip birkaç gözlem notu çıkar", "Geçmiş bir projede sahiplenme gösterdiğin somut bir örnek hazırla", "Şirketin mühendislik blogunu/kariyer sayfasını incele"]
}}

Şimdi SIRA SENDE: {company} şirketi ve {position} pozisyonu için, YUKARIDAKİ FORMATTA ama
tamamen kendi ürettiğin, {company}'ye özgü gerçek içerikle JSON döndür:
{{
    "company_overview": "...",
    "culture_values": ["...", "...", "..."],
    "focus_areas": ["...", "...", "..."],
    "prep_tips": ["...", "...", "..."]
}}

Sadece JSON döndür, başka hiçbir şey yazma. {no_placeholder} {lang_instruction}
"""
    try:
        response = client.chat.completions.create(
            model="qwen2.5-1.5b-instruct-generic-gpu:4",
            max_tokens=800,
            temperature=0.4,
            messages=[
                {"role": "system", "content": f"Sen bir kariyer koçu ve mülakat hazırlık uzmanısın. {lang_instruction} {no_placeholder} Sadece JSON formatında cevap ver."},
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