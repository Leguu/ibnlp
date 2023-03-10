package search

import (
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
	pythonProvider := &PythonEncodingSearchProvider{}
	pythonProvider.Search(cli.Args().First())

	return nil
}
