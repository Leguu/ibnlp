package main

import (
	"log"
	"os"

	"ibnlp/extract"
	searchpython "ibnlp/search/python"

	"github.com/urfave/cli/v2"
)

func SearchCommand(cli *cli.Context) error {
	pythonProvider, err := searchpython.New()
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

func main() {
	app := &cli.App{
		Commands: []*cli.Command{
			{
				Name:      "extract",
				Aliases:   []string{"e"},
				Usage:     "extract data from files for search",
				ArgsUsage: "[folder]",
				Action:    extract.ExtractCommand,
			},
			{
				Name:      "search",
				Aliases:   []string{"s"},
				Usage:     "search for data",
				ArgsUsage: "[query...]",
				Action:    SearchCommand,
			},
		},
	}

	app.Run(os.Args)
}
