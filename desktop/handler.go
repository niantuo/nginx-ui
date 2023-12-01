package desktop

import (
	"context"
	"github.com/astaxie/beego/logs"
	"net/http"
	"strings"
)

const prefix = "/api/nginx-ui/api"

type ApiHandler struct {
	http.Handler
	ctx context.Context
	api *Api
}

func NewApiHandler() *ApiHandler {
	return &ApiHandler{
		api: NewApi(),
	}
}

func (h *ApiHandler) Startup(ctx context.Context) {
	ApiSession.ctx = ctx
	h.ctx = ctx
	h.api.ctx = ctx

}

// 这也是一种方法，不过感觉比较复杂，需要自己处理请求参数之类的
func (h *ApiHandler) ServeHTTP(res http.ResponseWriter, req *http.Request) {
	requestUrl := strings.TrimPrefix(req.URL.Path, prefix)
	method := req.Method
	switch method {

	case http.MethodGet:

	}
	logs.Info("ServerHTTP: %s,%s", method, requestUrl)
	res.Write([]byte("{}"))
}
