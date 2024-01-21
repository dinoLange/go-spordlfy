package server

import (
	"encoding/json"
	"go-spordlfy/internal/models"
	"io"
	"net/http"
)

var client = &http.Client{}

func Devices(accessToken string) (*models.DeviceResponse, error) {
	req, err := http.NewRequest(http.MethodGet, "https://api.spotify.com/v1/me/player/devices", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Add("Authorization", "Bearer "+accessToken)

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	var deviceResponse models.DeviceResponse
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	json.Unmarshal(body, &deviceResponse)
	return &deviceResponse, nil
}

func Search(accessToken string, searchTerm string) (*models.SearchResponse, error) {
	req, err := http.NewRequest(http.MethodGet, "https://api.spotify.com/v1/search?q="+searchTerm+"&type=album,track", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Add("Authorization", "Bearer "+accessToken)

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}

	var searchResponse models.SearchResponse
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	json.Unmarshal(body, &searchResponse)
	return &searchResponse, nil
}
