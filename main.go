package main

import (
	"ibnlp/extract"
	"ibnlp/search"
	"os"

	"github.com/urfave/cli/v2"
)

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
				Action:    search.SearchCommand,
			},
		},
	}

	app.Run(os.Args)
}
