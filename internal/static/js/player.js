class SpotifyWebPlayer extends HTMLElement {
    accesstoken
    static observedAttributes = ["accesstoken"];

    paused = true
    progressInputActive = false;
    mute = false
    lastVolume = 0

    //elements
    player
    progress
    volume
    volumeButton

    playIcon = this.createElementFromHTML('<svg data-encore-id="icon" role="img" aria-hidden="true" viewBox="0 0 16 16" width="70%"><path d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z"></path></svg>')
    pauseIcon = this.createElementFromHTML('<svg data-encore-id="icon" role="img" aria-hidden="true" viewBox="0 0 16 16" width="70%"><path d="M2.7 1a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7H2.7zm8 0a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-2.6z"></path></svg>')


    constructor() {
        super();
        // Create a shadow root
        this.attachShadow({ mode: 'open' });

        // Create the two inner buttons
        this.shadowRoot.innerHTML = `
            <style>
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
                    padding: 10px;
                    display: flex;
                }
          
                #title-image {
                    width: 70px;
                    height: 70px;
                    border-radius: 5%;
                }

                #title-info {
                    margin-left: 5px;
                    width: 100px;
                }

                #track-title {
                    font-size: 12px;
                    color: white;
                    font-weight: bold;
                }
          
                #artist {
                    font-size: 10px;
                    color: #b3b3b3;
                }
          
                #song-control {
                    margin-left: 10px;
                    margin-right: 10px;
                    flex-grow:1
                 } 

                #controls {
                    display: flex;
                    justify-content: center;
                    gap: 10px;
                    margin-bottom: 10px;
                } 

                #progress {
                    color: #b3b3b3;
                    display: flex;
                    justify-content: center;
                    font-size: 12px;
                    align-items: center;
                    gap: 3px;
                }

                .volume {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                #volume-button {
                    height: 30px;
                    width: 30px;
                    border: none;
                    border-radius: 50%;
                    background-color: #222326;
                    cursor: pointer;
                }

                #volume-input {
                    width: 100px;
                    align-items: center;
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
                    width: 30px;
                    height: 30px;
                    cursor: pointer;
                }               
                .control-button {
                    background-color: #222326;
                    border: none;
                    border-radius: 50%;
                    width: 30px;
                    height: 30px;
                    cursor: pointer;
                }        
            
            </style>
            <div id="spotify-container">
                <div >
                    <img id="title-image"></img>
                </div>
                <div id="title-info">
                    <div id="track-title">Song Title</div>
                    <div id="artist">Artist Name</div>
                </div>
                <div id="song-control">
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
                    <div id="progress">
                        <div id="current-time">0:00</div>
                        <input id="track-progress-input" type="range" min="0" max="100" value="0"></input>
                        <div id="max-time">0:00</div>
                    </div>
                    
                </div>
                <div class="volume">
                    <button id="volume-button">
                        <svg data-encore-id="icon" role="img" aria-hidden="true" viewBox="0 0 16 16" width="70%">
                            <path  fill="#b3b3b3" d="M9.741.85a.75.75 0 0 1 .375.65v13a.75.75 0 0 1-1.125.65l-6.925-4a3.642 3.642 0 0 1-1.33-4.967 3.639 3.639 0 0 1 1.33-1.332l6.925-4a.75.75 0 0 1 .75 0zm-6.924 5.3a2.139 2.139 0 0 0 0 3.7l5.8 3.35V2.8l-5.8 3.35zm8.683 6.087a4.502 4.502 0 0 0 0-8.474v1.65a2.999 2.999 0 0 1 0 5.175v1.649z"></path>
                        </svg>
                    </button>
                    <input id="volume-input" type="range" min="0" max="100" value="100">
                </div>
            </div>
        `;

        this.progress = this.shadowRoot.getElementById("track-progress-input");
        this.volume = this.shadowRoot.getElementById("volume-input");
        this.volumeButton = this.shadowRoot.getElementById("volume-button");

        //style input elements
        this.progress.addEventListener("input", function (event) {
            const progress = (event.target.value / this.max) * 100;
            this.style.background = `linear-gradient(to right, #1DB954 ${progress}%, #ccc ${progress}%)`;
        });
        this.volume.addEventListener('input', function (event) {
            const progress = (event.target.value / this.max) * 100;
            this.style.background = `linear-gradient(to right, #1DB954 ${progress}%, #ccc ${progress}%)`;
        });

        self = this;
        this.progress.addEventListener("click", (event) => {
            self.seekToPosition(parseInt(event.target.value));
        });

        this.volume.addEventListener('click', (event) => {
            self.setVolume(event.target.value / 100)
        });

        this.volumeButton.addEventListener('click', () => {
            if (this.mute) {
                this.volume.value = this.lastVolume;
                this.mute = false;
            } else {
                this.lastVolume = this.volume.value;
                this.volume.value = 0;
                this.mute = true;
            }
            this.volume.dispatchEvent(new Event("click"))
            this.volume.dispatchEvent(new Event("input"))
        });


        this.shadowRoot.getElementById("play-button").replaceChildren(this.playIcon);

        // Attach event listeners to the buttons
        this.shadowRoot.getElementById("back-button").addEventListener('click', () => this.handlePreviousTrack());
        this.shadowRoot.getElementById("play-button").addEventListener('click', () => this.handleTogglePlay());
        this.shadowRoot.getElementById("next-button").addEventListener('click', () => this.handleNextTrack());

        this.currentTimeLabel = this.shadowRoot.getElementById("current-time");
        this.maxTimeLabel = this.shadowRoot.getElementById("max-time");
        this.interval = setInterval(() => this.updateProgressBar(100), 100);


        this.progress.addEventListener('mousedown', () => {
            this.progressInputActive = true;
        });

        this.progress.addEventListener('mouseup', () => {
            this.progressInputActive = false;
        });
    }



    createElementFromHTML(htmlString) {
        var div = document.createElement('div');
        div.innerHTML = htmlString.trim();

        // Change this to div.childNodes to support multiple top-level nodes.
        return div.firstChild;
    }



    setVolume(volumeLevel) {
        console.log(volumeLevel)
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
        const currentValue = this.progress.value;
        this.currentTimeLabel.textContent = this.formatTime(Number(currentValue) + Number(progressInMs))
        if (!this.paused && !this.progressInputActive) {
            this.progress.value = Number(currentValue) + Number(progressInMs);
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

    changeImage(imageUrl) {
        const titleImage = this.shadowRoot.getElementById("title-image");
        titleImage.src = imageUrl;
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
                this.dispatchEvent(new CustomEvent("player-ready", { detail: device_id }));

                this.player.getVolume().then(volume => {
                    let volume_percentage = volume * 100;
                    this.volume.value = volume_percentage;
                    this.volume.dispatchEvent(new Event("input"))
                    this.volume.dispatchEvent(new Event("click"))
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
                this.changeImage(current_track.album.images[0].url)
                this.togglePlayContent(paused)
                this.updateTrackProgress(duration, position)
            });

        };
    }
}
window.customElements.define('spotify-web-player', SpotifyWebPlayer);
