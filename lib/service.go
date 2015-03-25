package lib

import (
    "encoding/json"
    elastigo "github.com/mikeyoon/elastigo/lib"
    "log"
    "time"
    "encoding/base64"
    "golang.org/x/crypto/bcrypt"
    "code.google.com/p/go-uuid/uuid"
)

const (
    EsIndex = "mds"
    UserIndex = "user"
    JournalIndex = "journal"
)

type User struct {
    UserId       string `json:"user_id"`
    Email        string `json:"email"`
    PasswordHash string `json:"password_hash"`
    CreateDate   time.Time `json:"create_date"`
    LastLoginDate time.Time `json:"last_login_date"`
}

type JournalEntry struct {
    UserId     string `json:"user_id"`
    Entries    []string `json:"entries"`
    Date time.Time `json:"create_date"`
}

type Service struct {
    es *elastigo.Conn
}

type IndexSettings struct {
    Mapper map[string]interface{} `json:"mapper"`
    Mappings map[string]interface{} `json:"mappings"`
}

type ElasticOptions struct {
    Host string
    Port int
}

func (s *Service) InitDataStore(esopts *ElasticOptions) error {
    conn := elastigo.NewConn()
    if (esopts != nil) {
        conn.SetPort(string(esopts.Port))
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
                            "type": "string",
                            "index": "not_analyzed"
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
                            "index": "analyzed"
                        }
                    }
                }
            }
        }`)

        var indexSettings IndexSettings
        err := json.Unmarshal(indexJson, &indexSettings)

        if (err != nil) {
            log.Println("Error deserializing json: " + err.Error())
            return err
        }

        resp, err := c.CreateIndexWithSettings(EsIndex, indexSettings)
        if (err != nil) {
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
        Filter(elastigo.Filter().Term("email", email));

    result, err := s.es.Search(EsIndex, UserIndex, nil, query)
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
        Filter(elastigo.Filter().Term("email", email));

    result, err := s.es.Search(EsIndex, UserIndex, nil, query)
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
    err := s.es.GetSource(EsIndex, UserIndex, id, nil, &retval)

    if err != nil {
        log.Println("User " + id + " not found")
        return retval, err
    }

    return retval, nil
}

func (s *Service) UpdateUser(id string, email string, password string) (error) {
    user, err := s.GetUserById(id)

    log.Println(user)

    if err != nil {
        return UserNotFound
    }

    user.UserId = id

    if len(email) > 0 {
        user.Email = email
    }

    if len(password) > 0 {
        pass, err := bcrypt.GenerateFromPassword([]byte(password), 10)
        if err == nil {
            user.PasswordHash = base64.StdEncoding.EncodeToString(pass)
        }

        _, err = s.es.Index(EsIndex, UserIndex, id, nil, user)
        if err != nil {
            return err
        }
    }

    return nil
}

func (s *Service) CreateUser(email string, password string) (error) {

    _, err := s.GetUserByEmail(email)
    if err == UserNotFound {
        id := uuid.New()

        pass, err := bcrypt.GenerateFromPassword([]byte(password), 10)
        if err != nil {
            panic(err)
        }

        _, err = s.es.Index(EsIndex, UserIndex, id, nil, User{
            UserId:       id,
            Email:        email,
            CreateDate:   time.Now(),
            PasswordHash: base64.StdEncoding.EncodeToString(pass)})

        if err != nil {
            panic(err)
        }

        return err
    } else {
        return UserAlreadyExists
    }
}

//Journal Functions

func (s *Service) CreateJournalEntry(userId string, entries []string, date time.Time) (error) {
    _, err := s.GetJournalEntryByDate(userId, date)
    if err != NoJournalWithDate {
        return EntryAlreadyExists
    }

    createDate := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, time.UTC)

    id := uuid.New()
    entry := JournalEntry{UserId: userId, Date: createDate, Entries: entries}

    _, err = s.es.Index(EsIndex, JournalIndex, id, nil, entry)
    return err
}

func (s *Service) UpdateJournalEntry(id string, userId string, entries []string) (error) {
    var entry JournalEntry

    err := s.es.GetSource(EsIndex, JournalIndex, id, nil, &entry)

    if err != nil {
        return err
    }

    if entry.UserId != userId {
        return EntryNotFound
    }

    entry.Entries = entries
    _, err = s.es.Index(EsIndex, JournalIndex, id, nil, entry)

    return err
}

func (s *Service) DeleteJournalEntry(id string, userId string) (error) {
    var entry JournalEntry
    err := s.es.GetSource(EsIndex, JournalIndex, id, nil, &entry)

    if err != nil || userId != entry.UserId {
        return EntryNotFound
    }

    _, err = s.es.Delete(EsIndex, JournalIndex, id, nil)
    return err
}

func (s *Service) GetJournalEntryByDate(userId string, date time.Time) (JournalEntry, error) {
    var retval JournalEntry

    createDate := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, time.UTC)

    query := elastigo.Query().
        All().
        Filter(elastigo.Filter().
            And(elastigo.Filter().Term("user_id", userId)).
            And(elastigo.Filter().Term("create_date", createDate)))

    result, err := s.es.Search(EsIndex, JournalIndex, nil, query)
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