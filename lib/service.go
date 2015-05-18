package lib

import (
	"code.google.com/p/go-uuid/uuid"
	"encoding/base64"
	"encoding/json"
	"fmt"
	elastigo "github.com/mikeyoon/elastigo/lib"
	"golang.org/x/crypto/bcrypt"
	"log"
	"net"
	"net/url"
	"strings"
	"time"
)

const (
	EsIndex      = "mds"
	UserType = "user"
	ResetType = "pwreset"
	VerifyType = "verify"
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
	CreateDate   time.Time `json"create_date"`
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
	SortBy string
}

type Service struct {
	es *elastigo.Conn
}

type IndexSettings struct {
	Mapper   map[string]interface{} `json:"mapper"`
	Mappings map[string]interface{} `json:"mappings"`
}

type ElasticOptions struct {
	Host string
	Port string
}

func (s *Service) InitDataStore(esUrl string) error {
	conn := elastigo.NewConn()

	u, err := url.Parse(esUrl)
	if err != nil {
		return err
	}

	host, port, err := net.SplitHostPort(u.Host)
	if err != nil {
		return err
	}

	conn.SetHosts([]string{host})
	conn.SetPort(port)
	conn.Protocol = u.Scheme
	if u.User != nil {
		conn.Username = u.User.Username()
		conn.Password, _ = u.User.Password()
	}

	s.createIndexes(conn)

	s.es = conn
	return nil
}

func (service *Service) createIndexes(c *elastigo.Conn) error {
	indexExists, err := c.IndicesExists("mds")

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

		log.Println(output)

		return err
	} else {
		return elastigo.RecordNotFound
	}
}

//User Functions
func (s *Service) GetUserByEmail(email string) (User, error) {
	var retval User

	query := elastigo.Query().
		All().
		Filter(elastigo.Filter().Term("email", strings.ToLower(email)))

	search := elastigo.Search(EsIndex).Query(query)
	result, err := s.es.Search(EsIndex, UserType, nil, search)

	if err != nil {
		if err == elastigo.RecordNotFound {
			return retval, UserNotFound
		}

		return retval, err
	}

	err = getSingleResult(result, &retval)
	if err != nil {
		return retval, UserNotFound
	}

	return retval, nil
}

func (s *Service) GetUserByLogin(email string, password string) (User, error) {
	var retval User

	query := elastigo.Query().
		All().
		Filter(elastigo.Filter().Term("email", strings.ToLower(email)))

	search := elastigo.Search(EsIndex).Query(query)
	result, err := s.es.Search(EsIndex, UserType, nil, search)

	if err != nil {
		if err == elastigo.RecordNotFound {
			return retval, UserNotFound
		}

		return retval, err
	}

	err = getSingleResult(result, &retval)
	if err != nil {
		return retval, UserNotFound
	}

	hash, err := base64.StdEncoding.DecodeString(retval.PasswordHash)

	if err != nil {
		panic(err)
	}

	err = bcrypt.CompareHashAndPassword(hash, []byte(password))
	if err != nil {
		log.Println("Password mismatch: " + retval.PasswordHash)
		return retval, UserNotFound
	}

	return retval, nil
}

func (s *Service) GetUserById(id string) (User, error) {
	var retval User
	err := s.es.GetSource(EsIndex, UserType, id, nil, &retval)

	if err != nil {
		log.Println("User " + id + " not found")
		return retval, err
	}

	return retval, nil
}

func (s *Service) UpdateUser(id string, email string, password string) error {
	user, err := s.GetUserById(id)

	log.Println(user)

	if err != nil {
		return UserNotFound
	}

	user.UserId = id

	if len(email) > 0 {
		user.Email = strings.ToLower(email)
	}

	if len(password) > 0 {
		pass, err := bcrypt.GenerateFromPassword([]byte(password), 10)
		if err == nil {
			user.PasswordHash = base64.StdEncoding.EncodeToString(pass)
		}

		_, err = s.es.Index(EsIndex, UserType, id, nil, user)
		if err != nil {
			return err
		}
	}

	return nil
}

func (s *Service) GetUserVerification(token string) (UserVerification, error) {
	var retval UserVerification

	query := elastigo.Query().
		All().
		Filter(elastigo.Filter().Term("token", token))

	search := elastigo.Search(EsIndex).Query(query)
	result, err := s.es.Search(EsIndex, VerifyType, nil, search)

	if err == nil {
		err = getSingleResult(result, &retval)
	}

	if err != nil {
		if err != elastigo.RecordNotFound {
			fmt.Println("Error GetUserVerification: " + err.Error())
		}

		return retval, VerificationNotFound
	}

	return retval, err
}

func (s *Service) CreateUserVerification(email string, password string) error {
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

		//TODO: Send email

		return err
	} else {
		return UserAlreadyExists
	}
}

func (s *Service) CreateUser(verificationToken string) (string, error) {
	verify, err := s.GetUserVerification(verificationToken)
	if err == nil {
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

func (s *Service) GetResetPassword(token string) (PasswordReset, error) {
	var retval PasswordReset

	query := elastigo.Query().
		All().
		Filter(elastigo.Filter().Term("token", token))

	search := elastigo.Search(EsIndex).Query(query)
	result, err := s.es.Search(EsIndex, ResetType, nil, search)

	if err != nil {
		if err == elastigo.RecordNotFound {
			return retval, ResetNotFound
		}

		return retval, err
	}

	err = getSingleResult(result, &retval)
	if err != nil {
		return retval, ResetNotFound
	}

	return retval, nil
}

func (s *Service) CreateAndSendResetPassword(email string) error {
	user, err := s.GetUserByEmail(email)
	if err == nil {
		id := uuid.New()
		reset := PasswordReset{UserId: user.UserId, Token: id, CreateDate: time.Now()}

		_, err = s.es.Index(EsIndex, ResetType, id, nil, reset)

		if err == nil {
			fmt.Println("Sending reset password to " + user.UserId)
			//TODO: Send email
		}
	}

	return err
}

func (s *Service) ResetPassword(token string, password string) error {
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

func (s *Service) CreateJournalEntry(userId string, entries []string, date time.Time) (JournalEntry, error) {
	var entry JournalEntry

	if userId == "" {
		return entry, UserUnauthorized
	}

	_, err := s.GetJournalEntryByDate(userId, date)
	if err != NoJournalWithDate {
		return entry, EntryAlreadyExists
	}

	entryDate := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, time.UTC)

	id := uuid.New()
	entry = JournalEntry{Id: id, UserId: userId, Date: entryDate, CreateDate: time.Now().UTC(), Entries: entries}

	_, err = s.es.Index(EsIndex, JournalType, id, nil, entry)
	return entry, err
}

func (s *Service) UpdateJournalEntry(id string, userId string, entries []string) error {
	if userId == "" {
		return UserUnauthorized
	}

	var entry JournalEntry

	err := s.es.GetSource(EsIndex, JournalType, id, nil, &entry)

	if err != nil {
		return err
	}

	if entry.UserId != userId {
		return EntryNotFound
	}

	entry.Entries = entries
	_, err = s.es.Index(EsIndex, JournalType, id, nil, entry)

	return err
}

func (s *Service) DeleteJournalEntry(id string, userId string) error {
	if userId == "" {
		return UserUnauthorized
	}

	var entry JournalEntry
	err := s.es.GetSource(EsIndex, JournalType, id, nil, &entry)

	if err != nil || userId != entry.UserId {
		return EntryNotFound
	}

	_, err = s.es.Delete(EsIndex, JournalType, id, nil)
	return err
}

func (s *Service) GetJournalEntryByDate(userId string, date time.Time) (JournalEntry, error) {
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

	if err != nil {
		log.Println(err.Error())
		if err == elastigo.RecordNotFound {
			return retval, NoJournalWithDate
		}

		return retval, err
	}

	if result.Hits.Total == 0 {
		return retval, NoJournalWithDate
	}

	err = getSingleResult(result, &retval)
	return retval, err
}

//Search journal entries
func (s *Service) SearchJournal(userId string, jq JournalQuery) ([]JournalEntry, error) {
	if userId == "" {
		return nil, UserUnauthorized
	}

	query := elastigo.Query()

	if jq.Query != "" {
		query = query.Fields("entries,date", jq.Query, "", "").SetLenient(true)
	} else {
		query = query.All()
	}

	start := time.Date(jq.Start.Year(), jq.Start.Month(), jq.Start.Day(), 0, 0, 0, 0, time.UTC)
	end := time.Date(jq.End.Year(), jq.End.Month(), jq.End.Day(), 0, 0, 0, 0, time.UTC)

	if !jq.Start.IsZero() && !jq.End.IsZero() {
		query = query.Filter(elastigo.Filter().Range("date", start, nil, end, nil, ""))
	} else if !jq.Start.IsZero() {
		query = query.Filter(elastigo.Filter().Range("date", start, nil, nil, nil, ""))
	} else if !jq.End.IsZero() {
		query = query.Filter(elastigo.Filter().Range("date", nil, nil, end, nil, ""))
	}

	search := elastigo.Search(EsIndex).Query(query)
	result, err := s.es.Search(EsIndex, JournalType, nil, search)

	if err != nil {
		return nil, err
	}

	_, err = query.MarshalJSON()

	retval := make([]JournalEntry, result.Hits.Total)

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

		retval[index] = entry
	}

	return retval, nil
}

//Find dates with journal entries
func (s *Service) SearchJournalDates(userId string, jq JournalQuery) ([]string, error) {
	if userId == "" {
		return nil, UserUnauthorized
	}

	query := elastigo.Query()

	if jq.Query != "" {
		query = query.Fields("entries,date", jq.Query, "", "").SetLenient(true)
	} else {
		query = query.All()
	}

	start := time.Date(jq.Start.Year(), jq.Start.Month(), jq.Start.Day(), 0, 0, 0, 0, time.UTC)
	end := time.Date(jq.End.Year(), jq.End.Month(), jq.End.Day(), 0, 0, 0, 0, time.UTC)

	if !jq.Start.IsZero() && !jq.End.IsZero() {
		query = query.Filter(elastigo.Filter().Range("date", start, nil, end, nil, ""))
	} else if !jq.Start.IsZero() {
		query = query.Filter(elastigo.Filter().Range("date", start, nil, nil, nil, ""))
	} else if !jq.End.IsZero() {
		query = query.Filter(elastigo.Filter().Range("date", nil, nil, end, nil, ""))
	}

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
