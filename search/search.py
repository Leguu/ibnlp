"""
This is a simple application for sentence embeddings: semantic search
We have a corpus with various sentences. Then, for a given query sentence,
we want to find the most similar sentence in this corpus.
This script outputs for various queries the top 5 most similar sentences in the corpus.
"""
import re
from sentence_transformers import SentenceTransformer, util
import torch

# embedder = SentenceTransformer("all-MiniLM-L6-v2")
embedder = SentenceTransformer("msmarco-distilbert-base-v4")

f = open("./data/PRC-economics-guide-en.txt", "r", encoding="ascii")
lines = "".join(f.readlines()).split("\n")

corpus_embeddings = embedder.encode(lines, convert_to_tensor=True)

# Query sentences:
queries = [
    "What is the word count of the internal assessment?",
    "What is the word count for IA in Economics?",
    "word count",
    "word count internal assessment",
]


# Find the closest 5 sentences of the corpus for each query sentence based on cosine similarity
top_k = min(10, len(lines))
for query in queries:
    query_embedding = embedder.encode(query, convert_to_tensor=True)

    # We use cosine-similarity and torch.topk to find the highest 5 scores
    # cos_scores = util.cos_sim(query_embedding, corpus_embeddings)[0]
    # top_results = torch.topk(cos_scores, k=top_k)

    print("\n\n======================\n\n")
    print("Query:", query)
    print("\nTop 5 most similar sentences in corpus:")

    # for score, idx in zip(top_results[0], top_results[1]):
    #     print(corpus[idx], "(Score: {:.4f})".format(score))

    # Alternatively, we can also use util.semantic_search to perform cosine similarty + topk
    hits = util.semantic_search(query_embedding, corpus_embeddings, top_k=top_k)
    hits = hits[0]  # Get the hits for the first query
    for hit in hits:
        print(lines[hit["corpus_id"]], "(Score: {:.4f})".format(hit["score"]))
