import sys
import fitz

from nltk.corpus import stopwords

stop_words = set(stopwords.words("english"))

page_separator = """
Page %i
#####\n
"""

for fname in sys.argv[1:]:
    if not fname.endswith(".pdf"):
        continue

    doc = fitz.open(fname)

    out_path = fname.replace(".pdf", ".txt")

    out = open(out_path, "wb")

    print("Extracting text from %s to %s" % (fname, out_path))

    i = 1
    for page in doc:
        text = page.get_text()
        text = " ".join([word for word in text.split() if word not in stop_words])
        out.write(str.encode(page_separator % i))
        out.write(text.encode("ascii", "ignore"))
        i += 1

    out.close()
