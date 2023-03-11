package search

type SearchResult struct {
	File  string
	Page  int
	Match string
	Score float32
}

type Searcher interface {
	Search(query string) ([]SearchResult, error)
}
