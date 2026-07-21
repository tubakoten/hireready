import os
import traceback
from xml.sax.saxutils import escape

import requests
from fastapi import APIRouter, Depends, HTTPException, Response
from routers.cv import get_current_user
from models.database import User

router = APIRouter(prefix="/speech", tags=["speech"])

# Dil bazlı Azure neural ses seçimi. Farklı bir ses denemek istersen
# bu isimleri değiştirmen yeterli (Azure ses kataloğunda başka birçok seçenek var).
VOICE_MAP = {
    "tr": "tr-TR-EmelNeural",
    "en": "en-US-JennyNeural",
}


def _azure_credentials():
    key = os.environ.get("AZURE_SPEECH_KEY")
    region = os.environ.get("AZURE_SPEECH_REGION")
    if not key or not region:
        raise HTTPException(
            status_code=503,
            detail="Azure Speech yapılandırılmamış (AZURE_SPEECH_KEY / AZURE_SPEECH_REGION eksik)."
        )
    return key, region


@router.post("/tts")
def text_to_speech(
    text: str,
    language: str = "tr",
    current_user: User = Depends(get_current_user)
):
    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="Metin boş olamaz")

    key, region = _azure_credentials()
    lang_code = "tr-TR" if language == "tr" else "en-US"
    voice_name = VOICE_MAP.get(language, VOICE_MAP["tr"])

    ssml = f"""<speak version='1.0' xml:lang='{lang_code}'>
<voice xml:lang='{lang_code}' name='{voice_name}'>
{escape(text)}
</voice>
</speak>"""

    try:
        resp = requests.post(
            f"https://{region}.tts.speech.microsoft.com/cognitiveservices/v1",
            headers={
                "Ocp-Apim-Subscription-Key": key,
                "Content-Type": "application/ssml+xml",
                "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
                "User-Agent": "hireready",
            },
            data=ssml.encode("utf-8"),
            timeout=15,
        )
        if resp.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail=f"Azure Speech hatası ({resp.status_code}): {resp.text[:200]}"
            )
        return Response(content=resp.content, media_type="audio/mpeg")
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Seslendirme başarısız: {str(e)}")