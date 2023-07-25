package controllers

import (
	"fmt"
	"github.com/astaxie/beego/logs"
	config2 "server/config"
)

type ConfigController struct {
	BaseController
}

// Get 前端的配置文件
func (c *ConfigController) Get() {

	config := config2.Config
	oauth2Config := config2.OauthConfig
	var sso = "false"
	if oauth2Config.Enable {
		sso = "true"
	}
	js := fmt.Sprintf("  window.CONFIG = {\n        baseApi: '%s',\n SSO: %s   }", config.BaseApi, sso)
	output := c.Ctx.Output

	output.SetStatus(200)
	output.Header("Cache-Control", "no-cache")
	output.Header("content-type", "text/javascript")
	err := c.Ctx.Output.Body([]byte(js))
	if err != nil {
		logs.Error("config.js fail", err)
		return
	}
}
