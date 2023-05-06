package controllers

import (
	"net/http"

	"ibnlp/server/middleware"
	"ibnlp/server/model"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

var meRoute = route{
	path: "/me",
	handlers: []handler{
		{http.MethodGet, authenticatedRoute(GetMe)},
	},
}

func GetMe(c echo.Context) error {
	session := middleware.GetSessionValues(c)
	db := c.Get("db").(*gorm.DB)

	var user model.User
	if result := db.First(&user, "id = ?", session.UserID); result.Error != nil {
		return c.String(http.StatusInternalServerError, "Error fetching user")
	}

	return c.JSON(http.StatusOK, user)
}
