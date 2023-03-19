package controllers

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/rs/zerolog/log"
)

var loginRoutes = []route{
	{
		"",
		http.MethodPost,
		PostLogin,
	},
	{
		"",
		http.MethodGet,
		authenticatedRoute(GetUser),
	},
}

func PostLogin(c echo.Context) error {
	sess := GetSessionValues(c)

	if sess.Authenticated {
		return c.JSON(http.StatusOK, "Already logged in")
	}

	var json struct {
		Password string `json:"password"`
	}
	c.Bind(&json)

	if json.Password != "aba2023" {
		return c.JSON(http.StatusUnauthorized, "Incorrect password")
	}

	sess.Authenticated = true
	sess.Save(c)

	log.Info().
		Str("ip", c.RealIP()).
		Msg("User logged in")

	return c.JSON(http.StatusOK, "Logged in")
}

func GetUser(c echo.Context) error {
	sess := GetSessionValues(c)

	return c.JSON(http.StatusOK, sess)
}
