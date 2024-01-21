package models

import "time"

type UserSession struct {
	ID              string
	Name            string
	SessionID       string
	AccessToken     string
	RefreshToken    string
	ExpiryTime      time.Time
	CurrentDeviceId string
}
