package main

import (
	"github.com/astaxie/beego"
	_ "github.com/beego/beego/v2/server/web/session/redis"
	_ "nginx-ui/server/config"
	_ "nginx-ui/server/init"
	_ "nginx-ui/server/routers"
)

func main() {
	beego.Run()
}
