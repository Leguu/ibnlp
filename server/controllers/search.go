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

func PostSearch(c echo.Context) error {
	searcher := c.Get("search").(search.Searcher)

	var request SearchRequest
	if err := c.Bind(&request); err != nil {
		return c.JSON(500, err)
	}

	results, err := searcher.Search(request.Query)
	if err != nil {
		return c.JSON(500, err)
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
				Content: fmt.Sprintf(`File "%s", page "%d": """%s"""`, results[0].File, results[0].Page, results[0].Match),
			},
			{
				Role:    "user",
				Content: fmt.Sprintf(`File "%s", page "%d": """%s"""`, results[0].File, results[0].Page, results[0].Match),
			},
			{
				Role:    "user",
				Content: `Users query: """` + request.Query + `"""`,
			},
		},
	}

	response, err := openAiProvider.GetResponse(chatRequest)
	if err != nil {
		log.Error().Err(err)
		return c.JSON(500, "An error occured while conducting your search, please try again later~")
	}

	log.Info().Str("query", request.Query).
		Str("ip", c.RealIP()).
		Str("match1", results[0].Match).
		Str("match2", results[1].Match).
		Str("reponse", response).
		Msg("executed search")

	return c.JSON(200, map[string]string{
		"response": response,
	})
}
