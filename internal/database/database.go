package database

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/joho/godotenv/autoload"
	_ "github.com/mattn/go-sqlite3"
)

type Service interface {
	Health() map[string]string
	CreateUserSession(UserSession)
	LoadSessionBySessionId(string) (*UserSession, error)
}

type service struct {
	db *sql.DB
}

type UserSession struct {
	ID           string
	Name         string
	SessionID    string
	AccessToken  string
	RefreshToken string
	ExpiryTime   time.Time
}

var (
	dburl = os.Getenv("DB_URL")
)

func New() Service {
	db, err := sql.Open("sqlite3", dburl)
	if err != nil {
		// This will not be a connection error, but a DSN parse error or
		// another initialization error.
		log.Fatal(err)
	}
	// Create usersession table if not exists
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS usersession (
			id TEXT PRIMARY KEY,
			name TEXT,
			sessionid TEXT,
			accesstoken TEXT,
			refreshtoken TEXT,
			expirytime DATETIME
		)
	`)
	if err != nil {
		log.Fatal(err)
	}
	s := &service{db: db}
	return s
}

func (s *service) Health() map[string]string {
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()

	err := s.db.PingContext(ctx)
	if err != nil {
		log.Fatalf(fmt.Sprintf("db down: %v", err))
	}

	return map[string]string{
		"message": "It's healthy",
	}
}

func (s *service) CreateUserSession(userSession UserSession) {
	_, err := s.db.Exec("INSERT INTO usersession (id, name, sessionid, accesstoken, refreshtoken, expirytime) VALUES (?, ?, ?, ?, ?, ?)",
		userSession.ID, userSession.Name, userSession.SessionID, userSession.AccessToken, userSession.RefreshToken, userSession.ExpiryTime)
	if err != nil {
		log.Fatal(err)
	}
}

func (s *service) LoadSessionBySessionId(sessionId string) (*UserSession, error) {
	row := s.db.QueryRow("SELECT * FROM usersession WHERE sessionid = ?", sessionId)

	var userSession UserSession
	err := row.Scan(
		&userSession.ID,
		&userSession.Name,
		&userSession.SessionID,
		&userSession.AccessToken,
		&userSession.RefreshToken,
		&userSession.ExpiryTime,
	)
	if err == sql.ErrNoRows {
		return nil, err
	}
	if err != nil {
		log.Fatal(err)
	}
	return &userSession, nil
}
