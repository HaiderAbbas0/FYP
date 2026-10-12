"""Build the AI Product Development - Nyrn project feedback PDF.

Minimal academic layout: white background, dark-grey text, Calibri (Arial fallback).
"""

import os
import sys

from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

PROJECT_NAME = "Nyrn"

OUTPUT = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    f"AI_Product_Development_{PROJECT_NAME}_Project_Feedback.pdf",
)

FONT_DIR = r"C:\Windows\Fonts"
REGULAR = os.path.join(FONT_DIR, "calibri.ttf")
BOLD = os.path.join(FONT_DIR, "calibrib.ttf")
ITALIC = os.path.join(FONT_DIR, "calibrii.ttf")

if os.path.exists(REGULAR) and os.path.exists(BOLD):
    FONT = "Calibri"
    FONT_BOLD = "Calibri-Bold"
    FONT_ITALIC = "Calibri-Italic"
    pdfmetrics.registerFont(TTFont(FONT, REGULAR))
    pdfmetrics.registerFont(TTFont(FONT_BOLD, BOLD))
    pdfmetrics.registerFont(TTFont(FONT_ITALIC, ITALIC if os.path.exists(ITALIC) else REGULAR))
else:
    FONT = "Helvetica"
    FONT_BOLD = "Helvetica-Bold"
    FONT_ITALIC = "Helvetica-Oblique"

TEXT = "#1f1f1f"
MUTED = "#404040"
RULE = "#8a8a8a"
RULE_LIGHT = "#d4d4d4"

TEAM = [
    ("1.", "Mohammad Haider Abbas", "23I-2558"),
    ("2.", "Wajeeha Mahmood", "23I-0105"),
    ("3.", "Ayesha Ikram", "23I-0109"),
    ("4.", "Hamd Ul Haq", "23I-0081"),
]


def body_style(name, size=10.5, leading=None, space_after=6, alignment=TA_JUSTIFY, **kwargs):
    return ParagraphStyle(
        name,
        fontName=FONT,
        fontSize=size,
        leading=leading or size * 1.42,
        textColor=TEXT,
        spaceAfter=space_after,
        spaceBefore=0,
        alignment=alignment,
        **kwargs,
    )


def main():
    page_w, _ = A4
    left = right = 25 * mm
    top = 22 * mm
    bottom = 22 * mm
    content_w = page_w - left - right

    doc = SimpleDocTemplate(
        OUTPUT,
        pagesize=A4,
        leftMargin=left,
        rightMargin=right,
        topMargin=top,
        bottomMargin=bottom,
        title=f"AI Product Development Project - {PROJECT_NAME}: Presentation Feedback",
        author=f"Team {PROJECT_NAME}",
        subject="Session feedback report",
    )

    s_body = body_style("Body")
    s_body_last = body_style("BodyLast", space_after=0)
    s_h1 = ParagraphStyle(
        "H1",
        fontName=FONT_BOLD,
        fontSize=11.5,
        leading=14,
        textColor=TEXT,
        spaceBefore=10,
        spaceAfter=3,
    )
    s_title = ParagraphStyle(
        "Title",
        fontName=FONT_BOLD,
        fontSize=17,
        leading=21,
        textColor=TEXT,
        alignment=TA_CENTER,
        spaceAfter=4,
    )
    s_subtitle = ParagraphStyle(
        "Subtitle",
        fontName=FONT,
        fontSize=11,
        leading=14,
        textColor=MUTED,
        alignment=TA_CENTER,
        spaceAfter=0,
    )
    s_th = ParagraphStyle("Th", fontName=FONT_BOLD, fontSize=10, leading=12.5, textColor=TEXT, spaceAfter=0)
    s_td = ParagraphStyle("Td", fontName=FONT, fontSize=10.5, leading=13.5, textColor=TEXT, spaceAfter=0)
    # Hanging-indent style for numbered items.
    s_item_num = body_style(
        "ItemNum", leading=13.5, space_after=4, alignment=0,
        leftIndent=6.5 * mm, firstLineIndent=-6.5 * mm,
    )

    story = []

    # ------------------------------------------------------------------ Title
    story.append(Paragraph(f"AI Product Development Project – {PROJECT_NAME}", s_title))
    story.append(Paragraph("Presentation Feedback Report", s_subtitle))
    story.append(Spacer(1, 8))
    story.append(
        Table([[""]], colWidths=[content_w], rowHeights=[0.6], style=TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), RULE),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ]))
    )
    story.append(Spacer(1, 9))

    # ------------------------------------------------------------ 1. Introduction
    story.append(Paragraph("1. Introduction", s_h1))
    story.append(Paragraph(
        f"Our team presented the {PROJECT_NAME} product concept as part of the AI Product Development "
        "course. The session comprised a 90-second product pitch, a slide deck explaining the concept, "
        "and a question-and-answer session with the panel. Following the presentation, we gathered "
        "feedback from the people we interacted with during the session. This report summarises that "
        "feedback and the direction it has given us for the further development of the product.",
        s_body,
    ))

    # --------------------------------------------------------------- 2. The team
    story.append(Paragraph("2. Project Team", s_h1))
    header = [Paragraph("S. No.", s_th), Paragraph("Team Member", s_th), Paragraph("Roll Number", s_th)]
    rows = [header]
    for num, name, roll in TEAM:
        rows.append([Paragraph(num, s_td), Paragraph(name, s_td), Paragraph(roll, s_td)])
    table = Table(rows, colWidths=[22 * mm, 100 * mm, content_w - 122 * mm], hAlign="LEFT")
    table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), FONT),
        ("TEXTCOLOR", (0, 0), (-1, -1), TEXT),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 3.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("LINEBELOW", (0, 0), (-1, -2), 0.4, RULE_LIGHT),
        ("LINEBELOW", (0, -1), (-1, -1), 0.8, RULE),
        ("LINEABOVE", (0, 0), (-1, 0), 0.8, RULE),
    ]))
    story.append(table)

    # ------------------------------------------------- 3. Summary of the feedback
    story.append(Paragraph("3. Summary of the Feedback", s_h1))
    story.append(Paragraph(
        f"The feedback we received was strongly positive and consistent across everyone we spoke to. "
        f"The panel appreciated the quality of our presentation and the originality of the {PROJECT_NAME} "
        "idea, and they saw clear market potential in it. They also noted that we had a solid understanding "
        "of the product and a strong grasp of the concept behind it. Our ability to present the idea "
        "clearly and to answer the panel's questions during the Q&amp;A session was specifically "
        "commended.",
        s_body,
    ))
    story.append(Paragraph(
        "Alongside this encouragement, the panel offered useful technical recommendations. They "
        "advised us to look into specific tools and technologies in the area of cloud computing that "
        "could help us strengthen the security of the product and better protect the medical information "
        "of its users. The feedback therefore gave us clear direction for the next stage of our "
        "research, particularly on the security, reliability, and feasibility of the system we intend "
        "to build.",
        s_body_last,
    ))

    # ------------------------------------------- 4. Recommendations from the panel
    story.append(Paragraph("4. Recommendations from the Panel", s_h1))
    recs = [
        "Investigate the tools and technologies available in the cloud computing domain that can "
        "support stronger data security for the product.",
        "Focus in particular on the measures that can be adopted to protect the sensitive medical "
        "data of the product's users.",
        "Evaluate these options against the requirements of the product, and assess their "
        "contribution to the security, reliability, and overall feasibility of the system.",
    ]
    for i, text in enumerate(recs, 1):
        story.append(Paragraph(f"{i}.&nbsp;&nbsp; {text}", s_item_num))

    # --------------------------------------------------------------- 5. Closing
    story.append(Paragraph("5. Conclusion", s_h1))
    story.append(Paragraph(
        "Overall, the feedback was both encouraging and constructive. It reinforced our confidence in "
        f"the potential of the {PROJECT_NAME} idea while helping us identify the technical areas that "
        "deserve closer investigation. We intend to carry out the suggested research on data security and "
        "cloud technologies as we continue to develop the product.",
        s_body_last,
    ))

    def on_page(canvas, docobj):
        canvas.setFont(FONT, 8)
        canvas.setFillColor(MUTED)
        canvas.drawCentredString(page_w / 2, 13 * mm, str(canvas.getPageNumber()))

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    print(f"Written: {OUTPUT}")


if __name__ == "__main__":
    sys.exit(main())
