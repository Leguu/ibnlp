package middleware

import (
	"github.com/labstack/echo-contrib/session"
	"github.com/labstack/echo/v4"
)

type SessionValues struct {
	UserID string
}

func GetSessionValues(c echo.Context) SessionValues {
	sess, err := session.Get("session", c)
	if err != nil {
		return SessionValues{}
	}
	if sess.Values["UserID"] == nil {
		sess.Values["UserID"] = ""
	}
	return SessionValues{
		UserID: sess.Values["UserID"].(string),
	}
}

func (values *SessionValues) Save(c echo.Context) error {
	sess, err := session.Get("session", c)
	if err != nil {
		return err
	}
	sess.Values["UserID"] = values.UserID
	return sess.Save(c.Request(), c.Response())
}
