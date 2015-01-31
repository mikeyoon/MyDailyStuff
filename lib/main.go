// myweb project main.go
package main

import (
	"github.com/go-martini/martini"
	"github.com/martini-contrib/render"
	"github.com/mattbaird/elastigo/core"
	elastigo "github.com/mattbaird/elastigo/lib"
)

var (
	host *string = flag.String("host", "localhost", "Elasticsearch Host")
)

func main() {
	m := martini.Classic()
	m.Use(render.Renderer())

	//Build Indicies

	c := elastigo.NewConn()
	c.Domain = *host
	c.CreateIndexWithSettings()

	m.Get("/", func(r render.Render) {
		r.JSON(200, map[string]interface{}{"Hello": "World"})
	})

	m.Run()
}
