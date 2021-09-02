package lib

import (
	"fmt"
	"net/http"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/jinzhu/now"
	csrf "github.com/utrack/gin-csrf"
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
	Start string `form:"start"`
	End   string `form:"end"`
}

type ResetPasswordRequest struct {
	Token    string `json:"token" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type Response struct {
	Success bool        `json:"success"`
	Error   string      `json:"error,omitempty"`
	Result  interface{} `json:"result,omitempty"`
	Total   int64       `json:"total,omitempty"`
	Token   string      `json:"csrf,omitempty"`
}

func ErrorResponse(error string) Response {
	return Response{Success: false, Error: error}
}

func SuccessResponse(result interface{}) Response {
	return Response{Success: true, Result: result}
}

func PagedSuccessResponse(result interface{}, total int64) Response {
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

func (r *Controller) Login(c *gin.Context) {
	session := sessions.Default(c)
	var req LoginRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid parameters provided"})
		return
	}
	user, err := r.service.GetUserByLogin(req.Email, req.Password)

	if err != nil {
		c.JSON(200, ErrorResponse("Incorrect email or password"))
		return
	}

	maxAge := 0
	if req.Persist {
		maxAge = 2592000 //30 days
	}

	session.Options(sessions.Options{
		Path:     "/",
		HttpOnly: true,
		Secure:   r.secureCookie,
		MaxAge:   maxAge,
	})

	session.Set("userId", user.ID)
	session.Save()
	c.Header("X-Csrf-Token", csrf.GetToken(c))

	c.JSON(200, SuccessResponse(nil))
}

func (r *Controller) RequireLogin(c *gin.Context) {
	session := sessions.Default(c)

	if session.Get("userId") == nil {
		c.Redirect(302, "/login")
	} else {
		_, err := r.service.GetUserById(session.Get("userId").(string))
		if err == nil {
			c.Next()
		} else {
			session.Delete(("userId"))
			c.Redirect(302, "/login")
		}
	}
}

func (r *Controller) BypassIfLoggedIn(c *gin.Context) {
	session := sessions.Default(c)

	if session.Get("userId") != nil {
		_, err := r.service.GetUserById(session.Get("userId").(string))
		if err == nil {
			c.Redirect(301, "/journal")
			return
		} else {
			session.Delete(("userId"))
		}
	}

	c.Next()
}

func (r *Controller) Logout(c *gin.Context) {
	session := sessions.Default(c)
	session.Delete("userId")
	session.Options(sessions.Options{
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   r.secureCookie,
		Path:     "/",
	})

	c.JSON(200, SuccessResponse(nil))
}

func (r *Controller) Profile(c *gin.Context) {
	session := sessions.Default(c)
	user, err := r.service.GetUserById(session.Get("userId").(string))

	c.Header("X-Csrf-Token", csrf.GetToken(c))

	if err == nil {
		c.JSON(200, SuccessResponse(map[string]interface{}{
			"user_id":         user.ID,
			"create_date":     user.CreateDate,
			"last_login_date": user.LastLoginDate,
			"email":           user.Email,
		}))
	} else {
		c.JSON(404, ErrorResponse(err.Error()))
	}
}

func (r *Controller) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := r.service.CreateUserVerification(req.Email, req.Password)
	if err != nil {
		c.JSON(200, ErrorResponse(err.Error()))
	} else {
		c.JSON(200, SuccessResponse(nil))
	}
}

func (r *Controller) UpdateProfile(c *gin.Context) {
	session := sessions.Default(c)
	var req ModifyAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := r.service.UpdateUser(session.Get("userId").(string), "", req.Password)

	if err != nil {
		c.JSON(200, ErrorResponse(err.Error()))
	} else {
		c.JSON(200, SuccessResponse(nil))
	}
}

func (r *Controller) CreateForgotPasswordRequest(c *gin.Context) {
	err := r.service.CreateAndSendResetPassword(c.Param("email"))

	if err != nil {
		fmt.Println(err.Error() + " " + c.Query("email"))
	}

	c.JSON(200, SuccessResponse(nil))
}

func (r *Controller) GetResetPasswordRequest(c *gin.Context) {
	_, err := r.service.GetResetPassword(c.Param("token"))

	//TODO: Check if token has expired
	if err != nil {
		c.JSON(200, ErrorResponse(err.Error()))
	} else {
		c.JSON(200, SuccessResponse(nil))
	}
}

func (r *Controller) ResetPassword(c *gin.Context) {
	var req ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := r.service.ResetPassword(req.Token, req.Password)

	if err != nil {
		c.JSON(200, ErrorResponse(err.Error()))
	} else {
		c.JSON(200, SuccessResponse(nil))
	}
}

func (r *Controller) VerifyAccount(c *gin.Context) {
	session := sessions.Default(c)
	id, err := r.service.CreateUser(c.Param("token"))

	if err == nil {
		session.Set("userId", id)
		session.Save()
		c.Header("X-Csrf-Token", csrf.GetToken(c))
		c.JSON(200, SuccessResponse(nil))
	} else {
		c.JSON(200, ErrorResponse(err.Error()))
	}
}

func (r *Controller) GetEntryByDate(c *gin.Context) {
	session := sessions.Default(c)
	entry, err := r.service.GetJournalEntryByDate(session.Get("userId").(string), now.MustParse(c.Param("date")))

	if err != nil {
		c.JSON(200, ErrorResponse(err.Error()))
	} else {
		c.JSON(200, SuccessResponse(entry))
	}
}

func (r *Controller) DeleteEntry(c *gin.Context) {
	session := sessions.Default(c)
	err := r.service.DeleteJournalEntry(c.Param("id"), session.Get("userId").(string))

	if err != nil {
		c.JSON(200, ErrorResponse(err.Error()))
	} else {
		c.JSON(200, SuccessResponse(nil))
	}
}

func (r *Controller) CreateEntry(c *gin.Context) {
	session := sessions.Default(c)
	var entry CreateEntryRequest
	if err := c.ShouldBindJSON(&entry); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := r.service.CreateJournalEntry(session.Get("userId").(string), entry.Entries, now.MustParse(entry.Date))

	if err != nil {
		c.JSON(200, ErrorResponse(err.Error()))
	} else {
		//Need to return the result because there's a delay before the entry gets indexed into elastic search
		c.JSON(200, SuccessResponse(result))
	}
}

func (r *Controller) UpdateEntry(c *gin.Context) {
	session := sessions.Default(c)
	var entry ModifyEntryRequest
	if err := c.ShouldBindJSON(&entry); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	err := r.service.UpdateJournalEntry(c.Param("id"), session.Get("userId").(string), entry.Entries)

	if err != nil {
		c.JSON(200, ErrorResponse(err.Error()))
	} else {
		c.JSON(200, SuccessResponse(nil))
	}
}

func (r *Controller) SearchJournal(c *gin.Context) {
	session := sessions.Default(c)
	var req SearchJournalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

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

	results, total, err := r.service.SearchJournal(session.Get("userId").(string), query)

	if err != nil {
		c.JSON(500, ErrorResponse(err.Error()))
	} else {
		c.JSON(200, PagedSuccessResponse(results, total))
	}
}

func (r *Controller) SearchJournalDates(c *gin.Context) {
	session := sessions.Default(c)
	var req SearchJournalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var query JournalQuery
	query.Query = req.Query

	if req.Start != "" {
		query.Start = now.MustParse(req.Start)
	}

	if req.End != "" {
		query.End = now.MustParse(req.End)
	} else if req.Start != "" { // bit hacky, probably should have a flag in the request to do a default range
		query.End = query.Start.AddDate(0, 3, 0)
		query.Start = query.Start.AddDate(0, -3, 0)
	}

	results, err := r.service.SearchJournalDates(session.Get("userId").(string), query)
	if err != nil {
		c.JSON(500, ErrorResponse(err.Error()))
	} else {
		c.JSON(200, SuccessResponse(results))
	}
}

func (r *Controller) GetStreak(c *gin.Context) {
	session := sessions.Default(c)

	streak, err := r.service.GetStreak(session.Get("userId").(string), now.MustParse(c.Param("date")), 10)

	if err != nil {
		c.JSON(500, ErrorResponse(err.Error()))
	} else {
		c.JSON(200, SuccessResponse(streak))
	}
}
