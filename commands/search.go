package commands

import (
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
	
	response, err := openAi.GetResponse(nlp.ChatGPTRequest{
		Messages: []nlp.ChatGPTMessage{
			{Role: "user", Content: cli.Args().First()},
		},
	})
	if err != nil {
		return err
	}
	
	println(response.Choices[0].Message.Content)

	return nil
}
