package controllers

import (
	"net/http"

	"ibnlp/server/middleware"

	"github.com/labstack/echo/v4"
)

var logoutRoutes = route{
	path: "/logout",
	handlers: []handler{
		{http.MethodGet, GetLogout},
	},
}

func GetLogout(c echo.Context) error {
	sess := middleware.GetSessionValues(c)
	sess.UserID = ""
	sess.Save(c)

	return c.Redirect(http.StatusTemporaryRedirect, "/")
}
