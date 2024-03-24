package server

import (
	"bytes"
	"encoding/json"
	"fmt"
	"go-spordlfy/internal/models"
	"io"
	"net/http"
	"strings"
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

func PlayLists(accessToken string) (*models.PlayLists, error) {
	req, err := http.NewRequest(http.MethodGet, "https://api.spotify.com/v1/me/playlists", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Add("Authorization", "Bearer "+accessToken)

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}

	var searchResponse models.PlayLists
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	json.Unmarshal(body, &searchResponse)
	return &searchResponse, nil
}

func getBody(uri string) map[string]interface{} {
	if strings.Contains(uri, "spotify:track:") {
		return map[string]interface{}{
			"context_uri": nil,
			"uris":        []string{uri},
			"position_ms": 0,
		}
	} else {
		return map[string]interface{}{
			"context_uri": uri,
			"uris":        nil,
			"position_ms": 0,
		}
	}

}

func Play(session *models.UserSession, uri string, offset string) error {
	data := getBody(uri)

	if len(offset) > 0 {
		data["offset"] = map[string]interface{}{
			"uri": offset,
		}
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

	resp, err := client.Do(req)
	fmt.Println(resp)
	if err != nil {
		return err
	}
	if resp.StatusCode != 202 {
		return fmt.Errorf("Play call got %d status code: %s", resp.StatusCode, resp.Body)
	}
	return nil
}

func Queue(accessToken string) (*models.Queue, error) {
	req, err := http.NewRequest(http.MethodGet, "https://api.spotify.com/v1/me/player/queue", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Add("Authorization", "Bearer "+accessToken)

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}

	var queueResponse models.Queue
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	json.Unmarshal(body, &queueResponse)
	return &queueResponse, nil

}
