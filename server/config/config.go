package config

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"github.com/astaxie/beego"
	"github.com/astaxie/beego/logs"
	"github.com/astaxie/beego/orm"
	"golang.org/x/oauth2"
	"os"
	"server/models"
	"server/utils"
	"strings"
)

type AppConfig struct {
	BaseApi     string
	DataDir     string
	ContextPath string
}

type CompleteOauth2Config struct {
	*oauth2.Config
	Userinfo string
	Enable   bool
}

var OauthConfig = &CompleteOauth2Config{
	Enable: false,
	Config: &oauth2.Config{
		ClientID:     "",
		ClientSecret: "",
		Endpoint:     oauth2.Endpoint{},
		RedirectURL:  "",
		Scopes:       []string{},
	},
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
	baseApi = strings.TrimSuffix(baseApi, "/")
	Config.ContextPath = beego.AppConfig.DefaultString("contextpath", "")
	Config.ContextPath = strings.TrimSuffix(Config.ContextPath, "/")
	Config.BaseApi = baseApi
	Config.DataDir = beego.AppConfig.String("datadir")
	if exist := utils.IsExist(Config.DataDir); exist == false {
		err := os.MkdirAll(Config.DataDir, 0777)
		logs.Warn("create data dir fail", err)
		if err != nil {
			panic(err)
		}
	}

	OauthConfig.ClientID = beego.AppConfig.DefaultString("oauth2_client_id", "")
	OauthConfig.ClientSecret = beego.AppConfig.DefaultString("oauth2_client_secret", "")

	authorizeEndpoint := beego.AppConfig.DefaultString("oauth2_authorize_endpoint", "")
	tokenEndpoint := beego.AppConfig.DefaultString("oauth2_token_endpoint", "")

	OauthConfig.Endpoint = oauth2.Endpoint{
		AuthURL:   authorizeEndpoint,
		TokenURL:  tokenEndpoint,
		AuthStyle: 0,
	}
	OauthConfig.RedirectURL = beego.AppConfig.DefaultString("oauth2_redirect_uri", "")
	OauthConfig.Scopes = beego.AppConfig.DefaultStrings("oauth2_scopes", []string{})
	OauthConfig.Userinfo = beego.AppConfig.DefaultString("oauth2_userinfo", "")
	OauthConfig.Enable = beego.AppConfig.DefaultBool("oauth2_enable", false)
}

func InitAdmin() {
	o := orm.NewOrm()
	reset := beego.AppConfig.DefaultBool("reset_admin_password", false)
	admin := models.User{Account: "admin"}
	err := o.Read(&admin, "Account")
	if err != nil && !reset {
		return
	}
	password := beego.AppConfig.DefaultString("admin_password", randPassword(10))
	admin.Password = utils.GetSHA256HashCode(password)
	admin.Remark = "admin"
	admin.Roles = "ADMIN"
	if admin.Id > 0 {
		_, err = o.Update(&admin)
	} else {
		_, err = o.Insert(&admin)
	}
	if err != nil {
		logs.Warn("insert or update admin fail", err)
	} else {
		logs.Warn(fmt.Sprintf("admin password is:  %s", password))
	}

}

func randPassword(n int) string {
	b := make([]byte, n)
	_, err := rand.Read(b)
	if err != nil {
		return "123456"
	}
	return base64.StdEncoding.EncodeToString(b)
}
