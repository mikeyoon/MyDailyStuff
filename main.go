// myweb project main.go
package main

import (
	"flag"
	"github.com/go-martini/martini"
	"github.com/martini-contrib/binding"
	"github.com/martini-contrib/render"
	elastigo "github.com/mattbaird/elastigo/lib"
	. "github.com/mikeyoon/MyDailyStuff/utils"
	"log"
)

var (
	eshost *string = flag.String("host", "localhost", "Elasticsearch Server Host Address")
)

type LoginRequest struct {
	email    string `json:"email" binding:"required"`
	password string `json:"password" binding:"required"`
}

type RegisterRequest struct {
	email    string `json:"email" binding:"required"`
	password string `json:"password" binding:"required"`
}

type CreateEntryRequest struct {
	date    string   `json:"date binding:"required"`
	entries []string `json:"entries" binding:"required"`
}

func main() {
	conn := elastigo.NewConn()
	conn.Domain = *eshost

	err := CreateIndexes(conn)
	if err != nil {
		log.Fatal(err)
	}

	m := martini.Classic()
	m.Use(render.Renderer())

	//Home page
	m.Get("/", func(r render.Render) {
		r.JSON(200, map[string]interface{}{"Hello": "World"})
	})

	//Login
	m.Post("/account/login", binding.Bind(LoginRequest{}), func(req LoginRequest, r render.Render) {
		log.Println("email: " + req.email + ", password: " + req.password)
	})

	//Get user account information
	m.Get("/account", func(r render.Render) {

	})

	//Submit registration
	m.Post("/account/register")

	//Modify user account
	m.Post("/account", func(r render.Render) {

	})

	//Get a journal entry
	m.Get("/journal/:date", func(r render.Render) {

	})

	//Create/Modify a journal entry
	m.Post("/journal/", binding.Json(CreateEntryRequest{}),
		func(entry CreateEntryRequest, r render.Render) {
			log.Println("Entry", entry)
			r.JSON(200, map[string]interface{}{"Hello": "World"})
		})

	//Search journal entries
	m.Get("/journal/search/", func(r render.Render) {

	})

	m.Run()
}
