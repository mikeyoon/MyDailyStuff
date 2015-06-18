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
	"os"
)

var (
	DEFAULT_ES_URL         *string = flag.String("esurl", "http://localhost:9200", "Elasticsearch Server Url")
	DEFAULT_SESSION_SECRET *string = flag.String("sessionSecret", "secret123", "Session Secret Key")
	DEFAULT_SG_USERNAME    *string = flag.String("sg_name", "", "Sendgrid Username")
	DEFAULT_SG_PASSWORD    *string = flag.String("sg_pw", "", "Sendgrid Password")

	esurl      string
	sgUsername string
	sgPassword string
	secret     string

	service lib.Service
)

func LoginRequired(c martini.Context, r render.Render, session sessions.Session) {
	if session.Get("userId") == nil {
		r.JSON(401, lib.ErrorResponse("User not logged in"))
	} else {
		c.Next()
	}
}

func main() {
	esurl = os.Getenv("ESURL")
	if esurl == "" {
		esurl = *DEFAULT_ES_URL
	}

	sgUsername = os.Getenv("SENDGRID_USERNAME")
	if sgUsername == "" {
		sgUsername = *DEFAULT_SG_USERNAME
	}

	sgPassword = os.Getenv("SENDGRID_PASSWORD")
	if sgPassword == "" {
		sgPassword = *DEFAULT_SG_PASSWORD
	}

	secret = os.Getenv("SESSION_SECRET")
	if secret == "" {
		secret = *DEFAULT_SESSION_SECRET
	}

	mds := lib.MdsService{}
	err := mds.Init(lib.ServiceOptions{
		ElasticUrl:       esurl,
		SendGridUsername: sgUsername,
		SendGridPassword: sgPassword})

	service = mds

	if err != nil {
		log.Fatal(err)
	}

	store := sessions.NewCookieStore([]byte(secret))

	m := martini.Classic()
	m.Use(render.Renderer())
	m.Use(sessions.Sessions("my_session", store))
	m.Use(martini.Static("public", martini.StaticOptions{Fallback: "index.html", Exclude: "/api"}))

	c := lib.Controller{}
	c.SetOptions(mds, secret != *DEFAULT_SESSION_SECRET)

	//Login
	m.Post("/api/account/login", binding.Json(lib.LoginRequest{}), c.Login)

	//Logout
	m.Post("/api/account/logout", LoginRequired, c.Logout)

	//Get user account information
	m.Get("/api/account", LoginRequired, c.Profile)

	//Submit registration
	m.Post("/api/account/register", binding.Json(lib.RegisterRequest{}), c.Register)

	//Modify user account
	m.Put("/api/account", LoginRequired, binding.Json(lib.ModifyAccountRequest{}), c.UpdateProfile)

	//Send reset password link
	m.Post("/api/account/forgot/:email", c.CreateForgotPasswordRequest)

	//Check if reset link is valid
	m.Get("/api/account/reset/:token", c.GetResetPasswordRequest)

	m.Get("/api/account/streak/:date", LoginRequired, c.GetStreak)

	//Reset password
	m.Post("/api/account/reset/", binding.Json(lib.ResetPasswordRequest{}), c.ResetPassword)

	//Verify an account
	m.Get("/api/account/verify/:token", c.VerifyAccount)

	//Get a journal entry
	m.Get("/api/journal/:date", LoginRequired, c.GetEntryByDate)

	m.Delete("/api/journal/:id", LoginRequired, c.DeleteEntry)

	//Create a journal entry
	m.Post("/api/journal", LoginRequired, binding.Json(lib.CreateEntryRequest{}), c.CreateEntry)

	//Update a journal entry
	m.Put("/api/journal/:id", LoginRequired, binding.Json(lib.ModifyEntryRequest{}), c.UpdateEntry)

	//Search journal entries
	m.Post("/api/search", LoginRequired, binding.Json(lib.SearchJournalRequest{}), c.SearchJournal)

	//Find dates that have entries in month
	m.Post("/api/search/date", LoginRequired, binding.Json(lib.SearchJournalRequest{}), c.SearchJournalDates)

	m.Run()
}