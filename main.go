package main

import (
	"os"

	"ibnlp/commands"

	"github.com/joho/godotenv"
	"github.com/rs/zerolog/log"
	"github.com/urfave/cli/v2"
)

func main() {
	file, err := os.OpenFile("log.json", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o666)
	if err != nil {
		log.Fatal().Msg("error opening log file")
	}
	log.Logger = log.Output(file)

	err = godotenv.Load(".env", ".env.local")
	if err != nil {
		log.Fatal().Msg("error loading .env file")
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
