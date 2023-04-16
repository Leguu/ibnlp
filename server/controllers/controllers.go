package controllers

import (
	"errors"
	"net/http"

	"ibnlp/server/middleware"
	"ibnlp/server/model"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type route struct {
	string
	method string
	echo.HandlerFunc
}

func (route route) registerRoute(group *echo.Group) {
	group.Add(route.method, route.string, route.HandlerFunc)
}

func enableRoutes(group *echo.Group, routes []route) {
	for _, route := range routes {
		route.registerRoute(group)
	}
}

func SetUpRoutes(group *echo.Group) {
	enableRoutes(group.Group("/search"), searchRoutes)
	enableRoutes(group.Group("/login"), loginRoutes)
	enableRoutes(group.Group("/register"), registerRoutes)
	enableRoutes(group.Group("/chat"), chatRoutes)
	enableRoutes(group.Group("/oauth"), oauthRoutes)
}

func authenticatedRoute(handler echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		sess := middleware.GetSessionValues(c)
		db := c.Get("db").(*gorm.DB)

		var user model.User
		if err := db.First(&user, "id = ?", sess.UserID).Error; errors.Is(err, gorm.ErrRecordNotFound) {
			return c.String(http.StatusUnauthorized, "Not logged in")
		}

		return handler(c)
	}
}
