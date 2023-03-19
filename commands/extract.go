package commands

import (
	"log"
	"os"
	"os/exec"
	"regexp"

	"github.com/urfave/cli/v2"
)

func getExtractCommand() *exec.Cmd {
	command := exec.Command("pipenv", "run", "extract")

	command.Stdout = os.Stdout
	command.Stderr = os.Stderr

	return command
}

func ExtractCommand(ctx *cli.Context) error {
	folder := ctx.Args().First()
	if folder == "" {
		folder = "./data"
	}

	entries, err := os.ReadDir(folder)
	if err != nil {
		return err
	}

	extractCommand := getExtractCommand()

	for _, entry := range entries {
		name := entry.Name()
		path := folder + "/" + name

		pdfRegex := regexp.MustCompile(`\.pdf$`)
		if !pdfRegex.Match([]byte(path)) {
			log.Println(`Skipping non-pdf file: "` + path + `"`)
			continue
		}

		extractCommand.Args = append(extractCommand.Args, path)
	}

	if err := extractCommand.Run(); err != nil {
		log.Fatal(err)
	}

	return nil
}
