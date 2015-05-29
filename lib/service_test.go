package lib_test

import (
	"code.google.com/p/go-uuid/uuid"
	"github.com/mikeyoon/MyDailyStuff/lib"
	elastigo "github.com/mikeyoon/elastigo/lib"
	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
	"golang.org/x/crypto/bcrypt"
	"time"
	"encoding/base64"
)

var _ = Describe("Service", func() {
	service := lib.Service{}
	conn := elastigo.NewConn()

	TestIndex := "test"

	_, _ = conn.DeleteIndex(TestIndex)

	service.Init(lib.ServiceOptions{
		MainIndex:  TestIndex,
		ElasticUrl: "http://localhost:9200",
	})

	//Test Email Verification Data
	pass2, _ := bcrypt.GenerateFromPassword([]byte("whatever"), 10)
	verify1 := lib.UserVerification{
		Email: "test2@test.com",
		Token: uuid.New(),
		PasswordHash: base64.StdEncoding.EncodeToString(pass2),
		CreateDate: time.Now(),
	}

	//Test Users Data
	pass1, _ := bcrypt.GenerateFromPassword([]byte("something"), 10)
	testUser1 := lib.User{
		UserId:        uuid.New(),
		Email:         "test@test.com",
		PasswordHash:  base64.StdEncoding.EncodeToString(pass1),
		CreateDate:    time.Now(),
		LastLoginDate: time.Now(),
	}

	//Test Journal Data
	journal1 := lib.JournalEntry{
		UserId: testUser1.UserId,
		Entries: []string{"test entry 1", "test entry 2"},
		Date: time.Date(2002, 5, 20, 0, 0, 0, 0, time.UTC),
		CreateDate: time.Now(),
		Id: uuid.New(),
	}

	//Test Password Reset Data
	reset1 := lib.PasswordReset{
		UserId:     testUser1.UserId,
		Token:      uuid.New(),
		CreateDate: time.Now(),
	}

	BeforeEach(func() {
		conn.IndexWithParameters(TestIndex, lib.UserType, testUser1.UserId, "", 0, "", "", "", 0, "", "", true, nil, testUser1)
		conn.IndexWithParameters(TestIndex, lib.ResetType, reset1.Token, "", 0, "", "", "", 0, "", "", true, nil, reset1)
		conn.IndexWithParameters(TestIndex, lib.VerifyType, verify1.Token, "", 0, "", "", "", 0, "", "", true, nil, verify1)
		conn.IndexWithParameters(TestIndex, lib.JournalType, journal1.Id, "", 0, "", "", "", 0, "", "", true, nil, journal1)
	})

	AfterEach(func() {
		conn.DeleteByQuery([]string{TestIndex}, []string{lib.UserType, lib.ResetType, lib.VerifyType, lib.JournalType}, nil,  elastigo.Search("").Query(elastigo.Query().All()))
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

		Context("Where the user does not exist", func() {
			It("should not return result", func() {
				user, err := service.GetUserByEmail("nothing@nothing.com")
				Expect(err).To(Equal(lib.UserNotFound))
				Expect(user).To(Equal(lib.User{}))
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
				user, err := service.GetUserByLogin(testUser1.Email, "whatever")

				Expect(err).To(Equal(lib.UserNotFound))
				Expect(user).To(Equal(lib.User{}))
			})
		})

		Context("Where the email doesn't match", func() {
			It("should not return the result", func() {
				user, err := service.GetUserByLogin("asdf@asdf.com", "whatever")

				Expect(err).To(Equal(lib.UserNotFound))
				Expect(user).To(Equal(lib.User{}))
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

				Expect(err).To(Equal(lib.UserNotFound))
				Expect(user).To(Equal(lib.User{}))
			})
		})
	})

	Describe("Update user", func() {

	})

	Describe("Get user verification", func() {

	})

	Describe("Create user verification", func() {

	})

	Describe("Create user", func() {

	})

	Describe("Get reset password", func() {

	})

	Describe("Create and send reset password", func() {

	})

	Describe("Reset user password", func() {

	})

	Describe("Create journal entry", func() {

	})

	Describe("Update journal entry", func() {

	})

	Describe("Delete journal entry", func() {

	})

	Describe("Get journal entry by date", func() {

	})

	Describe("Search journal entries", func() {

	})

	Describe("Search journal dates", func() {

	})
})
