package models

type DeviceResponse struct {
	Devices []struct {
		ID               string `json:"id"`
		IsActive         bool   `json:"is_active"`
		IsPrivateSession bool   `json:"is_private_session"`
		IsRestricted     bool   `json:"is_restricted"`
		Name             string `json:"name"`
		Type             string `json:"type"`
		VolumePercent    int    `json:"volume_percent"`
		SupportsVolume   bool   `json:"supports_volume"`
	} `json:"devices"`
}
