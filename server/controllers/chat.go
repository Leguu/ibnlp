package controllers

import (
	"net/http"
	"strings"

	"github.com/rs/zerolog/log"
	"gorm.io/gorm"

	"ibnlp/server/middleware"
	"ibnlp/server/model"
	"ibnlp/server/nlp"

	"github.com/labstack/echo/v4"
)

var chatRoutes = route{
	path: "/chat",
	handlers: []handler{
		{http.MethodPost, authenticatedRoute(apiChat)},
	},
}

type ApiChatRequest struct {
	Query   string `json:"query"`
	History []struct {
		User      string `json:"user"`
		Assistant string `json:"assistant"`
	} `json:"history"`
}

func (request ApiChatRequest) constructGPTChatRequest() (result nlp.ChatGPTRequest) {
	for _, history := range request.History {
		result.Messages = append(
			result.Messages,
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
		query = request.Query
	}

	result.Messages = append(result.Messages, nlp.ChatGPTMessage{
		Role:    "user",
		Content: query,
	})

	return result
}

func apiChat(c echo.Context) error {
	response := c.Response()
	context := c.Request().Context()

	db := c.Get("db").(*gorm.DB)

	userId := middleware.GetSessionValues(c).UserID
	var user model.User
	result := db.Preload("ChatRequests").First(&user, "id = ?", userId)

	if result.Error != nil {
		return c.String(http.StatusUnauthorized, "You are not authorized to access this resource.")
	}

	var request ApiChatRequest
	if err := c.Bind(&request); err != nil {
		return c.String(http.StatusBadRequest, "An error occured while parsing your request, please contact your administrator.")
	}

	chatRequest := request.constructGPTChatRequest()

	openAiProvider := nlp.ChatGPTProvider{}

	responses, err := openAiProvider.GetResponse(chatRequest, context)
	if err != nil {
		log.Error().Err(err).Msg("error while getting response from openai")
		return c.String(http.StatusInternalServerError, "An error occured while getting a response from OpenAI, please try again later.")
	}

	totalResponse := nlp.StreamResponsesToWriter(response.Writer, responses)

	user.ChatRequests = append(user.ChatRequests, model.UserChatRequest{
		Request:  request.Query,
		Response: totalResponse,
	})

	db.Save(&user)

	return c.NoContent(http.StatusOK)
}
