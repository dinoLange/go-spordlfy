package server

import (
	"context"
	"fmt"
	"go-spordlfy/internal/models"
	"log"
	"net/http"
	"time"
)

func LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("Request: %s %s", r.Method, r.URL)
		next.ServeHTTP(w, r)
	})
}

func (s *Server) SessionMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/callback" {
			next.ServeHTTP(w, r)
			return
		}
		session, err := s.loadUserSession(r)
		if err != nil {
			fmt.Println("no session found")
			next.ServeHTTP(w, r)
			return
		}
		ctx := context.WithValue(r.Context(), "session", session)
		r = r.WithContext(ctx)
		next.ServeHTTP(w, r)
	})
}

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
		err := s.RefreshAccessToken(session)
		if err != nil {
			return nil, err
		}
		return session, nil
	}
	return session, nil
}

func noCacheMiddleWare(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Cache-Control", "no-cache")
		next.ServeHTTP(w, r)
	})
}
