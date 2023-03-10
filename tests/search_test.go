package tests

import (
	"log"
	"strings"
	"testing"

	"ibnlp/search"
)

var searchProvider search.PythonEncodingSearchProvider = search.PythonEncodingSearchProvider{}

func containsResult(results []search.SearchResult, matchs ...string) bool {
	for _, result := range results {
		for _, match := range matchs {
			if strings.Contains(strings.ToLower(result.Match), strings.ToLower(match)) {
				return true
			}
		}
	}

	return false
}

func testQueries(t *testing.T, queries []string, expectedResults []string) {
	failedQueries := []string{}

	for _, query := range queries {
		results, err := searchProvider.Search(query)
		if err != nil {
			t.Fatal(err)
		}

		if len(results) < 2 {
			t.Fatal("Expected at least two results, got ", len(results))
		}

		if !containsResult(results, expectedResults...) {
			failedQueries = append(failedQueries, query)
		}
	}

	if len(failedQueries) > 0 {
		log.Println("Failed to find expected results in queries: ", failedQueries)

		if len(failedQueries) >= len(queries)/2 {
			t.Fatal("Too many failed queries")
		}
	}
}

func TestSearchWordCount(t *testing.T) {
	queries := []string{"What is the word count?", "What is the word count for the IA?", "What is the IA wordcount", "Internal Assessment Word Count"}
	expectedResults := []string{"800"}

	testQueries(t, queries, expectedResults)
}

func TestSearchPurpose(t *testing.T) {
	queries := []string{"What is the purpose of the internal assessment?", "What is the purpose of the IA?", "Internal assessment purpose", "IA purpose"}
	expectedResults := []string{"demonstrate application skills knowledge", "pursue"}

	testQueries(t, queries, expectedResults)
}

func TestSearchCriteria(t *testing.T) {
	queries := []string{"What are the internal assessment criteria?", "What are the IA criteria?", "Internal assessment criteria", "IA criteria"}
	expectedResults := []string{"diagrams", "terminology", "application", "analysis", "key concept", "evaluation"}

	testQueries(t, queries, expectedResults)
}

func TestSustainableDevelopment(t *testing.T) {
	queries := []string{"What is sustainable development?", "What is sustainable development in economics?", "What are the sustainable development goals"}
	expectedResults := []string{"poverty", "reduced inequalities", "decent work economic growth", "innovation infrastructure", "responsible consumption production"}

	testQueries(t, queries, expectedResults)
}
