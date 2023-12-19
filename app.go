package main

import (
	"github.com/astaxie/beego"
	_ "nginx-ui/server/init"
)

// 启动一个后台服务
func main() {
	beego.Run()
}
