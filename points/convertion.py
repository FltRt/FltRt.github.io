from docx import Document
import json
import re

INPUT_FILE = r"D:\RISD.4\intro\FltRt.github.io\points\coca.docx"
OUTPUT_FILE = r"D:\RISD.4\intro\FltRt.github.io\points\coca_60000.json"


doc = Document(INPUT_FILE)
freq = {}

for p in doc.paragraphs:
    line = p.text.strip()
    if not line:
        continue

    parts = [x.strip() for x in line.split("\t") if x.strip()]

    if parts[0].startswith("RANK"):
        continue

    if len(parts) < 4:
        continue

    word = parts[2].lower()
    total = parts[3]

    if not total.isdigit():
        continue

    total = int(total)

    # KEEP MAX VALUE TO PREVENT OVERWRITING WITH SMALLER ONES
    freq[word] = max(freq.get(word, 0), total)

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(freq, f, indent=2)

print("Done!")
print("Words extracted:", len(freq))
print("Saved to:", OUTPUT_FILE)
