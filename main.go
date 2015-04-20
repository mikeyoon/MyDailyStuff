// myweb project main.go
package main

import (
	"flag"
	"github.com/go-martini/martini"
	"github.com/jinzhu/now"
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

type ModifyEntryRequest struct {
	Date    string   `json:"date" binding:"required"`
	Entries []string `json:"entries" binding:"required"`
}

type SearchJournalRequest struct {
	Query string `form:"query"`
	Start string `form:"start"`
	End   string `form:"end"`
}

type FindDaysRequest struct {
	Start string `form:start`
	End   string `form:end`
}

type Response struct {
	Success bool        `json:"success"`
	Error   string      `json:"error,omitempty"`
	Result  interface{} `json:"result,omitempty"`
}

func ErrorResponse(error string) Response {
	return Response{Success: false, Error: error}
}

func SuccessResponse(result interface{}) Response {
	return Response{Success: true, Result: result}
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
	m.Use(martini.Static("public", martini.StaticOptions{Fallback:"index.html", Exclude:"/api"}))

	//Home page
//	m.Get("/", func(r render.Render) {
//		r.JSON(200, map[string]interface{}{"Hello": "World"})
//	})

	//Login
	m.Post("/api/account/login", binding.Json(LoginRequest{}), func(req LoginRequest, session sessions.Session, r render.Render) {

		user, err := service.GetUserByLogin(req.Email, req.Password)

		if err != nil {
			r.Status(404)
			return
		}

		session.Set("userId", user.UserId)
		r.JSON(200, SuccessResponse(nil))
	})

	//Get user account information
	m.Get("/api/account", func(r render.Render) {

	})

	//Submit registration
	m.Post("/api/account/register", binding.Json(RegisterRequest{}),
		func(reg RegisterRequest, r render.Render) {
			err := service.CreateUser(reg.Email, reg.Password)
			if err != nil {
				r.JSON(200, ErrorResponse(err.Error()))
			} else {
				r.JSON(200, SuccessResponse(nil))
			}
		})

	//Modify user account
	m.Post("/api/account/:id", binding.Json(ModifyAccountRequest{}),
		func(req ModifyAccountRequest, args martini.Params, r render.Render) {
			log.Println("Modifying user " + args["id"])

			err := service.UpdateUser(args["id"], req.Email, req.Password)
			if err != nil {
				r.JSON(200, ErrorResponse(err.Error()))
			} else {
				r.JSON(200, SuccessResponse(nil))
			}
		})

	//Get a journal entry
	m.Get("/api/journal/:date", func(r render.Render, args martini.Params, session sessions.Session) {
		entry, err := service.GetJournalEntryByDate(session.Get("userId").(string), now.MustParse(args["date"]))

		if err != nil {
			r.JSON(200, ErrorResponse(err.Error()))
		} else {
			r.JSON(200, SuccessResponse(entry))
		}
	})

	m.Delete("/api/journal/:id",
		func(args martini.Params, session sessions.Session, r render.Render) {
			err := service.DeleteJournalEntry(args["id"], session.Get("userId").(string))

			if err != nil {
				r.JSON(200, ErrorResponse(err.Error()))
			} else {
				r.JSON(200, SuccessResponse(nil))
			}
		})

	//Create a journal entry
	m.Post("/api/journal", binding.Json(CreateEntryRequest{}),
		func(entry CreateEntryRequest, session sessions.Session, r render.Render) {
			err := service.CreateJournalEntry(session.Get("userId").(string), entry.Entries, now.MustParse(entry.Date))

			if err != nil {
				r.JSON(200, ErrorResponse(err.Error()))
			} else {
				r.JSON(200, SuccessResponse(nil))
			}
		})

	//Update a journal entry
	m.Put("/api/journal/:id", binding.Json(CreateEntryRequest{}),
		func(entry CreateEntryRequest, session sessions.Session, args martini.Params, r render.Render) {
			err := service.UpdateJournalEntry(args["id"], session.Get("userId").(string), entry.Entries)

			if err != nil {
				r.JSON(200, ErrorResponse(err.Error()))
			} else {
				r.JSON(200, SuccessResponse(nil))
			}
		})

	//Search journal entries
	m.Get("/api/search", binding.Bind(SearchJournalRequest{}),
		func(req SearchJournalRequest, session sessions.Session, r render.Render) {
			var query lib.JournalQuery
			query.Query = req.Query

			if req.Start != "" {
				query.Start = now.MustParse(req.Start)
			}

			if req.End != "" {
				query.End = now.MustParse(req.End)
			}

			log.Println(req.Query)
			results, err := service.SearchJournal(session.Get("userId").(string), query)
			if err != nil {
				r.JSON(500, ErrorResponse(err.Error()))
			} else {
				r.JSON(200, SuccessResponse(results))
			}
		})

	//Find dates that have entries in month
	m.Get("/api/search/date", binding.Bind(SearchJournalRequest{}),
		func(req SearchJournalRequest, session sessions.Session, r render.Render) {
			var query lib.JournalQuery
			query.Query = req.Query

			if req.Start != "" {
				query.Start = now.MustParse(req.Start)
			}

			if req.End != "" {
				query.End = now.MustParse(req.End)
			}

			results, err := service.SearchJournalDates(session.Get("userId").(string), query)
			if err != nil {
				r.JSON(500, ErrorResponse(err.Error()))
			} else {
				r.JSON(200, SuccessResponse(results))
			}
		})

	m.Run()
}
