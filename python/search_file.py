import hashlib
import json
import os
from pathlib import Path
import pickle
import sys
from typing import TypeVar
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

READY_CODE = "ready"
STOP_CODE = "stop"

DATA_DIR = r"./data"

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
            jsonLines = file.read()

        entries: list[Entry] = json.loads(
            jsonLines, object_hook=lambda d: Entry.fromDict(**d)
        )

        input_hash = hash([entry.fullPassage for entry in entries])

        self.input_hash = input_hash
        self.file_path = file_path
        self.embeddings_path = file_path.replace(".json", ".pkl")
        self.entries = entries

    # def generate_embeddings(self):
    #     corpus_embeddings = BI_ENCODER.encode(
    #         self.entries, normalize_embeddings=True, convert_to_numpy=False
    #     )

    #     corpus_object = {
    #         "input_hash": self.input_hash,
    #         "embedder_name": EMBEDDER_NAME,
    #         "embeddings": corpus_embeddings,
    #     }

    #     with open(self.embeddings_path, "wb") as pkl:
    #         pickle.dump(corpus_object, pkl)

    #     return corpus_embeddings

    # def try_load_embeddings(self):
    #     if not os.path.isfile(self.embeddings_path):
    #         return None

    #     with open(self.embeddings_path, "rb") as pkl:
    #         embeddings = pickle.load(pkl)

    #     if (
    #         "input_hash" not in embeddings
    #         or "embeddings" not in embeddings
    #         or "embedder_name" not in embeddings
    #     ):
    #         os.remove(self.embeddings_path)
    #         return None

    #     if (
    #         embeddings["input_hash"] != self.input_hash
    #         or embeddings["embedder_name"] != EMBEDDER_NAME
    #     ):
    #         os.remove(self.embeddings_path)
    #         return None

    #     return embeddings["embeddings"]


def getQueryEmbeddings(query: str) -> Tensor:
    query = query.replace(r"[^\w\s]", "").lower()
    query = " ".join([word for word in query.split() if word not in stop_words])

    query_embedding = BI_ENCODER.encode(
        query, convert_to_tensor=True, normalize_embeddings=True
    )
    if not isinstance(query_embedding, Tensor):
        raise Exception(
            "Expected query_embedding to be type Tensor, got: ", type(query_embedding)
        )
    query_embedding.cuda()

    return query_embedding


T = TypeVar("T")


def flatten(list: list[list[T]]) -> list[T]:
    return [item for sublist in list for item in sublist]


class SearchResult:
    file: str
    page: int
    match: str
    score: float

    def __init__(self, file: str, page: int, match: str, score: float) -> None:
        self.file = file
        self.page = page
        self.match = match
        self.score = score


class Searcher:
    searchFiles: list[SearchFile]
    corpus: Tensor

    def __init__(self, searchFiles: list[SearchFile]) -> None:
        self.searchFiles = searchFiles
        entries = flatten([searchFile.entries for searchFile in searchFiles])
        optimisedPassages = [entry.optimisedPassage for entry in entries]
        eprint("All passages: ", len(entries))

        if os.path.isfile("./data/corpus.pkl"):
            with open("./data/corpus.pkl", "rb") as pkl:
                self.corpus = pickle.load(pkl)
        else:
            corpus = BI_ENCODER.encode(
                optimisedPassages, convert_to_tensor=True, normalize_embeddings=True
            )
            if not isinstance(corpus, Tensor):
                raise Exception(
                    "Expected corpus to be type Tensor, got: ", type(corpus)
                )
            corpus.cuda()

            self.corpus = corpus

            with open("./data/corpus.pkl", "wb") as pkl:
                pickle.dump(self.corpus, pkl)

    def getFileAndEntry(self, index: int) -> tuple[SearchFile, Entry]:
        for searchFile in self.searchFiles:
            if index < len(searchFile.entries):
                return searchFile, searchFile.entries[index]
            index -= len(searchFile.entries)

        raise Exception("Index out of range")

    def search(self, query: str) -> list[SearchResult]:
        question_embedding = getQueryEmbeddings(query)
        question_embedding = question_embedding.cuda()
        hits = util.semantic_search(
            question_embedding, self.corpus, top_k=TOP_K, score_function=util.dot_score
        )
        hits = hits[0]

        entries = [self.getFileAndEntry(hit["corpus_id"])[1] for hit in hits]
        fullPassages = [entry.fullPassage for entry in entries]

        cross_input = zip([query] * len(fullPassages), fullPassages)
        cross_scores = CROSS_ENCODER.predict(list([list(pair) for pair in cross_input]))

        for i in range(len(cross_scores)):
            hits[i]["cross-score"] = cross_scores[i]

        hits = sorted(hits, key=lambda x: x["cross-score"], reverse=True)

        results: list[SearchResult] = []
        for hit in hits:
            index = hit["corpus_id"]
            [file, entry] = self.getFileAndEntry(index)

            results.append(
                SearchResult(
                    Path(file.file_path).stem,
                    entry.page,
                    entry.fullPassage,
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
    queryString = str(await request.body())
    results = searcher.search(queryString)

    return JSONResponse([result.__dict__ for result in results[:RETURN_LIMIT]])


development = os.environ.get("ENV") == "DEVELOPMENT"

app = Starlette(debug=development, routes=[Route("/", search, methods=["POST"])])
