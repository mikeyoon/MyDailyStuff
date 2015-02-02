// myweb project main.go
package main

import (
	"code.google.com/p/go-uuid/uuid"
	"encoding/json"
	"flag"
	"github.com/go-martini/martini"
	"github.com/martini-contrib/binding"
	"github.com/martini-contrib/render"
	"github.com/martini-contrib/sessions"
	elastigo "github.com/mattbaird/elastigo/lib"
	. "github.com/mikeyoon/MyDailyStuff/utils"
	"golang.org/x/crypto/bcrypt"
	"log"
	"time"
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

type User struct {
	UserId       string
	Email        string
	PasswordHash []byte
	CreateDate   time.Time
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
	conn := elastigo.NewConn()
	conn.Domain = *eshost

	err := CreateIndexes(conn)

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
	m.Post("/account/login", binding.Bind(LoginRequest{}), func(req LoginRequest, session sessions.Session, r render.Render) {
		pass, err := bcrypt.GenerateFromPassword([]byte(req.Password), 10)

		if err != nil {
			panic(err)
		}

		result, err := conn.Search("users", "user", map[string]interface{}{
			"Email":        req.Email,
			"PasswordHash": string(pass)}, nil)

		if err != nil {
			panic(err)
		}

		if result.Hits.Total > 0 {
			var u User
			bytes, err := result.Hits.Hits[0].Source.MarshalJSON()
			if err != nil {
				panic(err)
			}

			json.Unmarshal(bytes, u)
			session.Set("userId", u.UserId)
			r.JSON(200, map[string]interface{}{"result": "success"})
		} else {
			r.JSON(200, map[string]interface{}{"result": "notfound"})
		}
	})

	//Get user account information
	m.Get("/account", func(r render.Render) {

	})

	//Submit registration
	m.Post("/account/register", binding.Json(RegisterRequest{}),
		func(reg RegisterRequest, r render.Render) {
			id := uuid.New()

			pass, err := bcrypt.GenerateFromPassword([]byte(reg.Password), 10)
			if err != nil {
				panic(err)
			}

			result, err := conn.Search("users", "user", map[string]interface{}{
				"Email": reg.Email}, nil)

			if result.Hits.Total > 0 {
				r.JSON(200, map[string]interface{}{"error": "User already exists"})
			} else {
				resp, err := conn.Index("users", "user", id, nil, User{
					Email:        reg.Email,
					UserId:       id,
					CreateDate:   time.Now(),
					PasswordHash: pass})

				if err != nil {
					panic(err)
				}

				if resp.Created {
					r.JSON(200, map[string]interface{}{"Hello": "World"})
				} else {
					r.JSON(500, map[string]interface{}{"Stuff": "Things"})
				}
			}
		})

	//Modify user account
	m.Post("/account/:id", binding.Json(ModifyAccountRequest{}),
		func(req ModifyAccountRequest, args martini.Params, r render.Render) {
			var result User
			err := conn.GetSource("users", "user", args["id"], nil, result)

			if err != nil {
				r.JSON(200, map[string]interface{}{"Not": "Found"})
			} else {
				if req.Password != "" {
					hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), 10)
					if err != nil {
						panic(err)
					}

					result.PasswordHash = hash
				}

				result.Email = req.Email
				conn.Index("users", "user", args["id"], nil, User{
					Email: req.Email,
				})

				r.JSON(200, map[string]interface{}{"result": "success"})
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
