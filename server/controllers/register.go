package controllers

import (
	"net/http"

	"ibnlp/server/model"

	"github.com/google/uuid"
	"github.com/rs/zerolog/log"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

var registerRoutes = []route{
	{
		"",
		http.MethodPost,
		postRegister,
	},
}

func postRegister(c echo.Context) error {
	db := c.Get("db").(*gorm.DB)

	var json struct {
		Username string `json:"username"`
		Password string `json:"password"`
		AuthCode string `json:"authCode"`
	}
	c.Bind(&json)

	if json.AuthCode != "semantic2023" {
		return c.String(http.StatusUnauthorized, "That access code is not valid")
	}

	exists := db.First(&model.User{}, "username = ?", json.Username).RowsAffected > 0
	if exists {
		return c.String(http.StatusConflict, "That username is already in use")
	}

	user := &model.User{
		ID:       uuid.New().String(),
		Username: json.Username,
		Password: json.Password,
	}

	db.Create(user)

	log.Info().
		Object("user", user).
		Msg("User registered")

	return c.String(http.StatusOK, "User created")
}
