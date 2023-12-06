package main

import (
	"github.com/astaxie/beego"
	_ "nginx-ui/server/init"
)

func main() {
	beego.Run()
}
