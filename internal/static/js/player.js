class SpotifyWebPlayer extends HTMLElement {
    accesstoken
    static observedAttributes = ["accesstoken"];

    device_id = "";

    paused = true;
    progressInputActive = false;
    mute = false;
    lastVolume = 0;
    lastTrack = "";

    RepeatMode = {
        Off: "off",
        Track: "track",
        Context: "context",
    };

    shuffle_state = false;
    repeat_state = this.RepeatMode.Off;
    
    //elements
    player
    progress
    volume
    volumeButton

    playIcon = this.createElementFromHTML('<svg data-encore-id="icon" role="img" aria-hidden="true" viewBox="0 0 16 16" width="70%"><path d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z"></path></svg>');
    pauseIcon = this.createElementFromHTML('<svg data-encore-id="icon" role="img" aria-hidden="true" viewBox="0 0 16 16" width="70%"><path d="M2.7 1a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7H2.7zm8 0a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-2.6z"></path></svg>');

    repeatOffIcon = this.createElementFromHTML('<svg data-encore-id="icon" role="img" aria-hidden="true" viewBox="0 0 16 16" width="80%"><path if="repeat-path" fill="#b3b3b3" d="M0 4.75A3.75 3.75 0 0 1 3.75 1h8.5A3.75 3.75 0 0 1 16 4.75v5a3.75 3.75 0 0 1-3.75 3.75H9.81l1.018 1.018a.75.75 0 1 1-1.06 1.06L6.939 12.75l2.829-2.828a.75.75 0 1 1 1.06 1.06L9.811 12h2.439a2.25 2.25 0 0 0 2.25-2.25v-5a2.25 2.25 0 0 0-2.25-2.25h-8.5A2.25 2.25 0 0 0 1.5 4.75v5A2.25 2.25 0 0 0 3.75 12H5v1.5H3.75A3.75 3.75 0 0 1 0 9.75v-5z"></path></svg>')
    repeatTrackIcon = this.createElementFromHTML('<svg data-encore-id="icon" role="img" aria-hidden="true" viewBox="0 0 16 16" width="80%"><path fill="#1DB954" d="M0 4.75A3.75 3.75 0 0 1 3.75 1h.75v1.5h-.75A2.25 2.25 0 0 0 1.5 4.75v5A2.25 2.25 0 0 0 3.75 12H5v1.5H3.75A3.75 3.75 0 0 1 0 9.75v-5zM12.25 2.5h-.75V1h.75A3.75 3.75 0 0 1 16 4.75v5a3.75 3.75 0 0 1-3.75 3.75H9.81l1.018 1.018a.75.75 0 1 1-1.06 1.06L6.939 12.75l2.829-2.828a.75.75 0 1 1 1.06 1.06L9.811 12h2.439a2.25 2.25 0 0 0 2.25-2.25v-5a2.25 2.25 0 0 0-2.25-2.25z"></path><path fill="#1DB954" d="M9.12 8V1H7.787c-.128.72-.76 1.293-1.787 1.313V3.36h1.57V8h1.55z"></path></svg>')
    repeatContextIcon = this.createElementFromHTML('<svg data-encore-id="icon" role="img" aria-hidden="true" viewBox="0 0 16 16" width="80%"><path if="repeat-path" fill="#1DB954" d="M0 4.75A3.75 3.75 0 0 1 3.75 1h8.5A3.75 3.75 0 0 1 16 4.75v5a3.75 3.75 0 0 1-3.75 3.75H9.81l1.018 1.018a.75.75 0 1 1-1.06 1.06L6.939 12.75l2.829-2.828a.75.75 0 1 1 1.06 1.06L9.811 12h2.439a2.25 2.25 0 0 0 2.25-2.25v-5a2.25 2.25 0 0 0-2.25-2.25h-8.5A2.25 2.25 0 0 0 1.5 4.75v5A2.25 2.25 0 0 0 3.75 12H5v1.5H3.75A3.75 3.75 0 0 1 0 9.75v-5z"></path></svg>')

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
                    width: 200px;
                    overflow: hidden;
                    white-space: nowrap;
                    text-overflow: ellipsis;
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
                        <button class="control-button" id="shuffle-button">
                            <svg data-encore-id="icon" role="img" aria-hidden="true" viewBox="0 0 16 16" width="80%"> 
                                <path id="shuffle-path1" fill="#b3b3b3" d="M13.151.922a.75.75 0 1 0-1.06 1.06L13.109 3H11.16a3.75 3.75 0 0 0-2.873 1.34l-6.173 7.356A2.25 2.25 0 0 1 .39 12.5H0V14h.391a3.75 3.75 0 0 0 2.873-1.34l6.173-7.356a2.25 2.25 0 0 1 1.724-.804h1.947l-1.017 1.018a.75.75 0 0 0 1.06 1.06L15.98 3.75 13.15.922zM.391 3.5H0V2h.391c1.109 0 2.16.49 2.873 1.34L4.89 5.277l-.979 1.167-1.796-2.14A2.25 2.25 0 0 0 .39 3.5z"></path>
                                <path id="shuffle-path2" fill="#b3b3b3" d="m7.5 10.723.98-1.167.957 1.14a2.25 2.25 0 0 0 1.724.804h1.947l-1.017-1.018a.75.75 0 1 1 1.06-1.06l2.829 2.828-2.829 2.828a.75.75 0 1 1-1.06-1.06L13.109 13H11.16a3.75 3.75 0 0 1-2.873-1.34l-.787-.938z"></path>
                            </svg>
                        </button>
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
                        <button class="control-button" id="repeat-button">
                            <svg data-encore-id="icon" role="img" aria-hidden="true" viewBox="0 0 16 16" width="80%">
                                <path if="repeat-path" fill="#b3b3b3" d="M0 4.75A3.75 3.75 0 0 1 3.75 1h8.5A3.75 3.75 0 0 1 16 4.75v5a3.75 3.75 0 0 1-3.75 3.75H9.81l1.018 1.018a.75.75 0 1 1-1.06 1.06L6.939 12.75l2.829-2.828a.75.75 0 1 1 1.06 1.06L9.811 12h2.439a2.25 2.25 0 0 0 2.25-2.25v-5a2.25 2.25 0 0 0-2.25-2.25h-8.5A2.25 2.25 0 0 0 1.5 4.75v5A2.25 2.25 0 0 0 3.75 12H5v1.5H3.75A3.75 3.75 0 0 1 0 9.75v-5z"></path>
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
                            <path fill="#b3b3b3" d="M9.741.85a.75.75 0 0 1 .375.65v13a.75.75 0 0 1-1.125.65l-6.925-4a3.642 3.642 0 0 1-1.33-4.967 3.639 3.639 0 0 1 1.33-1.332l6.925-4a.75.75 0 0 1 .75 0zm-6.924 5.3a2.139 2.139 0 0 0 0 3.7l5.8 3.35V2.8l-5.8 3.35zm8.683 6.087a4.502 4.502 0 0 0 0-8.474v1.65a2.999 2.999 0 0 1 0 5.175v1.649z"></path>
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
        this.shadowRoot.getElementById("shuffle-button").addEventListener('click', () => this.handleShuffleToggle());
        this.shadowRoot.getElementById("repeat-button").addEventListener('click', () => this.handleRepeatToggle());



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

    handleShuffleToggle() {
        const new_shuffle_state = !this.shuffle_state
        this.callShuffleApi(new_shuffle_state);

        if (new_shuffle_state) {
            this.shadowRoot.getElementById("shuffle-path1").style.fill="#1DB954"
            this.shadowRoot.getElementById("shuffle-path2").style.fill="#1DB954"
        } else {
            this.shadowRoot.getElementById("shuffle-path1").style.fill="#b3b3b3"
            this.shadowRoot.getElementById("shuffle-path2").style.fill="#b3b3b3"
        }
        this.shuffle_state = new_shuffle_state;
    }

    callShuffleApi(new_shuffle_state) {
        fetch("https://api.spotify.com/v1/me/player/shuffle?state=" + new_shuffle_state, 
        {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + this.accesstoken
            }
        })
    }

    handleRepeatToggle() {
        const new_repeat_state = this.nextRepeatMode(this.repeat_state);
        this.callRepeatApi(new_repeat_state);
        this.repeat_state = new_repeat_state;
        if (this.repeat_state == this.RepeatMode.Off) {
            this.shadowRoot.getElementById("repeat-button").replaceChildren(this.repeatOffIcon);
            return;
        } 
        if (this.repeat_state == this.RepeatMode.Track) {
            this.shadowRoot.getElementById("repeat-button").replaceChildren(this.repeatTrackIcon);
            return;
        } 
        if (this.repeat_state == this.RepeatMode.Context) {
            this.shadowRoot.getElementById("repeat-button").replaceChildren(this.repeatContextIcon);
            return;
        } 
    }

    nextRepeatMode(repeat_state) {
        if (repeat_state === this.RepeatMode.Off) {
            return this.RepeatMode.Track;
        }
        if (repeat_state === this.RepeatMode.Track) {
            return this.RepeatMode.Context;
        }
        if (repeat_state === this.RepeatMode.Context) {
            return this.RepeatMode.Off;
        }
        
    }

    callRepeatApi(new_repeat_state) {
        fetch("https://api.spotify.com/v1/me/player/repeat?state=" + new_repeat_state, 
        {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + this.accesstoken
            }
        })
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
                this.device_id = device_id;
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
                if (current_track.uid != this.lastTrack) {
                    this.dispatchEvent(new Event("song-change"))
                }
                this.changeTrackLabels(current_track.name, current_track.artists[0].name);
                this.changeImage(current_track.album.images[0].url)
                this.togglePlayContent(paused)
                this.updateTrackProgress(duration, position)
                this.lastTrack = current_track.uid
            });

        };
    }
}

window.customElements.define('spotify-web-player', SpotifyWebPlayer);
