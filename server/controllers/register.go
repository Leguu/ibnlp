package controllers

import (
	"net/http"

	"ibnlp/server/middleware"
	"ibnlp/server/model"

	"github.com/google/uuid"
	"github.com/rs/zerolog/log"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

var registerRoutes = route{
	path: "/register",
	handlers: []handler{
		{http.MethodPost, postRegister},
	},
	children: []route{{
		path: "/access",
		handlers: []handler{
			{http.MethodPost, postAccess},
		},
	}},
}

func postAccess(c echo.Context) error {
	sess := middleware.GetSessionValues(c)

	if sess.AccessCodeVerified {
		return c.NoContent(http.StatusOK)
	}

	var json struct {
		AuthCode string `json:"auth_code"`
	}
	c.Bind(&json)

	if json.AuthCode == "semantic2023" {
		sess.AccessCodeVerified = true
		sess.Save(c)
		return c.NoContent(http.StatusOK)
	} else {
		return c.String(http.StatusUnauthorized, "That access code is not valid")
	}
}

func postRegister(c echo.Context) error {
	db := c.Get("db").(*gorm.DB)
	sess := middleware.GetSessionValues(c)

	if !sess.AccessCodeVerified {
		return c.String(http.StatusUnauthorized, "You must verify your access code first")
	}

	var json struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	c.Bind(&json)

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
