"""Branded PDF export: renders a markdown deliverable into a TyRey-styled PDF."""

import re

from fpdf import FPDF

INK = (17, 24, 39)
ACCENT = (13, 110, 93)
MUTED = (107, 114, 128)


class _TyReyPDF(FPDF):
    def __init__(self, title: str):
        super().__init__(format="Letter")
        self.doc_title = title
        self.set_auto_page_break(auto=True, margin=22)
        self.set_margins(18, 20, 18)

    def header(self):
        half = (self.w - self.l_margin - self.r_margin) / 2
        self.set_font("helvetica", "B", 9)
        self.set_text_color(*ACCENT)
        self.cell(half, 6, "TYREY INTELLIGENCE(TM)", align="L")
        self.set_font("helvetica", "", 9)
        self.set_text_color(*MUTED)
        self.cell(half, 6, self.doc_title[:70], align="R", new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(*ACCENT)
        self.set_line_width(0.4)
        self.line(18, self.get_y() + 1, self.w - 18, self.get_y() + 1)
        self.ln(6)

    def footer(self):
        self.set_y(-16)
        usable = self.w - self.l_margin - self.r_margin
        self.set_font("helvetica", "", 8)
        self.set_text_color(*MUTED)
        self.cell(
            usable - 25,
            5,
            "(c) TyRey Technologies, Inc. - Planning tool, not financial or legal advice.",
            align="L",
        )
        self.cell(25, 5, f"Page {self.page_no()}", align="R")


def _latin1(text: str) -> str:
    replacements = {
        "—": "-", "–": "-", "‘": "'", "’": "'",
        "“": '"', "”": '"', "•": "-", "…": "...",
        "→": "->", "™": "(TM)", "®": "(R)",
    }
    for src, dst in replacements.items():
        text = text.replace(src, dst)
    return text.encode("latin-1", "replace").decode("latin-1")


def _inline_plain(text: str) -> str:
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
    text = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"\1", text)
    text = re.sub(r"`([^`]+)`", r"\1", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    return text


def render_pdf(title: str, markdown: str) -> bytes:
    pdf = _TyReyPDF(title=_latin1(title))
    pdf.add_page()

    for raw_line in markdown.splitlines():
        line = _latin1(raw_line.rstrip())
        stripped = line.strip()

        if not stripped:
            pdf.ln(2)
            continue
        if re.fullmatch(r"-{3,}|\*{3,}|_{3,}", stripped):
            pdf.set_draw_color(*MUTED)
            pdf.set_line_width(0.2)
            y = pdf.get_y() + 2
            pdf.line(18, y, pdf.w - 18, y)
            pdf.ln(6)
            continue

        if stripped.startswith("# "):
            pdf.set_x(pdf.l_margin)
            pdf.set_font("helvetica", "B", 18)
            pdf.set_text_color(*INK)
            pdf.multi_cell(0, 9, _inline_plain(stripped[2:]), new_x="LMARGIN", new_y="NEXT")
            pdf.ln(2)
        elif stripped.startswith("## "):
            pdf.ln(3)
            pdf.set_x(pdf.l_margin)
            pdf.set_font("helvetica", "B", 14)
            pdf.set_text_color(*ACCENT)
            pdf.multi_cell(0, 7, _inline_plain(stripped[3:]), new_x="LMARGIN", new_y="NEXT")
            pdf.ln(1)
        elif stripped.startswith("### "):
            pdf.ln(2)
            pdf.set_x(pdf.l_margin)
            pdf.set_font("helvetica", "B", 11.5)
            pdf.set_text_color(*INK)
            pdf.multi_cell(0, 6, _inline_plain(stripped[4:]), new_x="LMARGIN", new_y="NEXT")
        elif stripped.startswith(">"):
            quote = _inline_plain(stripped.lstrip("> "))
            if not quote:
                pdf.ln(2)
                continue
            pdf.set_x(pdf.l_margin)
            pdf.set_font("helvetica", "I", 10)
            pdf.set_text_color(*MUTED)
            pdf.multi_cell(0, 5.5, quote, new_x="LMARGIN", new_y="NEXT")
        elif re.match(r"^[-*+]\s+", stripped):
            pdf.set_font("helvetica", "", 10.5)
            pdf.set_text_color(*INK)
            pdf.set_x(24)
            pdf.multi_cell(
                0, 5.5, "- " + _inline_plain(re.sub(r"^[-*+]\s+", "", stripped)),
                new_x="LMARGIN", new_y="NEXT",
            )
        elif re.match(r"^\d+\.\s+", stripped):
            pdf.set_font("helvetica", "", 10.5)
            pdf.set_text_color(*INK)
            pdf.set_x(24)
            pdf.multi_cell(0, 5.5, _inline_plain(stripped), new_x="LMARGIN", new_y="NEXT")
        else:
            pdf.set_x(pdf.l_margin)
            pdf.set_font("helvetica", "", 10.5)
            pdf.set_text_color(*INK)
            pdf.multi_cell(0, 5.5, _inline_plain(stripped), new_x="LMARGIN", new_y="NEXT")

    return bytes(pdf.output())
