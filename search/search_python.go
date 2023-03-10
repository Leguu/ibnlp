package search

import (
	"os"
	"os/exec"
	"strings"
)

var python_path string = `C:\Users\Legu\AppData\Local\Programs\Python\Python310\python.exe`

type PythonEncodingSearchProvider struct{}

func quote(s string) string {
	return `"` + s + `"`
}

var python_provider_path string = `C:\Users\Legu\repos\ibnlp\search\python\search_file.py`

func (p *PythonEncodingSearchProvider) Search(query string) ([]SearchResult, error) {
	command := exec.Command(python_path, python_provider_path, quote(query))

	command.Stderr = os.Stderr

	outputBytes, err := command.Output()
	if err != nil {
		return nil, err
	}

	split := strings.Split(string(outputBytes), "\n")

	searchResults := []SearchResult{}
	for _, line := range split {
		searchResults = append(searchResults, SearchResult{Match: line})
	}

	return searchResults, nil
}
