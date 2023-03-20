package controllers

import (
	"fmt"
	"net/http"

	"github.com/rs/zerolog/log"

	"ibnlp/search"
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

type SearchRequest struct {
	Query string `json:"query"`
	// SearchQuery is the query to be used for the search engine.
	// If it's empty we use Query instead.
	SearchQuery string `json:"searchQuery"`
}

func getContent(result search.SearchResult) string {
	if result.Page == nil {
		return fmt.Sprintf(`File "%s": """%s"""`, result.File, result.Match)
	} else {
		return fmt.Sprintf(`File "%s", page "%d": """%s"""`, result.File, *result.Page, result.Match)
	}
}

func getMessagesUpToWordLimit(results []search.SearchResult, wordLimit int) (messages []nlp.ChatGPTMessage) {
	if wordLimit < 0 {
		return messages
	}

	for _, result := range results {
		wordLimit -= len(result.Match)

		if wordLimit < 0 {
			break
		}

		messages = append(messages, nlp.ChatGPTMessage{
			Role:    "user",
			Content: getContent(result),
		})
	}

	return messages
}

func PostSearch(c echo.Context) error {
	searcher := c.Get("search").(search.Searcher)

	var request SearchRequest
	if err := c.Bind(&request); err != nil {
		return c.JSON(500, err)
	}

	searchQuery := request.SearchQuery
	if searchQuery == "" {
		searchQuery = request.Query
	}

	if searchQuery == "" {
		return c.JSON(http.StatusBadRequest, "Query cannot be empty.")
	}

	results, err := searcher.Search(searchQuery)
	if err != nil {
		log.Error().Err(err).Msg("error while searching")
		return c.JSON(http.StatusInternalServerError, "An error occured while conducting your search, please try again later.")
	}

	if len(results) < 2 {
		log.Error().Msg("search results returned less than 2 results")
		return c.JSON(http.StatusInternalServerError, "An error occured while conducting your search, please try again later.")
	}

	openAiProvider := nlp.ChatGPTProvider{}

	gptQuery := request.Query

	chatRequest := nlp.ChatGPTRequest{
		Messages: []nlp.ChatGPTMessage{
			{
				Role: "user",
				Content: `You are an assistant for the International Baccalaureate organisation.
				You will be given pages from IB files, and you must answer the user's query USING ONLY THE PAGES, or say 'I don't know' if you can't.
				If you can't answer, suggest different similar questions, don't answer questions that you don't have the information necessary.
				Cite page numbers when answering. Break up your answer to multiple paragraphs if it's too long.`,
			},
			{
				Role:    "user",
				Content: getContent(results[0]),
			},
			{
				Role:    "user",
				Content: getContent(results[1]),
			},
		},
	}

	results = results[2:]

	chatRequest.Messages = append(
		chatRequest.Messages,
		getMessagesUpToWordLimit(results, 1000-chatRequest.Words())...,
	)

	chatRequest.Messages = append(chatRequest.Messages, nlp.ChatGPTMessage{
		Role:    "user",
		Content: `Users query: """` + gptQuery + `"""`,
	})

	response, err := openAiProvider.GetResponse(chatRequest)
	if err != nil {
		log.Error().Err(err).Msg("error while getting response from openai")
		return c.JSON(http.StatusInternalServerError, "An error occured while getting a response from OpenAI, please try again later.")
	}

	stringResponse := response.Choices[0].Message.Content

	log.Info().Str("query", request.Query).
		Str("ip", c.RealIP()).
		Int("tokens", response.Usage.TotalTokens).
		Str("reponse", stringResponse).
		Msg("executed search")

	return c.JSON(200, map[string]string{
		"response": stringResponse,
	})
}
