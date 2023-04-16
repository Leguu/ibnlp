package controllers

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"os"

	"ibnlp/server/middleware"
	"ibnlp/server/model"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"gorm.io/gorm"
)

var googleOauthRoutes = []route{
	{
		"/login",
		http.MethodGet,
		GoogleLogin,
	},
	{
		"/callback",
		http.MethodGet,
		GoogleCallback,
	},
}

func getGoogleOauthConfig() *oauth2.Config {
	var redirectURL string
	if os.Getenv("ENV") == "DEVELOPMENT" {
		redirectURL = "http://localhost:8080/api/oauth/google/callback"
	} else {
		redirectURL = "https://semanticinquiry.com/api/oauth/google/callback"
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

	var user model.User
	if err := db.First(&user, "username = ?", data.Email).Error; err != nil {
		if !sess.AccessCodeVerified {
			return c.String(http.StatusUnauthorized, "Access code not verified")
		}
		user = model.User{
			ID:       uuid.New().String(),
			Username: data.Email,
			Name:     data.Name,
		}
		if err := db.Create(&user).Error; err != nil {
			return c.String(http.StatusUnauthorized, "Error creating user")
		}
	} else {
		sess.AccessCodeVerified = true
		sess.Save(c)
	}

	sess.UserID = user.ID
	sess.Save(c)

	return c.Redirect(http.StatusTemporaryRedirect, "/portal")
}
