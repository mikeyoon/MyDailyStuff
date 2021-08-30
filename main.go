// myweb project main.go
package main

import (
	"flag"
	"log"
	"net/http"
	"os"

	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
	"github.com/mikeyoon/MyDailyStuff/lib"
	"github.com/newrelic/go-agent/v3/integrations/nrgin"
	"github.com/newrelic/go-agent/v3/newrelic"
	csrf "github.com/utrack/gin-csrf"
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
)

func LoginRequired(c *gin.Context) {
	session := sessions.Default(c)
	c.Header("X-Csrf-Token", csrf.GetToken(c))

	if session.Get("userId") == nil {
		c.AbortWithStatusJSON(401, lib.ErrorResponse("User not logged in"))
	} else {
		c.Next()
	}
}

func RequireLogin(c *gin.Context) {
	session := sessions.Default(c)
	if session.Get("userId") == nil {
		c.Redirect(302, "/login")
	} else {
		c.Next()
	}
}

func DefaultPage(c *gin.Context) {
	c.File("./app/app-dev.html")
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

	if err != nil {
		log.Fatal(err)
	}

	store := cookie.NewStore([]byte(secret))

	router := gin.Default()

	if os.Getenv("NEW_RELIC_LICENSE_KEY") != "" {
		app, err := newrelic.NewApplication(
			newrelic.ConfigAppName("MyDailyStuff"),
			newrelic.ConfigLicense(os.Getenv("NEW_RELIC_LICENSE_KEY")),
			newrelic.ConfigDebugLogger(os.Stdout),
		)
		if nil != err {
			log.Fatal(err)
			os.Exit(1)
		}
		router.Use(nrgin.Middleware(app))
	}

	router.Use(sessions.Sessions("my_session", store))
	router.Use(csrf.Middleware(csrf.Options{
		Secret: secret,
		ErrorFunc: func(c *gin.Context) {
			c.String(400, "CSRF token mismatch")
			c.Abort()
		},
	}))

	c := lib.Controller{}
	c.SetOptions(mds, secret != *DEFAULT_SESSION_SECRET)

	public := router.Group("/api")

	//Login
	public.POST("/account/login", c.Login)
	public.POST("/account/logout", LoginRequired, c.Logout)
	public.POST("/account/register", c.Register)                         //Submit registration
	public.POST("/account/forgot/:email", c.CreateForgotPasswordRequest) //Send reset password link
	public.GET("/account/reset/:token", c.GetResetPasswordRequest)       //Check if reset link is valid
	public.POST("/account/reset/", c.ResetPassword)
	public.GET("/account/verify/:token", c.VerifyAccount)
	public.OPTIONS("/csrf", func(c *gin.Context) {
		c.Header("X-Csrf-Token", csrf.GetToken(c))
		c.Status(200)
	})

	privateAPI := router.Group("/api")
	privateAPI.Use(LoginRequired)
	privateAPI.GET("/account", c.Profile)       //Get user account information
	privateAPI.PUT("/account", c.UpdateProfile) //Modify user account

	privateAPI.GET("/account/streak/:date", c.GetStreak)

	privateAPI.GET("/journal/:date", c.GetEntryByDate) //Get a journal entry
	privateAPI.DELETE("/journal/:id", c.DeleteEntry)
	privateAPI.POST("/journal", c.CreateEntry)
	privateAPI.PUT("/journal/:id", c.UpdateEntry)

	privateAPI.GET("/search/date", c.SearchJournalDates) //Find dates that have entries in month
	privateAPI.POST("/search", c.SearchJournal)

	router.GET("/profile", RequireLogin, DefaultPage)

	router.GET("/login", DefaultPage)
	router.GET("/journal", DefaultPage)
	router.GET("/journal/:date", DefaultPage)
	router.GET("/search/:query", DefaultPage)
	router.GET("/search/:query/:offset", DefaultPage)
	router.GET("/register", DefaultPage)
	router.GET("/about", DefaultPage)
	router.GET("/forgot-password", DefaultPage)
	router.GET("/account/verify/:token", DefaultPage)
	router.GET("/account/reset/:token", DefaultPage)

	router.StaticFile("/", "./public/index.html")
	router.StaticFile("/favicon.ico", "./public/favicon.ico")
	router.Static("/css", "./public/css")
	router.Static("/fonts", "./public/fonts")
	router.Static("/img", "./public/img")
	router.Static("/js", "./public/js")

	dist := router.Group("/dist")
	dist.Use(func(c *gin.Context) {
		c.Header("Cache-Control", "no-cache")
		c.File("./app" + c.Request.URL.Path)
	})
	dist.Static("/", "./app/dist")

	router.NoRoute(func(c *gin.Context) {
		c.AbortWithStatus(http.StatusNotFound)
	})

	router.Run()
}
