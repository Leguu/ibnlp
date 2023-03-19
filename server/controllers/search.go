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
}

func getContent(result search.SearchResult) string {
	if result.Page == nil {
		return fmt.Sprintf(`File "%s": """%s"""`, result.File, result.Match)
	} else {
		return fmt.Sprintf(`File "%s", page "%d": """%s"""`, result.File, *result.Page, result.Match)
	}
}

func PostSearch(c echo.Context) error {
	searcher := c.Get("search").(search.Searcher)

	var request SearchRequest
	if err := c.Bind(&request); err != nil {
		return c.JSON(500, err)
	}

	results, err := searcher.Search(request.Query)
	if err != nil {
		log.Error().Err(err).Msg("error while searching")
		return c.JSON(500, "An error occured while conducting your search, please try again later.")
	}

	if len(results) < 2 {
		log.Error().Msg("search results returned less than 2 results")
		return c.JSON(500, "An error occured while conducting your search, please try again later.")
	}

	openAiProvider := nlp.ChatGPTProvider{}

	chatRequest := nlp.ChatGPTRequest{
		Messages: []nlp.ChatGPTMessage{
			{
				Role: "user",
				Content: `You are an assistant for the International Baccalaureate organisation.
				You will be given pages from IB files, and you must answer the user's query USING ONLY THE PAGES, or say 'I don't know' if you can't.
				The pages may be incomplete or otherwise not useful, so you must do your best in interpreting them.
				If you can't answer, suggest different similar questions, don't answer questions that you don't have the information necessary.
				Cite page numbers when answering.`,
			},
			{
				Role:    "user",
				Content: getContent(results[0]),
			},
			{
				Role:    "user",
				Content: getContent(results[1]),
			},
			{
				Role:    "user",
				Content: `Users query: """` + request.Query + `"""`,
			},
		},
	}

	response, err := openAiProvider.GetResponse(chatRequest)
	if err != nil {
		log.Error().Err(err).Msg("error while getting response from openai")
		return c.JSON(500, "An error occured while getting a response from OpenAI, please try again later.")
	}

	stringResponse := response.Choices[0].Message.Content

	log.Info().Str("query", request.Query).
		Str("ip", c.RealIP()).
		Str("match1", results[0].Match).
		Str("match2", results[1].Match).
		Int("tokens", response.Usage.TotalTokens).
		Str("reponse", stringResponse).
		Msg("executed search")

	return c.JSON(200, map[string]string{
		"response": stringResponse,
	})
}
