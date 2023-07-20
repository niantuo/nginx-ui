package main

import (
	"github.com/astaxie/beego"
	_ "server/config"
	"server/db"
	_ "server/routers"
)

func main() {

	db.Init()
	beego.Run()

}
