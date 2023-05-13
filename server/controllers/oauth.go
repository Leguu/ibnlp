package controllers

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"

	"ibnlp/server/middleware"
	"ibnlp/server/model"

	"github.com/labstack/echo/v4"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"gorm.io/gorm"
)

var oauthRoutes = route{
	path: "/oauth",
	children: []route{{
		path: "/google",
		children: []route{
			{
				path:     "/login",
				handlers: []handler{{http.MethodGet, GoogleLogin}},
			},
			{
				path:     "/callback",
				handlers: []handler{{http.MethodGet, GoogleCallback}},
			},
		},
	}},
}

func getGoogleOauthConfig() *oauth2.Config {
	var redirectURL string
	if os.Getenv("ENV") == "DEVELOPMENT" {
		redirectURL = "http://localhost:8080/api/oauth/google/callback"
	} else {
		redirectURL = os.Getenv("GOOGLE_REDIRECT_URI")
	}
	return &oauth2.Config{
		ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		RedirectURL:  redirectURL,
		Scopes: []string{
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
		},
		Endpoint: google.Endpoint,
	}
}

func generateStateOauthCookie() string {
	b := make([]byte, 16)
	rand.Read(b)
	state := base64.URLEncoding.EncodeToString(b)

	return state
}

func GoogleLogin(c echo.Context) error {
	sess := middleware.GetSessionValues(c)
	sess.OauthState = generateStateOauthCookie()
	sess.Save(c)

	log.Println("Attempted GoogleLogin")

	googleOauthConfig := getGoogleOauthConfig()

	authCodeUrl := googleOauthConfig.AuthCodeURL(sess.OauthState)
	return c.Redirect(http.StatusTemporaryRedirect, authCodeUrl)
}

type GoogleUser struct {
	Email         string `json:"email"`
	FamilyName    string `json:"family_name"`
	GivenName     string `json:"given_name"`
	ID            string `json:"id"`
	Locale        string `json:"locale"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
	VerifiedEmail bool   `json:"verified_email"`
}

func GoogleCallback(c echo.Context) error {
	code := c.FormValue("code")

	sess := middleware.GetSessionValues(c)

	if c.FormValue("state") != sess.OauthState {
		return c.String(http.StatusUnauthorized, "Invalid state")
	}

	googleOauthConfig := getGoogleOauthConfig()

	token, err := googleOauthConfig.Exchange(c.Request().Context(), code)
	if err != nil {
		return c.String(http.StatusUnauthorized, "Could not get token")
	}
	client := googleOauthConfig.Client(c.Request().Context(), token)

	userInfo, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		return c.String(http.StatusUnauthorized, "Could not get user info")
	}

	var data GoogleUser
	decoder := json.NewDecoder(userInfo.Body)
	decoder.Decode(&data)

	if data.Email == "" || data.Name == "" {
		return c.String(http.StatusUnauthorized, "Could not get user info")
	}

	db := c.Get("db").(*gorm.DB)

	lowerEmail := strings.ToLower(data.Email)

	var user model.User
	if err := db.First(&user, "Email = ?", lowerEmail).Error; err != nil {
		return c.String(http.StatusUnauthorized, "You're not invited to use this app. Email used: "+data.Email)
	}

	if user.InvitationPending {
		user.Name = data.Name
		user.InvitationPending = false
	}

	db.Save(&user)

	sess.UserID = user.ID
	sess.Save(c)

	return c.Redirect(http.StatusTemporaryRedirect, "/portal")
}
