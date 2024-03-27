package server

import (
	"net/http"
	"os"
)

const sessionContextKey = "session"

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
	if os.Getenv("APP_ENV") == "local" {
		app.Use(noCacheMiddleWare)
	}

	app.Handle("GET /", http.HandlerFunc(MainHandler))
	app.Handle("GET /callback", http.HandlerFunc(s.CallbackHandler))

	app.Handle("GET /static/*", http.StripPrefix("/static/", http.FileServer(http.Dir("internal/static"))))

	app.Handle("GET /setDevice", http.HandlerFunc(s.DevicesHandler))

	app.Handle("POST /search", http.HandlerFunc(SearchHandler))
	app.Handle("GET /playlists", http.HandlerFunc(PlayListsHandler))

	app.Handle("GET /play", http.HandlerFunc(PlayHandler))

	app.Handle("GET /queue", http.HandlerFunc(QueueHandler))

	return app.mux
}
