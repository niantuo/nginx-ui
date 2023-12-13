package main

import (
	"encoding/gob"
	"github.com/astaxie/beego"
	_ "nginx-ui/server/init"
	"nginx-ui/server/models"
)

func main() {
	gob.Register(models.User{})
	beego.Run()
}
