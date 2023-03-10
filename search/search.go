package search

import (
	"github.com/urfave/cli/v2"
)

type SearchResult struct {
	File  string
	Page  int
	Match string
}

type SearchProvider interface {
	Search(query string) ([]SearchResult, error)
}

func SearchCommand(cli *cli.Context) error {
	pythonProvider := &PythonEncodingSearchProvider{}

	output, err := pythonProvider.Search(cli.Args().First())
	if err != nil {
		return err
	}

	for _, result := range output {
		println(result.Match)
	}

	return nil
}
