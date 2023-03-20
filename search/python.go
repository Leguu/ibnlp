package search

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"os"
	"strings"
)

type PythonSearcher struct {
	Url     string
}

func NewPythonSearcher() (*PythonSearcher, error) {
	port := os.Getenv("PYTHON_SEARCH_SERVER_PORT")
	if port == "" {
		return nil, errors.New("PYTHON_SEARCH_SERVER_PORT environment variable not set")
	}

	return &PythonSearcher{ Url: "http://localhost:" + port + "/", }, nil
}

func quote(s string) string {
	return `"` + s + `"`
}

func (p *PythonSearcher) Search(query string) ([]SearchResult, error) {
	query = quote(query)

	response, err := http.Post(p.Url, "application/json", strings.NewReader(query+"\n"))
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()

	text, err := io.ReadAll(response.Body)
	if err != nil {
		return nil, err
	}

	var searchResults []SearchResult

	decoder := json.NewDecoder(strings.NewReader(string(text)))
	if err := decoder.Decode(&searchResults); err != nil {
		return nil, err
	}

	return searchResults, nil
}
