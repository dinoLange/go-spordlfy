package main

import (
	"fmt"
	"go-spordlfy/internal/server"
)

func main() {
	server := server.NewServer()
	fmt.Println("Server is running!")
	err := server.ListenAndServe()
	if err != nil {
		panic("cannot start server")
	}

}
