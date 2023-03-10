package search

import (
	"os"
	"os/exec"
)

var python_path string = `C:\Users\Legu\AppData\Local\Programs\Python\Python310\python.exe`

type PythonEncodingSearchProvider struct {
}

func quote(s string) string {
	return `"` + s + `"`
}

func (p *PythonEncodingSearchProvider) Search(query string) ([]SearchResult, error) {
	command := exec.Command(python_path, "./search/search.py", quote(query))

	command.Stderr = os.Stderr

	outputBytes, err := command.Output()
	if err != nil {
		return nil, err
	}
	output := string(outputBytes)

	println(output)

	return nil, nil
}
