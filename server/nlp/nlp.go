package nlp

import (
	"bufio"
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"
)

type ChatGPTProvider struct{}

const (
	chatGPTURL   = "https://api.openai.com/v1/chat/completions"
	defaultModel = "gpt-3.5-turbo"
)

type ChatGPTMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

func (message *ChatGPTMessage) WordCount() int {
	words := strings.Split(message.Content, " ")
	return len(words)
}

type ChatGPTRequest struct {
	Model    string           `json:"model"`
	Stream   bool             `json:"stream"`
	Messages []ChatGPTMessage `json:"messages"`
}

func (request *ChatGPTRequest) Words() int {
	words := 0
	for _, message := range request.Messages {
		line := strings.Split(message.Content, " ")
		words += len(line)
	}
	return words
}

type ChatGPTResponse struct {
	Id      string `json:"id"`
	Object  string `json:"object"`
	Choices []struct {
		Index        int            `json:"index"`
		Delta        ChatGPTMessage `json:"delta"`
		FinishReason *string        `json:"finish_reason"`
	} `json:"choices"`
}

func (c ChatGPTProvider) GetResponse(input ChatGPTRequest) (<-chan ChatGPTResponse, error) {
	openAIKey := os.Getenv("OPENAI_API_KEY")

	if input.Model == "" {
		input.Model = defaultModel
	}

	input.Stream = true

	marshalled, err := json.Marshal(input)
	if err != nil {
		return nil, err
	}

	request, err := http.NewRequest(http.MethodPost, chatGPTURL, bytes.NewReader(marshalled))
	if err != nil {
		return nil, err
	}

	request.Header.Set("Authorization", "Bearer "+openAIKey)
	request.Header.Set("Content-Type", "application/json")

	response, err := http.DefaultClient.Do(request)
	if err != nil {
		return nil, err
	}

	reader := bufio.NewReader(response.Body)

	out := make(chan ChatGPTResponse)
	go func() {
		for {
			line, err := reader.ReadString('\n')
			if err != nil {
				log.Println("error while reading string: ", err)
				close(out)
				return
			}
			line = strings.TrimSpace(strings.TrimPrefix(line, "data:"))

			if line == "" {
				continue
			}

			decoder := json.NewDecoder(strings.NewReader(line))

			var t ChatGPTResponse
			if err := decoder.Decode(&t); err != nil {
				log.Println("error while decoding: ", err)
				continue
			}

			if len(t.Choices) == 0 {
				log.Println("no choices in response: ", t)
				continue
			}

			if t.Choices[0].FinishReason != nil {
				out <- t
				close(out)
				response.Body.Close()
				return
			}

			out <- t
		}
	}()

	return out, nil
}
