import re
import textwrap
from datetime import datetime


def _ascii_text(value: object) -> str:
    text = str(value or "")
    table = str.maketrans({
        "ç": "c", "Ç": "C", "ğ": "g", "Ğ": "G", "ı": "i", "İ": "I",
        "ö": "o", "Ö": "O", "ş": "s", "Ş": "S", "ü": "u", "Ü": "U",
        "â": "a", "Â": "A", "î": "i", "Î": "I", "û": "u", "Û": "U",
    })
    return text.translate(table)


def _escape_pdf_text(value: str) -> str:
    return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def _clean_filename(value: str) -> str:
    value = _ascii_text(value).lower()
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-")
    return value or "doktor-raporu"


def _append_wrapped(lines: list[tuple[str, int]], text: str, size: int = 10, width: int = 92) -> None:
    for paragraph in _ascii_text(text).splitlines() or [""]:
        wrapped = textwrap.wrap(paragraph, width=width) or [""]
        for line in wrapped:
            lines.append((line, size))


def _append_section(lines: list[tuple[str, int]], title: str, content: object) -> None:
    if not content:
        return
    lines.append(("", 10))
    lines.append((_ascii_text(title).upper(), 13))
    if isinstance(content, list):
        for item in content:
            _append_wrapped(lines, f"- {item}", 10)
    else:
        _append_wrapped(lines, str(content), 10)


def doctor_report_pdf(report: dict, title: str) -> tuple[bytes, str]:
    date_range = report.get("date_range") or {}
    lines: list[tuple[str, int]] = [
        ("TaniLog Doktor Hazirlik Raporu", 18),
        (_ascii_text(title), 14),
    ]
    if date_range.get("start") and date_range.get("end"):
        lines.append((f"Donem: {date_range['start']} - {date_range['end']}", 10))
    lines.append((f"Olusturma: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", 9))

    _append_section(lines, "Ozet", report.get("summary"))
    _append_section(lines, "Kilit Bulgular", report.get("key_findings"))
    _append_section(lines, "Risk Uyarilari", report.get("risk_flags"))
    _append_section(lines, "Ilac Ozeti", report.get("medication_summary"))
    _append_section(lines, "Belge Ozeti", report.get("document_summary"))
    _append_section(lines, "Doktora Sorular", report.get("doctor_questions"))
    _append_section(lines, "Hazirlik Listesi", report.get("preparation_checklist"))
    _append_section(lines, "Detayli Rapor", report.get("full_report"))

    pages: list[list[tuple[str, int]]] = []
    current: list[tuple[str, int]] = []
    y = 760
    for text, size in lines:
        line_height = max(13, size + 4)
        if y - line_height < 50 and current:
            pages.append(current)
            current = []
            y = 760
        current.append((text, size))
        y -= line_height
    if current:
        pages.append(current)

    objects: list[str] = []

    def add_object(body: str) -> int:
        objects.append(body)
        return len(objects)

    catalog_id = add_object("<< /Type /Catalog /Pages 2 0 R >>")
    pages_id = add_object("<< /Type /Pages /Kids [] /Count 0 >>")
    font_id = add_object("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    page_ids: list[int] = []

    for page in pages:
        commands = ["BT", "/F1 10 Tf"]
        current_y = 780
        for text, size in page:
            line_height = max(13, size + 4)
            current_y -= line_height
            commands.append(f"/F1 {size} Tf")
            commands.append(f"1 0 0 1 50 {current_y} Tm")
            commands.append(f"({_escape_pdf_text(text)}) Tj")
        commands.append("ET")
        stream = "\n".join(commands)
        content_id = add_object(f"<< /Length {len(stream.encode('latin-1', errors='ignore'))} >>\nstream\n{stream}\nendstream")
        page_id = add_object(
            f"<< /Type /Page /Parent {pages_id} 0 R /MediaBox [0 0 595 842] "
            f"/Resources << /Font << /F1 {font_id} 0 R >> >> /Contents {content_id} 0 R >>"
        )
        page_ids.append(page_id)

    objects[pages_id - 1] = f"<< /Type /Pages /Kids [{' '.join(f'{pid} 0 R' for pid in page_ids)}] /Count {len(page_ids)} >>"

    pdf = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for idx, body in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf.extend(f"{idx} 0 obj\n{body}\nendobj\n".encode("latin-1", errors="ignore"))
    xref_pos = len(pdf)
    pdf.extend(f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode("ascii"))
    for offset in offsets[1:]:
        pdf.extend(f"{offset:010d} 00000 n \n".encode("ascii"))
    pdf.extend(
        f"trailer\n<< /Size {len(objects) + 1} /Root {catalog_id} 0 R >>\n"
        f"startxref\n{xref_pos}\n%%EOF\n".encode("ascii")
    )

    return bytes(pdf), f"{_clean_filename(title)}.pdf"
