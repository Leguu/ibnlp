package searchpython

import (
	"encoding/json"
	"io"
	"io/ioutil"
	"net/http"
	"os"
	"os/exec"
	"strconv"
	"strings"

	"ibnlp/search"
)

type PythonSearcher struct {
	Command *exec.Cmd
	Stdin   io.WriteCloser
	Url     string
}

func New() (*PythonSearcher, error) {
	port, err := strconv.Atoi(os.Getenv("PYTHON_SEARCH_SERVER_PORT"))
	if err != nil {
		return nil, err
	}

	return &PythonSearcher{
		Url: "http://localhost:" + strconv.Itoa(port) + "/",
	}, nil
}

func quote(s string) string {
	return `"` + s + `"`
}

func (p *PythonSearcher) Search(query string) ([]search.SearchResult, error) {
	query = quote(query)

	response, err := http.Post(p.Url, "application/json", strings.NewReader(query+"\n"))
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()

	text, err := ioutil.ReadAll(response.Body)
	if err != nil {
		return nil, err
	}

	var searchResults []search.SearchResult

	decoder := json.NewDecoder(strings.NewReader(string(text)))
	if err := decoder.Decode(&searchResults); err != nil {
		return nil, err
	}

	return searchResults, nil
}
