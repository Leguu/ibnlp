package commands

import (
	"ibnlp/server"

	"github.com/urfave/cli/v2"
)

func ServerCommand(c *cli.Context) error {
	return server.RunServer(c.Bool("dev"))
}
