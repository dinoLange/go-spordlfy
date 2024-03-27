package server

import (
	"go-spordlfy/internal/models"
	"go-spordlfy/internal/view"
	"net/http"
)

func SearchHandler(w http.ResponseWriter, r *http.Request) {
	session, ok := r.Context().Value(sessionContextKey).(*models.UserSession)
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
	session, ok := r.Context().Value(sessionContextKey).(*models.UserSession)
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
	session, ok := r.Context().Value(sessionContextKey).(*models.UserSession)
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

func QueueHandler(w http.ResponseWriter, r *http.Request) {
	session, ok := r.Context().Value(sessionContextKey).(*models.UserSession)
	if !ok {
		http.Error(w, "failed to get session info", http.StatusInternalServerError)
	}

	queue, err := Queue(session.AccessToken)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	view.Queue(queue).Render(r.Context(), w)
}
