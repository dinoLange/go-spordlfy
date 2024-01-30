class SpotifyWebPlayer extends HTMLElement {
    player
    paused = true
    progress
    volume
    accesstoken
    static observedAttributes = ["accesstoken"];

    playIcon = this.createElementFromHTML('<svg data-encore-id="icon" role="img" aria-hidden="true" viewBox="0 0 16 16" width="70%"><path d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z"></path></svg>')
    pauseIcon = this.createElementFromHTML('<svg data-encore-id="icon" role="img" aria-hidden="true" viewBox="0 0 16 16" width="70%"><path d="M2.7 1a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7H2.7zm8 0a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-2.6z"></path></svg>')


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
                    -webkit-appearance: none;
                    width: 80%;
                    height: 7px;
                    background: #535353;
                    outline: none;
                    opacity: 0.7;
                    -webkit-transition: .2s;
                    transition: opacity .2s;
                    border-radius: 15px;
                }
        
                input[type="range"]:hover {
                    opacity: 1; 
                    cursor: pointer;
                }                  
                
                input[type="range"]:hover::-webkit-slider-thumb{
                    height: 12px;
                    width: 12px;
                    border-radius: 50%;
                }
        
                input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    background: #FFFFFF;
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
                    margin-bottom: 10px;
                }
          
                #controls {
                    display: flex;
                    justify-content: center;
                    gap: 20px;
                    margin-top: 10px;
                } 

                #progress {
                    display: flex;
                    justify-content: space-between;
                    font-size: 12px;
                    align-items: center;
                    gap: 3px;
                }

                #volume-input {
                    margin-top: 10px;
                }

                #volume-input::-webkit-slider-thumb{
                    height: 12px;
                    width: 12px;
                    border-radius: 50%;
                }
          
                .play-button {
                    background-color: #ffffff;
                    border: none;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    cursor: pointer;
                }               
                .control-button {
                    background-color: #222326;
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
                <div id="progress">
                    <div id="current-time">0:00</div>
                    <input id="track-progress-input" type="range" min="0" max="100" value="0"></input>
                    <div id="max-time">0:00</div>
                </div>
                <div id="controls">
                    <button class="control-button" id="back-button">
                        <svg data-encore-id="icon" role="img" aria-hidden="true" viewBox="0 0 16 16" width="70%">
                            <path fill="#b3b3b3" d="M3.3 1a.7.7 0 0 1 .7.7v5.15l9.95-5.744a.7.7 0 0 1 1.05.606v12.575a.7.7 0 0 1-1.05.607L4 9.149V14.3a.7.7 0 0 1-.7.7H1.7a.7.7 0 0 1-.7-.7V1.7a.7.7 0 0 1 .7-.7h1.6z"></path>
                        </svg>
                    </button>
                    <button class="play-button" id="play-button"></button>
                    <button class="control-button" id="next-button">         
                        <svg data-encore-id="icon" role="img" aria-hidden="true" viewBox="0 0 16 16" width="70%">
                            <path fill="#b3b3b3" d="M12.7 1a.7.7 0 0 0-.7.7v5.15L2.05 1.107A.7.7 0 0 0 1 1.712v12.575a.7.7 0 0 0 1.05.607L12 9.149V14.3a.7.7 0 0 0 .7.7h1.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-1.6z"></path>
                        </svg>
                    </button>
                </div>

                <input id="volume-input" type="range" id="volumeControl" min="0" max="100" value="100">

            </div>
        `;

        this.progress = this.shadowRoot.getElementById("track-progress-input");
        this.volume = this.shadowRoot.getElementById("volume-input");

        //style input elements
        this.progress.addEventListener("input", function(event) {
            const progress = (event.target.value / this.max) * 100;
            this.style.background = `linear-gradient(to right, #1DB954 ${progress}%, #ccc ${progress}%)`;
        });
        this.volume.addEventListener('input',  function(event) {
            const progress = (event.target.value / this.max) * 100;
            this.style.background = `linear-gradient(to right, #1DB954 ${progress}%, #ccc ${progress}%)`;
        });     

        self = this;
        this.progress.addEventListener("click", (event) => {
            self.seekToPosition(parseInt(event.target.value));
        });   
        this.volume.addEventListener('click',  (event) => {
            self.setVolume(event.target.value / 100)
        });


        this.shadowRoot.getElementById("play-button").replaceChildren(this.playIcon);

        // Attach event listeners to the buttons
        this.shadowRoot.getElementById("back-button").addEventListener('click', () => this.handlePreviousTrack());
        this.shadowRoot.getElementById("play-button").addEventListener('click', () => this.handleTogglePlay());
        this.shadowRoot.getElementById("next-button").addEventListener('click', () => this.handleNextTrack());

        this.currentTimeLabel = this.shadowRoot.getElementById("current-time");
        this.maxTimeLabel = this.shadowRoot.getElementById("max-time");
        this.interval = setInterval(() => this.updateProgressBar(100), 100);
    }



    createElementFromHTML(htmlString) {
        var div = document.createElement('div');
        div.innerHTML = htmlString.trim();

        // Change this to div.childNodes to support multiple top-level nodes.
        return div.firstChild;
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
            this.progress.value = Number(currentValue) + Number(progressInMs);
            this.currentTimeLabel.textContent = this.formatTime(Number(currentValue) + Number(progressInMs))
            this.progress.dispatchEvent(new Event("input"))
        }
    }

    updateTrackProgress(duration, position) {
        this.progress.value = position
        this.progress.max = duration
        this.currentTimeLabel.textContent = this.formatTime(position)
        this.maxTimeLabel.textContent = this.formatTime(duration)
        this.progress.dispatchEvent(new Event("input"))
    }

    formatTime(milliseconds) {
        // Calculate minutes and seconds
        const minutes = Math.floor(milliseconds / 60000);
        const seconds = Math.floor((milliseconds % 60000) / 1000);

        // Pad single-digit seconds with a leading zero
        const formattedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;

        return `${minutes}:${formattedSeconds}`;
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
            playButton.replaceChildren(this.playIcon)
        } else {
            playButton.replaceChildren(this.pauseIcon)
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
            this.progress.dispatchEvent(new Event("input"));
            this.volume.dispatchEvent(new Event("input"));
            this.player.addListener("ready", ({ device_id }) => {
                // autoselect this device?
                htmx.trigger("#devices", "spotify-sdk-finished");
                this.player.getVolume().then(volume => {
                    let volume_percentage = volume * 100;
                    this.volume.value = volume_percentage;
                    this.volume.dispatchEvent(new Event("input"))
                  });
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
                this.changeTrackLabels(current_track.name, current_track.artists[0].name);
                this.togglePlayContent(paused)
                this.updateTrackProgress(duration, position)
            });

        };
    }
}
window.customElements.define('spotify-web-player', SpotifyWebPlayer);
