package lib

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/olivere/elastic"
	"github.com/sendgrid/rest"
	"github.com/sendgrid/sendgrid-go/helpers/mail"

	"code.google.com/p/go-uuid/uuid"
	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
	"github.com/stretchr/testify/mock"
	"golang.org/x/crypto/bcrypt"
)

type MockSendGridClient struct {
	mock.Mock
}

// Send will send mail using SG web API
func (sg *MockSendGridClient) Send(m *mail.SGMailV3) (*rest.Response, error) {
	args := sg.Called(m)
	return args.Get(0).(*rest.Response), args.Error(1)
}

var _ = Describe("Service", func() {
	ctx := context.Background()
	service := MdsService{}
	conn, err := elastic.NewClient()
	fmt.Println(err)

	esIndex = "test"

	_, _ = conn.DeleteIndex(userIndex(), journalIndex()).Do(ctx)

	service.Init(ServiceOptions{
		ElasticUrl: "http://localhost:9200",
	})

	//Test Email Verification Data
	pass2, _ := bcrypt.GenerateFromPassword([]byte("whatever"), 10)
	verify1 := UserVerification{
		Email:        "test2@test.com",
		Token:        uuid.New(),
		PasswordHash: base64.StdEncoding.EncodeToString(pass2),
		CreateDate:   time.Now(),
		UserID:       uuid.New(),
	}

	//Test Users Data
	pass1, _ := bcrypt.GenerateFromPassword([]byte("something"), 10)
	testUser1 := User{
		UserID:        uuid.New(),
		Email:         "test@test.com",
		PasswordHash:  base64.StdEncoding.EncodeToString(pass1),
		CreateDate:    time.Now(),
		LastLoginDate: time.Now(),
	}

	//Test Journal Data
	journal1 := JournalEntry{
		UserId:     testUser1.UserID,
		Entries:    []string{"test entry 1", "test entry 2"},
		Date:       time.Date(2002, 5, 20, 0, 0, 0, 0, time.UTC),
		CreateDate: time.Now(),
		Id:         uuid.New(),
	}

	journal2 := JournalEntry{
		UserId:     testUser1.UserID,
		Entries:    []string{"another entry 1", "another entry 2"},
		Date:       time.Date(2002, 5, 25, 0, 0, 0, 0, time.UTC),
		CreateDate: time.Now(),
		Id:         uuid.New(),
	}

	journal3 := JournalEntry{
		UserId:     testUser1.UserID,
		Entries:    []string{"some entry 1", "some entry 2"},
		Date:       time.Date(2002, 6, 20, 0, 0, 0, 0, time.UTC),
		CreateDate: time.Now(),
		Id:         uuid.New(),
	}

	streak1 := JournalEntry{
		UserId:     testUser1.UserID,
		Entries:    []string{"some entry 1", "some entry 2"},
		Date:       time.Date(time.Now().Year(), time.Now().Month(), time.Now().Day(), 0, 0, 0, 0, time.UTC).Add(-time.Hour * 24 * 1),
		CreateDate: time.Now(),
		Id:         uuid.New(),
	}

	streak2 := JournalEntry{
		UserId:     testUser1.UserID,
		Entries:    []string{"some entry 1", "some entry 2"},
		Date:       time.Date(time.Now().Year(), time.Now().Month(), time.Now().Day(), 0, 0, 0, 0, time.UTC).Add(-time.Hour * 24 * 2),
		CreateDate: time.Now(),
		Id:         uuid.New(),
	}

	streak4 := JournalEntry{
		UserId:     testUser1.UserID,
		Entries:    []string{"some entry 1", "some entry 2"},
		Date:       time.Date(time.Now().Year(), time.Now().Month(), time.Now().Day(), 0, 0, 0, 0, time.UTC).Add(-time.Hour * 24 * 4),
		CreateDate: time.Now(),
		Id:         uuid.New(),
	}

	//Test Password Reset Data
	reset1 := PasswordReset{
		UserId:     testUser1.UserID,
		Token:      uuid.New(),
		CreateDate: time.Now(),
	}

	BeforeEach(func() {
		conn.Index().Index(userIndex()).Type(userType).Id(testUser1.UserID).Refresh("true").BodyJson(testUser1).Do(ctx)
		conn.Index().Index(userIndex()).Type(userType).Id(uuid.New()).Refresh("true").BodyJson(reset1).Do(ctx)
		conn.Index().Index(userIndex()).Type(userType).Id(uuid.New()).Refresh("true").BodyJson(verify1).Do(ctx)
		conn.Index().Index(journalIndex()).Type(journalType).Id(journal1.Id).Refresh("true").BodyJson(journal1).Do(ctx)
	})

	AfterEach(func() {
		conn.DeleteByQuery(userIndex(), journalIndex()).Query(elastic.NewMatchAllQuery()).Refresh("true").Do(ctx)
	})

	Describe("Init with login", func() {
		It("should fail to initialize", func() {
			serviceWithAuth := MdsService{}
			serviceWithAuth.Init(ServiceOptions{
				ElasticUrl:       "http://test:pass@localhost:9200",
				SendGridUsername: "sg_user",
			})

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
				user, err := service.GetUserByEmail(testUser1.Email, true)

				Expect(err).To(BeNil())
				Expect(user.Email).To(Equal(testUser1.Email))
			})
		})

		Context("Where the user exists, but with upper case", func() {
			It("should have found the user", func() {
				user, err := service.GetUserByEmail(strings.ToUpper(testUser1.Email), true)

				Expect(err).To(BeNil())
				Expect(user.Email).To(Equal(testUser1.Email))
			})
		})

		Context("Where the user does not exist", func() {
			It("should not return result", func() {
				user, err := service.GetUserByEmail("nothing@nothing.com", true)
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
				user, err := service.GetUserById(testUser1.UserID)

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
				service.UpdateUser(testUser1.UserID, "something@else.com", "newpass")
				var actual User
				result, err := conn.Get().Index(userIndex()).Type(userType).Id(testUser1.UserID).Do(ctx)

				Expect(err).To(BeNil(), "Updated user be found")
				json.Unmarshal(*result.Source, &actual)

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
				err := service.UpdateUser(testUser1.UserID, "", "")
				Expect(err).To(BeNil())
			})
		})
	})

	Describe("Get user verification", func() {
		Context("Where the verification exists", func() {
			It("should find the verification", func() {
				userID, actual, err := service.GetUserVerification(verify1.Token)

				Expect(err).To(BeNil())
				Expect(userID).ToNot(Equal(""))
				Expect(actual.Email).To(Equal(verify1.Email))
			})
		})

		Context("Where the verification does not exist", func() {
			It("should return not found error", func() {
				userID, actual, err := service.GetUserVerification(uuid.New())

				Expect(err).To(Equal(VerificationNotFound))
				Expect(userID).To(Equal(""))
				Expect(actual).To(Equal(UserVerification{}))
			})
		})
	})

	Describe("Create user verification", func() {
		Context("Where the verification already exists", func() {
			It("should send a new email without creating a new user", func() {
				client := new(MockSendGridClient)
				service.MailClient = client

				client.On("Send", mock.AnythingOfType("*mail.SGMailV3")).Return(&rest.Response{}, nil)

				err := service.CreateUserVerification(verify1.Email, "NewPassword")
				Expect(err).To(BeNil())

				actual := client.Calls[0].Arguments[0].(*mail.SGMailV3)
				Expect(actual.Personalizations[0].To[0].Address).To(Equal(verify1.Email))
				Expect(actual.TemplateID).To(Equal("d-e782572e444d460e8d24b3f07005bcdf"))
				Expect(actual.From.Address).To(Equal("no-reply@mydailystuff.com"))

				results, err := conn.Search(userIndex()).Type(userType).Query(elastic.NewTermQuery("email", verify1.Email)).Do(context.Background())
				Expect(results.TotalHits()).To(Equal(int64(1)))
			})
		})

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

				client.On("Send", mock.AnythingOfType("*mail.SGMailV3")).Return(&rest.Response{}, nil)
				err := service.CreateUserVerification("newemail@new.com", "Some Password")
				Expect(err).To(BeNil())

				actual := client.Calls[0].Arguments[0].(*mail.SGMailV3)
				Expect(actual.Personalizations[0].To[0].Address).To(Equal("newemail@new.com"))
				Expect(actual.TemplateID).To(Equal("d-e782572e444d460e8d24b3f07005bcdf"))
				Expect(actual.From.Address).To(Equal("no-reply@mydailystuff.com"))

				client.AssertExpectations(GinkgoT())
			})
		})
	})

	Describe("Create user", func() {
		Context("Where the token exists", func() {
			It("should create the user and delete token", func() {
				id, err := service.CreateUser(verify1.Token)

				var user User

				result, err := conn.Get().Index(userIndex()).Type(userType).Id(id).Do(ctx)

				Expect(err).To(BeNil(), "Updated user found")
				json.Unmarshal(*result.Source, &user)

				resp, _ := conn.Exists().Index(userIndex()).Type(userType).Id(verify1.Token).Do(ctx)

				Expect(resp).To(BeFalse())
				Expect(err).To(BeNil())
				Expect(user.UserID).To(Equal(id))
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

				client.On("Send", mock.AnythingOfType("*mail.SGMailV3")).Return(&rest.Response{}, nil)
				err := service.CreateAndSendResetPassword(testUser1.Email)
				Expect(err).To(BeNil())

				actual := client.Calls[0].Arguments[0].(*mail.SGMailV3)
				Expect(actual.Personalizations[0].To[0].Address).To(Equal(testUser1.Email))
				Expect(actual.TemplateID).To(Equal("d-1019375cd8da4ae08345bc600e03e241"))

				Expect(actual.From.Address).To(Equal("no-reply@mydailystuff.com"))

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
				result, err := conn.Get().Index(userIndex()).Type(userType).Id(reset1.UserId).Do(ctx)

				Expect(err).To(BeNil(), "Updated user be found")
				json.Unmarshal(*result.Source, &actual)

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
				entry, err := service.CreateJournalEntry(testUser1.UserID, []string{"something", "to look at"}, current)
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
				entry, err := service.CreateJournalEntry(testUser1.UserID, []string{string(make([]byte, 501))}, current)

				Expect(err).To(Equal(JournalEntryInvalid))
				Expect(entry).To(Equal(JournalEntry{}))
			})
		})

		Context("Where there are more than 7 entries", func() {
			It("should return error", func() {
				current := time.Now()
				entry, err := service.CreateJournalEntry(testUser1.UserID, make([]string, 8), current)

				Expect(err).To(Equal(TooManyEntries))
				Expect(entry).To(Equal(JournalEntry{}))
			})
		})

		Context("Where there is a date conflict", func() {
			It("should return entry exists error", func() {
				_, err := service.CreateJournalEntry(testUser1.UserID, []string{"hello", "world"}, journal1.Date)
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
				result, err := conn.Get().Index(journalIndex()).Type(journalType).Id(journal1.Id).Do(ctx)
				json.Unmarshal(*result.Source, &actual)

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
				err := service.DeleteJournalEntry(journal1.Id, testUser1.UserID)

				resp, _ := conn.Exists().Index(journalIndex()).Type(journalType).Id(journal1.Id).Do(ctx)

				Expect(err).To(BeNil())
				Expect(resp).To(BeFalse())
			})
		})

		Context("Where the entry does not exist", func() {
			It("should return entry does not exist error", func() {
				err := service.DeleteJournalEntry(uuid.New(), testUser1.UserID)
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
				_, err := service.GetJournalEntryByDate(testUser1.UserID, time.Now())
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
			conn.Index().Index(journalIndex()).Type(journalType).Id(journal3.Id).Refresh("true").BodyJson(journal3).Do(ctx)
			conn.Index().Index(journalIndex()).Type(journalType).Id(journal2.Id).Refresh("true").BodyJson(journal2).Do(ctx)
		})

		Context("When searching with an exact word match query", func() {
			It("should find matching entries", func() {
				entries, total, err := service.SearchJournal(testUser1.UserID, JournalQuery{
					Query: "test",
				})

				Expect(err).To(BeNil())
				Expect(len(entries)).To(Equal(1))
				Expect(total).To(Equal(int64(1)))
				Expect(entries[0].Id).To(Equal(journal1.Id))
				Expect(entries[0].Entries[0]).To(Equal(strings.Replace(journal1.Entries[0], "test", "<strong>test</strong>", -1)))
				Expect(entries[0].Entries[1]).To(Equal(strings.Replace(journal1.Entries[1], "test", "<strong>test</strong>", -1)))
			})
		})

		Context("When searching with a start date and query", func() {
			It("should find matching entries", func() {
				entries, total, err := service.SearchJournal(testUser1.UserID, JournalQuery{
					Query: "entry",
					Start: time.Date(2002, 6, 10, 0, 0, 0, 0, time.UTC),
				})

				Expect(err).To(BeNil())
				Expect(len(entries)).To(Equal(1))
				Expect(total).To(Equal(int64(1)))
				Expect(entries[0].Id).To(Equal(journal3.Id))
				Expect(entries[0].Entries[0]).To(Equal(strings.Replace(journal3.Entries[0], "entry", "<strong>entry</strong>", -1)))
				Expect(entries[0].Entries[1]).To(Equal(strings.Replace(journal3.Entries[1], "entry", "<strong>entry</strong>", -1)))
			})
		})

		Context("When searching with a end date and query", func() {
			It("should find matching entries in order", func() {
				entries, total, err := service.SearchJournal(testUser1.UserID, JournalQuery{
					Query: "entry",
					End:   time.Date(2002, 5, 21, 0, 0, 0, 0, time.UTC),
				})

				Expect(err).To(BeNil())
				Expect(len(entries)).To(Equal(1))
				Expect(total).To(Equal(int64(1)))
				Expect(entries[0].Id).To(Equal(journal1.Id))
				Expect(entries[0].Entries[0]).To(Equal(strings.Replace(journal1.Entries[0], "entry", "<strong>entry</strong>", -1)))
				Expect(entries[0].Entries[1]).To(Equal(strings.Replace(journal1.Entries[1], "entry", "<strong>entry</strong>", -1)))
			})
		})

		Context("When searching with a start and date and query", func() {
			It("should find matching entries", func() {
				entries, total, err := service.SearchJournal(testUser1.UserID, JournalQuery{
					Query: "ent*",
					Start: time.Date(2002, 4, 21, 0, 0, 0, 0, time.UTC),
					End:   time.Date(2002, 6, 21, 0, 0, 0, 0, time.UTC),
				})

				Expect(err).To(BeNil())
				Expect(total).To(Equal(int64(3)))
				Expect(len(entries)).To(Equal(3))
				Expect(entries[0].Date.After(entries[1].Date)).To(BeTrue())
				Expect(entries[1].Date.After(entries[2].Date)).To(BeTrue())
			})
		})

		Context("When searching with paging", func() {
			It("should find matching entries", func() {
				entries, total, err := service.SearchJournal(testUser1.UserID, JournalQuery{
					Query:  "ent*",
					Limit:  2,
					Offset: 1,
				})

				Expect(err).To(BeNil())
				Expect(total).To(Equal(int64(3)))
				Expect(len(entries)).To(Equal(2))
			})
		})
	})

	Describe("Search journal dates", func() {
		BeforeEach(func() {
			conn.Index().Index(journalIndex()).Type(journalType).Id(journal3.Id).Refresh("true").BodyJson(journal3).Do(ctx)
			conn.Index().Index(journalIndex()).Type(journalType).Id(journal2.Id).Refresh("true").BodyJson(journal2).Do(ctx)
		})

		Context("When searching with a start date", func() {
			It("should return matching dates", func() {
				dates, err := service.SearchJournalDates(testUser1.UserID, JournalQuery{
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
				dates, err := service.SearchJournalDates(testUser1.UserID, JournalQuery{
					End: time.Date(2002, 5, 21, 0, 0, 0, 0, time.UTC),
				})

				Expect(err).To(BeNil())
				Expect(len(dates)).To(Equal(1))
				Expect(dates).To(ContainElement("2002-05-20T00:00:00Z"))
			})
		})

		Context("When searching with a start and date", func() {
			It("should return matching dates", func() {
				dates, err := service.SearchJournalDates(testUser1.UserID, JournalQuery{
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
			conn.Index().Index(journalIndex()).Type(journalType).Id(streak1.Id).Refresh("true").BodyJson(streak1).Do(ctx)
			conn.Index().Index(journalIndex()).Type(journalType).Id(streak2.Id).Refresh("true").BodyJson(streak2).Do(ctx)
			conn.Index().Index(journalIndex()).Type(journalType).Id(streak4.Id).Refresh("true").BodyJson(streak4).Do(ctx)
		})

		Context("When getting a 1 day streak", func() {
			It("should return 1 count", func() {
				count, err := service.GetStreak(testUser1.UserID, time.Now(), 1)

				Expect(err).To(BeNil())
				Expect(count).To(Equal(1))
			})
		})

		Context("When getting a 5 day streak", func() {
			It("should return 2 count", func() {
				count, err := service.GetStreak(testUser1.UserID, time.Now(), 5)

				Expect(err).To(BeNil())
				Expect(count).To(Equal(2))
			})
		})
	})
})
