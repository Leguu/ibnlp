package search

import (
	"bufio"
	"encoding/json"
	"io"
	"os/exec"
	"strings"
)

var python_path string = `C:\Users\Legu\AppData\Local\Programs\Python\Python310\python.exe`

type PythonEncodingSearchProvider struct {
	Command *exec.Cmd
	Stdin   io.WriteCloser
	Stdout  io.ReadCloser
}

func NewPythonEncodingSearchProvider() (*PythonEncodingSearchProvider, error) {
	command := exec.Command(python_path, python_provider_path)

	stdin, err := command.StdinPipe()
	if err != nil {
		return nil, err
	}

	stdout, err := command.StdoutPipe()
	if err != nil {
		return nil, err
	}

	if err := command.Start(); err != nil {
		return nil, err
	}

	return &PythonEncodingSearchProvider{
		Command: command,
		Stdin:   stdin,
		Stdout:  stdout,
	}, nil
}

func (p *PythonEncodingSearchProvider) Close() {
	p.Stdin.Write([]byte("exit\n"))
	p.Command.Wait()
}

func quote(s string) string {
	return `"` + s + `"`
}

var python_provider_path string = `C:\Users\Legu\repos\ibnlp\search\python\search_file.py`

func (p *PythonEncodingSearchProvider) Search(query string) ([]SearchResult, error) {
	p.Stdin.Write([]byte(quote(query) + "\n"))

	var searchResults []SearchResult

	scanner := bufio.NewScanner(p.Stdout)
	for scanner.Scan() {
		decoder := json.NewDecoder(strings.NewReader(scanner.Text()))

		if err := decoder.Decode(&searchResults); err != nil {
			return nil, err
		} else {
			break
		}
	}

	return searchResults, nil
}
