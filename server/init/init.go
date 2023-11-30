package init

import (
	"encoding/gob"
	"nginx-ui/server/config"
	"nginx-ui/server/db"
	"nginx-ui/server/models"
)

func init() {
	gob.Register(models.User{})
	db.Init()
	config.InitAdmin()
	println("init success")
}
