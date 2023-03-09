package extract

import (
	"os"
	"os/exec"
	"regexp"

	"github.com/urfave/cli/v2"
)

func ExtractCommand(ctx *cli.Context) error {
	folder := ctx.Args().First()
	if folder == "" {
		folder = "./data"
	}

	entries, err := os.ReadDir(folder)
	if err != nil {
		return err
	}

	entryNames := []string{}
	for _, entry := range entries {
		name := entry.Name()

		regex := regexp.MustCompile(`\.pdf$`)
		if !regex.Match([]byte(name)) {
			continue
		}

		path := folder + "/" + name
		entryNames = append(entryNames, path)
	}

	command := exec.Command("python", "./extract/extract.py")
	command.Args = append(command.Args, entryNames...)

	command.Stdout = os.Stdout
	command.Stderr = os.Stderr

	if err := command.Run(); err != nil {
		return err
	}

	return nil
}
