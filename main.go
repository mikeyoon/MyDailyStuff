// myweb project main.go
package main

import (
	"flag"
	"github.com/go-martini/martini"
	"github.com/martini-contrib/binding"
	"github.com/martini-contrib/render"
	"github.com/martini-contrib/sessions"
    "github.com/mikeyoon/MyDailyStuff/lib"
	"log"
)

var (
	eshost        *string = flag.String("host", "localhost", "Elasticsearch Server Host Address")
	sessionSecret *string = flag.String("sessionSecret", "secret123", "Session Secret Key")
)

type JournalEntry struct {
	UserId     string
	Date       string
	Entries    []string
	ModifyDate string
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type RegisterRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type ModifyAccountRequest struct {
	Password string `json:"password"`
	Email    string `json:"email"`
}

type CreateEntryRequest struct {
	Date    string   `json:"date" binding:"required"`
	Entries []string `json:"entries" binding:"required"`
}

func main() {
    service := lib.Service{}
    err := service.InitDataStore(nil)

	if err != nil {
        log.Fatal(err)
    }

	store := sessions.NewCookieStore([]byte(*sessionSecret))

	m := martini.Classic()
	m.Use(render.Renderer())
	m.Use(sessions.Sessions("my_session", store))

	//Home page
	m.Get("/", func(r render.Render) {
		r.JSON(200, map[string]interface{}{"Hello": "World"})
	})

	//Login
	m.Post("/account/login", binding.Json(LoginRequest{}), func(req LoginRequest, session sessions.Session, r render.Render) {

        user, err := service.GetUserByLogin(req.Email, req.Password)

		if err != nil {
			r.Status(404)
            return
		}

        session.Set("userId", user.UserId)
        r.JSON(200, map[string]interface{}{"result": "success"})
	})

	//Get user account information
	m.Get("/account", func(r render.Render) {

	})

	//Submit registration
	m.Post("/account/register", binding.Json(RegisterRequest{}),
		func(reg RegisterRequest, r render.Render) {
            err := service.CreateUser(reg.Email, reg.Password)
            if err != nil {
                r.JSON(200, map[string]interface{}{ "success": false })
            } else {
                r.JSON(200, map[string]interface{}{ "success": true })
            }
		})

	//Modify user account
	m.Post("/account/:id", binding.Json(ModifyAccountRequest{}),
		func(req ModifyAccountRequest, args martini.Params, r render.Render) {
            log.Println("Modifying user " + args["id"])

            err := service.UpdateUser(args["id"], req.Email, req.Password)
            if err != nil {
                r.JSON(200, map[string]interface{}{ "success": false })
            } else {
                r.JSON(200, map[string]interface{}{ "success": true })
            }
		})

	//Get a journal entry
	m.Get("/journal/:date", func(r render.Render) {

	})

	//Create/Modify a journal entry
	m.Post("/journal", binding.Json(CreateEntryRequest{}),
		func(entry CreateEntryRequest, r render.Render) {

			r.JSON(200, map[string]interface{}{"Hello": "World"})
		})

	//Search journal entries
	m.Get("/journal/search/", func(r render.Render) {

	})

	m.Run()
}
