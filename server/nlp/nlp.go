package nlp

import (
	"bufio"
	"bytes"
	"encoding/json"
	"io"
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

func (request *ChatGPTRequest) Characters() int {
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

func makeRequest(input ChatGPTRequest) (*http.Response, error) {
	openAIKey := os.Getenv("OPENAI_API_KEY")

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

	return http.DefaultClient.Do(request)
}

// Will stream all response in the channel into the writer in event-stream format,
// with each response separated by a \x1F character.
func StreamResponsesToWriter(writer io.Writer, responses <-chan ChatGPTResponse) string {
	flusher := writer.(http.Flusher)

	totalResponse := ""

	for response := range responses {
		stringResponse := response.Choices[0].Delta.Content
		totalResponse += stringResponse

		stringBuilder := strings.Builder{}
		encoder := json.NewEncoder(&stringBuilder)

		encoder.Encode(stringResponse)

		io.WriteString(writer, "data: "+stringBuilder.String()+"\n\n")
		flusher.Flush()
	}

	return totalResponse
}

func streamResponseToChannel(body io.ReadCloser, out chan<- ChatGPTResponse) {
	reader := bufio.NewReader(body)
	defer body.Close()
	defer close(out)

	for {
		line, err := reader.ReadString('\n')
		if err != nil {
			log.Println("error while reading string: ", err)
			return
		}
		line = strings.TrimPrefix(line, "data: ")

		if strings.TrimSpace(line) == "" {
			continue
		}

		decoder := json.NewDecoder(strings.NewReader(line))

		var t ChatGPTResponse
		if err := decoder.Decode(&t); err != nil {
			log.Println("error while decoding: ", err)
			log.Println(line)
			continue
		}

		if len(t.Choices) == 0 {
			log.Println("no choices in response: ", t)
			continue
		}

		if t.Choices[0].FinishReason != nil {
			return
		}

		if t.Choices[0].Delta.Content == "" {
			continue
		}

		out <- t
	}
}

func (c ChatGPTProvider) GetResponse(input ChatGPTRequest) (<-chan ChatGPTResponse, error) {
	if input.Model == "" {
		input.Model = defaultModel
	}

	input.Stream = true

	response, err := makeRequest(input)
	if err != nil {
		return nil, err
	}

	out := make(chan ChatGPTResponse)
	go streamResponseToChannel(response.Body, out)

	return out, nil
}
