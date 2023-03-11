package searchpython

import (
	"bufio"
	"encoding/json"
	"errors"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"ibnlp/search"
)

const (
	run_command = "run search"
	ready_code  = "ready"
	stop_code   = "stop"
)

type PythonSearcher struct {
	Command *exec.Cmd
	Stdin   io.WriteCloser
	Stdout  io.ReadCloser
}

func New() (*PythonSearcher, error) {
	where, err := exec.Command("pipenv", "--where").Output()
	if err != nil {
		return nil, err
	}

	base := strings.TrimSpace(string(where))

	command := exec.Command("pipenv", "run", "search")

	command.Stderr = os.Stderr
	command.Dir = filepath.Clean(base)

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

	// Wait for ready output
	scanner := bufio.NewScanner(stdout)
	for scanner.Scan() {
		if scanner.Text() != ready_code {
			return nil, &exec.Error{Err: errors.New("python provider did not output ready code")}
		} else {
			break
		}
	}

	return &PythonSearcher{
		Command: command,
		Stdin:   stdin,
		Stdout:  stdout,
	}, nil
}

func (p *PythonSearcher) Close() {
	p.Stdin.Write([]byte(stop_code + "\n"))
	p.Command.Wait()
}

func quote(s string) string {
	return `"` + s + `"`
}

func (p *PythonSearcher) Search(query string) ([]search.SearchResult, error) {
	p.Stdin.Write([]byte(quote(query) + "\n"))

	var searchResults []search.SearchResult

	scanner := bufio.NewScanner(p.Stdout)
	for scanner.Scan() {
		break
	}
	text := scanner.Text()

	decoder := json.NewDecoder(strings.NewReader(text))
	if err := decoder.Decode(&searchResults); err != nil {
		return nil, err
	}

	return searchResults, nil
}
