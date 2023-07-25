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
	BaseApi              string
	DataDir              string
	DBDir                string
	ContextPath          string
	NginxPath            string
	NginxDir             string
	ThirdSession         bool
	ThirdSessionName     string
	ThirdSessionCheckUrl string
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
	beego.BConfig.CopyRequestBody = true
	mode := beego.AppConfig.DefaultString("runmode", "prod")
	beego.BConfig.RunMode = mode
	port := beego.AppConfig.DefaultInt("httpport", 8080)
	beego.BConfig.Listen.HTTPPort = port

	// 需要和前端配置好
	baseApi := beego.AppConfig.DefaultString("baseApi", "/nginx-ui/api")
	baseApi = strings.TrimSuffix(baseApi, "/")
	Config.ContextPath = beego.AppConfig.DefaultString("contextpath", "/nginx-ui")
	Config.ContextPath = strings.TrimSuffix(Config.ContextPath, "/")
	Config.BaseApi = baseApi
	Config.DataDir = beego.AppConfig.DefaultString("datadir", "./data")
	Config.DBDir = beego.AppConfig.DefaultString("dbdir", "./data/db")
	if exist := utils.IsExist(Config.DataDir); exist == false {
		err := os.MkdirAll(Config.DataDir, 0777)
		logs.Warn("create data dir fail", err)
		if err != nil {
			panic(err)
		}
	}

	Config.NginxPath = beego.AppConfig.DefaultString("nginxPath", "/usr/sbin/nginx")
	Config.NginxDir = beego.AppConfig.DefaultString("nginxDir", "/etc/nginx")

	Config.ThirdSession = beego.AppConfig.DefaultBool("thirdsessionenable", false)
	Config.ThirdSessionName = beego.AppConfig.DefaultString("thirdsessionname", "")
	Config.ThirdSessionCheckUrl = beego.AppConfig.DefaultString("thirdsessioncheckurl", "")
	if Config.ThirdSession && (len(Config.ThirdSessionName) == 0 || len(Config.ThirdSessionCheckUrl) == 0) {
		logs.Warn("please config thirdsessionname and thirdsessioncheckurl, third session will skip!")
		Config.ThirdSession = false
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
	// session 相关的配置
	sessionon := beego.AppConfig.DefaultBool("sessionon", true)
	beego.BConfig.WebConfig.Session.SessionOn = sessionon
	sessionprovider := beego.AppConfig.DefaultString("sessionprovider", "file")
	beego.BConfig.WebConfig.Session.SessionProvider = sessionprovider
	sessionproviderconfig := beego.AppConfig.DefaultString("sessionproviderconfig", "./data/sessions")
	beego.BConfig.WebConfig.Session.SessionProviderConfig = sessionproviderconfig
	sessiongcmaxlifetime := beego.AppConfig.DefaultInt("sessiongcmaxlifetime", 7200)
	beego.BConfig.WebConfig.Session.SessionCookieLifeTime = sessiongcmaxlifetime
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
