class SpotifyWebPlayer extends HTMLElement {
    player
    paused
    progress
    accesstoken
    static observedAttributes = ["accesstoken"];

    constructor() {
        super();

        // Create a shadow root
        this.attachShadow({ mode: 'open' });

        // Create the two inner buttons
        this.shadowRoot.innerHTML = `
            <style>
                body {
                    font-family: 'Arial', sans-serif;
                    background-color: #121212;
                    color: #ffffff;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                input[type="range"] {
                    margin-top: 10px;
                    overflow: hidden;
                    -webkit-appearance: none;
                    width: 80%;
                    height: 6px;
                    background: #535353;
                    outline: none;
                    opacity: 0.7;
                    -webkit-transition: .2s;
                    transition: opacity .2s;
                }
        
                input[type="range"]:hover {
                    opacity: 1;
                }

                
        
                input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 16px;
                    height: 16px;
                    background: #1DB954;
                    cursor: pointer;
                    box-shadow: -80px 0 0 80px #1DB954;

                }
        
                input[type="range"]::-moz-range-thumb {
                    width: 16px;
                    height: 16px;
                    background: #1DB954;
                    cursor: pointer;
                }
        
                input[type="range"]::-webkit-slider-thumb:hover {
                    background: #1DB954;
                }
        
                input[type="range"]::-moz-range-thumb:hover {
                    background: #1DB954;
                }
        

                progress {
                    width: 100%;
                    height: 10px;
                    margin-top: 20px;
                    appearance: none;
                    background-color: #535353;
                    border-radius: 5px;
                    cursor: pointer;
                }
        
                progress::-webkit-progress-bar {
                    background-color: #535353;
                    border-radius: 5px;
                }
            
                progress::-webkit-progress-value {
                    background-color: #1DB954;
                    border-radius: 5px;
                }
          
                #spotify-container {
                    background-color: #222326;
                    border-radius: 10px;
                    padding: 20px;
                    width: 200px;
                    text-align: center;
                }
          
                #track-title {
                    font-size: 18px;
                    font-weight: bold;
                    margin-bottom: 10px;
                }
          
                #artist {
                    font-size: 14px;
                    color: #b3b3b3;
                    margin-bottom: 20px;
                }
          
                #controls {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 20px;
                }
          
                .control-button {
                    background-color: #1DB954;
                    color: #ffffff;
                    border: none;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    cursor: pointer;
                }        
            
            </style>
            <div id="spotify-container">
                <div id="track-title">Song Title</div>
                <div id="artist">Artist Name</div>
                <progress id="track-progress" value="100" max="100"></progress>
                <div id="controls">
                    <button class="control-button" id="back-button">&lt;</button>
                    <button class="control-button" id="play-button">▶</button>
                    <button class="control-button" id="next-button">&gt;</button>
                </div>

                <input id="volume-input" type="range" id="volumeControl" min="0" max="100" value="50">

            </div>
        `;

        // Attach event listeners to the buttons
        this.shadowRoot.getElementById("back-button").addEventListener('click', () => this.handlePreviousTrack());
        this.shadowRoot.getElementById("play-button").addEventListener('click', () => this.handleTogglePlay());
        this.shadowRoot.getElementById("next-button").addEventListener('click', () => this.handleNextTrack());



        this.progress = this.shadowRoot.getElementById("track-progress");
        this.interval = setInterval(() => this.updateProgressBar(100), 100);

        var self = this
        this.shadowRoot.getElementById('track-progress').addEventListener('click', function (e) {
            var x = e.pageX - this.offsetLeft; // or e.offsetX (less support, though)
            var clickedValue = x * this.max / this.offsetWidth;
            console.log(clickedValue)
            self.seekToPosition(parseInt(clickedValue));
        });
        this.shadowRoot.getElementById("volume-input").addEventListener('click', function (e) {
            self.setVolume(this.value/100)
        });


    }


    setVolume(volumeLevel) {
        this.player.setVolume(volumeLevel).then(() => console.log('Volume updated!'));
    }

    seekToPosition(positionInMs) {
        this.player.seek(positionInMs).then(() => {
            console.log('Changed position!');
        });
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

    updateProgressBar(progressInMs) {
        if (!this.paused) {
            const currentValue = this.progress.value;
            this.progress.value = currentValue + progressInMs;
        }
    }

    updateTrackProgress(duration, position) {
        this.progress.value = position
        this.progress.max = duration
    }


    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "accesstoken") {
            this.accesstoken = this.getAttribute("accesstoken");
        }
    }

    changeTrackLabels(trackName, artistname) {
        const trackLabel = this.shadowRoot.getElementById("track-title");
        trackLabel.textContent = trackName;
        const artistLabel = this.shadowRoot.getElementById("artist");
        artistLabel.textContent = artistname;
    }

    togglePlayContent(paused) {
        this.paused = paused
        const playButton = this.shadowRoot.getElementById("play-button");
        // unexpected but correct
        if (paused) {
            playButton.textContent = '▶'
        } else {
            playButton.textContent = '||'
        }
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
                paused,
                position,
                duration,
                track_window: { current_track }
            }) => {
                console.log("change");
                this.changeTrackLabels(current_track.name, current_track.artists[0].name);
                this.togglePlayContent(paused)
                this.updateTrackProgress(duration, position)
            });

        };
    }
}
window.customElements.define('spotify-web-player', SpotifyWebPlayer);
