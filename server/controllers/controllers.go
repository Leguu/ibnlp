package controllers

import (
	"net/http"

	"ibnlp/server/middleware"

	"github.com/labstack/echo/v4"
)

type route struct {
	string
	method string
	echo.HandlerFunc
}

func (route route) registerRoute(group *echo.Group) {
	group.Add(route.method, route.string, route.HandlerFunc)
}

func registerRoutes(group *echo.Group, routes []route) {
	for _, route := range routes {
		route.registerRoute(group)
	}
}

func SetUpRoutes(group *echo.Group) {
	registerRoutes(group.Group("/search"), searchRoutes)
	registerRoutes(group.Group("/login"), loginRoutes)
}

func authenticatedRoute(handler echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		sess := c.Get("session").(middleware.SessionValues)

		if !sess.Authenticated {
			return c.String(http.StatusUnauthorized, "Not logged in")
		}

		return handler(c)
	}
}
