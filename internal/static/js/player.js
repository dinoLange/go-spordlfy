class SpotifyWebPlayer extends HTMLElement {
    player
    accesstoken
    static observedAttributes = ["accesstoken"];

    constructor() {
        super();

         // Create a shadow root
        this.attachShadow({mode: 'open'});

        // Create the two inner buttons
        this.shadowRoot.innerHTML = `
            <style>
            /* Add some basic styling */
            :host {
                display: inline-block;
            }

            button {
                margin: 5px;
            }
            </style>
            <label id="trackLabel">Default Track</label>
            <div>
                <button id="btnBack">Back</button>
                <button id="btnTogglePlay">Play/Pause</button>
                <button id="btnNext">Next</button>
            </div>
        `;

        // Attach event listeners to the buttons
        this.shadowRoot.getElementById("btnBack").addEventListener('click', () => this.handlePreviousTrack());
        this.shadowRoot.getElementById("btnTogglePlay").addEventListener('click', () => this.handleTogglePlay());
        this.shadowRoot.getElementById("btnNext").addEventListener('click', () => this.handleNextTrack());

    }

    handlePreviousTrack() {
        this.player.previousTrack()
    }

    handleTogglePlay() {
        this.player.togglePlay()
    }

    handleNextTrack() {
        this.player.nextTrack()
    }



    attributeChangedCallback(name, oldValue, newValue) {
        // Called when one of the observed attributes changes
        if (name === "accesstoken") {
            this.accesstoken = this.getAttribute("accesstoken");
        }
    }

    changeTrackLabel(trackName) {
          const trackLabel = this.shadowRoot.getElementById("trackLabel");
          trackLabel.textContent = trackName;
    }

    connectedCallback() {
        window.onbeforeunload = () => {
            this.player.disconnect();
            return undefined;
        }
        window.onSpotifyWebPlaybackSDKReady = () => {
            const token = this.accesstoken
            this.player = new Spotify.Player({
                name: "Gotify",
                getOAuthToken: cb => { cb(token); },
                volume: 0.5
            });
            this.player.connect();
            this.player.addListener("ready", ({ device_id }) => {
                htmx.trigger("#devices", "spotify-sdk-finished");
            });  					
    
            this.player.addListener("not_ready", ({ device_id }) => {
                console.log("Device ID has gone offline", device_id);
            });
        
            this.player.addListener("initialization_error", ({ message }) => {
                console.error(message);
            });
        
            this.player.addListener("authentication_error", ({ message }) => {
                console.error(message);
            });
        
            this.player.addListener("account_error", ({ message }) => {
                console.error(message);
            });

            this.player.addListener('player_state_changed', ({
                position,
                duration,
                track_window: { current_track }
                }) => {
                    console.log('Currently Playing', current_track);
                    this.changeTrackLabel(current_track.name);
                    console.log('Position in Song', position);
                    console.log('Duration of Song', duration);
                });
    
              };
        }
}
window.customElements.define('spotify-web-player', SpotifyWebPlayer);
