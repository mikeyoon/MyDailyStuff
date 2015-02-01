// users
package mydailystuff

import (
	//"encoding/json"
	elastigo "github.com/mattbaird/elastigo/lib"
	"log"
)

func CreateIndexes(c *elastigo.Conn) error {
	usersExists, err := c.IndicesExists("users")

	if err != nil {
		log.Println("Error retriving user index: " + err.Error())
		return err
	}

	if !usersExists {
		log.Println("Creating Users Index")
		c.CreateIndex("users")
	}

	journalExists, err := c.IndicesExists("journal")

	if err != nil {
		log.Println("Error retriving journal index: " + err.Error())
		return err
	}

	if !journalExists {
		log.Println("Creating Journals Index")
		c.CreateIndex("journal")
	}

	return nil
}
