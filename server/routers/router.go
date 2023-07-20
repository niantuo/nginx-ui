package routers

import (
	"encoding/json"
	"github.com/astaxie/beego"
	"github.com/astaxie/beego/context"
	"github.com/astaxie/beego/logs"
	"net/http"
	config2 "server/config"
	"server/controllers"
	"strings"
)

func init() {
	config := config2.Config
	ns := beego.NewNamespace(config.BaseApi,
		beego.NSRouter("/nginx", &controllers.NginxController{}),
		beego.NSRouter("/nginx/:id", &controllers.NginxController{}, "get:GetNginx"),
		beego.NSRouter("/nginx/:id", &controllers.NginxController{}, "delete:DelNginx"),
		beego.NSRouter("/http/refresh", &controllers.NginxController{}, "post:RefreshHttp"),
		beego.NSRouter("/nginx/:id/start", &controllers.NginxController{}, "post:StartNginx"),
		beego.NSRouter("/nginx/:id/stop", &controllers.NginxController{}, "post:StopNginx"),
		beego.NSRouter("/nginx/:id/status", &controllers.NginxController{}, "post:StatusNginx"),
		// certs
		beego.NSRouter("/nginx/:id/certs", &controllers.CertController{}),
		beego.NSRouter("/nginx/:id/certs/sync", &controllers.CertController{}, "post:Sync"),
		// nginx server apis
		beego.NSRouter("/server", &controllers.ServerController{}),
		beego.NSRouter("/server/refresh", &controllers.ServerController{}, "post:Refresh"),
		// file upload download
		beego.NSRouter("/file", &controllers.FileController{}),
		beego.NSRouter("/file/deploy", &controllers.FileController{}, "post:Deploy"),
	)
	beego.AddNamespace(ns)

	beego.Router("/nginx-ui/config.js", &controllers.ConfigController{})
	// portal static assets
	beego.SetStaticPath("/nginx-ui", "static/web")
	beego.SetStaticPath("/web", "static/web")

	beego.Get("/", func(ctx *context.Context) {
		ctx.Redirect(301, "/nginx-ui/index.html")
	})

	beego.ErrorHandler("404", func(writer http.ResponseWriter, request *http.Request) {
		accept := request.Header.Get("accept")
		logs.Warn("404", accept)
		if strings.Contains(accept, "json") {
			writer.Header().Set("content-type", "application/json")
			writer.WriteHeader(200)
			resp := controllers.RespData{
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
