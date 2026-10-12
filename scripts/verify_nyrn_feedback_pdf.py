"""Verify the generated Nyrn feedback PDF: page count, text extraction, and team details."""

import os
import sys

from pypdf import PdfReader

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
matches = sorted(
    f for f in os.listdir(ROOT)
    if f.startswith("AI_Product_Development_") and f.endswith(".pdf")
)
if len(matches) != 1:
    print(f"Expected exactly one feedback PDF in {ROOT}, found: {matches}")
    sys.exit(1)
PDF = os.path.join(ROOT, matches[0])

EXPECTED = [
    "Mohammad Haider Abbas",
    "23I-2558",
    "Wajeeha Mahmood",
    "23I-0105",
    "Ayesha Ikram",
    "23I-0109",
    "Hamd Ul Haq",
    "23I-0081",
    "Nyrn",
]

FORBIDDEN = [
    "AWS", "Azure", "Google Cloud", "Firebase", "Heroku", "Verizon",
    "Dr.", "Prof.", "Universit", "Signatur", "http",
]


def main():
    reader = PdfReader(PDF)
    print(f"PDF: {PDF}")
    print(f"Pages: {len(reader.pages)}")
    text = "\n".join(p.extract_text() or "" for p in reader.pages)
    print("---- TEXT ----")
    print(text)
    print("---- CHECKS ----")
    ok = True
    for item in EXPECTED:
        found = item in text
        ok &= found
        print(f"{'OK     ' if found else 'MISSING'}: {item}")
    for item in FORBIDDEN:
        found = item.lower() in text.lower()
        ok &= not found
        print(f"{'FOUND(!!)' if found else 'absent  '}: {item}")
    stale = "Ring" in text
    print(f"{'FOUND(!!)' if stale else 'absent  '}: Ring (old project name)")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
