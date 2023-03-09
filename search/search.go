package search

import (
	"os"
	"os/exec"

	"github.com/urfave/cli/v2"
)

type SearchResult struct {
	File  string
	Match string
}

type SearchProvider interface {
	Search(query string) ([]SearchResult, error)
}

func SearchCommand(cli *cli.Context) error {
	python := `C:\Users\Legu\AppData\Local\Programs\Python\Python310\python.exe`
	command := exec.Command(python, "./search/search.py")

	command.Stdout = os.Stdout
	command.Stderr = os.Stderr

	if err := command.Run(); err != nil {
		return err
	}

	return nil
}
