import json
import sys
import fitz

from nltk.corpus import stopwords


class Entry:
    page: int
    fullPassage: str
    optimisedPassage: str

    @staticmethod
    def fromDict(**kwargs):
        e = Entry()
        e.__dict__.update(kwargs)
        return e

    def __init__(self, page: int = 0, passage: str = "") -> None:
        passage = passage.encode("ascii", "ignore").decode("ascii")
        self.page = page
        self.fullPassage = passage
        self.optimisedPassage = " ".join(
            [word for word in passage.split() if word not in stop_words]
        )


if __name__ == "__main__":
    stop_words = set(stopwords.words("english"))

    for fname in sys.argv[1:]:
        if not fname.endswith(".pdf"):
            continue

        doc = fitz.Document(fname)

        out_path = fname.replace(".pdf", ".json")

        out = open(out_path, "wb")

        print("Extracting text from %s to %s" % (fname, out_path))

        passages_set: set[str] = set()
        pages: list[Entry] = []

        i = 1
        for page in doc:
            text: str = page.get_textpage().extractText()

            entry = Entry(page=i, passage=text)
            if (
                entry.optimisedPassage != ""
                and entry.optimisedPassage not in passages_set
            ):
                pages.append(entry)

            passages_set.add(entry.optimisedPassage)

            i += 1

        out.write(
            json.dumps([page.__dict__ for page in pages], indent=2).encode(
                "ascii", "ignore"
            )
        )

        out.close()
