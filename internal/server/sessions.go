package server

import (
	"fmt"
	"go-spordlfy/internal/models"
	"go-spordlfy/internal/view"
	"net/http"
	"time"

	"github.com/labstack/echo"
)

func (s *Server) noCacheMiddleWare(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		c.Response().Header().Add("Cache-Control", "no-cache")
		fmt.Println("no cache")
		fmt.Println(c)
		return next(c)
	}
}

func (s *Server) checkSessionMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		if c.Path() == "/callback" || c.Path() == "/login" {
			return next(c)
		}
		session, err := s.getUserSession(c)
		if err != nil {
			if c.Path() == "/" {
				return view.Login(buildSpotifyURL()).Render(c.Request().Context(), c.Response().Writer)
			}
			url := "http://localhost:4200/" // TODO: env variable
			c.Response().Header().Add("HX-Redirect", url+"login")
			return c.String(http.StatusOK, "Login required")
		}
		c.Set(sessionContext, session)
		return next(c)
	}
}

func (s *Server) getUserSession(c echo.Context) (*models.UserSession, error) {
	sessionCookie, err := c.Cookie("session_id")
	if err != nil {
		return nil, err
	}
	session, err := s.db.LoadSessionBySessionId(sessionCookie.Value)
	if err != nil {
		return nil, err
	}
	if session.ExpiryTime.Add(1 * time.Minute).Before(time.Now()) {
		fmt.Println("accesstoken expired")
		err := s.RefreshAccessToken(session)
		if err != nil {
			return nil, err
		}
		return session, nil
	}
	return session, nil
}
