package server

import (
	"go-spordlfy/internal/models"
	"go-spordlfy/internal/view"
	"net/http"

	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
)

const sessionContext = "session"

func (s *Server) RegisterRoutes() http.Handler {
	e := echo.New()
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(s.checkSessionMiddleware)
	e.GET("/callback", s.CallbackHandler)
	e.GET("/login", LoginHandler)

	e.GET("/", MainHandler)
	e.GET("/devices", DevicesHandler)
	e.POST("/search", SearchHandler)

	return e
}

func LoginHandler(c echo.Context) error {
	return view.Login(buildSpotifyURL()).Render(c.Request().Context(), c.Response().Writer)
}

func MainHandler(c echo.Context) error {
	session, ok := c.Get(sessionContext).(*models.UserSession)
	if !ok {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to get session information")
	}
	return view.Main(session.AccessToken).Render(c.Request().Context(), c.Response().Writer)
}

func DevicesHandler(c echo.Context) error {
	session, ok := c.Get(sessionContext).(*models.UserSession)
	if !ok {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to get session information")
	}

	devices, err := Devices(session.AccessToken)
	if err != nil {
		http.Error(c.Response().Writer, err.Error(), http.StatusInternalServerError)
	}
	return view.Devices(*devices).Render(c.Request().Context(), c.Response().Writer)
}

func SearchHandler(c echo.Context) error {
	session, ok := c.Get(sessionContext).(*models.UserSession)
	if !ok {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to get session information")
	}

	searchTerm := c.FormValue("term")
	searchResponse, err := Search(session.AccessToken, searchTerm)
	if err != nil {
		http.Error(c.Response().Writer, err.Error(), http.StatusInternalServerError)
	}

	return view.SearchResultView(*searchResponse).Render(c.Request().Context(), c.Response().Writer)
}
