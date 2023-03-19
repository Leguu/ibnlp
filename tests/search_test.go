package tests

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"sync"
	"testing"
	"time"

	"ibnlp/search"
	searchpython "ibnlp/search/python"

	"github.com/joho/godotenv"
	"golang.org/x/sync/semaphore"
)

var provider search.Searcher

func TestMain(m *testing.M) {
	err := godotenv.Load("../.env")
	if err != nil {
		log.Fatal("error loading .env file")
	}

	p, err := searchpython.New()
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

	wg := sync.WaitGroup{}

	maxCalls := semaphore.NewWeighted(4)

	ctx := context.Background()

	for _, query := range queries {
		title := strings.Replace(query, "/", "", -1)
		maxCalls.Acquire(ctx, 1)
		wg.Add(1)
		go t.Run(title, func(t *testing.T) {
			defer wg.Done()
			defer maxCalls.Release(1)

			results, err := provider.Search(query)
			if err != nil {
				t.Fatal(err)
			}

			if len(results) != 2 {
				t.Error("Expected exactly two results, got ", len(results))
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

	wg.Wait()

	if fails > 0 {
		if float32(fails) >= float32(len(queries))/2 {
			t.Fatal("Too many failed queries")
		}
	}
}

func TestSearchWordCount(t *testing.T) {
	queries := []string{
		"What is the word count?", "What is the word count for the IA?", "What is the IA wordcount", "Internal Assessment Word Count",
		"What is the specified word limit for the economics IA?",
		"How many words are required for the economics IA?",
		"What is the prescribed word count for the economics IA?",
		"What is the maximum/minimum word count for the economics IA?",
		"What is the recommended word length for the economics IA?",
	}
	expectedResults := []string{"800"}

	testQueries(t, queries, expectedResults)
}

func TestSearchPurpose(t *testing.T) {
	queries := []string{
		"What is the purpose of the internal assessment?", "What is the purpose of the IA?", "Internal assessment purpose", "IA purpose",
		"What are the objectives of conducting internal assessments?",
		"What is the aim of performing internal assessments?",
		"What is the goal of the internal assessment process?",
		"Why is internal assessment important and what is its purpose?",
		"What is the intended outcome of conducting internal assessments?",
		"What is the goal or objective of the internal assessment?",
		"What is the intended outcome of the IA?",
		"What is the reason or rationale for completing the internal assessment?",
		"What is the function or role of the IA within the overall assessment process?",
		"What is the benefit or value of completing the internal assessment?",
	}
	expectedResults := []string{"demonstrate application skills knowledge", "pursue"}

	testQueries(t, queries, expectedResults)
}

func TestSearchCriteria(t *testing.T) {
	queries := []string{
		"What are the internal assessment criteria?", "What are the IA criteria?", "Internal assessment criteria", "IA criteria",
		"What are the specific evaluation criteria used for the internal assessment?",
		"What are the factors or standards that are taken into consideration when assessing the IA?",
		"What are the elements that are used to assess the quality of the IA?",
		"What are the grading or scoring rubrics used for the internal assessment?",
		"What are the benchmarks or guidelines used to evaluate the IA?",
	}
	expectedResults := []string{"diagrams", "terminology", "application", "analysis", "key concept", "evaluation"}

	testQueries(t, queries, expectedResults)
}

func TestSearchSustainableDevelopment(t *testing.T) {
	queries := []string{
		"What is sustainable development?", "What is sustainable development in economics?", "What are the sustainable development goals",
		"What does sustainable development mean in the context of economics?",
		"What is the definition of sustainable development in economics?",
		"How is sustainable development defined within the field of economics?",
		"What are the economic principles underlying sustainable development?",
		"Can you explain the concept of sustainable development as it relates to economics?",
	}
	expectedResults := []string{"poverty", "reduced inequalities", "decent work economic growth", "innovation infrastructure", "responsible consumption production"}

	testQueries(t, queries, expectedResults)
}

func TestProjectZero(t *testing.T) {
	queries := []string{
		"What is project zero?", "What is project zero in economics?", "What is project zero economics?",
		"What is the project zero initiative?",
		"What is the project zero init",
	}
	expectedResults := []string{"project zero"}

	testQueries(t, queries, expectedResults)
}

func TestLearnerProfile(t *testing.T) {
	queries := []string{
		"What are the IB learner profiles?",
		"What is meant by the term 'IB learner profiles'?",
		"What are the characteristics or attributes of an IB learner?",
		"What are the qualities or traits that the IB learner profiles aim to develop?",
		"What is the purpose of the IB learner profiles in the International Baccalaureate program?",
		"How do the IB learner profiles relate to the mission and philosophy of the International Baccalaureate?",
	}
	expectedResults := []string{"inquirer", "knowledgeable", "thinker", "communicator", "principled", "open", "caring", "risk", "balanced", "reflective"}

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

	wg := sync.WaitGroup{}

	maxCalls := semaphore.NewWeighted(4)
	ctx := context.Background()

	for _, query := range queries {
		wg.Add(1)

		maxCalls.Acquire(ctx, 1)
		go func(query string) {
			defer wg.Done()
			defer maxCalls.Release(1)

			_, err := provider.Search(query)
			if err != nil {
				t.Fail()
			}
		}(query)
	}

	wg.Wait()

	time_taken := time.Since(start)

	if time_taken > time.Second {
		t.Fatal("Search took too long, took ", time_taken.Seconds(), " seconds")
	}
}
