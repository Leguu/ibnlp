package controllers

import (
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/rs/zerolog/log"

	"ibnlp/search"
	"ibnlp/server/middleware"
	"ibnlp/server/nlp"

	"github.com/labstack/echo/v4"
)

var searchRoutes = []route{
	{
		"",
		http.MethodPost,
		authenticatedRoute(PostSearch),
	},
}

func getContent(result search.SearchResult) string {
	if result.Page == nil {
		return fmt.Sprintf(`Search File "%s": """%s"""`, result.File, result.Match)
	} else {
		return fmt.Sprintf(`Search File "%s", page "%d": """%s"""`, result.File, *result.Page, result.Match)
	}
}

func getMessagesUpToWordLimit(results []search.SearchResult, wordLimit int) (messages []nlp.ChatGPTMessage) {
	if wordLimit <= 0 {
		return messages
	}

	for _, result := range results {
		wordLimit -= len(result.Match)

		if wordLimit <= 0 {
			break
		}

		messages = append(messages, nlp.ChatGPTMessage{
			Role:    "system",
			Content: getContent(result),
		})
	}

	return messages
}

const IB_PROMPT string = `You are an assistant for the International Baccalaureate organisation.
				You will be given pages from IB files, and you must answer the user's query USING ONLY THE PAGES, or say 'I don't know' if you can't.
				If you can't answer, suggest different similar questions, don't answer questions that you don't have the information necessary.
				Cite page numbers when answering. Break up your answer to multiple paragraphs if it's too long.`

const STANDARD_PROMPT string = `You are an assistant who has access to files.
				You will be given pages from those files, and you must answer the user's query USING ONLY THE PAGES, or say 'I don't know' if you can't.
				If you can't answer, suggest different similar questions, don't answer questions that you don't have the information necessary.
				Cite page numbers when answering. Break up your answer to multiple paragraphs if it's too long.`

type Request struct {
	Query string `json:"query"`
	// SearchQuery is the query to be used for the search engine.
	// If it's empty we use Query instead.
	SearchQuery string `json:"searchQuery"`
	History     []struct {
		User      string `json:"user"`
		Assistant string `json:"assistant"`
	} `json:"history"`
}

func constructGPTRequest(request Request, results []search.SearchResult) (chatRequest nlp.ChatGPTRequest) {
	chatRequest.Messages = append(chatRequest.Messages, nlp.ChatGPTMessage{
		Role:    "system",
		Content: STANDARD_PROMPT,
	})

	if len(results) >= 2 {
		chatRequest.Messages = append(chatRequest.Messages, nlp.ChatGPTMessage{
			Role:    "system",
			Content: getContent(results[0]),
		})

		chatRequest.Messages = append(chatRequest.Messages, nlp.ChatGPTMessage{
			Role:    "system",
			Content: getContent(results[1]),
		})

		results = results[2:]
	}

	chatRequest.Messages = append(
		chatRequest.Messages,
		getMessagesUpToWordLimit(results, 1000-chatRequest.Words())...,
	)

	for _, history := range request.History {
		chatRequest.Messages = append(
			chatRequest.Messages,
			[]nlp.ChatGPTMessage{{
				Role:    "user",
				Content: history.User,
			}, {
				Role:    "assistant",
				Content: history.Assistant,
			}}...,
		)
	}

	query := request.Query
	if strings.TrimSpace(request.Query) == "" {
		query = request.SearchQuery
	}

	chatRequest.Messages = append(chatRequest.Messages, nlp.ChatGPTMessage{
		Role:    "user",
		Content: query,
	})

	return chatRequest
}

func doSearch(searcher search.Searcher, searchQuery string) (results []search.SearchResult, err error) {
	if strings.TrimSpace(searchQuery) == "" {
		return nil, errors.New("The search query was empty")
	}

	results, err = searcher.Search(searchQuery)
	if err != nil {
		log.Error().Err(err).Msg("error while searching")
		return nil, errors.New("An error occured while conducting your search, please try again later.")
	}

	return results, err
}

func writeResponse(writer io.Writer, responses <-chan nlp.ChatGPTResponse) string {
	flusher := writer.(http.Flusher)
	flusher.Flush()

	totalResponse := ""

	for response := range responses {
		stringResponse := response.Choices[0].Delta.Content
		totalResponse += stringResponse

		io.WriteString(writer, "data: "+stringResponse+"\n\n")
		flusher.Flush()
	}

	flusher.Flush()

	return totalResponse
}

func resultsToString(results []search.SearchResult) string {
	var sb strings.Builder

	for _, result := range results {
		sb.WriteString(result.Match)
	}

	return sb.String()
}

func PostSearch(c echo.Context) error {
	response := c.Response()

	var request Request
	if err := c.Bind(&request); err != nil {
		return c.String(http.StatusBadRequest, "An error occured while parsing your request, please contact your administrator.")
	}

	var results []search.SearchResult
	if request.SearchQuery != "" {
		searcher := c.Get("search").(search.Searcher)
		var err error
		results, err = doSearch(searcher, request.SearchQuery)
		if err != nil {
			return c.String(http.StatusInternalServerError, err.Error())
		}
	}

	chatRequest := constructGPTRequest(request, results)

	openAiProvider := nlp.ChatGPTProvider{}

	responses, err := openAiProvider.GetResponse(chatRequest)
	if err != nil {
		log.Error().Err(err).Msg("error while getting response from openai")
		return c.String(http.StatusInternalServerError, "An error occured while getting a response from OpenAI, please try again later.")
	}

	totalResponse := writeResponse(response.Writer, responses)

	session := middleware.GetSessionValues(c)
	log.Info().Str("query", request.Query).
		Str("user", session.UserID).
		Str("response", totalResponse).
		Str("results", resultsToString(results)).
		Msg("executed search")

	return c.NoContent(http.StatusOK)
}
