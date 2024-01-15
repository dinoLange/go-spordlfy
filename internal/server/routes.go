package server

import (
	"database/sql"
	"go-spordlfy/internal/view"
	"net/http"
	"text/template"

	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
)

type Template struct {
	templates *template.Template
}

func (s *Server) RegisterRoutes() http.Handler {
	e := echo.New()
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	e.GET("/", s.MainHandler)
	e.GET("/callback", s.CallbackHandler)

	e.GET("/devices", s.DevicesHandler)

	return e
}

func (s *Server) DevicesHandler(c echo.Context) error {
	sessionCookie, err := c.Cookie("session_id")
	if err != nil {
		return view.Login(buildSpotifyURL()).Render(c.Request().Context(), c.Response().Writer)
	}
	userSession, err := s.db.LoadSessionBySessionId(sessionCookie.Value)
	if err == sql.ErrNoRows {
		return view.Login(buildSpotifyURL()).Render(c.Request().Context(), c.Response().Writer)
	}

	devices, err := Devices(userSession.AccessToken)
	if err != nil {
		http.Error(c.Response().Writer, err.Error(), http.StatusInternalServerError)
	}
	return view.Devices(*devices).Render(c.Request().Context(), c.Response().Writer)
}

func (s *Server) MainHandler(c echo.Context) error {
	sessionCookie, err := c.Cookie("session_id")
	if err != nil {
		return view.Login(buildSpotifyURL()).Render(c.Request().Context(), c.Response().Writer)
	}
	userSession, err := s.db.LoadSessionBySessionId(sessionCookie.Value)
	if err == sql.ErrNoRows {
		return view.Login(buildSpotifyURL()).Render(c.Request().Context(), c.Response().Writer)
	}

	return view.Main(userSession.Name).Render(c.Request().Context(), c.Response().Writer)
}
