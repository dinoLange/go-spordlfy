package server

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"go-spordlfy/internal/database"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo"
)

var clientId = os.Getenv("SPOTIFY_CLIENT_ID")
var clientSecret = os.Getenv("SPOTIFY_CLIENT_SECRET")

type TokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
	TokenType    string `json:"token_type"`
}

type Profile struct {
	DisplayName  string `json:"display_name"`
	ExternalUrls struct {
		Spotify string `json:"spotify"`
	} `json:"external_urls"`
	Href      string `json:"href"`
	ID        string `json:"id"`
	Images    []any  `json:"images"`
	Type      string `json:"type"`
	URI       string `json:"uri"`
	Followers struct {
		Href  any `json:"href"`
		Total int `json:"total"`
	} `json:"followers"`
	Country         string `json:"country"`
	Product         string `json:"product"`
	ExplicitContent struct {
		FilterEnabled bool `json:"filter_enabled"`
		FilterLocked  bool `json:"filter_locked"`
	} `json:"explicit_content"`
	Email string `json:"email"`
}

func buildSpotifyURL() string {
	return fmt.Sprintf(
		"https://accounts.spotify.com/authorize?client_id=%s&response_type=code&redirect_uri=%s&scope=%s",
		clientId,
		"http://localhost:4200/callback",
		"streaming user-read-private user-read-email user-read-playback-state",
	)
}

func (s *Server) CallbackHandler(c echo.Context) error {
	code := c.QueryParam("code")
	//state := c.QueryParam("state")
	data := setAuthTokenQueryParams(code, "http://localhost:4200/callback")
	req, err := http.NewRequest("POST", "https://accounts.spotify.com/api/token", strings.NewReader(data.Encode()))

	if err != nil {
		http.Error(c.Response().Writer, err.Error(), http.StatusInternalServerError)
	}

	if len(clientId) < 1 || len(clientSecret) < 1 {
		http.Error(c.Response().Writer, "ClientId or ClientSecret not provide in env", http.StatusInternalServerError)
	}
	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Add("Authorization", "Basic "+base64.StdEncoding.EncodeToString([]byte(clientId+":"+clientSecret)))

	client := &http.Client{}
	resp, err := client.Do(req)

	if err != nil {
		http.Error(c.Response().Writer, err.Error(), http.StatusInternalServerError)
	}

	defer func() {
		err := resp.Body.Close()
		if err != nil {
			fmt.Errorf(err.Error())
		}
	}()

	body, err := io.ReadAll(resp.Body)

	if err != nil {
		http.Error(c.Response().Writer, err.Error(), http.StatusInternalServerError)
	}

	if resp.StatusCode != 200 {
		http.Error(c.Response().Writer, fmt.Sprintf("spotify: got %d status code: %s", resp.StatusCode, body), http.StatusInternalServerError)

	}
	var token TokenResponse
	err = json.Unmarshal([]byte(string(body)), &token)

	if err != nil {
		http.Error(c.Response().Writer, err.Error(), http.StatusInternalServerError)
	}

	if err != nil {
		http.Error(c.Response().Writer, err.Error(), http.StatusInternalServerError)
	}

	userSession := database.UserSession{
		ID:           uuid.New().String(),
		Name:         "Not implemented",
		SessionID:    uuid.New().String(),
		AccessToken:  token.AccessToken,
		RefreshToken: token.RefreshToken,
		ExpiryTime:   time.Now().Add(time.Duration(token.ExpiresIn) * time.Second),
	}

	s.db.CreateUserSession(userSession)

	cookie := new(http.Cookie)
	cookie.Name = "session_id"
	cookie.Value = userSession.SessionID
	cookie.Expires = userSession.ExpiryTime
	c.SetCookie(cookie)

	return c.Redirect(http.StatusSeeOther, "/")
}

func setAuthTokenQueryParams(authCode string, redirectURI string) url.Values {
	data := url.Values{}

	data.Set("grant_type", "authorization_code")
	data.Set("code", authCode)
	data.Set("redirect_uri", redirectURI)
	return data
}
