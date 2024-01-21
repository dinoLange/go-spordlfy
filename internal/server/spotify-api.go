package server

import (
	"bytes"
	"encoding/json"
	"fmt"
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

func Play(session *models.UserSession, uri string) error {

	data := map[string]interface{}{
		"context_uri": uri,
		"offset": map[string]interface{}{
			"position": 5,
		},
		"position_ms": 0,
	}
	jsonData, err := json.Marshal(data)
	if err != nil {
		fmt.Println("Error marshaling JSON:", err)
		return err
	}

	req, err := http.NewRequest(http.MethodPut, "https://api.spotify.com/v1/me/player/play?device_id="+session.CurrentDeviceId, bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}
	req.Header.Add("Authorization", "Bearer "+session.AccessToken)
	fmt.Println(req)

	resp, err := client.Do(req)
	fmt.Println(resp)
	if err != nil {
		return err
	}
	return nil
}
