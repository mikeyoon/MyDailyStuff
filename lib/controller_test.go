package lib_test

import (
	"github.com/martini-contrib/render"
	"github.com/martini-contrib/sessions"
	"github.com/mikeyoon/MyDailyStuff/lib"
	. "github.com/onsi/ginkgo"
	//. "github.com/onsi/gomega"
	"github.com/stretchr/testify/mock"
	"html/template"
	"net/http"
	"time"
	"code.google.com/p/go-uuid/uuid"
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
		UserId: uuid.New(),
		Email: "asdf@asdf.com",
		PasswordHash: "hash",
		CreateDate: time.Now(),
		LastLoginDate: time.Now(),
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
					Path: "/",
					HttpOnly: true,
					Secure: false,
					MaxAge: 0,
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
					Path: "/",
					HttpOnly: true,
					Secure: true,
					MaxAge: 2592000,
				}).Return()
				session.On("Set", "userId", mockUser1.UserId).Return()

				controller.SetOptions(service, true)

				controller.Login(lib.LoginRequest{Email: mockUser1.Email, Password: "password", Persist: true},
					session, render)
			})
		})
	})
})
