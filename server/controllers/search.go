package controllers

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/rs/zerolog/log"

	"ibnlp/search"
	"ibnlp/server/middleware"
	"ibnlp/server/nlp"

	"github.com/labstack/echo/v4"
)

var searchRoutes = route{
	path: "/search",
	handlers: []handler{
		{http.MethodPost, authenticatedRoute(PostSearch)},
	},
	children: []route{
		{
			path: "/ping",
			handlers: []handler{
				{http.MethodGet, authenticatedRoute(GetPing)},
			},
		},
	},
}

func GetPing(c echo.Context) error {
	pythonSearcher, err := search.NewPythonSearcher()
	if (err != nil) {
		return c.NoContent(http.StatusOK)
	}
	resp, err := http.Get(pythonSearcher.Url + "ping")
	if (err != nil) {
		return c.NoContent(http.StatusServiceUnavailable)
	}

	return c.NoContent(resp.StatusCode)
}

func getContent(result search.SearchResult) string {
	if result.Page == nil {
		return fmt.Sprintf(`Search File "%s": """%s"""`, result.File, result.Match)
	} else {
		return fmt.Sprintf(`Search File "%s", page "%d": """%s"""`, result.File, *result.Page, result.Match)
	}
}

func getMessagesUpToCharacterLimit(results []search.SearchResult, charLimit int) (messages []nlp.ChatGPTMessage) {
	if charLimit <= 0 {
		return messages
	}

	for _, result := range results {
		charLimit -= len(result.Match)

		if charLimit <= 0 {
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
				Cite the file name and page numbers when answering. Break up your answer to multiple paragraphs if it's too long.`

type searchRequest struct {
	Query       string `json:"query"`
	SearchQuery string `json:"searchQuery"`
	History     []struct {
		User      string `json:"user"`
		Assistant string `json:"assistant"`
	} `json:"history"`
}

func constructGPTSearchRequest(request searchRequest, results []search.SearchResult) (chatRequest nlp.ChatGPTRequest) {
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
		getMessagesUpToCharacterLimit(results, 1000-chatRequest.Characters())...,
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

func doSearch(searcher search.Searcher, searchQuery string) ([]search.SearchResult, string) {
	if strings.TrimSpace(searchQuery) == "" {
		return nil, "The search query was empty"
	}

	results, err := searcher.Search(searchQuery)
	if err != nil {
		log.Error().Err(err).Msg("error while searching")
		return nil, "An error occured while conducting your search, please try again later."
	}

	return results, ""
}

func PostSearch(c echo.Context) error {
	response := c.Response()

	var request searchRequest
	if err := c.Bind(&request); err != nil {
		return c.String(http.StatusBadRequest, "An error occured while parsing your request, please contact your administrator.")
	}

	var results []search.SearchResult
	if request.SearchQuery != "" {
		searcher := c.Get("search").(search.Searcher)

		var errorMessage string
		results, errorMessage = doSearch(searcher, request.SearchQuery)

		if results == nil {
			return c.String(http.StatusInternalServerError, errorMessage)
		}
	}

	chatRequest := constructGPTSearchRequest(request, results)

	openAiProvider := nlp.ChatGPTProvider{}

	responses, err := openAiProvider.GetResponse(chatRequest)
	if err != nil {
		log.Error().Err(err).Msg("error while getting response from openai")
		return c.String(http.StatusInternalServerError, "An error occured while getting a response from OpenAI, please try again later.")
	}

	totalResponse := nlp.StreamResponsesToWriter(response.Writer, responses)

	session := middleware.GetSessionValues(c)
	log.Info().
		Str("query", request.Query).
		Str("searchQuery", request.SearchQuery).
		Str("user", session.UserID).
		Str("response", totalResponse).
		Msg("executed search")

	return c.NoContent(http.StatusOK)
}
