package extract

import (
	"os"
	"os/exec"
	"regexp"

	"github.com/urfave/cli/v2"
)

func extractPdf(path string) error {
	command := exec.Command("python", "./extract/extract.py")
	command.Args = append(command.Args, path)

	command.Stdout = os.Stdout
	command.Stderr = os.Stderr

	if err := command.Run(); err != nil {
		return err
	}

	return nil
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

	for _, entry := range entries {
		name := entry.Name()
		path := folder + "/" + name

		pdfRegex := regexp.MustCompile(`\.pdf$`)
		if pdfRegex.Match([]byte(path)) {
			extractPdf(folder + "/" + name)
		}
	}

	return nil
}
