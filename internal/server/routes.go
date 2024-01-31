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

	e.GET("/", MainHandler)
	e.GET("/callback", s.CallbackHandler)
	e.GET("/login", LoginHandler)

	e.GET("/setDevice", s.DevicesHandler)

	e.POST("/search", SearchHandler)
	e.GET("/playlists", PlayListsHandler)

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
	deviceId := c.QueryParam("id")
	if len(deviceId) == 0 {
		http.Error(c.Response().Writer, "device id required", http.StatusBadRequest)
	}
	devices, err := Devices(session.AccessToken)
	if err != nil {
		http.Error(c.Response().Writer, err.Error(), http.StatusInternalServerError)
	}
	for _, device := range devices.Devices {
		if device.ID == deviceId {
			s.db.UpdateDevice(session.ID, device.ID)
			return c.String(http.StatusOK, "set device "+deviceId)
		}
	}
	return echo.NewHTTPError(http.StatusInternalServerError, "Device id not found")
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

	return view.SearchResult(*searchResponse).Render(c.Request().Context(), c.Response().Writer)
}

func PlayListsHandler(c echo.Context) error {
	session, ok := c.Get(sessionContext).(*models.UserSession)
	if !ok {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to get session information")
	}

	playLists, err := PlayLists(session.AccessToken)
	if err != nil {
		http.Error(c.Response().Writer, err.Error(), http.StatusInternalServerError)
	}

	return view.PlayLists(*playLists).Render(c.Request().Context(), c.Response().Writer)
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
