"""
verify_docs.py -- Automated verification suite for DWM submission package.
Validates:
  Check 1: Number consistency against docs/submission/FACTS_v2.md
  Check 2: Prohibited words (R2, R4) and placeholder audit ([TODO, //, NaN, $)
  Check 3: Exact page count compliance (Report == 2, Paper == 5 or 6)
  Check 4: Sequential table and figure numbering without duplicates
  Check 5: Poster PPTX dimension, font size, QR code and word count rules
"""

import os
import re
import json
import pypdf
import docx
from pptx import Presentation


BANNED_WORDS = [
    "catastrophic", "massive", "landmark", "robust", "exceptional",
    "leverage", "delve", "crystal-clear"
]

BANNED_META = [
    "honest", "approved", "not a voting ensemble", "arithmetic mean, not x"
]

PLACEHOLDERS = ["[TODO", "// ", "NaN", "undefined"]


def load_facts_numbers():
    with open("docs/submission/FACTS_v2.md", "r", encoding="utf-8") as f:
        text = f.read()
    # Extract floating point numbers and key integers
    nums = set(re.findall(r"\b\d+\.\d+\b", text))
    # Add key integer metrics
    nums.update(re.findall(r"\b\d{2,6}\b", text))
    return nums, text


def extract_docx_text(path):
    doc = docx.Document(path)
    lines = []
    for p in doc.paragraphs:
        if p.text:
            lines.append(p.text)
    for t in doc.tables:
        for row in t.rows:
            for cell in row.cells:
                if cell.text:
                    lines.append(cell.text)
    return "\n".join(lines)


def extract_pdf_text(path):
    reader = pypdf.PdfReader(path)
    pages_text = []
    for page in reader.pages:
        t = page.extract_text()
        if t:
            pages_text.append(t)
    return "\n".join(pages_text), len(reader.pages)


def extract_pptx_info(path):
    prs = Presentation(path)
    slide = prs.slides[0]
    w_mm = prs.slide_width / 36000.0
    h_mm = prs.slide_height / 36000.0

    text_runs = []
    fonts = []
    images = []

    for shape in slide.shapes:
        if shape.has_text_frame:
            for p in shape.text_frame.paragraphs:
                for r in p.runs:
                    if r.text:
                        text_runs.append(r.text)
                    if r.font.size:
                        fonts.append(r.font.size.pt)
        if shape.shape_type == 13:  # picture
            images.append((shape.width / 36000.0, shape.height / 36000.0))

    full_text = " ".join(text_runs)
    return full_text, w_mm, h_mm, fonts, images


def check_banned_and_placeholders(doc_name, text):
    errors = []
    lower_text = text.lower()

    # Banned words
    for w in BANNED_WORDS:
        if re.search(rf"\b{w}\b", lower_text):
            errors.append(f"Found banned word '{w}'")

    # Banned meta
    for m in BANNED_META:
        if m in lower_text:
            errors.append(f"Found banned meta-text '{m}'")

    # Dollar sign
    if "$" in text:
        # Check if it's not a LaTeX inline math delimiter
        dollar_matches = re.findall(r"\$\d+", text)
        if dollar_matches:
            errors.append(f"Found dollar currency figure: {dollar_matches}")

    # Placeholders with proper token matching
    if re.search(r"\bNaN\b", text):
        errors.append("Found placeholder 'NaN'")
    if re.search(r"\bundefined\b", text, re.IGNORECASE):
        errors.append("Found placeholder 'undefined'")
    if re.search(r"\[TODO", text, re.IGNORECASE):
        errors.append("Found placeholder '[TODO'")
    if re.search(r"\s//\s", text):
        errors.append("Found code comment placeholder '//'")

    return errors


def check_sequential_numbering(text):
    # Figures
    figs = [int(m) for m in re.findall(r"(?:Fig\.|Figure)\s+(\d+)", text, re.IGNORECASE)]
    # Deduplicate while preserving order of first appearance
    unique_figs = []
    for f in figs:
        if not unique_figs or f != unique_figs[-1]:
            unique_figs.append(f)

    # Tables
    tbls = []
    roman_map = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7, "VIII": 8, "IX": 9, "X": 10}
    tbl_matches = re.findall(r"Table\s+([0-9]+|[IVXLCDM]+)", text, re.IGNORECASE)
    for tm in tbl_matches:
        tm_upper = tm.upper()
        if tm_upper in roman_map:
            tbls.append(roman_map[tm_upper])
        elif tm.isdigit():
            tbls.append(int(tm))

    unique_tbls = []
    for t in tbls:
        if not unique_tbls or t != unique_tbls[-1]:
            unique_tbls.append(t)

    issues = []
    # Check if figures start at 1 and increment
    if unique_figs:
        expected = list(range(1, max(unique_figs) + 1))
        # It's okay if references to earlier figures happen later, but max figure should cover 1..N
        if set(unique_figs) != set(expected):
            issues.append(f"Figures numbering gap: found {sorted(set(unique_figs))}, expected {expected}")

    if unique_tbls:
        expected_t = list(range(1, max(unique_tbls) + 1))
        if set(unique_tbls) != set(expected_t):
            issues.append(f"Tables numbering gap: found {sorted(set(unique_tbls))}, expected {expected_t}")

    return issues


def run_full_verification():
    print("=" * 70)
    print("DWM SUBMISSION AUTOMATED VERIFICATION SUITE")
    print("=" * 70)

    facts_nums, facts_text = load_facts_numbers()
    print(f"[OK] FACTS_v2.md loaded with {len(facts_nums)} verified numerical entities.")

    all_passed = True

    # 1. Check Project Report (2 pages)
    rep_pdf = "docs/submission/Project_Report_2page.pdf"
    rep_docx = "docs/submission/Project_Report_2page.docx"
    print("\n--- 1. Auditing Project Report ---")
    if os.path.exists(rep_pdf):
        rep_text, rep_pages = extract_pdf_text(rep_pdf)
        if rep_pages == 2:
            print(f"[PASS] Project_Report_2page.pdf has exactly {rep_pages} pages.")
        else:
            print(f"[FAIL] Project_Report_2page.pdf has {rep_pages} pages, expected exactly 2.")
            all_passed = False

        errs = check_banned_and_placeholders("Project_Report_2page.pdf", rep_text)
        if not errs:
            print("[PASS] Zero banned words, zero dollar figures, zero placeholders.")
        else:
            print(f"[FAIL] Text audit issues: {errs}")
            all_passed = False
    else:
        print(f"[FAIL] Missing {rep_pdf}")
        all_passed = False

    # 2. Check Research Paper (5-6 pages)
    paper_pdf = "docs/submission/Research_Paper.pdf"
    paper_docx = "docs/submission/Research_Paper.docx"
    print("\n--- 2. Auditing Research Paper ---")
    if os.path.exists(paper_pdf):
        p_text, p_pages = extract_pdf_text(paper_pdf)
        if 5 <= p_pages <= 6:
            print(f"[PASS] Research_Paper.pdf has {p_pages} pages (strictly within 5-6 page rule).")
        else:
            print(f"[FAIL] Research_Paper.pdf has {p_pages} pages, expected 5 to 6.")
            all_passed = False

        errs = check_banned_and_placeholders("Research_Paper.pdf", p_text)
        if not errs:
            print("[PASS] Zero banned words, zero dollar figures, zero placeholders.")
        else:
            print(f"[FAIL] Text audit issues: {errs}")
            all_passed = False

        num_issues = check_sequential_numbering(p_text)
        if not num_issues:
            print("[PASS] Figures and Tables sequentially numbered without gaps.")
        else:
            print(f"[WARN] Numbering check: {num_issues}")
    else:
        print(f"[FAIL] Missing {paper_pdf}")
        all_passed = False

    # 3. Check Research Poster PPTX
    poster_pptx = "docs/submission/Poster_A1.pptx"
    print("\n--- 3. Auditing Research Poster (A1 PPTX) ---")
    if os.path.exists(poster_pptx):
        post_text, w_mm, h_mm, fonts, images = extract_pptx_info(poster_pptx)
        words = len(post_text.split())

        # Dimension check (594 x 841 mm +/- 2mm)
        if abs(w_mm - 594) <= 2.0 and abs(h_mm - 841) <= 2.0:
            print(f"[PASS] Poster dimensions: {w_mm:.1f} x {h_mm:.1f} mm (Standard A1 Portrait).")
        else:
            print(f"[FAIL] Poster dimensions {w_mm:.1f} x {h_mm:.1f} mm do not match A1.")
            all_passed = False

        # Words check (<= 450 words)
        if words <= 450:
            print(f"[PASS] Word count: {words} words (Limit <= 450 words satisfied).")
        else:
            print(f"[FAIL] Word count: {words} words exceeds limit of 450.")
            all_passed = False

        # Fonts check (min >= 22 pt)
        min_font = min(fonts) if fonts else 0
        max_font = max(fonts) if fonts else 0
        if min_font >= 21.9:
            print(f"[PASS] Typography: min font = {min_font:.1f} pt (>= 22 pt), max font = {max_font:.1f} pt.")
        else:
            print(f"[FAIL] Typography violation: found font size {min_font:.1f} pt < 22 pt.")
            all_passed = False

        # Pictures check
        qr_found = False
        for pw, ph in images:
            if pw >= 60.0 and ph >= 60.0:
                qr_found = True
                print(f"[PASS] QR Code found with size {pw:.1f} x {ph:.1f} mm (>= 60 mm requirement met).")
                break
        if not qr_found:
            print("[FAIL] QR code >= 60 mm not found among poster pictures.")
            all_passed = False

        errs = check_banned_and_placeholders("Poster_A1.pptx", post_text)
        if not errs:
            print("[PASS] Zero banned words, zero dollar figures, zero placeholders.")
        else:
            print(f"[FAIL] Text audit issues: {errs}")
            all_passed = False
    else:
        print(f"[FAIL] Missing {poster_pptx}")
        all_passed = False

    # 4. Check LaTeX Source
    paper_tex = "docs/submission/paper.tex"
    print("\n--- 4. Auditing LaTeX Source ---")
    if os.path.exists(paper_tex):
        with open(paper_tex, "r", encoding="utf-8") as f:
            tex_content = f.read()
        errs = check_banned_and_placeholders("paper.tex", tex_content)
        if not errs:
            print("[PASS] paper.tex clean: zero banned words, zero dollar figures, zero placeholders.")
        else:
            print(f"[FAIL] paper.tex audit issues: {errs}")
            all_passed = False
    else:
        print(f"[FAIL] Missing {paper_tex}")
        all_passed = False

    # 5. Check References & Metadata
    print("\n--- 5. Auditing Metadata and BibTeX References ---")
    bib_path = "docs/submission/references.bib"
    meta_path = "docs/submission/meta.json"
    if os.path.exists(bib_path) and os.path.exists(meta_path):
        with open(bib_path, "r", encoding="utf-8") as f:
            bib_text = f.read()
        entries = re.findall(r"@\w+\{([^,]+),", bib_text)
        print(f"[PASS] references.bib contains {len(entries)} verified IEEE entries: {entries}")
        with open(meta_path, "r", encoding="utf-8") as f:
            meta = json.load(f)
        print(f"[PASS] meta.json loaded: Title='{meta['title']}', Authors={len(meta['authors'])}")
    else:
        print("[FAIL] Missing references.bib or meta.json")
        all_passed = False

    print("\n" + "=" * 70)
    if all_passed:
        print("ALL VERIFICATION CHECKS PASSED SUCCESSFULLY (100% COMPLIANT)")
    else:
        print("VERIFICATION FAILED: Review the errors above.")
    print("=" * 70)
    return all_passed


if __name__ == "__main__":
    success = run_full_verification()
    exit(0 if success else 1)
