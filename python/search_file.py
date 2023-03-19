import hashlib
import json
import os
from pathlib import Path
import pickle
import sys
from typing import Optional, TypeVar
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer, util, CrossEncoder
from nltk.corpus import stopwords
from torch import Tensor
from starlette.applications import Starlette
from starlette.responses import JSONResponse
from starlette.routing import Route
from starlette.requests import Request
from .extract import Entry

load_dotenv(".env")

stop_words = set(stopwords.words("english"))

# Available models: https://www.sbert.net/docs/pretrained_models.html
EMBEDDER_NAME = "multi-qa-distilbert-dot-v1"
BI_ENCODER = SentenceTransformer(EMBEDDER_NAME)
CROSS_ENCODER = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

DATA_DIR = r"./data/output"

CORPUS_PATH = os.path.join(DATA_DIR, "corpus.pkl")

TOP_K = 64
RETURN_LIMIT = 2


def hash(text: str | list[str]) -> str:
    if isinstance(text, list):
        text = " ".join(text)
    return hashlib.sha256(text.encode("ascii")).hexdigest()


class SearchFile:
    input_hash: str
    file_path: str
    embeddings_path: str
    entries: list[Entry]

    def __init__(self, file_name) -> None:
        file_path = os.path.join(DATA_DIR, file_name)

        with open(file_path, "r", encoding="ascii") as file:
            json_lines = file.read()

        entries: list[Entry] = json.loads(
            json_lines, object_hook=lambda d: Entry.from_dict(**d)
        )

        input_hash = hash([entry.full_passage for entry in entries])

        self.input_hash = input_hash
        self.file_path = file_path
        self.embeddings_path = file_path.replace(".json", ".pkl")
        self.entries = entries


def get_query_embeddings(query: str) -> Tensor:
    query = query.replace(r"[^\w\s]", "").lower()
    query = " ".join([word for word in query.split() if word not in stop_words])

    query_embedding = BI_ENCODER.encode(
        query, convert_to_tensor=True, normalize_embeddings=True
    )
    if not isinstance(query_embedding, Tensor):
        raise TypeError(
            "Expected query_embedding to be type Tensor, got: ", type(query_embedding)
        )
    query_embedding.cuda()

    return query_embedding


T = TypeVar("T")


def flatten(list: list[list[T]]) -> list[T]:
    return [item for sublist in list for item in sublist]


class SearchResult:
    file: str
    page: Optional[int]
    match: str
    score: float

    def __init__(
        self, file: str, page: Optional[int], match: str, score: float
    ) -> None:
        self.file = file
        self.page = page
        self.match = match
        self.score = score


class Searcher:
    search_files: list[SearchFile]
    corpus: Tensor

    def __init__(self, search_files: list[SearchFile]) -> None:
        self.search_files = search_files
        entries = flatten([searchFile.entries for searchFile in search_files])
        optimised_passages = [entry.optimised_passage for entry in entries]
        eprint("All passages: ", len(entries))

        if os.path.isfile(CORPUS_PATH):
            with open(CORPUS_PATH, "rb") as pkl:
                self.corpus = pickle.load(pkl)
        else:
            corpus = BI_ENCODER.encode(
                optimised_passages, convert_to_tensor=True, normalize_embeddings=True
            )
            if not isinstance(corpus, Tensor):
                raise TypeError(
                    "Expected corpus to be type Tensor, got: ", type(corpus)
                )
            corpus.cuda()

            self.corpus = corpus

            with open(CORPUS_PATH, "wb") as pkl:
                pickle.dump(self.corpus, pkl)

    def get_file_and_entry(self, index: int) -> tuple[SearchFile, Entry]:
        for search_file in self.search_files:
            if index < len(search_file.entries):
                return search_file, search_file.entries[index]
            index -= len(search_file.entries)

        raise IndexError("Index out of range")

    def search(self, query: str) -> list[SearchResult]:
        question_embedding = get_query_embeddings(query)
        question_embedding = question_embedding.cuda()
        hits = util.semantic_search(
            question_embedding, self.corpus, top_k=TOP_K, score_function=util.dot_score
        )[0]

        entries = [self.get_file_and_entry(hit["corpus_id"])[1] for hit in hits]
        full_passages = [entry.full_passage for entry in entries]

        cross_scores = CROSS_ENCODER.predict(
            [[query, fulL_passage] for fulL_passage in full_passages],
        )

        for i in range(len(cross_scores)):
            hits[i]["cross-score"] = cross_scores[i]

        hits = sorted(hits, key=lambda x: x["cross-score"], reverse=True)

        results: list[SearchResult] = []
        for hit in hits:
            index = hit["corpus_id"]
            [file, entry] = self.get_file_and_entry(index)

            results.append(
                SearchResult(
                    Path(file.file_path).stem,
                    entry.page,
                    entry.full_passage,
                    hit["score"],
                )
            )

        return results


def eprint(*args, **kwargs):
    print(*args, file=sys.stderr, **kwargs)


fileNames = [
    fileName for fileName in os.listdir(DATA_DIR) if fileName.endswith(".json")
]

searchFiles = [SearchFile(fileName) for fileName in fileNames]
eprint("Search Files ready")
searcher = Searcher(searchFiles)
eprint("Searcher ready")

eprint(
    sum([len(searchFile.entries) for searchFile in searchFiles]),
    " entries loaded.",
)


async def search(request: Request):
    query_string = str(await request.body())
    results = searcher.search(query_string)

    return JSONResponse([result.__dict__ for result in results])


development = os.environ.get("ENV") == "DEVELOPMENT"

app = Starlette(debug=development, routes=[Route("/", search, methods=["POST"])])
