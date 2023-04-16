package controllers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"github.com/labstack/echo/v4"
)

var oauthRoutes = []route{
	{
		"redirect",
		http.MethodPost,
		PostRedirect,
	},
}

type OAuthAccessResponse struct {
	AccessToken string `json:"access_token"`
}

func googleAuthUrl(clientId, redirectUri, scope, state string) string {
	if scope == "" {
		scope = "openid email"
	}
	return fmt.Sprintf("https://accounts.google.com/o/oauth2/v2/auth?client_id=%s&redirect_uri=%s&scope=%s&response_type=code&state=%s", clientId, redirectUri, scope, state)
}

func PostRedirect(c echo.Context) error {
	code := c.FormValue("code")

	clientId := os.Getenv("GOOGLE_CLIENT_ID")
	url := googleAuthUrl(clientId, "http://localhost:8080/oauth/redirect", "", code)

	httpClient := http.Client{}
	loginReq, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		fmt.Fprintf(os.Stdout, "could not create HTTP request: %v", err)
		return c.NoContent(http.StatusBadRequest)
	}

	loginReq.Header.Set("accept", "application/json")

	res, err := httpClient.Do(loginReq)
	if err != nil {
		fmt.Fprintf(os.Stdout, "could not send HTTP request: %v", err)
		return c.NoContent(http.StatusInternalServerError)
	}

	var t OAuthAccessResponse
	if err := json.NewDecoder(res.Body).Decode(&t); err != nil {
		fmt.Fprintf(os.Stdout, "could not parse JSON response: %v", err)
		return c.NoContent(http.StatusInternalServerError)
	}

	return c.Redirect(http.StatusFound, "/?token="+t.AccessToken)
}
