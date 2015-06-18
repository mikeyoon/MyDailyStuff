package lib_test

import (
	"github.com/martini-contrib/render"
	"github.com/martini-contrib/sessions"
	"github.com/mikeyoon/MyDailyStuff/lib"
	. "github.com/onsi/ginkgo"
	//. "github.com/onsi/gomega"
	"code.google.com/p/go-uuid/uuid"
	"github.com/go-martini/martini"
	"github.com/jinzhu/now"
	"github.com/stretchr/testify/mock"
	"html/template"
	"net/http"
	"time"
)

type MockService struct {
	mock.Mock
}

func (s MockService) GetUserById(id string) (lib.User, error) {
	args := s.Called(id)
	return args.Get(0).(lib.User), args.Error(1)
}

func (s MockService) GetUserByEmail(email string) (lib.User, error) {
	args := s.Called(email)
	return args.Get(0).(lib.User), args.Error(1)
}

func (s MockService) GetUserByLogin(email string, password string) (lib.User, error) {
	args := s.Called(email, password)
	return args.Get(0).(lib.User), args.Error(1)
}

func (s MockService) UpdateUser(id string, email string, password string) error {
	args := s.Called(id, email, password)
	return args.Error(0)
}

func (s MockService) GetUserVerification(token string) (lib.UserVerification, error) {
	args := s.Called(token)
	return args.Get(0).(lib.UserVerification), args.Error(1)
}

func (s MockService) CreateUserVerification(email string, password string) error {
	args := s.Called(email, password)
	return args.Error(0)
}

func (s MockService) CreateUser(verificationToken string) (string, error) {
	args := s.Called(verificationToken)
	return args.String(0), args.Error(1)
}

func (s MockService) GetResetPassword(token string) (lib.PasswordReset, error) {
	args := s.Called(token)
	return args.Get(0).(lib.PasswordReset), args.Error(1)
}

func (s MockService) CreateAndSendResetPassword(email string) error {
	args := s.Called(email)
	return args.Error(0)
}

func (s MockService) ResetPassword(token string, password string) error {
	args := s.Called(token, password)
	return args.Error(0)
}

func (s MockService) CreateJournalEntry(userId string, entries []string, date time.Time) (lib.JournalEntry, error) {
	args := s.Called(userId, entries, date)
	return args.Get(0).(lib.JournalEntry), args.Error(1)
}

func (s MockService) UpdateJournalEntry(id string, userId string, entries []string) error {
	args := s.Called(id, userId, entries)
	return args.Error(0)
}

func (s MockService) DeleteJournalEntry(id string, userId string) error {
	args := s.Called(id, userId)
	return args.Error(0)
}

func (s MockService) GetJournalEntryByDate(userId string, date time.Time) (lib.JournalEntry, error) {
	args := s.Called(userId, date)
	return args.Get(0).(lib.JournalEntry), args.Error(1)
}

func (s MockService) SearchJournal(userId string, jq lib.JournalQuery) ([]lib.JournalEntry, error) {
	args := s.Called(userId, jq)
	return args.Get(0).([]lib.JournalEntry), args.Error(1)
}

func (s MockService) SearchJournalDates(userId string, jq lib.JournalQuery) ([]string, error) {
	args := s.Called(userId, jq)
	return args.Get(0).([]string), args.Error(1)
}

func (s MockService) GetStreak(userId string, date time.Time, limit int) (int, error) {
	args := s.Called(userId, date, limit)
	return args.Get(0).(int), args.Error(1)
}

type MockSession struct {
	mock.Mock
}

func (m MockSession) Get(key interface{}) interface{} {
	args := m.Called(key)
	return args.Get(0)
}
func (m MockSession) Set(key interface{}, val interface{}) {
	m.Called(key, val)
}
func (m MockSession) Delete(key interface{}) {
	m.Called(key)
}
func (m MockSession) Clear() {
	m.Called()
}
func (m MockSession) AddFlash(value interface{}, vars ...string) {
	m.Called(value, vars)
}
func (m MockSession) Flashes(vars ...string) []interface{} {
	args := m.Called(vars)
	return args.Get(0).([]interface{})
}
func (m MockSession) Options(options sessions.Options) {
	m.Called(options)
}

type MockRender struct {
	mock.Mock
}

func (m MockRender) JSON(status int, v interface{}) {
	m.Called(status, v)
}
func (m MockRender) HTML(status int, name string, v interface{}, htmlOpt ...render.HTMLOptions) {
	m.Called(status, name, v, htmlOpt)
}
func (m MockRender) XML(status int, v interface{}) {
	m.Called(status, v)
}
func (m MockRender) Data(status int, v []byte) {
	m.Called(status, v)
}
func (m MockRender) Error(status int) {
	m.Called(status)
}
func (m MockRender) Status(status int) {
	m.Called(status)
}
func (m MockRender) Redirect(location string, status ...int) {
	m.Called(location, status)
}
func (m MockRender) Template() *template.Template {
	args := m.Called()
	return args.Get(0).(*template.Template)
}
func (m MockRender) Header() http.Header {
	args := m.Called()
	return args.Get(0).(http.Header)
}

var _ = Describe("Controller", func() {
	controller := new(lib.Controller)

	var service MockService
	var session MockSession
	var render MockRender

	mockUser1 := lib.User{
		UserId:        uuid.New(),
		Email:         "asdf@asdf.com",
		PasswordHash:  "hash",
		CreateDate:    time.Now(),
		LastLoginDate: time.Now(),
	}

	mockEntry1 := lib.JournalEntry{
		UserId:     mockUser1.UserId,
		Entries:    []string{"entry1", "entry2"},
		Date:       time.Now(),
		CreateDate: time.Now(),
		Id:         uuid.New(),
	}

	BeforeEach(func() {
		session = MockSession{}
		render = MockRender{}
		service = MockService{}
	})

	Describe("Login", func() {
		Context("Where the username and password are invalid", func() {
			It("should return not found result", func() {
				service.On("GetUserByLogin", "asdf@asdf.com", "password").Return(lib.User{}, lib.UserNotFound)
				render.On("JSON", 200, lib.ErrorResponse("User not found")).Return()

				controller.SetOptions(service, false)

				controller.Login(lib.LoginRequest{Email: "asdf@asdf.com", Password: "password"},
					session, render)
			})
		})

		Context("Where the username and password are valid", func() {
			It("should return user", func() {
				service.On("GetUserByLogin", mockUser1.Email, "password").Return(mockUser1, nil)
				render.On("JSON", 200, mock.Anything).Return()
				session.On("Options", sessions.Options{
					Path:     "/",
					HttpOnly: true,
					Secure:   false,
					MaxAge:   0,
				}).Return()
				session.On("Set", "userId", mockUser1.UserId).Return()

				controller.SetOptions(service, false)

				controller.Login(lib.LoginRequest{Email: mockUser1.Email, Password: "password"},
					session, render)
			})
		})

		Context("Where the username and password are valid and persist login", func() {
			It("should return user", func() {
				service.On("GetUserByLogin", mockUser1.Email, "password").Return(mockUser1, nil)
				render.On("JSON", 200, mock.Anything).Return()
				session.On("Options", sessions.Options{
					Path:     "/",
					HttpOnly: true,
					Secure:   true,
					MaxAge:   2592000,
				}).Return()
				session.On("Set", "userId", mockUser1.UserId).Return()

				controller.SetOptions(service, true)

				controller.Login(lib.LoginRequest{Email: mockUser1.Email, Password: "password", Persist: true},
					session, render)
			})
		})
	})

	Describe("Logout", func() {
		Context("User is logged in", func() {
			It("should log the user out", func() {
				session.On("Delete", "userId").Return()
				session.On("Options", sessions.Options{MaxAge: -1}).Return()
				render.On("JSON", 200, lib.SuccessResponse(nil)).Return()
				controller.SetOptions(service, false)

				controller.Logout(session, render)
			})
		})
	})

	Describe("Get Profile", func() {
		Context("User is valid", func() {
			It("should return the user information", func() {
				session.On("Get", "userId").Return(mockUser1.UserId)
				service.On("GetUserById", mockUser1.UserId).Return(mockUser1, nil)
				render.On("JSON", 200, lib.SuccessResponse(map[string]interface{}{
					"user_id":         mockUser1.UserId,
					"create_date":     mockUser1.CreateDate,
					"last_login_date": mockUser1.LastLoginDate,
					"email":           mockUser1.Email,
				})).Return()
				controller.SetOptions(service, false)

				controller.Profile(session, render)
			})
		})

		Context("User does not exist", func() {
			It("should return 404 response", func() {
				session.On("Get", "userId").Return(mockUser1.UserId)
				service.On("GetUserById", mockUser1.UserId).Return(lib.User{}, lib.UserNotFound)
				render.On("JSON", 404, lib.ErrorResponse(lib.UserNotFound.Error())).Return()
				controller.SetOptions(service, false)

				controller.Profile(session, render)
			})
		})
	})

	Describe("Register", func() {
		Context("Where the email is unused", func() {
			It("should return success response", func() {
				service.On("CreateUserVerification", "test@test.com", "password").Return(nil)
				render.On("JSON", 200, lib.SuccessResponse(nil)).Return()

				controller.SetOptions(service, false)
				controller.Register(lib.RegisterRequest{Email: "test@test.com", Password: "password"}, render)
			})
		})

		Context("Where the email is in use", func() {
			It("should return failure response", func() {
				service.On("CreateUserVerification", "test@test.com", "password").Return(lib.EmailInUse)
				render.On("JSON", 200, lib.ErrorResponse(lib.EmailInUse.Error())).Return()

				controller.SetOptions(service, false)
				controller.Register(lib.RegisterRequest{Email: "test@test.com", Password: "password"}, render)
			})
		})
	})

	Describe("Update Profile", func() {
		Context("Where there is no error", func() {
			It("should return success response", func() {
				session.On("Get", "userId").Return(mockUser1.Email)
				service.On("UpdateUser", mockUser1.Email, "", "password").Return(nil)
				render.On("JSON", 200, lib.SuccessResponse(nil)).Return()

				controller.SetOptions(service, false)
				controller.UpdateProfile(lib.ModifyAccountRequest{Password: "password"}, session, render)
			})
		})

		Context("Where there is an error", func() {
			It("should return failure response", func() {
				session.On("Get", "userId").Return(mockUser1.Email)
				service.On("UpdateUser", mockUser1.Email, "", "password").Return(lib.UserNotFound)
				render.On("JSON", 200, lib.ErrorResponse(lib.UserNotFound.Error())).Return()

				controller.SetOptions(service, false)
				controller.UpdateProfile(lib.ModifyAccountRequest{Password: "password"}, session, render)
			})
		})
	})

	Describe("Create Send Password Request", func() {
		Context("When create request successful", func() {
			It("should return success response", func() {
				service.On("CreateAndSendResetPassword", "asdf@asdf.com").Return(nil)
				render.On("JSON", 200, lib.SuccessResponse(nil)).Return()
				controller.SetOptions(service, false)

				controller.CreateForgotPasswordRequest(martini.Params{"email": "asdf@asdf.com"}, session, render)
			})
		})

		Context("When create request failed", func() {
			It("should still return success response", func() {
				service.On("CreateAndSendResetPassword", "asdf@asdf.com").Return(lib.UserNotFound)
				render.On("JSON", 200, lib.SuccessResponse(nil)).Return()
				controller.SetOptions(service, false)

				controller.CreateForgotPasswordRequest(martini.Params{"email": "asdf@asdf.com"}, session, render)
			})
		})
	})

	Describe("Get Reset Password Request", func() {
		Context("Where reset token exists", func() {
			It("should return success response", func() {
				service.On("GetResetPassword", "token").Return(lib.PasswordReset{}, nil)
				render.On("JSON", 200, lib.SuccessResponse(nil)).Return()
				controller.SetOptions(service, false)

				controller.GetResetPasswordRequest(martini.Params{"token": "token"}, session, render)
			})
		})

		Context("When service returns error", func() {
			It("should return failure", func() {
				service.On("GetResetPassword", "token").Return(lib.PasswordReset{}, lib.ResetNotFound)
				render.On("JSON", 200, lib.ErrorResponse(lib.ResetNotFound.Error())).Return()
				controller.SetOptions(service, false)

				controller.GetResetPasswordRequest(martini.Params{"token": "token"}, session, render)
			})
		})
	})

	Describe("Reset Password", func() {
		Context("Where reset service successful", func() {
			It("should return success response", func() {
				service.On("ResetPassword", "token", "password").Return(nil)
				render.On("JSON", 200, lib.SuccessResponse(nil)).Return()
				controller.SetOptions(service, false)

				controller.ResetPassword(lib.ResetPasswordRequest{Token: "token", Password: "password"}, session, render)
			})
		})

		Context("When service returns error", func() {
			It("should return failure", func() {
				service.On("ResetPassword", "token", "password").Return(lib.ResetNotFound)
				render.On("JSON", 200, lib.ErrorResponse(lib.ResetNotFound.Error())).Return()
				controller.SetOptions(service, false)

				controller.ResetPassword(lib.ResetPasswordRequest{Token: "token", Password: "password"}, session, render)
			})
		})
	})

	Describe("Verify Account", func() {
		Context("Where create user service successful", func() {
			It("should return success response", func() {
				service.On("CreateUser", "token").Return("whatever", nil)
				render.On("JSON", 200, lib.SuccessResponse(nil)).Return()
				session.On("Set", "userId", "whatever").Return()
				controller.SetOptions(service, false)

				controller.VerifyAccount(martini.Params{"token": "token"}, session, render)
			})
		})

		Context("Where create user service failed", func() {
			It("should return failure", func() {
				service.On("CreateUser", "token").Return("", lib.VerificationNotFound)
				render.On("JSON", 200, lib.ErrorResponse(lib.VerificationNotFound.Error())).Return()
				controller.SetOptions(service, false)

				controller.VerifyAccount(martini.Params{"token": "token"}, session, render)
			})
		})
	})

	Describe("Get Entry By Date", func() {
		Context("Where entry is found", func() {
			It("should return entry", func() {
				service.On("GetJournalEntryByDate", mockUser1.UserId, now.MustParse("2005-5-1")).Return(lib.JournalEntry{}, nil)
				render.On("JSON", 200, lib.SuccessResponse(lib.JournalEntry{})).Return()
				session.On("Get", "userId").Return(mockUser1.UserId)
				controller.SetOptions(service, false)

				controller.GetEntryByDate(render, martini.Params{"date": "2005-5-1"}, session)
			})
		})

		Context("Where service returns failure", func() {
			It("should return failure", func() {
				service.On("GetJournalEntryByDate", mockUser1.UserId, now.MustParse("2005-5-1")).Return(lib.JournalEntry{}, lib.EntryNotFound)
				render.On("JSON", 200, lib.ErrorResponse(lib.EntryNotFound.Error())).Return()
				session.On("Get", "userId").Return(mockUser1.UserId)
				controller.SetOptions(service, false)

				controller.GetEntryByDate(render, martini.Params{"date": "2005-5-1"}, session)
			})
		})
	})

	Describe("Delete Entry", func() {
		Context("Where entry successfully deleted", func() {
			It("should return success response", func() {
				service.On("DeleteJournalEntry", mockEntry1.Id, mockUser1.UserId).Return(nil)
				session.On("Get", "userId").Return(mockUser1.UserId)
				render.On("JSON", 200, lib.SuccessResponse(nil)).Return()

				controller.SetOptions(service, false)
				controller.DeleteEntry(martini.Params{"id": mockEntry1.Id}, session, render)
			})
		})

		Context("Where entry failed to delete", func() {
			It("should return failure response", func() {
				service.On("DeleteJournalEntry", mockEntry1.Id, mockUser1.UserId).Return(lib.EntryNotFound)
				session.On("Get", "userId").Return(mockUser1.UserId)
				render.On("JSON", 200, lib.ErrorResponse(lib.EntryNotFound.Error())).Return()

				controller.SetOptions(service, false)
				controller.DeleteEntry(martini.Params{"id": mockEntry1.Id}, session, render)
			})
		})
	})

	Describe("Create Entry", func() {
		Context("Where entry successfully created", func() {
			It("should return success response", func() {
				service.On("CreateJournalEntry", mockUser1.UserId, mockEntry1.Entries, now.MustParse("2001-5-1")).Return(mockEntry1, nil)
				session.On("Get", "userId").Return(mockUser1.UserId)
				render.On("JSON", 200, lib.SuccessResponse(mockEntry1)).Return()

				controller.SetOptions(service, false)
				controller.CreateEntry(lib.CreateEntryRequest{Date: "2001-5-1", Entries: mockEntry1.Entries}, session, render)
			})
		})

		Context("Where entry failed to create", func() {
			It("should return failure response", func() {
				service.On("CreateJournalEntry", mockUser1.UserId, mockEntry1.Entries, now.MustParse("2001-5-1")).
					Return(lib.JournalEntry{}, lib.EntryAlreadyExists)
				session.On("Get", "userId").Return(mockUser1.UserId)
				render.On("JSON", 200, lib.ErrorResponse(lib.EntryAlreadyExists.Error())).Return()

				controller.SetOptions(service, false)
				controller.CreateEntry(lib.CreateEntryRequest{Date: "2001-5-1", Entries: mockEntry1.Entries}, session, render)
			})
		})
	})

	Describe("Update Entry", func() {
		Context("Where entry successfully created", func() {
			It("should return success response", func() {
				service.On("UpdateJournalEntry", "id", mockUser1.UserId, mockEntry1.Entries).Return(nil)
				session.On("Get", "userId").Return(mockUser1.UserId)
				render.On("JSON", 200, lib.SuccessResponse(nil)).Return()

				controller.SetOptions(service, false)
				controller.UpdateEntry(lib.ModifyEntryRequest{Entries: mockEntry1.Entries}, session, martini.Params{"id": "id"}, render)
			})
		})

		Context("Where entry failed to create", func() {
			It("should return failure response", func() {
				service.On("UpdateJournalEntry", "id", mockUser1.UserId, mockEntry1.Entries).
					Return(lib.EntryNotFound)
				session.On("Get", "userId").Return(mockUser1.UserId)
				render.On("JSON", 200, lib.ErrorResponse(lib.EntryNotFound.Error())).Return()

				controller.SetOptions(service, false)
				controller.UpdateEntry(lib.ModifyEntryRequest{Entries: mockEntry1.Entries}, session, martini.Params{"id": "id"}, render)
			})
		})
	})

	Describe("Search Journal", func() {
		Context("With successful result with start date specified", func() {
			It("should return entries", func() {
				service.On("SearchJournal", mockUser1.UserId, lib.JournalQuery{
					Query: "query",
					Start: now.MustParse("2005-1-1"),
				}).Return([]lib.JournalEntry{mockEntry1}, nil)
				session.On("Get", "userId").Return(mockUser1.UserId)
				render.On("JSON", 200, lib.SuccessResponse([]lib.JournalEntry{mockEntry1})).Return()

				controller.SetOptions(service, false)
				controller.SearchJournal(lib.SearchJournalRequest{
					Query: "query",
					Start: "2005-1-1",
				}, session, render)
			})
		})

		Context("With successful result with end date specified", func() {
			It("should return entries", func() {
				service.On("SearchJournal", mockUser1.UserId, lib.JournalQuery{
					Query: "query",
					End:   now.MustParse("2005-2-1"),
				}).Return([]lib.JournalEntry{mockEntry1}, nil)
				session.On("Get", "userId").Return(mockUser1.UserId)
				render.On("JSON", 200, lib.SuccessResponse([]lib.JournalEntry{mockEntry1})).Return()

				controller.SetOptions(service, false)
				controller.SearchJournal(lib.SearchJournalRequest{
					Query: "query",
					End:   "2005-2-1",
				}, session, render)
			})
		})

		Context("With successful result with no date specified", func() {
			It("should return entries", func() {
				service.On("SearchJournal", mockUser1.UserId, lib.JournalQuery{
					Query: "query",
				}).Return([]lib.JournalEntry{mockEntry1}, nil)
				session.On("Get", "userId").Return(mockUser1.UserId)
				render.On("JSON", 200, lib.SuccessResponse([]lib.JournalEntry{mockEntry1})).Return()

				controller.SetOptions(service, false)
				controller.SearchJournal(lib.SearchJournalRequest{
					Query: "query",
				}, session, render)
			})
		})

		Context("When search returns error", func() {
			It("should return error response", func() {
				service.On("SearchJournal", mockUser1.UserId, lib.JournalQuery{}).Return([]lib.JournalEntry{}, lib.UserUnauthorized)
				session.On("Get", "userId").Return(mockUser1.UserId)
				render.On("JSON", 500, lib.ErrorResponse(lib.UserUnauthorized.Error())).Return()

				controller.SetOptions(service, false)
				controller.SearchJournal(lib.SearchJournalRequest{}, session, render)
			})
		})
	})

	Describe("Search Journal Dates", func() {
		Context("With successful result with start date specified", func() {
			It("should return dates", func() {
				service.On("SearchJournalDates", mockUser1.UserId, lib.JournalQuery{
					Start: now.MustParse("2005-1-1"),
				}).Return([]string{"2010-1-1"}, nil)
				session.On("Get", "userId").Return(mockUser1.UserId)
				render.On("JSON", 200, lib.SuccessResponse([]string{"2010-1-1"})).Return()

				controller.SetOptions(service, false)
				controller.SearchJournalDates(lib.SearchJournalRequest{Start: "2005-1-1"}, session, render)
			})
		})

		Context("With successful result with end date specified", func() {
			It("should return dates", func() {
				service.On("SearchJournalDates", mockUser1.UserId, lib.JournalQuery{
					End: now.MustParse("2005-2-1"),
				}).Return([]string{"2004-1-1"}, nil)
				session.On("Get", "userId").Return(mockUser1.UserId)
				render.On("JSON", 200, lib.SuccessResponse([]string{"2004-1-1"})).Return()

				controller.SetOptions(service, false)
				controller.SearchJournalDates(lib.SearchJournalRequest{End: "2005-2-1"}, session, render)
			})
		})

		Context("With successful result with no date specified", func() {
			It("should return dates", func() {
				service.On("SearchJournalDates", mockUser1.UserId, lib.JournalQuery{}).Return([]string{"2004-1-1", "2010-1-1"}, nil)
				session.On("Get", "userId").Return(mockUser1.UserId)
				render.On("JSON", 200, lib.SuccessResponse([]string{"2004-1-1", "2010-1-1"})).Return()

				controller.SetOptions(service, false)
				controller.SearchJournalDates(lib.SearchJournalRequest{}, session, render)
			})
		})

		Context("When search returns error", func() {
			It("should return error response", func() {
				service.On("SearchJournalDates", mockUser1.UserId, lib.JournalQuery{}).Return([]string{}, lib.UserUnauthorized)
				session.On("Get", "userId").Return(mockUser1.UserId)
				render.On("JSON", 500, lib.ErrorResponse(lib.UserUnauthorized.Error())).Return()

				controller.SetOptions(service, false)
				controller.SearchJournalDates(lib.SearchJournalRequest{}, session, render)
			})
		})
	})

	Describe("Get Streak", func() {
		Context("With successful result", func() {
			It("should return success response", func() {
				date := time.Now().Format("2006-01-02")
				service.On("GetStreak", mockUser1.UserId, now.MustParse(date), 10).Return(5, nil)
				session.On("Get", "userId").Return(mockUser1.UserId)
				render.On("JSON", 200, lib.SuccessResponse(5)).Return()

				controller.SetOptions(service, false)
				controller.GetStreak(martini.Params{"date": date}, session, render)
			})
		})

		Context("With failed result", func() {
			It("should return success response", func() {
				date := time.Now().Format("2006-01-02")

				service.On("GetStreak", mockUser1.UserId, now.MustParse(date), 10).Return(0, lib.UserUnauthorized)
				session.On("Get", "userId").Return(mockUser1.UserId)
				render.On("JSON", 500, lib.ErrorResponse(lib.UserUnauthorized.Error())).Return()

				controller.SetOptions(service, false)
				controller.GetStreak(martini.Params{"date": date}, session, render)
			})
		})
	})
})
