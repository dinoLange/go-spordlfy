package server

import (
	"fmt"
	"go-spordlfy/internal/models"
	"net/http"
	"time"
)

func (s *Server) loadUserSession(r *http.Request) (*models.UserSession, error) {
	sessionCookie, err := r.Cookie("session_id")
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
