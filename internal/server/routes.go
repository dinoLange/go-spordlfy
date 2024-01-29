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

	// for dev use only
	e.Use(s.noCacheMiddleWare)
	e.Use(s.checkSessionMiddleware)

	e.Static("/static", "internal/static")

	e.GET("/callback", s.CallbackHandler)
	e.GET("/login", LoginHandler)

	e.GET("/", MainHandler)

	e.GET("/devices", s.DevicesHandler)
	e.POST("/selectdevice", s.SelectDeviceHandler)

	e.POST("/search", SearchHandler)
	e.GET("/play", PlayHandler)

	return e
}

func MainHandler(c echo.Context) error {
	session, ok := c.Get(sessionContext).(*models.UserSession)
	if !ok {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to get session information")
	}
	return view.Main(session.AccessToken).Render(c.Request().Context(), c.Response().Writer)
}

func (s *Server) DevicesHandler(c echo.Context) error {
	session, ok := c.Get(sessionContext).(*models.UserSession)
	if !ok {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to get session information")
	}

	devices, err := Devices(session.AccessToken)
	if err != nil {
		http.Error(c.Response().Writer, err.Error(), http.StatusInternalServerError)
	}
	if len(devices.Devices) > 0 {
		s.db.UpdateDevice(session.ID, devices.Devices[0].ID)
	}

	return view.Devices(*devices).Render(c.Request().Context(), c.Response().Writer)
}

func (s *Server) SelectDeviceHandler(c echo.Context) error {
	session, ok := c.Get(sessionContext).(*models.UserSession)
	if !ok {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to get session information")
	}
	deviceId := c.FormValue("device")
	if deviceId == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "No device id set")
	}
	s.db.UpdateDevice(session.ID, deviceId)
	return c.String(http.StatusNoContent, "set device "+deviceId)
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

func PlayHandler(c echo.Context) error {
	session, ok := c.Get(sessionContext).(*models.UserSession)
	if !ok {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to get session information")
	}

	uri := c.QueryParam("uri")
	err := Play(session, uri)
	if err != nil {
		http.Error(c.Response().Writer, err.Error(), http.StatusInternalServerError)
	}

	return c.String(http.StatusNoContent, "played "+uri)

}
