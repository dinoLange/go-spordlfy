package server

import (
	"database/sql"
	"fmt"
	"go-spordlfy/internal/models"
	"go-spordlfy/internal/view"
	"net/http"

	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
)

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
	userSession, err := s.getUserSession(c)
	if err != nil {
		if err == sql.ErrNoRows {
			return view.Login(buildSpotifyURL()).Render(c.Request().Context(), c.Response().Writer)
		}
		http.Error(c.Response().Writer, err.Error(), http.StatusInternalServerError)

	}
	devices, err := Devices(userSession.AccessToken)
	if err != nil {
		http.Error(c.Response().Writer, err.Error(), http.StatusInternalServerError)
	}
	return view.Devices(*devices).Render(c.Request().Context(), c.Response().Writer)
}

func (s *Server) MainHandler(c echo.Context) error {
	fmt.Println("hello from main")
	userSession, err := s.getUserSession(c)
	if err != nil {
		if err != nil {
			return view.Login(buildSpotifyURL()).Render(c.Request().Context(), c.Response().Writer)
		}

	}
	return view.Main(userSession.Name, userSession.AccessToken).Render(c.Request().Context(), c.Response().Writer)
}

func (s *Server) getUserSession(c echo.Context) (*models.UserSession, error) {
	sessionCookie, err := c.Cookie("session_id")

	if err != nil {
		return nil, err
	}
	return s.db.LoadSessionBySessionId(sessionCookie.Value)
}
