package server

import (
	"encoding/json"
	"go-spordlfy/internal/data"
	"io"
	"net/http"
)

func Devices() (*data.DeviceResponse, error) {
	req, err := http.NewRequest(http.MethodGet, "https://api.spotify.com/v1/me/player/devices", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Add("Authorization", "Bearer "+Token.AccessToken)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	var deviceResponse data.DeviceResponse
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	json.Unmarshal(body, &deviceResponse)
	return &deviceResponse, nil
}
