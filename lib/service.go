package lib

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/url"
	"strconv"
	"strings"
	"time"

	"code.google.com/p/go-uuid/uuid"
	"github.com/kennygrant/sanitize"
	elastigo "github.com/mikeyoon/elastigo/lib"
	"github.com/sendgrid/sendgrid-go"
	"golang.org/x/crypto/bcrypt"
)

// EsIndex the main ES index
var EsIndex = "mds"

const (
	// UserType ES index for user data
	UserType = "user"
	// ResetType ES index for password reset requests
	ResetType = "pwreset"
	// VerifyType ES index for pending account verifications
	VerifyType = "verify"
	// JournalType ES index for journal entries
	JournalType = "journal"
)

type User struct {
	UserId        string    `json:"user_id"`
	Email         string    `json:"email"`
	PasswordHash  string    `json:"password_hash"`
	CreateDate    time.Time `json:"create_date"`
	LastLoginDate time.Time `json:"last_login_date"`
}

type UserVerification struct {
	Email        string    `json:"email"`
	Token        string    `json:"token"`
	PasswordHash string    `json:"password_hash"`
	CreateDate   time.Time `json:"create_date"`
}

type PasswordReset struct {
	UserId     string    `json:"user_id"`
	Token      string    `json:"token"`
	CreateDate time.Time `json:"create_date"`
}

type JournalEntry struct {
	UserId     string    `json:"user_id"`
	Entries    []string  `json:"entries"`
	Date       time.Time `json:"date"`
	CreateDate time.Time `json:"create_date"`
	Id         string    `json:"id"`
}

type JournalQuery struct {
	Start  time.Time
	End    time.Time
	Query  string
	Limit  int
	Offset int
	SortBy string
}

type Service interface {
	//Init(options ServiceOptions) error
	GetUserById(id string) (User, error)
	GetUserByEmail(email string) (User, error)
	GetUserByLogin(email string, password string) (User, error)
	UpdateUser(id string, email string, password string) error
	GetUserVerification(token string) (UserVerification, error)
	CreateUserVerification(email string, password string) error
	CreateUser(verificationToken string) (string, error)
	GetResetPassword(token string) (PasswordReset, error)
	CreateAndSendResetPassword(email string) error
	ResetPassword(token string, password string) error
	CreateJournalEntry(userId string, entries []string, date time.Time) (JournalEntry, error)
	UpdateJournalEntry(id string, userId string, entries []string) error
	DeleteJournalEntry(id string, userId string) error
	GetJournalEntryByDate(userId string, date time.Time) (JournalEntry, error)
	SearchJournal(userId string, jq JournalQuery) ([]JournalEntry, int, error)
	SearchJournalDates(userId string, jq JournalQuery) ([]string, error)
	GetStreak(userId string, date time.Time, limit int) (int, error)
}

type MailService interface {
	Send(m *sendgrid.SGMail) error
}

type MdsService struct {
	es         *elastigo.Conn
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
	conn := elastigo.NewConn()

	if options.MainIndex != "" {
		EsIndex = options.MainIndex
	}

	u, err := url.Parse(options.ElasticUrl)

	if err == nil {
		host, port, e := net.SplitHostPort(u.Host)
		err = e //Why go, why?

		conn.SetHosts([]string{host})
		conn.SetPort(port)
		conn.Protocol = u.Scheme
		if u.User != nil {
			conn.Username = u.User.Username()
			conn.Password, _ = u.User.Password()
		}
	}

	err = s.createIndexes(conn)

	if err == nil {
		s.es = conn
		if options.SendGridUsername != "" {
			s.MailClient = sendgrid.NewSendGridClient(options.SendGridUsername, options.SendGridPassword)
		}
	}

	return err
}

func (service *MdsService) createIndexes(c *elastigo.Conn) error {
	indexExists, err := c.IndicesExists(EsIndex)

	if err != nil {
		log.Println("Error retriving user index: " + err.Error())
		return err
	}

	if !indexExists {
		log.Println("Creating main index")

		indexJson := []byte(`{
            "mapper": {
                "dynamic": false
            },
            "settings": {
			    "index": {
			        "analysis": {
			            "analyzer": {
			                "keyword_lowercase": {
			                    "tokenizer":"keyword",
			                    "filter":"lowercase"
			                }
						}
			        }
			    }
			},
            "mappings": {
                "user": {
                    "properties": {
                        "user_id": {
                            "type": "string",
                            "index": "no"
                        },
                        "email": {
                            "type": "string",
                            "index": "not_analyzed"
                        },
                        "password_hash": {
                            "type": "binary"
                        },
                        "create_date": {"type": "date"},
                        "last_login_date": {"type": "date"}
                    }
                },
                "journal": {
                    "properties": {
                        "user_id": {
                            "type": "string",
                            "index": "not_analyzed"
                        },
                        "entries": {
                            "type": "string",
                            "analyzer": "english"

                        },
                        "create_date": {
                            "type": "date"
                        },
                        "date": {
                            "type": "date"
                        }
                    }
                },
                "verify": {
                	"properties": {
                		"email": {
                			"type": "string",
                			"index": "not_analyzed"
                		},
                		"token": {
                			"type": "string",
                			"index": "not_analyzed"
                		},
                		"password_hash": {
                			"type": "binary"
                		},
                		"create_date": {
                			"type": "date"
                		}
                	}
                },
                "pwreset": {
                	"properties": {
                		"user_id": {
                			"type": "string",
                			"index": "not_analyzed"
                		},
                		"token": {
                			"type": "string",
                			"index": "not_analyzed"
                		},
                		"create_date": {
                			"type": "date"
                		}
                	}
                }
            }
        }`)

		var indexSettings IndexSettings
		err := json.Unmarshal(indexJson, &indexSettings)

		if err != nil {
			log.Println("Error deserializing json: " + err.Error())
			return err
		}

		resp, err := c.CreateIndexWithSettings(EsIndex, indexSettings)

		if err != nil {
			log.Println("Error creating index: " + err.Error())
		} else {
			log.Println(resp.Exists)
		}
	}

	if err != nil {
		log.Println("Error retriving index: " + err.Error())
		return err
	}

	return nil
}

func getSingleResult(result elastigo.SearchResult, output interface{}) error {
	if result.Hits.Total > 0 {

		bytes, err := result.Hits.Hits[0].Source.MarshalJSON()
		if err != nil {
			panic(err)
		}

		err = json.Unmarshal(bytes, output)

		return err
	} else {
		return elastigo.RecordNotFound
	}
}

//User Functions
func (s MdsService) GetUserByEmail(email string) (User, error) {
	var retval User

	query := elastigo.Query().
		All().
		Filter(elastigo.Filter().Term("email", strings.ToLower(email)))

	search := elastigo.Search(EsIndex).Query(query)
	result, err := s.es.Search(EsIndex, UserType, nil, search)

	if err == nil {
		err = getSingleResult(result, &retval)
	}

	if err == elastigo.RecordNotFound {
		return retval, UserNotFound
	}

	return retval, nil
}

func (s MdsService) GetUserByLogin(email string, password string) (User, error) {
	var retval User

	query := elastigo.Query().
		All().
		Filter(elastigo.Filter().Term("email", strings.ToLower(email)))

	search := elastigo.Search(EsIndex).Query(query)
	result, err := s.es.Search(EsIndex, UserType, nil, search)

	if err == nil {
		err = getSingleResult(result, &retval)
	}

	var hash []byte
	if err == nil {
		hash, err = base64.StdEncoding.DecodeString(retval.PasswordHash)
	}

	if err == nil {
		err = bcrypt.CompareHashAndPassword(hash, []byte(password))
	}

	if err == elastigo.RecordNotFound || err == bcrypt.ErrMismatchedHashAndPassword {
		return User{}, UserNotFound
	}

	return retval, err
}

func (s MdsService) GetUserById(id string) (User, error) {
	var retval User
	err := s.es.GetSource(EsIndex, UserType, id, nil, &retval)

	if err == elastigo.RecordNotFound {
		return retval, UserNotFound
	}

	return retval, err
}

func (s MdsService) UpdateUser(id string, email string, password string) error {
	user, err := s.GetUserById(id)

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

			_, err = s.es.Index(EsIndex, UserType, id, nil, user)
		}

		return err
	}

	return nil
}

func (s MdsService) GetUserVerification(token string) (UserVerification, error) {
	var retval UserVerification

	query := elastigo.Query().
		All().
		Filter(elastigo.Filter().Term("token", token))

	search := elastigo.Search(EsIndex).Query(query)
	result, err := s.es.Search(EsIndex, VerifyType, nil, search)

	if err == nil {
		err = getSingleResult(result, &retval)
	}

	if err == elastigo.RecordNotFound {
		fmt.Println("Error GetUserVerification: " + err.Error())
		return retval, VerificationNotFound
	}

	return retval, err
}

func (s MdsService) CreateUserVerification(email string, password string) error {
	_, err := s.GetUserByEmail(email)

	if err == UserNotFound {
		//Generate token
		id := uuid.New()

		pass, err := bcrypt.GenerateFromPassword([]byte(password), 10)

		if err == nil {
			verify := UserVerification{
				Email:        email,
				CreateDate:   time.Now(),
				PasswordHash: base64.StdEncoding.EncodeToString(pass),
				Token:        id}

			_, err = s.es.Index(EsIndex, VerifyType, id, nil, verify)
		}

		if err != nil {
			panic(err)
		}

		message := sendgrid.NewMail()
		message.AddTo(email)
		message.SetSubject("Activate your MyDailyStuff.com account")
		message.SetFrom("no-reply@mydailystuff.com")
		message.SetText(`Welcome to MyDailyStuff!

To activate your account, please click on the following link below.

https://www.mydailystuff.com/account/verify/` + id + `

Please activate your account within 3 days of receiving this email. Replies to this account are not monitored. If you have any issues, please contact us via our support form on our website.

Thank You,

MyDailyStuff.com`)

		message.SetHTML(`<html>
<head>
	<title></title>
</head>
<body>
<p>Welcome to MyDailyStuff!</p>

<p>To activate your account, please click on the following link below.</p>

<p>https://www.mydailystuff.com/account/verify/` + id + `</p>

<p>Please activate your account within 3 days of receiving this email. Replies to this account are not monitored. If you have any issues, please contact us via our support form on our website.</p>

<p>Thanks You,</p>

<p>MyDailyStuff.com</p>
</body>
</html>`)

		if s.MailClient != nil {
			err = s.MailClient.Send(message)
		}

		return err
	} else {
		return EmailInUse
	}
}

func (s MdsService) CreateUser(verificationToken string) (string, error) {
	verify, err := s.GetUserVerification(verificationToken)
	if err == nil {
		_, getErr := s.GetUserByEmail(verify.Email)

		err = getErr
	}

	if err == UserNotFound {
		id := uuid.New()

		_, err = s.es.Index(EsIndex, UserType, id, nil, User{
			UserId:       id,
			Email:        verify.Email,
			CreateDate:   time.Now(),
			PasswordHash: verify.PasswordHash})

		if err == nil {
			_, err = s.es.Delete(EsIndex, VerifyType, verify.Token, nil)
		}

		return id, err
	} else {
		fmt.Println(err.Error())
		return "", VerificationNotFound
	}
}

func (s MdsService) GetResetPassword(token string) (PasswordReset, error) {
	var retval PasswordReset

	query := elastigo.Query().
		All().
		Filter(elastigo.Filter().Term("token", token))

	search := elastigo.Search(EsIndex).Query(query)
	result, err := s.es.Search(EsIndex, ResetType, nil, search)

	if err == nil {
		err = getSingleResult(result, &retval)
	}

	if err == elastigo.RecordNotFound {
		return retval, ResetNotFound
	}

	return retval, err
}

func (s MdsService) CreateAndSendResetPassword(email string) error {
	user, err := s.GetUserByEmail(email)
	if err == nil {
		id := uuid.New()
		reset := PasswordReset{UserId: user.UserId, Token: id, CreateDate: time.Now()}

		_, err = s.es.Index(EsIndex, ResetType, id, nil, reset)

		if err == nil {
			fmt.Println("Sending reset password to " + user.UserId)

			message := sendgrid.NewMail()
			message.AddTo(email)
			message.SetSubject("Reset your MyDailyStuff.com password")
			message.SetFrom("no-reply@mydailystuff.com")
			message.SetText(`Reset your MyDailyStuff.com password

We sent you this email because you requested to reset your password. Click the link below to reset your password. It will be valid for 24 hours.

https://www.mydailystuff.com/account/reset/` + id + `

If this is incorrect, please ignore this email.

Thank You,

MyDailyStuff.com`)

			message.SetHTML(`<html>
<head>
	<title></title>
</head>
<body>
<p>Reset your MyDailyStuff.com password</p>

<p>We sent you this email because you requested to reset your password.
Click the link below to reset your password. It will be valid for 24 hours.</p>

<p>https://www.mydailystuff.com/account/reset/` + id + `</p>

<p>If this is incorrect, please ignore this email.</p>

<p>Thank You,</p>

<p>MyDailyStuff.com</p>
</body>
</html>`)

			if s.MailClient != nil {
				err = s.MailClient.Send(message)
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
		fmt.Println("Resetting password for " + reset.UserId)
		err = s.UpdateUser(reset.UserId, "", password)
	}

	if err == nil {
		_, err = s.es.Delete(EsIndex, ResetType, token, nil)
	}

	return err
}

//Journal Functions

func (s MdsService) CreateJournalEntry(userId string, entries []string, date time.Time) (JournalEntry, error) {
	var entry JournalEntry

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
		entry = JournalEntry{Id: id, UserId: userId, Date: entryDate, CreateDate: time.Now().UTC(), Entries: entries}

		_, err = s.es.IndexWithParameters(EsIndex, JournalType, id, "", 0, "", "", "", 0, "", "", true, nil, entry)
	}

	return entry, err
}

func (s MdsService) UpdateJournalEntry(id string, userId string, entries []string) error {
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
		err = s.es.GetSource(EsIndex, JournalType, id, nil, &entry)
	}

	if err == nil && entry.UserId == userId {
		entry.Entries = entries
		_, err = s.es.IndexWithParameters(EsIndex, JournalType, id, "", 0, "", "", "", 0, "", "", true, nil, entry)
	}

	if err == elastigo.RecordNotFound || err == nil && entry.UserId != userId {
		return EntryNotFound
	}

	return err
}

func (s MdsService) DeleteJournalEntry(id string, userId string) error {
	if userId == "" {
		return UserUnauthorized
	}

	var entry JournalEntry
	err := s.es.GetSource(EsIndex, JournalType, id, nil, &entry)

	if err != nil || userId != entry.UserId {
		return EntryNotFound
	}

	_, err = s.es.Delete(EsIndex, JournalType, id, map[string]interface{}{"refresh": true})
	return err
}

func (s MdsService) GetJournalEntryByDate(userId string, date time.Time) (JournalEntry, error) {
	var retval JournalEntry

	if userId == "" {
		return retval, UserUnauthorized
	}

	createDate := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, time.UTC)

	query := elastigo.Query().
		All().
		Filter(elastigo.Filter().
			And(elastigo.Filter().Term("user_id", userId)).
			And(elastigo.Filter().Term("date", createDate)))

	search := elastigo.Search(EsIndex).Query(query)
	result, err := s.es.Search(EsIndex, JournalType, nil, search)

	if err == nil {
		if result.Hits.Total == 0 {
			return retval, NoJournalWithDate
		}

		err = getSingleResult(result, &retval)
	}

	if err == elastigo.RecordNotFound {
		err = NoJournalWithDate
	}

	return retval, err
}

//Search journal entries
func (s MdsService) SearchJournal(userId string, jq JournalQuery) ([]JournalEntry, int, error) {
	if userId == "" {
		return nil, 0, UserUnauthorized
	}

	query := elastigo.Query()

	if jq.Query != "" {
		query = query.Fields("entries,date", jq.Query, "", "").SetLenient(true)
	} else {
		query = query.All()
	}

	start := time.Date(jq.Start.Year(), jq.Start.Month(), jq.Start.Day(), 0, 0, 0, 0, time.UTC)
	end := time.Date(jq.End.Year(), jq.End.Month(), jq.End.Day(), 0, 0, 0, 0, time.UTC)

	var filter *elastigo.FilterOp = nil

	if !jq.Start.IsZero() && !jq.End.IsZero() {
		filter = elastigo.Filter().And(elastigo.Filter().Range("date", start, nil, end, nil, ""))
	} else if !jq.Start.IsZero() {
		filter = elastigo.Filter().And(elastigo.Filter().Range("date", start, nil, nil, nil, ""))
	} else if !jq.End.IsZero() {
		filter = elastigo.Filter().And(elastigo.Filter().Range("date", nil, nil, end, nil, ""))
	}

	//Filter by the user id, add to and query if there's a date range
	if filter == nil {
		filter = elastigo.Filter().Term("user_id", userId)
	} else {
		filter = filter.And(elastigo.Filter().Term("user_id", userId))
	}

	query = query.Filter(filter)

	highlight := elastigo.NewHighlight().
		AddField("entries", nil).
		SetOptions(elastigo.NewHighlightOpts().Tags("<strong>", "</strong>"))

	search := elastigo.Search(EsIndex).Query(query).
		Highlight(highlight).
		Sort(elastigo.Sort("date").Desc())

	if jq.Limit > 0 {
		search.Size(strconv.Itoa(jq.Limit))
	}

	if jq.Offset > 0 {
		search.From(strconv.Itoa(jq.Offset))
	}

	result, err := search.Result(s.es) //s.es.Search(EsIndex, JournalType, nil, search)

	if err == nil {
		retval := make([]JournalEntry, result.Hits.Len())

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

			if hit.Highlight != nil && (*hit.Highlight)["entries"] != nil {
				entry.Entries = (*hit.Highlight)["entries"]
			}

			retval[index] = entry
		}

		return retval, result.Hits.Total, nil
	}

	return nil, 0, err
}

func (s MdsService) GetStreak(userId string, date time.Time, limit int) (int, error) {
	end := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, time.UTC).Add(-time.Hour * 24)
	start := end.Add(-time.Hour * 24 * time.Duration(limit-1))

	filter := elastigo.Filter().And(
		elastigo.Filter().Term("user_id", userId),
		elastigo.Filter().Range("date", start, nil, end, nil, ""))

	query := elastigo.Query().Filter(filter).All()

	search := elastigo.Search(EsIndex).Type(JournalType).Query(query).Fields("date").Sort(elastigo.Sort("date").Desc())

	result, err := search.Result(s.es)

	var retval int = 0

	if err == nil {
		current := end

		var fields map[string][]interface{}

		for _, hit := range result.Hits.Hits {
			if err == nil {
				bytes, err := hit.Fields.MarshalJSON()

				if err == nil {
					err = json.Unmarshal(bytes, &fields)
				}
			}

			if err == nil {
				//Calculate the streak by finding the last ten entry dates and figuring out if there
				//are any gaps
				rdate, err2 := time.Parse("2006-01-02T15:04:05Z", fields["date"][0].(string))
				err = err2

				if err == nil {
					if current.Sub(rdate).Hours() == 0 {
						retval++
						current = rdate.Add(-time.Hour * 24)
					} else {
						break
					}
				}
			}
		}
	}

	return retval, err
}

//Find dates with journal entries
func (s MdsService) SearchJournalDates(userId string, jq JournalQuery) ([]string, error) {
	query := elastigo.Query()

	if jq.Query != "" {
		query = query.Fields("entries,date", jq.Query, "", "").SetLenient(true)
	} else {
		query = query.All()
	}

	start := time.Date(jq.Start.Year(), jq.Start.Month(), jq.Start.Day(), 0, 0, 0, 0, time.UTC)
	end := time.Date(jq.End.Year(), jq.End.Month(), jq.End.Day(), 0, 0, 0, 0, time.UTC)

	//Filter by user id, assume we can do an and because this query must have a date
	filter := elastigo.Filter().And(elastigo.Filter().Term("user_id", userId))

	if !jq.Start.IsZero() && !jq.End.IsZero() {
		filter = elastigo.Filter().And(elastigo.Filter().Range("date", start, nil, end, nil, ""))
	} else if !jq.Start.IsZero() {
		filter = elastigo.Filter().And(elastigo.Filter().Range("date", start, nil, nil, nil, ""))
	} else if !jq.End.IsZero() {
		filter = elastigo.Filter().And(elastigo.Filter().Range("date", nil, nil, end, nil, ""))
	}

	query = query.Filter(filter)

	search := elastigo.Search(EsIndex).Type(JournalType).Query(query).Fields("date")

	result, err := search.Result(s.es)

	if err != nil {
		return nil, err
	}

	retval := make([]string, result.Hits.Total)

	for index, hit := range result.Hits.Hits {
		bytes, err := hit.Fields.MarshalJSON()
		if err != nil {
			panic(err)
		}

		var fields map[string][]interface{}

		err = json.Unmarshal(bytes, &fields)
		if err != nil {
			panic(err)
		}

		retval[index] = fields["date"][0].(string)
	}

	return retval, nil
}
