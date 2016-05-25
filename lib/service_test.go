package lib

import (
	"code.google.com/p/go-uuid/uuid"
	"encoding/base64"
	elastigo "github.com/mikeyoon/elastigo/lib"
	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
	. "github.com/sendgrid/sendgrid-go"
	"github.com/stretchr/testify/mock"
	"golang.org/x/crypto/bcrypt"
	"strings"
	"time"
)

type MockSendGridClient struct {
	mock.Mock
}

// Send will send mail using SG web API
func (sg *MockSendGridClient) Send(m *SGMail) error {
	args := sg.Called(m)
	return args.Error(0)
}

var _ = Describe("Service", func() {
	service := MdsService{}
	conn := elastigo.NewConn()

	TestIndex := "test"

	_, _ = conn.DeleteIndex(TestIndex)

	service.Init(ServiceOptions{
		MainIndex:  TestIndex,
		ElasticUrl: "http://localhost:9200",
	})

	//Test Email Verification Data
	pass2, _ := bcrypt.GenerateFromPassword([]byte("whatever"), 10)
	verify1 := UserVerification{
		Email:        "test2@test.com",
		Token:        uuid.New(),
		PasswordHash: base64.StdEncoding.EncodeToString(pass2),
		CreateDate:   time.Now(),
	}

	//Test Users Data
	pass1, _ := bcrypt.GenerateFromPassword([]byte("something"), 10)
	testUser1 := User{
		UserId:        uuid.New(),
		Email:         "test@test.com",
		PasswordHash:  base64.StdEncoding.EncodeToString(pass1),
		CreateDate:    time.Now(),
		LastLoginDate: time.Now(),
	}

	//Test Journal Data
	journal1 := JournalEntry{
		UserId:     testUser1.UserId,
		Entries:    []string{"test entry 1", "test entry 2"},
		Date:       time.Date(2002, 5, 20, 0, 0, 0, 0, time.UTC),
		CreateDate: time.Now(),
		Id:         uuid.New(),
	}

	journal2 := JournalEntry{
		UserId:     testUser1.UserId,
		Entries:    []string{"another entry 1", "another entry 2"},
		Date:       time.Date(2002, 5, 25, 0, 0, 0, 0, time.UTC),
		CreateDate: time.Now(),
		Id:         uuid.New(),
	}

	journal3 := JournalEntry{
		UserId:     testUser1.UserId,
		Entries:    []string{"some entry 1", "some entry 2"},
		Date:       time.Date(2002, 6, 20, 0, 0, 0, 0, time.UTC),
		CreateDate: time.Now(),
		Id:         uuid.New(),
	}

	streak1 := JournalEntry{
		UserId:     testUser1.UserId,
		Entries:    []string{"some entry 1", "some entry 2"},
		Date:       time.Date(time.Now().Year(), time.Now().Month(), time.Now().Day(), 0, 0, 0, 0, time.UTC).Add(-time.Hour * 24 * 1),
		CreateDate: time.Now(),
		Id:         uuid.New(),
	}

	streak2 := JournalEntry{
		UserId:     testUser1.UserId,
		Entries:    []string{"some entry 1", "some entry 2"},
		Date:       time.Date(time.Now().Year(), time.Now().Month(), time.Now().Day(), 0, 0, 0, 0, time.UTC).Add(-time.Hour * 24 * 2),
		CreateDate: time.Now(),
		Id:         uuid.New(),
	}

	streak4 := JournalEntry{
		UserId:     testUser1.UserId,
		Entries:    []string{"some entry 1", "some entry 2"},
		Date:       time.Date(time.Now().Year(), time.Now().Month(), time.Now().Day(), 0, 0, 0, 0, time.UTC).Add(-time.Hour * 24 * 4),
		CreateDate: time.Now(),
		Id:         uuid.New(),
	}

	//Test Password Reset Data
	reset1 := PasswordReset{
		UserId:     testUser1.UserId,
		Token:      uuid.New(),
		CreateDate: time.Now(),
	}

	BeforeEach(func() {
		conn.IndexWithParameters(TestIndex, UserType, testUser1.UserId, "", 0, "", "", "", 0, "", "", true, nil, testUser1)
		conn.IndexWithParameters(TestIndex, ResetType, reset1.Token, "", 0, "", "", "", 0, "", "", true, nil, reset1)
		conn.IndexWithParameters(TestIndex, VerifyType, verify1.Token, "", 0, "", "", "", 0, "", "", true, nil, verify1)
		conn.IndexWithParameters(TestIndex, JournalType, journal1.Id, "", 0, "", "", "", 0, "", "", true, nil, journal1)
	})

	AfterEach(func() {
		conn.DeleteByQuery([]string{TestIndex}, []string{UserType, ResetType, VerifyType, JournalType}, nil, elastigo.Search("").Query(elastigo.Query().All()))
	})

	Describe("Init with login", func() {
		It("should fail to initialize", func() {
			serviceWithAuth := MdsService{}
			serviceWithAuth.Init(ServiceOptions{
				MainIndex:        TestIndex,
				ElasticUrl:       "http://test:pass@localhost:9200",
				SendGridUsername: "sg_user",
			})

			Expect(serviceWithAuth.es.Username).To(Equal("test"))
			Expect(serviceWithAuth.es.Password).To(Equal("pass"))
			Expect(serviceWithAuth.MailClient).NotTo(BeNil())
		})
	})

	Describe("Storing mapping", func() {
		Context("On Initialization", func() {
			It("should have each type", func() {
				Expect(true).To(Equal(true))
			})
		})
	})

	Describe("Get user by email", func() {
		Context("Where the user exists", func() {
			It("should have found the user", func() {
				user, err := service.GetUserByEmail(testUser1.Email)

				Expect(err).To(BeNil())
				Expect(user.Email).To(Equal(testUser1.Email))
			})
		})

		Context("Where the user exists, but with upper case", func() {
			It("should have found the user", func() {
				user, err := service.GetUserByEmail(strings.ToUpper(testUser1.Email))

				Expect(err).To(BeNil())
				Expect(user.Email).To(Equal(testUser1.Email))
			})
		})

		Context("Where the user does not exist", func() {
			It("should not return result", func() {
				user, err := service.GetUserByEmail("nothing@nothing.com")
				Expect(err).To(Equal(UserNotFound))
				Expect(user).To(Equal(User{}))
			})
		})
	})

	Describe("Get user by login", func() {
		Context("Where the login matches", func() {
			It("should find the user", func() {
				user, err := service.GetUserByLogin(testUser1.Email, "something")

				Expect(err).To(BeNil())
				Expect(user.Email).To(Equal(testUser1.Email))
			})
		})

		Context("Where the login doesn't match", func() {
			It("should not return the result", func() {
				user, err := service.GetUserByLogin(testUser1.Email, "Something")

				Expect(err).To(Equal(UserNotFound))
				Expect(user).To(Equal(User{}))
			})
		})

		Context("Where the email doesn't match", func() {
			It("should not return the result", func() {
				user, err := service.GetUserByLogin("asdf@asdf.com", "whatever")

				Expect(err).To(Equal(UserNotFound))
				Expect(user).To(Equal(User{}))
			})
		})
	})

	Describe("Get user by id", func() {
		Context("Where the user with the id exists", func() {
			It("should find the user", func() {
				user, err := service.GetUserById(testUser1.UserId)

				Expect(err).To(BeNil())
				Expect(user.Email).To(Equal(testUser1.Email))
			})
		})

		Context("Where the id doesn't match", func() {
			It("should not return the result", func() {
				user, err := service.GetUserById(uuid.New())

				Expect(err).To(Equal(UserNotFound))
				Expect(user).To(Equal(User{}))
			})
		})
	})

	Describe("Update user email and password", func() {
		Context("Where the user exists", func() {
			It("should modify the user email and password", func() {
				service.UpdateUser(testUser1.UserId, "something@else.com", "newpass")
				var actual User
				err := conn.GetSource(TestIndex, UserType, testUser1.UserId, nil, &actual)

				Expect(err).To(BeNil(), "Updated user be found")

				hash, _ := base64.StdEncoding.DecodeString(actual.PasswordHash)

				err = bcrypt.CompareHashAndPassword(hash, []byte("newpass"))

				Expect(err).To(BeNil(), "Password must be newpass")
				Expect(actual.Email).To(Equal("something@else.com"), "Email should be new")
			})
		})

		Context("Where the user does not exist", func() {
			It("should return UserNotFound error", func() {
				err := service.UpdateUser(uuid.New(), "", "newpass")
				Expect(err).To(Equal(UserNotFound))
			})
		})

		Context("Where the user exists but password too short", func() {
			It("should do nothing", func() {
				err := service.UpdateUser(testUser1.UserId, "", "")
				Expect(err).To(BeNil())
			})
		})
	})

	Describe("Get user verification", func() {
		Context("Where the verification exists", func() {
			It("should find the verification", func() {
				actual, err := service.GetUserVerification(verify1.Token)

				Expect(err).To(BeNil())
				Expect(actual.Email).To(Equal(verify1.Email))
			})
		})

		Context("Where the verification does not exist", func() {
			It("should return not found error", func() {
				actual, err := service.GetUserVerification(uuid.New())

				Expect(err).To(Equal(VerificationNotFound))
				Expect(actual).To(Equal(UserVerification{}))
			})
		})
	})

	Describe("Create user verification", func() {
		Context("Where the email address already in use", func() {
			It("should return UserAlreadyExists error", func() {
				err := service.CreateUserVerification(testUser1.Email, "Some password")

				Expect(err).To(Equal(EmailInUse))
			})
		})

		Context("Where the email is new", func() {
			It("should send the message", func() {
				client := new(MockSendGridClient)
				service.MailClient = client

				client.On("Send", mock.AnythingOfType("*sendgrid.SGMail")).Return(nil)
				err := service.CreateUserVerification("newemail@new.com", "Some Password")
				Expect(err).To(BeNil())

				actual := client.Calls[0].Arguments[0].(*SGMail)
				Expect(actual.To[0]).To(Equal("newemail@new.com"))
				Expect(actual.From).To(Equal("no-reply@mydailystuff.com"))
				Expect(actual.Subject).To(Equal("Activate your MyDailyStuff.com account"))

				client.AssertExpectations(GinkgoT())
			})
		})
	})

	Describe("Create user", func() {
		Context("Where the token exists", func() {
			It("should create the user and delete token", func() {
				id, err := service.CreateUser(verify1.Token)

				var user User
				conn.GetSource(TestIndex, UserType, id, nil, &user)
				resp, _ := conn.Exists(TestIndex, VerifyType, verify1.Token, nil)

				Expect(resp.Exists).To(BeFalse())
				Expect(err).To(BeNil())
				Expect(user.UserId).To(Equal(id))
				Expect(user.Email).To(Equal(verify1.Email))
			})
		})

		Context("Where the token does not exist", func() {
			It("should return token not found error", func() {
				_, err := service.CreateUser(uuid.New())

				Expect(err).To(Equal(VerificationNotFound))
			})
		})
	})

	Describe("Get reset password", func() {
		Context("Where the reset token exists", func() {
			It("should find the reset entry", func() {
				reset, err := service.GetResetPassword(reset1.Token)

				Expect(err).To(BeNil())
				Expect(reset.UserId).To(Equal(reset1.UserId))
			})
		})

		Context("Where the reset token isn't found", func() {
			It("should return reset not found error", func() {
				_, err := service.GetResetPassword(uuid.New())

				Expect(err).To(Equal(ResetNotFound))
			})
		})
	})

	Describe("Create and send reset password", func() {
		Context("Where the reset token exists", func() {
			It("should send reset token email", func() {
				client := new(MockSendGridClient)
				service.MailClient = client

				client.On("Send", mock.AnythingOfType("*sendgrid.SGMail")).Return(nil)
				err := service.CreateAndSendResetPassword(testUser1.Email)
				Expect(err).To(BeNil())

				actual := client.Calls[0].Arguments[0].(*SGMail)
				Expect(actual.To[0]).To(Equal(testUser1.Email))
				Expect(actual.From).To(Equal("no-reply@mydailystuff.com"))
				Expect(actual.Subject).To(Equal("Reset your MyDailyStuff.com password"))

				client.AssertExpectations(GinkgoT())
			})
		})

		Context("Where the email address not found", func() {
			It("should return user not found error", func() {
				err := service.CreateAndSendResetPassword("asdf@asdfasd.com")
				Expect(err).To(Equal(UserNotFound))
			})
		})
	})

	Describe("Reset user password", func() {
		Context("Where the reset token exists", func() {
			It("should reset the password", func() {
				err := service.ResetPassword(reset1.Token, "stuffandthings")

				Expect(err).To(BeNil(), "Reset token not found")

				var actual User
				err = conn.GetSource(TestIndex, UserType, reset1.UserId, nil, &actual)

				Expect(err).To(BeNil(), "Updated user be found")

				hash, _ := base64.StdEncoding.DecodeString(actual.PasswordHash)

				err = bcrypt.CompareHashAndPassword(hash, []byte("stuffandthings"))

				Expect(err).To(BeNil(), "Password must be stuffandthings")
				Expect(actual.Email).To(Equal(testUser1.Email), "Email should be the same")
			})
		})

		Context("Where the reset token exists, but password too short", func() {
			It("should return invalid password error", func() {
				err := service.ResetPassword(reset1.Token, "asdf")
				Expect(err).To(Equal(PasswordInvalid))
			})
		})

		Context("Where the reset token exists, but password too long", func() {
			It("should return invalid password error", func() {
				err := service.ResetPassword(reset1.Token, "asdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdf")
				Expect(err).To(Equal(PasswordInvalid))
			})
		})

		Context("Where the reset token isn't found", func() {
			It("should return reset password not found error", func() {
				err := service.ResetPassword(uuid.New(), "password")
				Expect(err).To(Equal(ResetNotFound))
			})
		})
	})

	Describe("Create journal entry", func() {
		Context("Where there is no date conflict", func() {
			It("should create the entry", func() {
				current := time.Now()
				entry, err := service.CreateJournalEntry(testUser1.UserId, []string{"something", "to look at"}, current)
				date := time.Date(current.Year(), current.Month(), current.Day(), 0, 0, 0, 0, time.UTC)

				Expect(entry.Date).To(Equal(date))
				Expect(entry.Entries[0]).To(Equal("something"))
				Expect(entry.Entries[1]).To(Equal("to look at"))
				Expect(err).To(BeNil())
			})
		})

		Context("Where entry length is too long", func() {
			It("should return error", func() {
				current := time.Now()
				entry, err := service.CreateJournalEntry(testUser1.UserId, []string{string(make([]byte, 501))}, current)

				Expect(err).To(Equal(JournalEntryInvalid))
				Expect(entry).To(Equal(JournalEntry{}))
			})
		})

		Context("Where there are more than 7 entries", func() {
			It("should return error", func() {
				current := time.Now()
				entry, err := service.CreateJournalEntry(testUser1.UserId, make([]string, 8), current)

				Expect(err).To(Equal(TooManyEntries))
				Expect(entry).To(Equal(JournalEntry{}))
			})
		})

		Context("Where there is a date conflict", func() {
			It("should return entry exists error", func() {
				_, err := service.CreateJournalEntry(testUser1.UserId, []string{"hello", "world"}, journal1.Date)
				Expect(err).To(Equal(EntryAlreadyExists))
			})
		})
	})

	Describe("Update journal entry", func() {
		Context("Where the entry exists", func() {
			It("should update journal entry", func() {
				err := service.UpdateJournalEntry(journal1.Id, journal1.UserId, []string{"test", "entry"})
				Expect(err).To(BeNil())

				var actual JournalEntry
				_ = conn.GetSource(TestIndex, JournalType, journal1.Id, nil, &actual)

				Expect(actual.Entries[0]).To(Equal("test"))
				Expect(actual.Entries[1]).To(Equal("entry"))
			})
		})

		Context("Where the entry does not exist", func() {
			It("should return entry does not exist error", func() {
				err := service.UpdateJournalEntry(uuid.New(), journal1.UserId, []string{"test", "entry"})
				Expect(err).To(Equal(EntryNotFound))
			})
		})

		Context("Where the entry is empty", func() {
			It("should return entry is empty error", func() {
				err := service.UpdateJournalEntry(uuid.New(), journal1.UserId, []string{" ", "entry"})
				Expect(err).To(Equal(JournalEntryEmpty))
			})
		})

		Context("Where the entry contains only html", func() {
			It("should return entry is empty error", func() {
				err := service.UpdateJournalEntry(uuid.New(), journal1.UserId, []string{"<div></div>", "entry"})
				Expect(err).To(Equal(JournalEntryEmpty))
			})
		})
	})

	Describe("Delete journal entry", func() {
		Context("Where the entry exists", func() {
			It("should delete the entry", func() {
				err := service.DeleteJournalEntry(journal1.Id, testUser1.UserId)

				resp, _ := conn.Exists(TestIndex, JournalType, journal1.Id, nil)

				Expect(err).To(BeNil())
				Expect(resp.Exists).To(BeFalse())
			})
		})

		Context("Where the entry does not exist", func() {
			It("should return entry does not exist error", func() {
				err := service.DeleteJournalEntry(uuid.New(), testUser1.UserId)
				Expect(err).To(Equal(EntryNotFound))
			})
		})
	})

	Describe("Get journal entry by date", func() {
		Context("Where the entry exists", func() {
			It("should return entry", func() {
				entry, err := service.GetJournalEntryByDate(journal1.UserId, journal1.Date)

				Expect(err).To(BeNil())
				Expect(entry.Id).To(Equal(journal1.Id))
				Expect(entry.UserId).To(Equal(journal1.UserId))
				Expect(entry.Entries[0]).To(Equal(journal1.Entries[0]))
				Expect(entry.Entries[1]).To(Equal(journal1.Entries[1]))
			})
		})

		Context("Where the entry does not exist on date", func() {
			It("should return entry not found error", func() {
				_, err := service.GetJournalEntryByDate(testUser1.UserId, time.Now())
				Expect(err).To(Equal(NoJournalWithDate))
			})
		})

		Context("Where the user id doesn't exist", func() {
			It("should return entry not found error", func() {
				_, err := service.GetJournalEntryByDate(uuid.New(), journal1.Date)
				Expect(err).To(Equal(NoJournalWithDate))
			})
		})
	})

	Describe("Search journal entries", func() {
		BeforeEach(func() {
			conn.IndexWithParameters(TestIndex, JournalType, journal3.Id, "", 0, "", "", "", 0, "", "", true, nil, journal3)
			conn.IndexWithParameters(TestIndex, JournalType, journal2.Id, "", 0, "", "", "", 0, "", "", true, nil, journal2)
		})

		Context("When searching with an exact word match query", func() {
			It("should find matching entries", func() {
				entries, total, err := service.SearchJournal(testUser1.UserId, JournalQuery{
					Query: "test",
				})

				Expect(err).To(BeNil())
				Expect(len(entries)).To(Equal(1))
				Expect(total).To(Equal(1))
				Expect(entries[0].Id).To(Equal(journal1.Id))
				Expect(entries[0].Entries[0]).To(Equal(strings.Replace(journal1.Entries[0], "test", "<strong>test</strong>", -1)))
				Expect(entries[0].Entries[1]).To(Equal(strings.Replace(journal1.Entries[1], "test", "<strong>test</strong>", -1)))
			})
		})

		Context("When searching with a start date and query", func() {
			It("should find matching entries", func() {
				entries, total, err := service.SearchJournal(testUser1.UserId, JournalQuery{
					Query: "entry",
					Start: time.Date(2002, 6, 10, 0, 0, 0, 0, time.UTC),
				})

				Expect(err).To(BeNil())
				Expect(len(entries)).To(Equal(1))
				Expect(total).To(Equal(1))
				Expect(entries[0].Id).To(Equal(journal3.Id))
				Expect(entries[0].Entries[0]).To(Equal(strings.Replace(journal3.Entries[0], "entry", "<strong>entry</strong>", -1)))
				Expect(entries[0].Entries[1]).To(Equal(strings.Replace(journal3.Entries[1], "entry", "<strong>entry</strong>", -1)))
			})
		})

		Context("When searching with a end date and query", func() {
			It("should find matching entries in order", func() {
				entries, total, err := service.SearchJournal(testUser1.UserId, JournalQuery{
					Query: "entry",
					End:   time.Date(2002, 5, 21, 0, 0, 0, 0, time.UTC),
				})

				Expect(err).To(BeNil())
				Expect(len(entries)).To(Equal(1))
				Expect(total).To(Equal(1))
				Expect(entries[0].Id).To(Equal(journal1.Id))
				Expect(entries[0].Entries[0]).To(Equal(strings.Replace(journal1.Entries[0], "entry", "<strong>entry</strong>", -1)))
				Expect(entries[0].Entries[1]).To(Equal(strings.Replace(journal1.Entries[1], "entry", "<strong>entry</strong>", -1)))
			})
		})

		Context("When searching with a start and date and query", func() {
			It("should find matching entries", func() {
				entries, total, err := service.SearchJournal(testUser1.UserId, JournalQuery{
					Query: "ent*",
					Start: time.Date(2002, 4, 21, 0, 0, 0, 0, time.UTC),
					End:   time.Date(2002, 6, 21, 0, 0, 0, 0, time.UTC),
				})

				Expect(err).To(BeNil())
				Expect(total).To(Equal(3))
				Expect(len(entries)).To(Equal(3))
				Expect(entries[0].Date.After(entries[1].Date)).To(BeTrue())
				Expect(entries[1].Date.After(entries[2].Date)).To(BeTrue())
			})
		})

		Context("When searching with paging", func() {
			It("should find matching entries", func() {
				entries, total, err := service.SearchJournal(testUser1.UserId, JournalQuery{
					Query:  "ent*",
					Limit:  2,
					Offset: 1,
				})

				Expect(err).To(BeNil())
				Expect(total).To(Equal(3))
				Expect(len(entries)).To(Equal(2))
			})
		})
	})

	Describe("Search journal dates", func() {
		BeforeEach(func() {
			conn.IndexWithParameters(TestIndex, JournalType, journal2.Id, "", 0, "", "", "", 0, "", "", true, nil, journal2)
			conn.IndexWithParameters(TestIndex, JournalType, journal3.Id, "", 0, "", "", "", 0, "", "", true, nil, journal3)
		})

		Context("When searching with a start date", func() {
			It("should return matching dates", func() {
				dates, err := service.SearchJournalDates(testUser1.UserId, JournalQuery{
					Start: time.Date(2002, 4, 21, 0, 0, 0, 0, time.UTC),
					End:   time.Date(2002, 6, 21, 0, 0, 0, 0, time.UTC),
				})

				Expect(err).To(BeNil())
				Expect(len(dates)).To(Equal(3))
				Expect(dates).To(ContainElement("2002-05-25T00:00:00Z"))
				Expect(dates).To(ContainElement("2002-05-20T00:00:00Z"))
				Expect(dates).To(ContainElement("2002-06-20T00:00:00Z"))
			})
		})

		Context("When searching with a end date", func() {
			It("should return matching dates", func() {
				dates, err := service.SearchJournalDates(testUser1.UserId, JournalQuery{
					End: time.Date(2002, 5, 21, 0, 0, 0, 0, time.UTC),
				})

				Expect(err).To(BeNil())
				Expect(len(dates)).To(Equal(1))
				Expect(dates).To(ContainElement("2002-05-20T00:00:00Z"))
			})
		})

		Context("When searching with a start and date", func() {
			It("should return matching dates", func() {
				dates, err := service.SearchJournalDates(testUser1.UserId, JournalQuery{
					Start: time.Date(2002, 5, 21, 0, 0, 0, 0, time.UTC),
				})

				Expect(err).To(BeNil())
				Expect(len(dates)).To(Equal(2))
				Expect(dates).To(ContainElement("2002-05-25T00:00:00Z"))
				Expect(dates).To(ContainElement("2002-06-20T00:00:00Z"))
			})
		})
	})

	Describe("Get Streak", func() {
		BeforeEach(func() {
			conn.IndexWithParameters(TestIndex, JournalType, streak1.Id, "", 0, "", "", "", 0, "", "", true, nil, streak1)
			conn.IndexWithParameters(TestIndex, JournalType, streak2.Id, "", 0, "", "", "", 0, "", "", true, nil, streak2)
			conn.IndexWithParameters(TestIndex, JournalType, streak4.Id, "", 0, "", "", "", 0, "", "", true, nil, streak4)
		})

		Context("When getting a 1 day streak", func() {
			It("should return 1 count", func() {
				count, err := service.GetStreak(testUser1.UserId, time.Now(), 1)

				Expect(err).To(BeNil())
				Expect(count).To(Equal(1))
			})
		})

		Context("When getting a 5 day streak", func() {
			It("should return 2 count", func() {
				count, err := service.GetStreak(testUser1.UserId, time.Now(), 5)

				Expect(err).To(BeNil())
				Expect(count).To(Equal(2))
			})
		})
	})
})
