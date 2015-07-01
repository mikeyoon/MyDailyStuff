package lib

import (
	"fmt"
	"github.com/go-martini/martini"
	"github.com/jinzhu/now"
	"github.com/martini-contrib/render"
	"github.com/martini-contrib/sessions"
)

type LoginRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
	Persist  bool   `json:"persist"`
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
	Query  string `form:"query"`
	Start  string `form:"start"`
	End    string `form:"end"`
	Limit  int    `form:"limit"`
	Offset int    `form:"offset"`
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
	Total   int         `json:"total,omitempty"`
}

func ErrorResponse(error string) Response {
	return Response{Success: false, Error: error}
}

func SuccessResponse(result interface{}) Response {
	return Response{Success: true, Result: result}
}

func PagedSuccessResponse(result interface{}, total int) Response {
	return Response{Success: true, Result: result, Total: total}
}

type Controller struct {
	service      Service
	secureCookie bool
}

func (c *Controller) SetOptions(service Service, useSecureCookie bool) {
	c.service = service
	c.secureCookie = useSecureCookie
}

func (c *Controller) Login(req LoginRequest, session sessions.Session, r render.Render) {
	user, err := c.service.GetUserByLogin(req.Email, req.Password)

	if err != nil {
		r.JSON(200, ErrorResponse("User not found"))
		return
	}

	maxAge := 0
	if req.Persist {
		maxAge = 2592000 //30 days
	}

	session.Options(sessions.Options{
		Path:     "/",
		HttpOnly: true,
		Secure:   c.secureCookie,
		MaxAge:   maxAge,
	})

	session.Set("userId", user.UserId)
	r.JSON(200, SuccessResponse(nil))
}

func (c *Controller) Logout(session sessions.Session, r render.Render) {
	session.Delete("userId")
	session.Options(sessions.Options{
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   c.secureCookie,
		Path:     "/",
	})

	r.JSON(200, SuccessResponse(nil))
}

func (c *Controller) Profile(session sessions.Session, r render.Render) {
	user, err := c.service.GetUserById(session.Get("userId").(string))

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
}

func (c *Controller) Register(reg RegisterRequest, r render.Render) {
	err := c.service.CreateUserVerification(reg.Email, reg.Password)
	if err != nil {
		r.JSON(200, ErrorResponse(err.Error()))
	} else {
		r.JSON(200, SuccessResponse(nil))
	}
}

func (c *Controller) UpdateProfile(req ModifyAccountRequest, session sessions.Session, r render.Render) {
	err := c.service.UpdateUser(session.Get("userId").(string), "", req.Password)
	if err != nil {
		r.JSON(200, ErrorResponse(err.Error()))
	} else {
		r.JSON(200, SuccessResponse(nil))
	}
}

func (c *Controller) CreateForgotPasswordRequest(args martini.Params, session sessions.Session, r render.Render) {
	err := c.service.CreateAndSendResetPassword(args["email"])

	if err != nil {
		fmt.Println(err.Error() + " " + args["email"])
	}

	r.JSON(200, SuccessResponse(nil))
}

func (c *Controller) GetResetPasswordRequest(args martini.Params, session sessions.Session, r render.Render) {
	_, err := c.service.GetResetPassword(args["token"])

	//TODO: Check if token has expired
	if err != nil {
		r.JSON(200, ErrorResponse(err.Error()))
	} else {
		r.JSON(200, SuccessResponse(nil))
	}
}

func (c *Controller) ResetPassword(req ResetPasswordRequest,
	session sessions.Session, r render.Render) {

	err := c.service.ResetPassword(req.Token, req.Password)

	if err != nil {
		r.JSON(200, ErrorResponse(err.Error()))
	} else {
		r.JSON(200, SuccessResponse(nil))
	}
}

func (c *Controller) VerifyAccount(args martini.Params, session sessions.Session, r render.Render) {
	id, err := c.service.CreateUser(args["token"])

	if err == nil {
		session.Set("userId", id)
		r.JSON(200, SuccessResponse(nil))
	} else {
		r.JSON(200, ErrorResponse(err.Error()))
	}
}

func (c *Controller) GetEntryByDate(r render.Render, args martini.Params, session sessions.Session) {
	entry, err := c.service.GetJournalEntryByDate(session.Get("userId").(string), now.MustParse(args["date"]))

	if err != nil {
		r.JSON(200, ErrorResponse(err.Error()))
	} else {
		r.JSON(200, SuccessResponse(entry))
	}
}

func (c *Controller) DeleteEntry(args martini.Params, session sessions.Session, r render.Render) {
	err := c.service.DeleteJournalEntry(args["id"], session.Get("userId").(string))

	if err != nil {
		r.JSON(200, ErrorResponse(err.Error()))
	} else {
		r.JSON(200, SuccessResponse(nil))
	}
}

func (c *Controller) CreateEntry(entry CreateEntryRequest, session sessions.Session, r render.Render) {
	result, err := c.service.CreateJournalEntry(session.Get("userId").(string), entry.Entries, now.MustParse(entry.Date))

	if err != nil {
		r.JSON(200, ErrorResponse(err.Error()))
	} else {
		//Need to return the result because there's a delay before the entry gets indexed into elastic search
		r.JSON(200, SuccessResponse(result))
	}
}

func (c *Controller) UpdateEntry(entry ModifyEntryRequest, session sessions.Session, args martini.Params, r render.Render) {
	err := c.service.UpdateJournalEntry(args["id"], session.Get("userId").(string), entry.Entries)

	if err != nil {
		r.JSON(200, ErrorResponse(err.Error()))
	} else {
		r.JSON(200, SuccessResponse(nil))
	}
}

func (c *Controller) SearchJournal(req SearchJournalRequest, session sessions.Session, r render.Render) {
	var query JournalQuery
	query.Query = req.Query
	query.Limit = req.Limit
	query.Offset = req.Offset

	if req.Start != "" {
		query.Start = now.MustParse(req.Start)
	}

	if req.End != "" {
		query.End = now.MustParse(req.End)
	}

	results, total, err := c.service.SearchJournal(session.Get("userId").(string), query)

	if err != nil {
		r.JSON(500, ErrorResponse(err.Error()))
	} else {
		r.JSON(200, PagedSuccessResponse(results, total))
	}
}

func (c *Controller) SearchJournalDates(req SearchJournalRequest, session sessions.Session, r render.Render) {
	var query JournalQuery
	query.Query = req.Query

	if req.Start != "" {
		query.Start = now.MustParse(req.Start)
	}

	if req.End != "" {
		query.End = now.MustParse(req.End)
	}

	results, err := c.service.SearchJournalDates(session.Get("userId").(string), query)
	if err != nil {
		r.JSON(500, ErrorResponse(err.Error()))
	} else {
		r.JSON(200, SuccessResponse(results))
	}
}

func (c *Controller) GetStreak(args martini.Params, session sessions.Session, r render.Render) {
	streak, err := c.service.GetStreak(session.Get("userId").(string), now.MustParse(args["date"]), 10)

	if err != nil {
		r.JSON(500, ErrorResponse(err.Error()))
	} else {
		r.JSON(200, SuccessResponse(streak))
	}
}
