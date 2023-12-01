package routers

import (
	"encoding/json"
	"fmt"
	"github.com/astaxie/beego"
	"github.com/astaxie/beego/context"
	"github.com/astaxie/beego/logs"
	"net/http"
	config2 "nginx-ui/server/config"
	"nginx-ui/server/controllers"
	"nginx-ui/server/middleware"
	"nginx-ui/server/models"
	"strings"
)

var NginxR = "/nginx"
var NginxGetR = "/nginx/:id"
var NginxRefreshR = "/nginx/:id/http/refresh"
var NginxStartR = "/nginx/:id/start"
var NginxStopR = "/nginx/:id/stop"
var NginxStatusR = "/nginx/:id/status"

func init() {
	config := config2.Config

	userController := controllers.NewUserController()

	ns := beego.NewNamespace(config.BaseApi,
		beego.NSRouter(NginxR, &controllers.NginxController{}),
		beego.NSRouter(NginxGetR, &controllers.NginxController{}, "post:Update"),
		beego.NSRouter(NginxGetR, &controllers.NginxController{}, "get:GetNginx"),
		beego.NSRouter(NginxGetR, &controllers.NginxController{}, "delete:DelNginx"),
		beego.NSRouter(NginxRefreshR, &controllers.NginxController{}, "post:RefreshHttp"),
		beego.NSRouter(NginxStartR, &controllers.NginxController{}, "post:StartNginx"),
		beego.NSRouter(NginxStopR, &controllers.NginxController{}, "post:StopNginx"),
		beego.NSRouter(NginxStatusR, &controllers.NginxController{}, "post:StatusNginx"),
		// certs
		beego.NSRouter("/nginx/:id/certs", &controllers.CertController{}),
		beego.NSRouter("/nginx/:id/certs/sync", &controllers.CertController{}, "post:Sync"),
		// nginx server apis
		beego.NSRouter("/nginx/:id/server", &controllers.ServerController{}),
		beego.NSRouter("/nginx/:id/server/refresh", &controllers.ServerController{}, "post:Refresh"),
		// file upload download
		beego.NSRouter("/nginx/:id/file/deploy", &controllers.FileController{}, "post:Deploy"),
		beego.NSRouter("/file", &controllers.FileController{}),
		beego.NSRouter("/logger", &controllers.LoggerController{}),

		beego.NSRouter("/user/login", userController, "post:Login"),
		beego.NSRouter("/user/info", userController, "get:User"),
		beego.NSRouter("/user/register", userController, "post:Register"),
		beego.NSRouter("/oauth2", &controllers.Oauth2Controller{}),
		beego.NSRouter("/oauth2/callback", &controllers.Oauth2Controller{}, "post:Callback"),
	)
	beego.AddNamespace(ns)

	beego.InsertFilter(fmt.Sprintf("%s/**", config.BaseApi), beego.BeforeRouter, middleware.AuthFilter)

	beego.Router(fmt.Sprintf("%s/config.js", config.ContextPath), &controllers.ConfigController{})
	// portal static assets
	beego.SetStaticPath(config.ContextPath, "static/web")
	beego.Get("/", func(ctx *context.Context) {
		ctx.Redirect(301, fmt.Sprintf("%s/index.html", config.ContextPath))
	})

	beego.ErrorHandler("404", func(writer http.ResponseWriter, request *http.Request) {
		accept := request.Header.Get("accept")
		logs.Warn("404", accept)
		if strings.Contains(accept, "json") {
			writer.Header().Set("content-type", "application/json")
			writer.WriteHeader(200)
			resp := models.RespData{
				Code: -2,
				Msg:  "server error",
			}
			str, _ := json.Marshal(&resp)
			writer.Write(str)
		} else {
			writer.WriteHeader(404)
			writer.Write([]byte(""))
		}
	})
}
