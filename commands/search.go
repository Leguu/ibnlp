package commands

import (
	"context"

	"ibnlp/server/nlp"

	"github.com/urfave/cli/v2"
)

func SearchCommand(cli *cli.Context) error {
	// pythonProvider, err := search.NewPythonSearcher()
	// if err != nil {
	// 	return err
	// }

	// searchQuery := cli.Args().First()

	// output, err := pythonProvider.Search(searchQuery)
	// if err != nil {
	// 	log.Fatal(err)
	// }

	// for _, result := range output {
	// 	log.Println(result)
	// }

	openAi := nlp.ChatGPTProvider{}

	responses, err := openAi.GetResponse(nlp.ChatGPTRequest{
		Messages: []nlp.ChatGPTMessage{
			{Role: "user", Content: cli.Args().First()},
		},
	}, context.Background())
	if err != nil {
		return err
	}

	for response := range responses {
		print(response.Choices[0].Delta.Content)
	}
	println()

	return nil
}
