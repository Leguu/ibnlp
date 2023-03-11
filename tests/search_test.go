package tests

import (
	"fmt"
	"log"
	"os"
	"strings"
	"testing"
	"time"

	"ibnlp/search"
	"ibnlp/search/python"
)

var provider search.Searcher

func TestMain(m *testing.M) {
	p, err := python.New()
	if err != nil {
		log.Fatal(err)
	}
	defer p.Close()

	provider = p

	code := m.Run()

	os.Exit(code)
}

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
	fails := 0

	for _, query := range queries {
		t.Run(query, func(t *testing.T) {
			results, err := provider.Search(query)
			if err != nil {
				t.Fatal(err)
			}

			if len(results) < 2 {
				t.Error("Expected at least two results, got ", len(results))
			}

			if len(expectedResults) == 0 {
				return
			}

			if !containsResult(results, expectedResults...) {
				fails += 1
				t.Skip("This query failed")
			}
		})
	}

	if fails > 0 {
		if float32(fails) >= float32(len(queries))/2 {
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

func TestSearchSustainableDevelopment(t *testing.T) {
	queries := []string{"What is sustainable development?", "What is sustainable development in economics?", "What are the sustainable development goals"}
	expectedResults := []string{"poverty", "reduced inequalities", "decent work economic growth", "innovation infrastructure", "responsible consumption production"}

	testQueries(t, queries, expectedResults)
}

// Assure that the search can handle 100 queries a second at least
func TestSpeed(t *testing.T) {
	query := "some random string of characters, perhaps long, perhaps short, perhaps with a number"
	queries := []string{}
	for i := 0; i < 100; i++ {
		queries = append(queries, query+fmt.Sprint(i))
	}

	// This warms up the encoder so subsequent queries run faster
	provider.Search(query)

	start := time.Now()

	for _, query := range queries {
		_, err := provider.Search(query)
		if err != nil {
			t.Fatal(err)
		}
	}

	time_taken := time.Since(start)

	if time_taken > time.Second {
		t.Fatal("Search took too long, took ", time_taken.Seconds(), " seconds")
	}
}
