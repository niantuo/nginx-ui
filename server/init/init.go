package init

import (
	"encoding/gob"
	"fmt"
	_ "github.com/beego/beego/v2/server/web/session/redis"
	"nginx-ui/server/config"
	"nginx-ui/server/db"
	"nginx-ui/server/models"
	_ "nginx-ui/server/routers"
)

func init() {
	gob.Register(models.User{})
	db.Init()
	config.InitAdmin()
	fmt.Println("init success")
}
