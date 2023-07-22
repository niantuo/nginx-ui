package config

import (
	"github.com/astaxie/beego"
	"github.com/astaxie/beego/logs"
	"os"
	"server/utils"
)

type AppConfig struct {
	BaseApi string
	DataDir string
}

var Config = &AppConfig{}

func GetDataDir() string {
	return Config.DataDir
}

func init() {
	// 需要和前端配置好
	baseApi := beego.AppConfig.String("baseApi")
	if baseApi == "" {
		baseApi = "/ngx"
		err := beego.AppConfig.Set("baseApi", baseApi)
		if err != nil {
			logs.Info("init set baseApi", err)
		}
	}
	Config.BaseApi = baseApi
	Config.DataDir = beego.AppConfig.String("datadir")
	if exist := utils.IsExist(Config.DataDir); exist == false {
		err := os.MkdirAll(Config.DataDir, 0777)
		logs.Warn("create data dir fail", err)
		if err != nil {
			panic(err)
		}
	}
}
