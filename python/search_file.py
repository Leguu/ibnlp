import hashlib
import json
import os
import pickle
import re
import sys
from sentence_transformers import SentenceTransformer, util
from nltk.corpus import stopwords

stop_words = set(stopwords.words("english"))

# Available models: https://www.sbert.net/docs/pretrained_models.html
# EMBEDDER_NAME = "msmarco-MiniLM-L6-cos-v5"
# EMBEDDER_NAME = "msmarco-bert-base-dot-v5"
# EMBEDDER_NAME = "multi-qa-MiniLM-L6-cos-v1"
EMBEDDER_NAME = "all-MiniLM-L6-v2"
embedder = SentenceTransformer(EMBEDDER_NAME)

READY_CODE = "ready"
STOP_CODE = "stop"


INPUT_PATH = r"./data/PRC-economics-guide-en.txt"

with open(INPUT_PATH, "r", encoding="ascii") as f:
    lines = f.read()

split = re.split(r"Page \d+\n#####\n\n", lines)

input_hash = hashlib.sha256(lines.encode()).hexdigest()

EMBEDDINGS_PATH = INPUT_PATH.replace(".txt", ".pkl")


def eprint(*args, **kwargs):
    print(*args, file=sys.stderr, **kwargs)


def generate_embeddings():
    corpus_embeddings = embedder.encode(split, convert_to_tensor=True)
    corpus_embeddings = corpus_embeddings.to("cuda")
    # corpus_embeddings = util.normalize_embeddings(corpus_embeddings)

    corpus_object = {
        "input_hash": input_hash,
        "embedder_name": EMBEDDER_NAME,
        "embeddings": corpus_embeddings,
    }

    with open(EMBEDDINGS_PATH, "wb") as pkl:
        pickle.dump(corpus_object, pkl)

    return corpus_embeddings


def try_load_embeddings():
    if not os.path.isfile(EMBEDDINGS_PATH):
        return None

    with open(EMBEDDINGS_PATH, "rb") as pkl:
        embeddings = pickle.load(pkl)

    if (
        "input_hash" not in embeddings
        or "embeddings" not in embeddings
        or "embedder_name" not in embeddings
    ):
        os.remove(EMBEDDINGS_PATH)
        return None

    if (
        embeddings["input_hash"] != input_hash
        or embeddings["embedder_name"] != EMBEDDER_NAME
    ):
        os.remove(EMBEDDINGS_PATH)
        return None

    return embeddings["embeddings"]


def yieldCommands():
    for line in sys.stdin:
        yield line.rstrip()


def getQueryEmbeddings(query):
    query = query.replace(r"[^\w\s]", "").lower()
    query = " ".join([word for word in query.split() if word not in stop_words])

    query_embedding = embedder.encode(query, convert_to_tensor=True)
    query_embedding = query_embedding.to("cuda")
    # query_embedding = util.normalize_embeddings(query_embedding)

    return query_embedding


def search(corpus, query):
    top_k = min(2, len(split))
    hits = util.semantic_search(
        query,
        corpus,
        top_k=top_k,
        score_function=util.dot_score,
    )

    return hits[0]


def main():
    corpus_embeddings = try_load_embeddings()

    if corpus_embeddings is None:
        corpus_embeddings = generate_embeddings()

    print(READY_CODE, flush=True)

    for query in yieldCommands():
        if query == STOP_CODE:
            exit()

        query_embedding = getQueryEmbeddings(query)

        hits = search(corpus_embeddings, query_embedding)

        lines = []
        for hit in hits:
            lines.append(
                {
                    "File": INPUT_PATH,
                    "Page": hit["corpus_id"] + 1,
                    "Match": split[hit["corpus_id"]],
                    "Score": hit["score"],
                }
            )

        jsonLines = json.dumps(lines)

        print(jsonLines, flush=True)


if __name__ == "__main__":
    main()
