package server

import (
	"go-spordlfy/internal/models"
	"go-spordlfy/internal/view"
	"net/http"
)

const sessionContext = "session"

type Middleware func(http.Handler) http.Handler

// App struct to hold our routes and middleware
type App struct {
	mux         *http.ServeMux
	middlewares []Middleware
}

// Use adds middleware to the chain
func (a *App) Use(mw Middleware) {
	a.middlewares = append(a.middlewares, mw)
}

// NewApp creates and returns a new App with an initialized ServeMux and middleware slice
func NewApp() *App {
	return &App{
		mux:         http.NewServeMux(),
		middlewares: []Middleware{},
	}
}

// Handle registers a handler for a specific route, applying all middleware
func (a *App) Handle(pattern string, handler http.Handler) {
	finalHandler := handler
	for _, middleware := range a.middlewares {
		finalHandler = middleware(finalHandler)
	}
	a.mux.Handle(pattern, finalHandler)
}

// ListenAndServe starts the application server
func (a *App) ListenAndServe(address string) error {
	return http.ListenAndServe(address, a.mux)
}

func (s *Server) RegisterRoutes() http.Handler {
	app := NewApp()
	app.Use(LoggingMiddleware)
	app.Use(s.SessionMiddleware)
	// TODO: dev flag
	app.Use(noCacheMiddleWare)

	app.Handle("GET /", http.HandlerFunc(MainHandler))
	app.Handle("GET /callback", http.HandlerFunc(s.CallbackHandler))

	app.Handle("GET /static/*", http.StripPrefix("/static/", http.FileServer(http.Dir("internal/static"))))

	app.Handle("GET /login", http.HandlerFunc(LoginHandler))

	app.Handle("GET /setDevice", http.HandlerFunc(s.DevicesHandler))

	app.Handle("POST /search", http.HandlerFunc(SearchHandler))
	app.Handle("GET /playlists", http.HandlerFunc(PlayListsHandler))

	app.Handle("GET /play", http.HandlerFunc(PlayHandler))

	return app.mux
}

func MainHandler(w http.ResponseWriter, r *http.Request) {
	session := r.Context().Value(sessionContext).(*models.UserSession)
	view.Main(session.AccessToken).Render(r.Context(), w)
}

func (s *Server) DevicesHandler(w http.ResponseWriter, r *http.Request) {
	session, ok := r.Context().Value(sessionContext).(*models.UserSession)
	if !ok {
		http.Error(w, "failed to get session info", http.StatusInternalServerError)
	}
	deviceId := r.URL.Query().Get("id")

	if len(deviceId) == 0 {
		http.Error(w, "device id required", http.StatusBadRequest)
	}
	devices, err := Devices(session.AccessToken)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
	for _, device := range devices.Devices {
		if device.ID == deviceId {
			s.db.UpdateDevice(session.ID, device.ID)
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("Device set to " + device.Name))
			return
		}
	}
	http.Error(w, "device id not found", http.StatusInternalServerError)
}

func SearchHandler(w http.ResponseWriter, r *http.Request) {
	session, ok := r.Context().Value(sessionContext).(*models.UserSession)
	if !ok {
		http.Error(w, "failed to get session info", http.StatusInternalServerError)
	}

	searchTerm := r.FormValue("search")
	searchResponse, err := Search(session.AccessToken, searchTerm)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	view.SearchResult(*searchResponse).Render(r.Context(), w)
}

func PlayListsHandler(w http.ResponseWriter, r *http.Request) {
	session, ok := r.Context().Value(sessionContext).(*models.UserSession)
	if !ok {
		http.Error(w, "failed to get session info", http.StatusInternalServerError)
	}

	playLists, err := PlayLists(session.AccessToken)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	view.PlayLists(*playLists).Render(r.Context(), w)
}

func PlayHandler(w http.ResponseWriter, r *http.Request) {
	session, ok := r.Context().Value(sessionContext).(*models.UserSession)
	if !ok {
		http.Error(w, "failed to get session info", http.StatusInternalServerError)
	}
	uri := r.URL.Query().Get("uri")
	offset := r.URL.Query().Get("offset")

	err := Play(session, uri, offset)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	w.WriteHeader(http.StatusNoContent)
	w.Write([]byte("Played " + uri))
}
