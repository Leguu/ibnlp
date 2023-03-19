package commands

import (
	"log"

	searchpython "ibnlp/search/python"

	"github.com/urfave/cli/v2"
)

func SearchCommand(cli *cli.Context) error {
	pythonProvider, err := searchpython.New()
	if err != nil {
		return err
	}

	searchQuery := cli.Args().First()

	output, err := pythonProvider.Search(searchQuery)
	if err != nil {
		log.Fatal(err)
	}

	for _, result := range output {
		log.Println(result)
	}

	return nil
}
