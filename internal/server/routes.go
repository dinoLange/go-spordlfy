package server

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"text/template"

	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
)

type Template struct {
	templates *template.Template
}

type TokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    uint   `json:"expires_in"`
	TokenType    string `json:"token_type"`
}

func (s *Server) RegisterRoutes() http.Handler {
	e := echo.New()
	e.Renderer = &Template{
		templates: template.Must(template.ParseGlob("internal/views/*.html")),
	}
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	e.GET("/", s.HelloWorldHandler)
	e.GET("/health", s.healthHandler)
	e.GET("/login", s.LoginHandler)
	e.GET("/callback", s.CallbackHandler)

	return e
}

func (t *Template) Render(w io.Writer, name string, data interface{}, c echo.Context) error {
	return t.templates.ExecuteTemplate(w, name, data)
}

func (s *Server) HelloWorldHandler(c echo.Context) error {
	resp := map[string]string{
		"message": "Hello World",
	}
	return c.JSON(http.StatusOK, resp)
}

var Token TokenResponse

func (s *Server) CallbackHandler(c echo.Context) error {
	code := c.QueryParam("code")
	//state := c.QueryParam("state")
	data := setAuthTokenQueryParams(code, "http://localhost:4200/callback")
	req, err := http.NewRequest("POST", "https://accounts.spotify.com/api/token", strings.NewReader(data.Encode()))

	if err != nil {
		http.Error(c.Response().Writer, err.Error(), http.StatusInternalServerError)
	}

	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Add("Authorization", "Basic "+base64.StdEncoding.EncodeToString([]byte("1ec6cb1a181e47368d762606d2851929"+":"+"20629895a02c4d1cbb28cbf480e55055")))

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

	err = json.Unmarshal([]byte(string(body)), &Token)

	if err != nil {
		http.Error(c.Response().Writer, err.Error(), http.StatusInternalServerError)
	}
	pageVariables := PageVariables{
		AuthUrl: buildSpotifyURL(),
	}

	return c.Render(http.StatusOK, "login.html", pageVariables)
}

func setAuthTokenQueryParams(authCode string, redirectURI string) url.Values {
	data := url.Values{}
	data.Set("grant_type", "authorization_code")
	data.Set("code", authCode)
	data.Set("redirect_uri", redirectURI)
	return data
}

type PageVariables struct {
	AuthUrl string
}

func (s *Server) LoginHandler(c echo.Context) error {
	pageVariables := PageVariables{
		AuthUrl: buildSpotifyURL(),
	}
	return c.Render(http.StatusOK, "login.html", pageVariables)
}

func buildSpotifyURL() string {
	return fmt.Sprintf(
		"https://accounts.spotify.com/authorize?client_id=%s&response_type=code&redirect_uri=%s&scope=%s",
		"1ec6cb1a181e47368d762606d2851929",
		"http://localhost:4200/callback",
		"streaming user-read-private user-read-email user-read-playback-state",
	)
}

func (s *Server) healthHandler(c echo.Context) error {
	return c.JSON(http.StatusOK, s.db.Health())
}
