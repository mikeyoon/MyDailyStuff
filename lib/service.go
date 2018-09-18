package lib

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"log"
	"os"
	"strings"
	"time"

	"github.com/olivere/elastic"

	"code.google.com/p/go-uuid/uuid"
	"github.com/kennygrant/sanitize"
	"github.com/sendgrid/rest"
	"github.com/sendgrid/sendgrid-go"
	"github.com/sendgrid/sendgrid-go/helpers/mail"
	"golang.org/x/crypto/bcrypt"
)

// esIndex the main ES index, default to mds
var esIndex = "mds"

const (
	// userType ES index for user data
	userType = "user"
	// journalType ES index for journal entries
	journalType = "journal"
)

func userIndex() string {
	return esIndex + "_" + userType
}

func journalIndex() string {
	return esIndex + "_" + journalType
}

type IdDocument interface {
	GetID() string
	SetID(id string)
}

type User struct {
	ID            string    `json:"-"`
	Email         string    `json:"email"`
	PasswordHash  string    `json:"password_hash"`
	CreateDate    time.Time `json:"create_date"`
	LastLoginDate time.Time `json:"last_login_date"`
	VerifyToken   string    `json:"verify_token,omitempty"`
	ResetToken    string    `json:"reset_token,omitempty"`
}

func (u *User) GetID() string   { return u.ID }
func (u *User) SetID(id string) { u.ID = id }

type UserVerification struct {
	ID           string    `json:"-"`
	Email        string    `json:"email"`
	Token        string    `json:"verify_token"`
	PasswordHash string    `json:"password_hash"`
	CreateDate   time.Time `json:"create_date"`
}

func (u *UserVerification) GetID() string   { return u.ID }
func (u *UserVerification) SetID(id string) { u.ID = id }

type PasswordReset struct {
	ID         string    `json:"-"`
	Token      string    `json:"reset_token"`
	CreateDate time.Time `json:"create_date"`
}

func (u *PasswordReset) GetID() string   { return u.ID }
func (u *PasswordReset) SetID(id string) { u.ID = id }

type JournalEntry struct {
	UserId     string    `json:"user_id"`
	Entries    []string  `json:"entries"`
	Date       time.Time `json:"date"`
	CreateDate time.Time `json:"create_date"`
	ID         string    `json:"-"`
}

func (u *JournalEntry) GetID() string   { return u.ID }
func (u *JournalEntry) SetID(id string) { u.ID = id }

type JournalQuery struct {
	Start  time.Time
	End    time.Time
	Query  string
	Limit  int
	Offset int
	SortBy string
}

type Service interface {
	GetUserById(id string) (User, error)
	GetUserByEmail(email string, verified bool) (User, error)
	GetUserByLogin(email string, password string) (User, error)
	UpdateUser(id string, email string, password string) error
	GetUserVerification(token string) (string, UserVerification, error)
	CreateUserVerification(email string, password string) error
	CreateUser(verificationToken string) (string, error)
	GetResetPassword(token string) (PasswordReset, error)
	CreateAndSendResetPassword(email string) error
	ResetPassword(token string, password string) error
	CreateJournalEntry(userId string, entries []string, date time.Time) (JournalEntry, error)
	UpdateJournalEntry(id string, userId string, entries []string) error
	DeleteJournalEntry(id string, userId string) error
	GetJournalEntryByDate(userId string, date time.Time) (JournalEntry, error)
	SearchJournal(userId string, jq JournalQuery) ([]JournalEntry, int64, error)
	SearchJournalDates(userId string, jq JournalQuery) ([]string, error)
	GetStreak(userId string, date time.Time, limit int) (int, error)
}

type MailService interface {
	Send(m *mail.SGMailV3) (*rest.Response, error)
}

type MdsService struct {
	es         *elastic.Client
	MailClient MailService
}

type IndexSettings struct {
	Mapper   map[string]interface{} `json:"mapper"`
	Mappings map[string]interface{} `json:"mappings"`
}

type ServiceOptions struct {
	ElasticUrl       string
	SendGridUsername string
	SendGridPassword string
	MainIndex        string
}

func (s *MdsService) Init(options ServiceOptions) error {
	conn, err := elastic.NewClient(
		elastic.SetURL(options.ElasticUrl),
		elastic.SetSniff(false),
	)

	if err != nil {
		return err
	}

	if options.MainIndex != "" {
		esIndex = options.MainIndex
	}

	err = s.createIndexes(conn)

	if err == nil {
		s.es = conn
		if options.SendGridUsername != "" {
			s.MailClient = sendgrid.NewSendClient(os.Getenv("SENDGRID_API_KEY"))
		}
	}

	return err
}

func (s *MdsService) createIndex(c *elastic.Client, index string, json string) error {
	ctx := context.Background()
	indexExists, err := c.IndexExists(index).Do(ctx)

	if err != nil {
		log.Println("Error retriving " + index + " index: " + err.Error())
		return err
	}

	if !indexExists {
		log.Println("Creating index " + index)
		resp, err := c.CreateIndex(index).BodyString(json).Do(ctx)

		if err != nil {
			log.Println("Error creating " + index + " index: " + err.Error())
			return err
		} else {
			log.Println(resp.Acknowledged)
		}
	}

	return nil
}

func (s *MdsService) createIndexes(c *elastic.Client) error {
	log.Println("Preparing Indexes")
	err := s.createIndex(c, userIndex(), IndexUserJSON)
	if err != nil {
		return err
	}

	err = s.createIndex(c, journalIndex(), IndexJournalJSON)
	if err != nil {
		return err
	}

	return err
}

func getSingleResult(result *elastic.SearchResult, output interface{}) (string, error) {
	if result.Hits.TotalHits > 0 {

		bytes, err := result.Hits.Hits[0].Source.MarshalJSON()
		if err != nil {
			panic(err)
		}

		err = json.Unmarshal(bytes, output)
		return result.Hits.Hits[0].Id, err
	}

	return "", RecordNotFound
}

func initID(doc IdDocument, id string, err error) {
	if err == nil {
		doc.SetID(id)
	}
}

func getUserFromResult(result *elastic.SearchResult) (User, error) {
	var user User
	id, err := getSingleResult(result, &user)
	initID(&user, id, err)
	return user, err
}

func getVerificationFromResult(result *elastic.SearchResult) (UserVerification, error) {
	var verification UserVerification
	id, err := getSingleResult(result, &verification)
	initID(&verification, id, err)
	return verification, err
}

func getResetFromResult(result *elastic.SearchResult) (PasswordReset, error) {
	var reset PasswordReset
	id, err := getSingleResult(result, &reset)
	initID(&reset, id, err)
	return reset, err
}

func getEntryFromResult(result *elastic.SearchResult) (JournalEntry, error) {
	var entry JournalEntry
	id, err := getSingleResult(result, &entry)
	initID(&entry, id, err)
	return entry, err
}

//User Functions

// GetUserByEmail retrieves a user by their email address
func (s MdsService) GetUserByEmail(email string, verified bool) (User, error) {
	var retVal User
	ctx := context.Background()

	query := elastic.NewBoolQuery().
		Must(elastic.NewTermQuery("email", strings.ToLower(email)))

	if verified {
		query.MustNot(elastic.NewExistsQuery("verify_token"))
	}

	result, err := s.es.Search(userIndex()).Type(userType).Query(query).Do(ctx)

	if err == nil {
		retVal, err = getUserFromResult(result)
	}

	if err == RecordNotFound {
		return retVal, UserNotFound
	}

	return retVal, nil
}

// GetUserByLogin retrieves a user account by their email and password hash
func (s MdsService) GetUserByLogin(email string, password string) (User, error) {
	ctx := context.Background()
	user, err := s.GetUserByEmail(email, true)

	var hash []byte
	if err == nil {
		hash, err = base64.StdEncoding.DecodeString(user.PasswordHash)
	}

	if err == nil {
		err = bcrypt.CompareHashAndPassword(hash, []byte(password))
	}

	if err == RecordNotFound || err == bcrypt.ErrMismatchedHashAndPassword {
		return User{}, UserNotFound
	}

	if user.ResetToken != "" {
		user.ResetToken = ""
		s.es.Update().Index(userIndex()).Type(userType).Refresh("true").Doc(user).Do(ctx)
	}

	return user, err
}

//GetUserById retrieves a user by their id
func (s MdsService) GetUserById(id string) (User, error) {
	var retval User

	ctx := context.Background()
	query := elastic.NewBoolQuery().
		MustNot(elastic.NewExistsQuery("verify_token")).
		Must(elastic.NewIdsQuery(userType).Ids(id))

	result, err := s.es.Search().Index(userIndex()).Type(userType).Query(query).Do(ctx)

	if err != nil {
		return retval, err
	}

	retval, err = getUserFromResult(result)

	if err != nil {
		return retval, UserNotFound
	}

	return retval, err
}

func (s MdsService) UpdateUser(id string, email string, password string) error {
	user, err := s.GetUserById(id)
	ctx := context.Background()

	if err != nil {
		return UserNotFound
	}

	if len(email) > 0 {
		user.Email = strings.ToLower(email)
	}

	if len(password) >= 6 {
		pass, err := bcrypt.GenerateFromPassword([]byte(password), 10)
		if err == nil {
			user.PasswordHash = base64.StdEncoding.EncodeToString(pass)
			user.ResetToken = ""

			_, err = s.es.Update().Index(userIndex()).Type(userType).Id(id).Doc(user).Refresh("true").Do(ctx)
		}

		return err
	}

	return nil
}

func (s MdsService) GetUserVerification(token string) (string, UserVerification, error) {
	var retVal UserVerification
	ctx := context.Background()

	search := elastic.NewTermQuery("verify_token", token)
	result, err := s.es.Search(userIndex()).Type(userType).Query(search).Do(ctx)

	if err == nil {
		retVal, err = getVerificationFromResult(result)
	}

	if err == RecordNotFound {
		log.Println("Error GetUserVerification: " + err.Error())
		return "", retVal, VerificationNotFound
	}

	return result.Hits.Hits[0].Id, retVal, err
}

func (s MdsService) CreateUserVerification(email string, password string) error {
	user, err := s.GetUserByEmail(email, false)
	ctx := context.Background()

	if err == UserNotFound {
		//Generate token
		id := uuid.New()
		token := uuid.New()

		pass, err := bcrypt.GenerateFromPassword([]byte(password), 10)

		if err == nil {
			verify := UserVerification{
				Email:        email,
				CreateDate:   time.Now(),
				PasswordHash: base64.StdEncoding.EncodeToString(pass),
				Token:        token,
				ID:           id}

			_, err = s.es.Index().Index(userIndex()).Type(userType).Id(id).BodyJson(verify).Refresh("true").Do(ctx)
		}

		if err != nil {
			panic(err)
		}

		message := mail.NewV3Mail()
		message.SetFrom(mail.NewEmail("MyDailyStuff", "no-reply@mydailystuff.com"))
		message.SetTemplateID("d-e782572e444d460e8d24b3f07005bcdf")
		personalizations := mail.NewPersonalization()
		personalizations.AddTos(mail.NewEmail(email, email))
		personalizations.DynamicTemplateData["token"] = token
		message.AddPersonalizations(personalizations)

		if s.MailClient != nil {
			_, err = s.MailClient.Send(message)
		}

		return err
	} else {
		if user.VerifyToken == "" {
			return EmailInUse
		}

		// Resend the user verification and update password
		pass, err := bcrypt.GenerateFromPassword([]byte(password), 10)
		if err == nil {
			user.PasswordHash = base64.StdEncoding.EncodeToString(pass)
			_, err = s.es.Update().Index(userIndex()).Type(userType).Id(user.ID).Doc(user).Refresh("true").Do(ctx)

			message := mail.NewV3Mail()
			message.SetFrom(mail.NewEmail("MyDailyStuff", "no-reply@mydailystuff.com"))
			message.SetTemplateID("d-e782572e444d460e8d24b3f07005bcdf")
			personalizations := mail.NewPersonalization()
			personalizations.AddTos(mail.NewEmail(email, email))
			personalizations.DynamicTemplateData["token"] = user.VerifyToken
			message.AddPersonalizations(personalizations)

			if s.MailClient != nil {
				_, err = s.MailClient.Send(message)
			}
		}

		return err
	}
}

func (s MdsService) CreateUser(verificationToken string) (string, error) {
	ctx := context.Background()
	userID, verify, err := s.GetUserVerification(verificationToken)

	if err != nil {
		log.Println(err.Error())
		return "", VerificationNotFound
	}

	user := User{
		ID:           userID,
		Email:        verify.Email,
		CreateDate:   time.Now(),
		PasswordHash: verify.PasswordHash,
		VerifyToken:  "",
	}

	_, err = s.es.Update().Index(userIndex()).Type(userType).Doc(user).Id(verify.ID).Do(ctx)

	if err != nil {
		return "", err
	}

	return userID, err
}

func (s MdsService) GetResetPassword(token string) (PasswordReset, error) {
	var retVal PasswordReset
	ctx := context.Background()

	search := elastic.NewTermQuery("reset_token", token)
	result, err := s.es.Search(userIndex()).Type(userType).Query(search).Do(ctx)

	if err == nil {
		retVal, err = getResetFromResult(result)
	}

	if err == RecordNotFound {
		return retVal, ResetNotFound
	}

	return retVal, err
}

func (s MdsService) CreateAndSendResetPassword(email string) error {
	ctx := context.Background()
	user, err := s.GetUserByEmail(email, true)
	if err == nil {
		id := uuid.New()

		_, err = s.es.Update().Index(userIndex()).Type(userType).Id(user.ID).Doc(map[string]interface{}{"reset_token": id}).Do(ctx)

		if err == nil {
			log.Println("Sending reset password to " + user.ID)

			message := mail.NewV3Mail()
			message.SetFrom(mail.NewEmail("MyDailyStuff", "no-reply@mydailystuff.com"))
			message.SetTemplateID("d-1019375cd8da4ae08345bc600e03e241")
			personalizations := mail.NewPersonalization()
			personalizations.AddTos(mail.NewEmail(email, email))
			personalizations.DynamicTemplateData["id"] = id
			message.AddPersonalizations(personalizations)

			if s.MailClient != nil {
				_, err = s.MailClient.Send(message)
			}
		}
	}

	return err
}

func (s MdsService) ResetPassword(token string, password string) error {
	reset, err := s.GetResetPassword(token)

	if len(password) < 6 || len(password) > 50 {
		err = PasswordInvalid
	}

	if err == nil {
		log.Println("Resetting password for " + reset.ID)
		err = s.UpdateUser(reset.ID, "", password)
	}

	return err
}

//Journal Functions

func (s MdsService) CreateJournalEntry(userId string, entries []string, date time.Time) (JournalEntry, error) {
	var entry JournalEntry
	ctx := context.Background()

	var err error = nil

	if len(entries) > 7 {
		err = TooManyEntries
	}

	if err == nil {
		for index, entry := range entries {
			if len(entry) > 500 {
				err = JournalEntryInvalid
				break
			} else {
				entries[index] = strings.TrimSpace(sanitize.HTML(entry))
				if len(entries[index]) <= 0 {
					err = JournalEntryEmpty
					break
				}
			}
		}
	}

	if err == nil {
		_, jerr := s.GetJournalEntryByDate(userId, date)

		if jerr != NoJournalWithDate {
			err = EntryAlreadyExists
		}
	}

	if err == nil {
		entryDate := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, time.UTC)

		id := uuid.New()
		entry = JournalEntry{ID: id, UserId: userId, Date: entryDate, CreateDate: time.Now().UTC(), Entries: entries}

		_, err = s.es.Index().Index(journalIndex()).Type(journalType).Id(id).Refresh("true").BodyJson(entry).Do(ctx)
	}

	return entry, err
}

func (s MdsService) UpdateJournalEntry(id string, userId string, entries []string) error {
	ctx := context.Background()
	if userId == "" {
		return UserUnauthorized
	}

	var err error = nil

	if len(entries) > 7 {
		err = TooManyEntries
	}

	for index, entry := range entries {
		if len(entry) > 500 {
			err = JournalEntryInvalid
			break
		} else {
			entries[index] = strings.TrimSpace(sanitize.HTML(entry))
			if len(entries[index]) <= 0 {
				err = JournalEntryEmpty
				break
			}
		}
	}

	var entry JournalEntry
	if err == nil {
		// err = json.Unmarshal(*result.Source, &retval)
		result, err := s.es.Get().Index(journalIndex()).Type(journalType).Id(id).Do(ctx)
		if err == nil && result.Found {
			err = json.Unmarshal(*result.Source, &entry)
		}
	}

	if err == nil && entry.UserId == userId {
		entry.Entries = entries
		_, err = s.es.Index().Index(journalIndex()).Type(journalType).Id(id).Refresh("true").BodyJson(entry).Do(ctx)
	}

	if err == nil && entry.UserId != userId {
		return EntryNotFound
	}

	return err
}

func (s MdsService) DeleteJournalEntry(id string, userId string) error {
	ctx := context.Background()
	if userId == "" {
		return UserUnauthorized
	}

	var entry JournalEntry
	result, err := s.es.Get().Index(journalIndex()).Type(journalType).Id(id).Do(ctx)
	if err == nil && result.Found {
		err = json.Unmarshal(*result.Source, &entry)
	}

	if err != nil || userId != entry.UserId {
		return EntryNotFound
	}

	_, err = s.es.Delete().Index(journalIndex()).Type(journalType).Id(id).Refresh("true").Do(ctx)
	return err
}

func (s MdsService) GetJournalEntryByDate(userId string, date time.Time) (JournalEntry, error) {
	var retVal JournalEntry
	ctx := context.Background()

	if userId == "" {
		return retVal, UserUnauthorized
	}

	createDate := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, time.UTC)

	query := elastic.NewBoolQuery().
		Must(elastic.NewTermQuery("user_id", userId)).
		Filter(elastic.NewTermQuery("date", createDate))

	result, err := s.es.Search(journalIndex()).Type(journalType).Query(query).Do(ctx)

	if err == nil {
		if result.Hits.TotalHits == 0 {
			return retVal, NoJournalWithDate
		}

		retVal, err = getEntryFromResult(result)
	}

	if err != nil {
		_, ok := err.(*elastic.Error)
		if !ok {
			err = NoJournalWithDate
		}

	}

	return retVal, err
}

//Search journal entries
func (s MdsService) SearchJournal(userId string, jq JournalQuery) ([]JournalEntry, int64, error) {
	ctx := context.Background()
	if userId == "" {
		return nil, 0, UserUnauthorized
	}

	query := elastic.NewBoolQuery().Must(elastic.NewTermQuery("user_id", userId))
	if jq.Query != "" {
		query = query.Filter(elastic.NewQueryStringQuery(jq.Query).Field("entries").Field("date").Lenient(true))
	}

	start := time.Date(jq.Start.Year(), jq.Start.Month(), jq.Start.Day(), 0, 0, 0, 0, time.UTC)
	end := time.Date(jq.End.Year(), jq.End.Month(), jq.End.Day(), 0, 0, 0, 0, time.UTC)

	if !jq.Start.IsZero() && !jq.End.IsZero() {
		query = query.Filter(elastic.NewRangeQuery("date").Gte(start).Lte(end))
	} else if !jq.Start.IsZero() {
		query = query.Filter(elastic.NewRangeQuery("date").Gte(start))
	} else if !jq.End.IsZero() {
		query = query.Filter(elastic.NewRangeQuery("date").Lte(end))
	}

	highlight := elastic.NewHighlight().Field("entries").PreTags("<strong>").PostTags("</strong>")

	search := s.es.Search(journalIndex()).Type(journalType).Query(query).Highlight(highlight).Sort("date", false)

	if jq.Limit > 0 {
		search.Size(jq.Limit)
	}

	if jq.Offset > 0 {
		search.From(jq.Offset)
	}

	result, err := search.Do(ctx)

	if err == nil {
		size := len(result.Hits.Hits)
		retval := make([]JournalEntry, size)

		//TODO: Maybe only take the fields we need
		for index, hit := range result.Hits.Hits {
			bytes, err := hit.Source.MarshalJSON()
			if err != nil {
				panic(err)
			}

			var entry JournalEntry

			err = json.Unmarshal(bytes, &entry)
			if err != nil {
				panic(err)
			}
			entry.ID = hit.Id

			if hit.Highlight != nil && hit.Highlight["entries"] != nil {
				entry.Entries = hit.Highlight["entries"]
			}

			retval[index] = entry
		}

		return retval, result.TotalHits(), nil
	}

	return nil, 0, err
}

func (s MdsService) GetStreak(userId string, date time.Time, limit int) (int, error) {
	ctx := context.Background()
	end := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, time.UTC).Add(-time.Hour * 24)
	start := end.Add(-time.Hour * 24 * time.Duration(limit-1))

	query := elastic.NewBoolQuery().Filter(
		elastic.NewTermQuery("user_id", userId),
		elastic.NewRangeQuery("date").Gte(start).Lte(end),
	)

	result, err := s.es.Search(journalIndex()).Type(journalType).Query(query).Sort("date", false).Do(ctx)

	var retval int = 0

	if err == nil {
		current := end

		for _, hit := range result.Hits.Hits {
			var entry JournalEntry
			err := json.Unmarshal(*hit.Source, &entry)

			if err == nil {
				//Calculate the streak by finding the last ten entry dates and figuring out if there
				//are any gaps
				if current.Sub(entry.Date).Hours() == 0 {
					retval++
					current = entry.Date.Add(-time.Hour * 24)
				} else {
					break
				}
			}
		}
	}

	return retval, err
}

//Find dates with journal entries
func (s MdsService) SearchJournalDates(userId string, jq JournalQuery) ([]string, error) {
	ctx := context.Background()
	query := elastic.NewBoolQuery().Must(elastic.NewTermQuery("user_id", userId))

	if jq.Query != "" {
		query = query.Must(elastic.NewMultiMatchQuery(jq.Query, "entries", "date").Lenient(true))
	}

	start := time.Date(jq.Start.Year(), jq.Start.Month(), jq.Start.Day(), 0, 0, 0, 0, time.UTC)
	end := time.Date(jq.End.Year(), jq.End.Month(), jq.End.Day(), 0, 0, 0, 0, time.UTC)

	if !jq.Start.IsZero() && !jq.End.IsZero() {
		query.Filter(elastic.NewRangeQuery("date").Gte(start).Lte(end))
	} else if !jq.Start.IsZero() {
		query.Filter(elastic.NewRangeQuery("date").Gte(start))
	} else if !jq.End.IsZero() {
		query.Filter(elastic.NewRangeQuery("date").Lte(end))
	}

	result, err := s.es.Search(journalIndex()).Type(journalType).Query(query).Do(ctx)

	if err != nil {
		return nil, err
	}

	log.Println(result.TotalHits())
	retval := make([]string, result.TotalHits())

	for index, hit := range result.Hits.Hits {
		if err != nil {
			panic(err)
		}

		var entry JournalEntry
		err := json.Unmarshal(*hit.Source, &entry)
		if err != nil {
			return nil, err
		}

		retval[index] = entry.Date.Format(time.RFC3339)
	}

	return retval, nil
}
