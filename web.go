// myweb project main.go
package main

import (
	"flag"
	"fmt"
	"github.com/go-martini/martini"
	"github.com/jinzhu/now"
	"github.com/martini-contrib/binding"
	"github.com/martini-contrib/render"
	"github.com/martini-contrib/sessions"
	"github.com/mikeyoon/MyDailyStuff/lib"
	"log"
	"os"
)

var (
	DEFAULT_ES_URL         *string = flag.String("esurl", "http://localhost:9200", "Elasticsearch Server Url")
	DEFAULT_SESSION_SECRET *string = flag.String("sessionSecret", "secret123", "Session Secret Key")
	DEFAULT_SG_USERNAME    *string = flag.String("sg_name", "", "Sendgrid Username")
	DEFAULT_SG_PASSWORD    *string = flag.String("sg_pw", "", "Sendgrid Password")
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

type ResetPasswordRequest struct {
	Token    string `json:"token" binding:"required"`
	Password string `json:"password" binding:"required"`
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
	esurl := os.Getenv("ESURL")
	if esurl == "" {
		esurl = *DEFAULT_ES_URL
	}

	sgUsername := os.Getenv("SENDGRID_USERNAME")
	if sgUsername == "" {
		sgUsername = *DEFAULT_SG_USERNAME
	}

	sgPassword := os.Getenv("SENDGRID_PASSWORD")
	if sgPassword == "" {
		sgPassword = *DEFAULT_SG_PASSWORD
	}

	fmt.Println(sgUsername)

	service := lib.Service{}
	err := service.Init(lib.ServiceOptions{
		ElasticUrl:       esurl,
		SendGridUsername: sgUsername,
		SendGridPassword: sgPassword})

	if err != nil {
		log.Fatal(err)
	}

	secret := os.Getenv("SESSION_SECRET")
	if secret == "" {
		secret = *DEFAULT_SESSION_SECRET
	}

	store := sessions.NewCookieStore([]byte(secret))

	m := martini.Classic()
	m.Use(render.Renderer())
	m.Use(sessions.Sessions("my_session", store))
	m.Use(martini.Static("public", martini.StaticOptions{Fallback: "index.html", Exclude: "/api"}))

	//Login
	m.Post("/api/account/login", binding.Json(LoginRequest{}), func(req LoginRequest, session sessions.Session, r render.Render) {
		user, err := service.GetUserByLogin(req.Email, req.Password)

		if err != nil {
			r.JSON(200, ErrorResponse("User not found"))
			return
		}

		session.Set("userId", user.UserId)
		r.JSON(200, SuccessResponse(nil))
	})

	//Logout
	m.Post("/api/account/logout", func(session sessions.Session, r render.Render) {
		if session.Get("userId") != nil {
			session.Delete("userId")
			r.JSON(200, SuccessResponse(nil))
		} else {
			r.JSON(200, ErrorResponse("User not logged in"))
		}
	})

	//Get user account information
	m.Get("/api/account", func(session sessions.Session, r render.Render) {
		if session.Get("userId") != nil {
			user, err := service.GetUserById(session.Get("userId").(string))

			if err == nil {
				r.JSON(200, SuccessResponse(map[string]interface{}{
					"user_id":         user.UserId,
					"create_date":     user.CreateDate,
					"last_login_date": user.LastLoginDate,
					"email":           user.Email,
				}))
			} else {
				r.JSON(404, ErrorResponse(err.Error()))
			}
		} else {
			r.JSON(200, ErrorResponse(""))
		}
	})

	//Submit registration
	m.Post("/api/account/register", binding.Json(RegisterRequest{}),
		func(reg RegisterRequest, r render.Render) {
			err := service.CreateUserVerification(reg.Email, reg.Password)
			if err != nil {
				r.JSON(200, ErrorResponse(err.Error()))
			} else {
				r.JSON(200, SuccessResponse(nil))
			}
		})

	//Modify user account
	m.Put("/api/account", binding.Json(ModifyAccountRequest{}),
		func(req ModifyAccountRequest, session sessions.Session, r render.Render) {

			err := service.UpdateUser(session.Get("userId").(string), "", req.Password)
			if err != nil {
				r.JSON(200, ErrorResponse(err.Error()))
			} else {
				r.JSON(200, SuccessResponse(nil))
			}
		})

	//Send reset password link
	m.Post("/api/account/forgot/:email", func(args martini.Params, session sessions.Session, r render.Render) {
		err := service.CreateAndSendResetPassword(args["email"])

		if err != nil {
			fmt.Println(err.Error() + " " + args["email"])
		}

		r.JSON(200, SuccessResponse(nil))
	})

	//Check if reset link is valid
	m.Get("/api/account/reset/:token", func(args martini.Params, session sessions.Session, r render.Render) {
		_, err := service.GetResetPassword(args["token"])

		//TODO: Check if token has expired
		if err != nil {
			r.JSON(200, ErrorResponse(err.Error()))
		} else {
			r.JSON(200, SuccessResponse(nil))
		}
	})

	//Reset password
	m.Post("/api/account/reset/", binding.Json(ResetPasswordRequest{}), func(req ResetPasswordRequest,
		session sessions.Session, r render.Render) {

		err := service.ResetPassword(req.Token, req.Password)

		if err != nil {
			r.JSON(200, ErrorResponse(err.Error()))
		} else {
			r.JSON(200, SuccessResponse(nil))
		}
	})

	//Verify an account
	m.Get("/api/account/verify/:token", func(args martini.Params, session sessions.Session, r render.Render) {
		id, err := service.CreateUser(args["token"])

		if err == nil {
			session.Set("userId", id)
			r.JSON(200, SuccessResponse(nil))
		} else {
			r.JSON(200, ErrorResponse(err.Error()))
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
			result, err := service.CreateJournalEntry(session.Get("userId").(string), entry.Entries, now.MustParse(entry.Date))

			if err != nil {
				r.JSON(200, ErrorResponse(err.Error()))
			} else {
				//Need to return the result because there's a delay before the entry gets indexed into elastic search
				r.JSON(200, SuccessResponse(result))
			}
		})

	//Update a journal entry
	m.Put("/api/journal/:id", binding.Json(ModifyEntryRequest{}),
		func(entry ModifyEntryRequest, session sessions.Session, args martini.Params, r render.Render) {
			err := service.UpdateJournalEntry(args["id"], session.Get("userId").(string), entry.Entries)

			if err != nil {
				r.JSON(200, ErrorResponse(err.Error()))
			} else {
				r.JSON(200, SuccessResponse(nil))
			}
		})

	//Search journal entries
	m.Post("/api/search", binding.Json(SearchJournalRequest{}),
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
	m.Post("/api/search/date", binding.Json(SearchJournalRequest{}),
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
