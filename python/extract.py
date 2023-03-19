import json
import os
from pathlib import Path
import sys
from typing import Optional
import fitz

from nltk.corpus import stopwords


class Entry:
    page: Optional[int]
    full_passage: str
    optimised_passage: str

    @staticmethod
    def from_dict(**kwargs):
        e = Entry()
        e.__dict__.update(kwargs)
        if e.full_passage == "":
            raise ValueError("Empty passage")
        if e.optimised_passage == "":
            raise ValueError("Empty passage")
        return e

    def __init__(self, page: Optional[int] = None, passage: str = "") -> None:
        passage = passage.encode("ascii", "ignore").decode("ascii").strip()
        self.page = page
        self.full_passage = passage
        self.optimised_passage = " ".join(
            [word for word in passage.split() if word not in stop_words]
        ).strip()


def python_handler(fname: str) -> list[Entry]:
    doc = fitz.Document(fname)

    passages_set: set[str] = set()
    pages: list[Entry] = []

    i = 1
    for page in doc:
        text: str = page.get_textpage().extractText()

        entry = Entry(page=i, passage=text)
        if (
            entry.optimised_passage != ""
            and entry.optimised_passage not in passages_set
        ):
            pages.append(entry)

        passages_set.add(entry.optimised_passage)

        i += 1

    return pages


def text_handler(fname: str) -> list[Entry]:
    with open(fname, "r", encoding="utf-8") as f:
        text = f.read().encode("ascii", "ignore").decode("ascii")

    paragraphs = []

    lines = [line.strip() for line in text.splitlines()]

    current_paragraph = ""
    for line in lines:
        current_paragraph += line
        if line == "" and current_paragraph != "":
            paragraphs.append(current_paragraph)
            current_paragraph = ""

    if current_paragraph != "":
        paragraphs.append(current_paragraph)

    return [Entry(passage=passage) for passage in paragraphs]


if __name__ == "__main__":
    stop_words = set(stopwords.words("english"))

    for fname in sys.argv[1:]:
        output_dir = os.path.join(os.path.dirname(fname), "output")
        suffix = Path(fname).suffix
        basename = os.path.basename(fname).replace(suffix, ".json")
        out_path = os.path.join(output_dir, basename)

        if not os.path.exists(output_dir):
            os.mkdir(output_dir)

        out = open(out_path, "wb")

        print("Extracting text from %s to %s" % (fname, out_path))

        pages = []
        if fname.endswith(".txt"):
            pages = text_handler(fname)
        elif fname.endswith(".pdf"):
            pages = python_handler(fname)

        out.write(
            json.dumps([page.__dict__ for page in pages], indent=2).encode(
                "ascii", "ignore"
            )
        )

        out.close()
