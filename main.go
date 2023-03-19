package main

import (
	"log"
	"os"

	"ibnlp/commands"

	"github.com/joho/godotenv"
	"github.com/urfave/cli/v2"
)

func main() {
	err := godotenv.Load(".env", ".env.local")
	if err != nil {
		log.Fatal("error loading .env file")
	}

	app := &cli.App{
		Commands: []*cli.Command{
			{
				Name:      "extract",
				Aliases:   []string{"e"},
				Usage:     "extract data from files for search",
				ArgsUsage: "[folder]",
				Action:    commands.ExtractCommand,
			},
			{
				Name:      "search",
				Aliases:   []string{"s"},
				Usage:     "search for data",
				ArgsUsage: "[query...]",
				Action:    commands.SearchCommand,
			},
			{
				Name:   "serve",
				Usage:  "serve the search API",
				Action: commands.ServerCommand,
				Flags: []cli.Flag{
					&cli.BoolFlag{
						Name:    "dev",
						Aliases: []string{"d"},
						Value:   false,
						Usage:   "run in development mode (if true, overrides .env)",
					},
				},
			},
		},
	}

	app.Run(os.Args)
}
