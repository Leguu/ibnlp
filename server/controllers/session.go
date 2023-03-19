package controllers

import (
	"github.com/labstack/echo-contrib/session"
	"github.com/labstack/echo/v4"
)

type SessionValues struct {
	Authenticated bool `json:"authenticated"`
}

func GetSessionValues(c echo.Context) SessionValues {
	sess, err := session.Get("session", c)
	if err != nil {
		return SessionValues{}
	}
	if sess.Values["authenticated"] == nil {
		sess.Values["authenticated"] = false
	}
	return SessionValues{
		Authenticated: sess.Values["authenticated"].(bool),
	}
}

func (values *SessionValues) Save(c echo.Context) error {
	sess, err := session.Get("session", c)
	if err != nil {
		return err
	}
	sess.Values["authenticated"] = values.Authenticated
	return sess.Save(c.Request(), c.Response())
}
