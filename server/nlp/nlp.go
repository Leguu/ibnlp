package nlp

import (
	"bytes"
	"encoding/json"
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

type ChatGPTRequest struct {
	Model    string           `json:"model"`
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
	Choices []struct {
		Index        int            `json:"index"`
		Message      ChatGPTMessage `json:"message"`
		FinishReason string         `json:"finish_reason"`
	} `json:"choices"`
	Usage struct {
		PromptTokens     int `json:"prompt_tokens"`
		CompletionTokens int `json:"completion_tokens"`
		TotalTokens      int `json:"total_tokens"`
	} `json:"usage"`
}

func (c ChatGPTProvider) GetResponse(input ChatGPTRequest) (string, error) {
	openAIKey := os.Getenv("OPENAI_API_KEY")

	if input.Model == "" {
		input.Model = defaultModel
	}

	marshalled, err := json.Marshal(input)
	if err != nil {
		return "", err
	}

	request, err := http.NewRequest(http.MethodPost, chatGPTURL, bytes.NewReader(marshalled))
	if err != nil {
		return "", err
	}

	request.Header.Set("Authorization", "Bearer "+openAIKey)
	request.Header.Set("Content-Type", "application/json")

	response, err := http.DefaultClient.Do(request)
	if err != nil {
		return "", err
	}

	decoder := json.NewDecoder(response.Body)

	var t ChatGPTResponse

	decoder.Decode(&t)

	return t.Choices[0].Message.Content, nil
}
