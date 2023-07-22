package middleware

import (
	"fmt"
	"github.com/astaxie/beego"
	"github.com/astaxie/beego/context"
	"github.com/astaxie/beego/logs"
	"github.com/astaxie/beego/session"
	"github.com/beego/beego/v2/client/httplib"
	"net/http"
	"server/models"
)

type ThirdSession struct {
	Enable     bool
	CookieName string
	CheckUrl   string
}

var thirdSession = ThirdSession{
	Enable:     false,
	CookieName: "",
	CheckUrl:   "",
}

func init() {
	beego.BConfig.WebConfig.Session.SessionAutoSetCookie = true

	thirdSession.Enable = beego.AppConfig.DefaultBool("thirdsessionenable", false)
	thirdSession.CookieName = beego.AppConfig.DefaultString("thirdsessionname", "")
	thirdSession.CheckUrl = beego.AppConfig.DefaultString("thirdsessioncheckurl", "")
	if thirdSession.Enable && (len(thirdSession.CookieName) == 0 || len(thirdSession.CheckUrl) == 0) {
		logs.Info("no thirdsessionname or thirdsessioncheckurl info,skip !")
		thirdSession.Enable = false
	}
}

func checkThirdSession(ctx *context.Context, sess session.Store) {
	if !thirdSession.Enable {
		return
	}
	cookie, err := ctx.Request.Cookie(thirdSession.CookieName)
	if err != nil {
		logs.Warn("no cookie", err)
		return
	}
	req := httplib.Get(thirdSession.CheckUrl)
	req.SetEnableCookie(true)
	req.SetCookie(cookie)
	user := models.User{}
	err = req.ToJSON(&user)
	if err != nil {
		logs.Warn("check third session fail ", err)
		return
	}
	err = sess.Set("user", user)
	if err != nil {
		logs.Warn("set session data fail ", err)
		return
	}
	logs.Debug("check third session ok ", user)
}

func AuthFilter(ctx *context.Context) {
	sess := ctx.Input.CruSession
	defer sess.SessionRelease(ctx.ResponseWriter)
	data := sess.Get("user")
	if data == nil {
		checkThirdSession(ctx, sess)
	}
	data = sess.Get("user")
	if data == nil {
		writeForbidden(ctx.ResponseWriter)
		return
	}
	user := data.(models.User)
	if len(user.Account) == 0 {
		writeForbidden(ctx.ResponseWriter)
		return
	}
	logs.Info(fmt.Sprintf("request uri: %s, uid: %s", ctx.Request.RequestURI, user.Account))
}

func writeForbidden(w http.ResponseWriter) {
	w.WriteHeader(403)
	_, err := w.Write([]byte("403 Forbidden\n"))
	if err != nil {
		logs.Warn("writeForbidden write error", err)
		return
	}
}
