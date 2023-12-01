package init

import (
	"encoding/gob"
	"fmt"
	"nginx-ui/server/config"
	"nginx-ui/server/db"
	"nginx-ui/server/models"
)

func init() {
	gob.Register(models.User{})
	db.Init()
	config.InitAdmin()
	fmt.Println("init success")
}
