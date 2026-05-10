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


def generate_doctor_prep_report(context: dict, start_date: str, end_date: str) -> dict:
    """Create a 30-day doctor visit preparation report."""
    fallback = {
        "date_range": {"start": start_date, "end": end_date},
        "summary": "Son 30 günlük doktor hazırlık raporu şu anda AI ile tamamlanamadı.",
        "key_findings": [
            "Kayıtlarınızı tarih sırasına göre doktorunuzla paylaşın.",
            "Tekrarlayan semptomları, kullanılan ilaçları ve analizli belgeleri özellikle belirtin."
        ],
        "medication_summary": "İlaç kayıtlarınızı ve doz bilgilerinizi randevu öncesi kontrol edin.",
        "document_summary": "Analizli belgeleriniz varsa randevuda yanınızda bulundurun.",
        "risk_flags": [],
        "doctor_questions": [
            "Son 30 gündeki semptomlarım mevcut tedavimle ilişkili olabilir mi?",
            "Kullandığım ilaçlar arasında dikkat etmem gereken bir etkileşim var mı?",
            "Hangi tahlilleri veya kontrolleri tekrar etmem gerekir?"
        ],
        "preparation_checklist": [
            "Tüm ilaç ve doz listesini hazırlayın.",
            "Son tahlil ve reçete belgelerini yanınıza alın.",
            "En sık tekrar eden semptomları tarihleriyle not edin."
        ],
        "full_report": "## Doktora Hazırlık\n\nAI raporu üretilemedi. Yine de son 30 günlük kayıtlarınızı, ilaçlarınızı ve belgelerinizi doktorunuzla paylaşmanız önerilir.",
        "share_text": "Son 30 günlük sağlık kayıtlarımı ve analizli belgelerimi doktor randevumda değerlendirmek istiyorum."
    }

    prompt = f"""
    Sen TanıLog içindeki Türkçe doktor randevusu hazırlık asistanısın.
    Teşhis koyma, tedavi planı yazma, ilaç başlatma/bıraktırma veya kesin tıbbi hüküm verme.
    Kullanıcının son 30 günlük sağlık kayıtlarını ve analizli belgelerini doktor görüşmesine hazırlanacak şekilde özetle.
    Doktorun hızlı tarayabileceği, profesyonel ama sade bir Türkçe kullan.

    Dönem: {start_date} - {end_date}
    Bağlam:
    {json.dumps(context, ensure_ascii=False, default=str)}

    Sadece şu JSON formatında cevap ver:
    {{
      "date_range": {{"start": "{start_date}", "end": "{end_date}"}},
      "summary": "Randevu öncesi 3-4 cümlelik genel özet.",
      "key_findings": ["Doktor için en önemli bulgu veya örüntüler."],
      "medication_summary": "İlaç kullanımı ve takip durumu özeti.",
      "document_summary": "Analizli belge/tahlil/reçete özeti.",
      "risk_flags": ["Acil olmayan ama randevuda özellikle konuşulması gereken uyarılar."],
      "doctor_questions": ["Doktora sorulacak net ve kısa sorular."],
      "preparation_checklist": ["Randevu öncesi hazırlanacak pratik maddeler."],
      "full_report": "Markdown formatında profesyonel Türkçe rapor. Başlıklar: Hasta Özeti, Son 30 Günün Bulguları, İlaçlar, Belgeler ve Tahliller, Doktora Sorulacaklar, Hazırlık Listesi.",
      "share_text": "Doktora veya yakına gönderilebilecek kısa paylaşım metni."
    }}
    """

    return _json_from_gemini(prompt, fallback, temperature=0.2)


def generate_chatbot_response(user_message: str, context: dict, history: list[dict]) -> dict:
    """Generate a Premium AI assistant response grounded in Tanilog data."""
    fallback = {
        "answer": (
            "Şu anda AI yanıtı üretilemedi. Yine de sağlık kayıtlarını düzenli tutmanı, "
            "belge analizlerini doktorunla paylaşmanı ve acil belirtilerde sağlık kuruluşuna başvurmanı öneririm."
        ),
        "safety_level": "caution",
        "suggested_actions": [],
        "follow_up_questions": [
            "Bu durumu ne zamandır yaşıyorsun?",
            "Bu konuda doktoruna sormak istediğin özel bir nokta var mı?"
        ],
    }

    prompt = f"""
    Sen TanıLog Premium içindeki Türkçe sağlık asistanı chatbotusun.
    Kullanıcının TanıLog kayıtlarını bağlam olarak kullanarak dikkatli, kısa ve pratik cevap ver.
    Teşhis koyma, ilaç başlatma/bıraktırma, doz değiştirme veya kesin tıbbi hüküm verme.
    Acil olabilecek belirtilerde net şekilde acil yardım/112/sağlık kuruluşu yönlendirmesi yap.
    Yanıtlarında kullanıcıya doktor görüşmesini destekleyen sorular, takip önerileri ve güvenli kayıt önerileri sun.

    Eğer kullanıcı yeni bir sağlık kaydı oluşturmak istiyorsa, suggested_actions içine kullanıcı onayıyla kaydedilebilecek bir aksiyon koy.
    Aksiyon tipleri yalnızca şunlar olabilir:
    - symptom: payload = date, symptom_name, severity, notes
    - medication: payload = date, name, dosage, time_taken, reminder_enabled, reminder_time, notes
    - sleep: payload = date, hours_slept, quality, notes
    - nutrition: payload = date, meal_type, water_ml, notes

    Kullanıcı mesajı:
    {user_message}

    Son konuşma geçmişi:
    {json.dumps(history[-10:], ensure_ascii=False, default=str)}

    TanıLog bağlamı:
    {json.dumps(context, ensure_ascii=False, default=str)}

    Sadece şu JSON formatında cevap ver:
    {{
      "answer": "Kullanıcıya Türkçe, güvenli, anlaşılır chatbot yanıtı.",
      "safety_level": "normal, caution veya urgent",
      "suggested_actions": [
        {{
          "type": "symptom|medication|sleep|nutrition",
          "label": "Kullanıcıya gösterilecek kısa aksiyon adı",
          "payload": {{"date": "YYYY-MM-DD"}}
        }}
      ],
      "follow_up_questions": ["Kullanıcıya sorulabilecek 1-3 takip sorusu."]
    }}
    """

    result = _json_from_gemini(prompt, fallback, temperature=0.25)
    result.setdefault("answer", fallback["answer"])
    result.setdefault("safety_level", "caution")
    result.setdefault("suggested_actions", [])
    result.setdefault("follow_up_questions", [])

    if result["safety_level"] not in {"normal", "caution", "urgent"}:
        result["safety_level"] = "caution"

    allowed = {"symptom", "medication", "sleep", "nutrition"}
    clean_actions = []
    for action in result.get("suggested_actions", []):
        if not isinstance(action, dict) or action.get("type") not in allowed:
            continue
        clean_actions.append({
            "type": action.get("type"),
            "label": action.get("label") or "Kaydı ekle",
            "payload": action.get("payload") or {},
        })
    result["suggested_actions"] = clean_actions[:3]
    return result


def generate_chatbot_attachment_response(
    user_message: str,
    file_bytes: bytes,
    mime_type: str,
    filename: str,
    context: dict,
    history: list[dict],
) -> dict:
    """Generate a Premium AI assistant response for an uploaded chat file/image."""
    fallback = {
        "answer": (
            f"{filename} dosyası şu anda AI ile incelenemedi. Dosya tıbbi belge veya görselse, "
            "okunabilir olduğundan emin olup Belgelerim alanına da yükleyebilirsin."
        ),
        "safety_level": "caution",
        "suggested_actions": [],
        "follow_up_questions": [
            "Bu dosyada özellikle hangi kısmı anlamak istiyorsun?",
            "Bunu doktor raporuna eklemek ister misin?"
        ],
    }

    prompt = f"""
    Sen TanıLog Premium içindeki Türkçe sağlık asistanı chatbotusun.
    Kullanıcı sohbet içinde bir dosya veya görsel yükledi.
    Dosyayı/görseli incele, ancak teşhis koyma, tedavi veya ilaç değişikliği önerme.
    Tıbbi belgeyse sade Türkçe özetle; ilaç kutusu/reçeteyse görünen bilgileri yapılandır; görsel net değilse bunu söyle.
    Acil risk sezersen sağlık kuruluşuna yönlendir.

    Kullanıcı mesajı: {user_message}
    Dosya adı: {filename}
    MIME türü: {mime_type}

    Son konuşma geçmişi:
    {json.dumps(history[-10:], ensure_ascii=False, default=str)}

    TanıLog bağlamı:
    {json.dumps(context, ensure_ascii=False, default=str)}

    Sadece şu JSON formatında cevap ver:
    {{
      "answer": "Dosya/görsel hakkında Türkçe, güvenli, anlaşılır chatbot yanıtı.",
      "safety_level": "normal, caution veya urgent",
      "suggested_actions": [],
      "follow_up_questions": ["Kullanıcıya sorulabilecek 1-3 takip sorusu."]
    }}
    """

    try:
        client = get_genai_client()
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=[
                types.Part.from_bytes(data=file_bytes, mime_type=mime_type),
                prompt,
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2,
            ),
        )
        result = json.loads(response.text)
    except Exception as e:
        print(f"Chat Attachment Error: {str(e)}")
        result = fallback.copy()
        result["error"] = str(e)

    result.setdefault("answer", fallback["answer"])
    result.setdefault("safety_level", "caution")
    result.setdefault("suggested_actions", [])
    result.setdefault("follow_up_questions", [])
    if result["safety_level"] not in {"normal", "caution", "urgent"}:
        result["safety_level"] = "caution"
    return result


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
