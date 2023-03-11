package search

import (
	"log"

	"github.com/urfave/cli/v2"
)

type SearchResult struct {
	File  string
	Page  int
	Match string
	Score float32
}

type SearchProvider interface {
	Search(query string) ([]SearchResult, error)
}

func SearchCommand(cli *cli.Context) error {
	pythonProvider, err := NewPythonEncodingSearchProvider()
	if err != nil {
		return err
	}
	defer pythonProvider.Close()

	output, err := pythonProvider.Search(cli.Args().First())
	if err != nil {
		log.Fatal(err)
	}

	log.Println("Found", len(output), "results")
	for _, result := range output {
		log.Println(result.Match)
	}

	return nil
}
