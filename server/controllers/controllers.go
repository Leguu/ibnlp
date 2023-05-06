package controllers

import (
	"errors"
	"net/http"

	"ibnlp/server/middleware"
	"ibnlp/server/model"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type handler struct {
	method      string
	handlerFunc echo.HandlerFunc
}

type route struct {
	path     string
	handlers []handler
	children []route
}

var routes = route{
	children: []route{
		chatRoutes,
		oauthRoutes,
		logoutRoutes,
		searchRoutes,
		statsRoutes,
		meRoute,
		adminRoutes,
		feedbackRoutes,
	},
}

func (route route) registerRoute(group *echo.Group) {
	for _, handler := range route.handlers {
		group.Add(handler.method, route.path, handler.handlerFunc)
	}
	for _, child := range route.children {
		child.registerRoute(group.Group(route.path))
	}
}

func SetUpRoutes(group *echo.Group) {
	routes.registerRoute(group)
}

func authenticatedRoute(handler echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		sess := middleware.GetSessionValues(c)
		db := c.Get("db").(*gorm.DB)

		if sess.UserID == "" {
			return c.String(http.StatusUnauthorized, "Not logged in")
		}

		var user model.User
		if err := db.First(&user, "id = ?", sess.UserID).Error; errors.Is(err, gorm.ErrRecordNotFound) {
			return c.String(http.StatusUnauthorized, "Not logged in")
		}

		return handler(c)
	}
}

func adminRoute(handler echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		sess := middleware.GetSessionValues(c)
		db := c.Get("db").(*gorm.DB)

		if sess.UserID == "" {
			return c.String(http.StatusUnauthorized, "Not logged in")
		}

		var user model.User
		if err := db.First(&user, "id = ?", sess.UserID).Error; errors.Is(err, gorm.ErrRecordNotFound) {
			return c.String(http.StatusUnauthorized, "Not logged in")
		}

		if !user.IsAdmin {
			return c.String(http.StatusUnauthorized, "Not an admin")
		}

		return handler(c)
	}
}
