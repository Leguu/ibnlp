package controllers

import (
	"errors"
	"net/http"

	"ibnlp/server/middleware"
	"ibnlp/server/model"

	"github.com/labstack/echo/v4"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

var loginRoutes = route{
	path: "/login",
	handlers: []handler{
		{http.MethodPost, PostLogin},
		{http.MethodGet, authenticatedRoute(GetUser)},
	},
}

func PostLogin(c echo.Context) error {
	sess := middleware.GetSessionValues(c)
	db := c.Get("db").(*gorm.DB)

	if sess.UserID != "" {
		return c.String(http.StatusOK, "Already logged in")
	}

	var json struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	c.Bind(&json)

	var user model.User
	if err := db.First(&user, "username = ?", json.Username).Error; errors.Is(err, gorm.ErrRecordNotFound) {
		return c.String(http.StatusNotFound, "Username not found")
	}

	if user.Password != json.Password {
		return c.String(http.StatusUnauthorized, "Incorrect password")
	}

	sess.UserID = user.ID
	sess.Save(c)

	log.Info().
		Object("user", user).
		Msg("User logged in")

	return c.String(http.StatusOK, "Logged in")
}

func GetUser(c echo.Context) error {
	sess := middleware.GetSessionValues(c)

	return c.JSON(http.StatusOK, sess)
}
