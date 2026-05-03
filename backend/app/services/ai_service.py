import json
import pathlib
from google import genai
from google.genai import types
from app.config import settings

def get_genai_client():
    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY ortam değișkeni tanımlanmamış.")
    return genai.Client(api_key=settings.GEMINI_API_KEY)

def analyze_medical_document(file_path: str, mime_type: str) -> dict:
    """
    Belirtilen belgeyi (PDF, Görüntü) okur ve tıbbi analiz yapar.
    """
    client = get_genai_client()
    
    prompt = """
    Sen uzman bir Türk doktorsun. Verilen tıbbi belgeyi (tahlil, MR raporu, reçete vb.) dikkatlice incele.
    Halkın anlayabileceği, sade ve şefkatli bir dil kullan.

    Lütfen analizini tam olarak aşağıdaki JSON formatında (başka hiçbir metin eklemeden) ver:
    {
      "summary": "Belgenin genel durumu hakkında anlaşılır, kısa bir özet (1-2 cümle).",
      "critical_findings": "Eğer referans değerlerin çok dışında, acil veya tehlikeli bir durum varsa buraya yaz. Yoksa null bırak.",
      "has_critical_alert": true veya false,
      "full_analysis": "Belgedeki tüm önemli değerlerin açıklaması, ne anlama geldikleri ve varsa hastaya tavsiyeler (Markdown formatında detaylı, listeler kullanarak yaz)."
    }
    """
    
    # Gemini 2.5 Flash hem hızlıdır hem de döküman analizi (multimodal) için çok iyidir.
    model_name = "gemini-2.5-flash"
    
    try:
        path = pathlib.Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"Dosya bulunamadı: {file_path}")
            
        file_bytes = path.read_bytes()
        
        response = client.models.generate_content(
            model=model_name,
            contents=[
                types.Part.from_bytes(data=file_bytes, mime_type=mime_type),
                prompt
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2
            )
        )
        
        return json.loads(response.text)
        
    except Exception as e:
        print(f"AI Analiz Hatası: {str(e)}")
        # Güvenli geri dönüş (fallback)
        return {
            "summary": "Analiz sırasında bir hata oluştu veya belge tam okunamadı.",
            "critical_findings": f"Sistem hatası: {str(e)}",
            "has_critical_alert": False,
            "full_analysis": "Lütfen belgenizin okunabilir ve desteklenen bir formatta (PDF, JPEG, PNG) olduğundan emin olup tekrar deneyin."
        }
