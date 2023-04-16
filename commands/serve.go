package commands

import (
	"os"

	"ibnlp/server"

	"github.com/urfave/cli/v2"
)

func ServerCommand(c *cli.Context) error {
	if c.Bool("dev") {
		os.Setenv("ENV", "DEVELOPMENT")
	}
	return server.RunServer()
}
