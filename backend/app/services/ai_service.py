import json
import pathlib
from google import genai
from google.genai import types
from app.config import settings

MODEL_NAME = "gemini-2.5-flash"

def get_genai_client():
    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY ortam değișkeni tanımlanmamış.")
    return genai.Client(api_key=settings.GEMINI_API_KEY)

def _json_from_gemini(prompt: str, fallback: dict, temperature: float = 0.25) -> dict:
    try:
        client = get_genai_client()
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=[prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=temperature
            )
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"AI Text Analysis Error: {str(e)}")
        fallback = fallback.copy()
        fallback["error"] = str(e)
        return fallback


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
            model=MODEL_NAME,
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


def analyze_symptoms_with_document(document_context: dict, health_context: dict, days: int) -> dict:
    """Create an instant cross-analysis from one document analysis and recent health logs."""
    fallback = {
        "summary": "Capraz analiz su anda tamamlanamadi.",
        "linked_findings": [],
        "recommendations": [
            "Belge analizini ve gunluk saglik kayitlarini doktorunuzla birlikte degerlendirin."
        ],
        "critical_findings": None,
        "has_critical_alert": False,
        "full_analysis": "Analiz sirasinda teknik bir sorun olustu. Lutfen daha sonra tekrar deneyin."
    }

    prompt = f"""
    Sen Tanilog icinde calisan Turkce bir saglik verisi yorumlama asistanisin.
    Tibbi teshis koyma; kullaniciya sadece bilgilendirici, dikkatli ve doktor gorusunu destekleyen icgoruler ver.

    Asagida bir tibbi belgenin AI analiz sonucu ve kullanicinin son {days} gunluk saglik kayitlari var.
    Bu iki veri kaynagi arasinda anlamli baglantilar kur.
    Veri azsa bunu acikca soyle ve kesin yorum yapma.

    Belge analizi:
    {json.dumps(document_context, ensure_ascii=False, default=str)}

    Saglik kayitlari:
    {json.dumps(health_context, ensure_ascii=False, default=str)}

    Sadece su JSON formatinda cevap ver:
    {{
      "summary": "1-2 cumlelik genel capraz analiz ozeti.",
      "linked_findings": ["Belge bulgusu ile semptom/ilac/uyku/beslenme arasinda kurulan somut baglantilar."],
      "recommendations": ["Doktorla konusulabilecek, takip edilebilecek guvenli oneriler."],
      "critical_findings": "Acil dikkat gerektiren bir durum varsa yaz, yoksa null.",
      "has_critical_alert": true veya false,
      "full_analysis": "Markdown formatinda detayli Turkce analiz. Basliklar ve maddeler kullan."
    }}
    """

    return _json_from_gemini(prompt, fallback, temperature=0.2)


def generate_health_report(health_context: dict, period: str, start_date: str, end_date: str) -> dict:
    """Create an instant weekly or monthly health report from health logs."""
    period_label = "haftalik" if period == "weekly" else "aylik"
    fallback = {
        "period": period,
        "date_range": {"start": start_date, "end": end_date},
        "summary": f"{period_label.capitalize()} rapor su anda tamamlanamadi.",
        "trends": [],
        "recommendations": [
            "Kayitlarinizi duzenli tutup raporu doktorunuzla birlikte degerlendirin."
        ],
        "doctor_questions": [],
        "has_critical_alert": False,
        "full_report": "Rapor olusturulurken teknik bir sorun yasandi. Lutfen daha sonra tekrar deneyin."
    }

    prompt = f"""
    Sen Tanilog icinde calisan Turkce bir kisisel saglik raporu asistanisin.
    Teshis koyma, tedavi plani yazma ve kesin tibbi hukum verme.
    Kullanicinin {start_date} ile {end_date} arasindaki {period_label} saglik kayitlarini ozetle.

    Kayitlar:
    {json.dumps(health_context, ensure_ascii=False, default=str)}

    Veri yoksa veya azsa bunu belirt; yine de kullaniciya takip acisindan faydali, guvenli bir rapor ver.

    Sadece su JSON formatinda cevap ver:
    {{
      "period": "{period}",
      "date_range": {{"start": "{start_date}", "end": "{end_date}"}},
      "summary": "Donemin 2-3 cumlelik genel ozeti.",
      "trends": ["Semptom, ilac, uyku ve beslenme tarafinda fark edilen trendler."],
      "recommendations": ["Guvenli takip onerileri ve doktora danisma notlari."],
      "doctor_questions": ["Doktora sorulabilecek net sorular."],
      "has_critical_alert": true veya false,
      "full_report": "Markdown formatinda detayli Turkce rapor. Semptomlar, ilaclar, uyku, beslenme, dikkat edilmesi gerekenler ve doktora sorular basliklarini kullan."
    }}
    """

    return _json_from_gemini(prompt, fallback, temperature=0.25)


def analyze_medication_interactions(medication_context: dict) -> dict:
    """Review active medications and prescription analyses for possible interaction warnings."""
    fallback = {
        "summary": "Ilac etkilesim kontrolu su anda tamamlanamadi.",
        "risk_level": "unknown",
        "interactions": [],
        "recommendations": [
            "Birden fazla ilac kullaniyorsaniz ilac listenizi doktor veya eczacinizla paylasin."
        ],
        "doctor_questions": [],
        "has_critical_alert": False,
        "full_analysis": "Analiz sirasinda teknik bir sorun olustu. Lutfen daha sonra tekrar deneyin."
    }

    prompt = f"""
    Sen Tanilog icinde calisan Turkce bir ilac guvenligi asistanisin.
    Teshis koyma, tedavi degisikligi onerme, doz degistirme veya ilac biraktirma.
    Kullaniciya sadece olasi ilac etkilesimi, tekrar eden etken madde riski ve doktora/eczaciya sorulacak noktalar hakkinda guvenli bilgi ver.

    Asagida kullanicinin son kayitli ilaclari ve varsa analiz edilmis recete belgeleri var:
    {json.dumps(medication_context, ensure_ascii=False, default=str)}

    Veri yetersizse bunu acikca soyle. Ilac adlari ticari marka olabilir; emin olmadigin durumda kesin hukum verme.

    Sadece su JSON formatinda cevap ver:
    {{
      "summary": "1-2 cumlelik genel ilac guvenligi ozeti.",
      "risk_level": "low, medium, high veya unknown",
      "interactions": ["Olası etkilesim veya dikkat edilmesi gereken somut noktalar."],
      "recommendations": ["Guvenli takip ve doktor/eczaciya danisma onerileri."],
      "doctor_questions": ["Doktora veya eczaciya sorulabilecek net sorular."],
      "has_critical_alert": true veya false,
      "full_analysis": "Markdown formatinda detayli Turkce analiz."
    }}
    """

    return _json_from_gemini(prompt, fallback, temperature=0.2)


def scan_medications_from_file(file_bytes: bytes, mime_type: str) -> dict:
    """Extract medication candidates from a prescription or medication box image/PDF."""
    client = get_genai_client()
    fallback = {
        "summary": "Dosyadan ilaç bilgisi çıkarılamadı.",
        "medications": [],
        "warnings": [
            "Görüntü net değilse daha aydınlık ve okunabilir bir fotoğrafla tekrar deneyin."
        ]
    }

    prompt = """
    Sen TanıLog içinde çalışan Türkçe bir reçete ve ilaç kutusu okuma asistanısın.
    Gönderilen reçete, ilaç kutusu veya prospektüs görselinden ilaç adaylarını çıkar.
    Teşhis koyma, doz önerme, tedavi değiştirme. Yalnızca görüntüde yazan bilgileri yapılandır.
    Emin olmadığın alanları null bırak ve confidence değerini düşük ver.

    Sadece şu JSON formatında cevap ver:
    {
      "summary": "Dosyada kaç ilaç adayı bulunduğunu ve güven düzeyini özetle.",
      "medications": [
        {
          "name": "İlaç adı",
          "dosage": "Doz / form bilgisi, örn 500 mg tablet",
          "usage": "Reçetede yazıyorsa kullanım sıklığı, örn günde 2 kez",
          "suggested_time": "Metinden çıkarılabiliyorsa HH:MM formatında saat, yoksa null",
          "notes": "Tok/aç, sabah/akşam gibi ek bilgi",
          "barcode": "Kutuda barkod okunuyorsa barkod, yoksa null",
          "confidence": 0.0 ile 1.0 arasında sayı
        }
      ],
      "warnings": ["Belirsiz veya kullanıcı onayı gerektiren noktalar."]
    }
    """

    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=[
                types.Part.from_bytes(data=file_bytes, mime_type=mime_type),
                prompt
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1
            )
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Medication Scan Error: {str(e)}")
        fallback["warnings"].append(f"Sistem hatası: {str(e)}")
        return fallback
