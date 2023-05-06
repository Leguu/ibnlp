package middleware

import (
	"github.com/labstack/echo-contrib/session"
	"github.com/labstack/echo/v4"
)

type SessionValues struct {
	UserID             string
	OauthState         string
	AccessCodeVerified bool
}

func GetSessionValues(c echo.Context) SessionValues {
	sess, err := session.Get("session", c)
	if err != nil {
		return SessionValues{}
	}
	if sess.Values["UserID"] == nil {
		sess.Values["UserID"] = ""
	}
	if sess.Values["OauthState"] == nil {
		sess.Values["OauthState"] = ""
	}
	return SessionValues{
		UserID:     sess.Values["UserID"].(string),
		OauthState: sess.Values["OauthState"].(string),
	}
}

func (values *SessionValues) Save(c echo.Context) error {
	sess, err := session.Get("session", c)
	if err != nil {
		return err
	}
	sess.Values["UserID"] = values.UserID
	sess.Values["OauthState"] = values.OauthState
	return sess.Save(c.Request(), c.Response())
}
