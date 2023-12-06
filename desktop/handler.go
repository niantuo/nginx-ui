package desktop

import (
	"context"
	"errors"
	"fmt"
	_ "io/ioutil"
	"net/http"
	"net/http/httputil"
	"nginx-ui/server/config"
	"strings"
)

type ApiHandler struct {
	http.Handler
	ctx     context.Context
	api     *Api
	proxy   *httputil.ReverseProxy
	handler http.Handler
}

func rewriteRequestURL(req *http.Request) {
	logger.Printf("req.URL: %s, method: %s", req.URL, req.Method)

	req.URL.Scheme = "http"
	req.URL.Host = fmt.Sprintf("localhost:%d", config.Config.Port)
	path := req.URL.Path
	path = strings.TrimPrefix(path, "/api")
	req.URL.Path = path
	logger.Printf("Loading '%s'", req.URL)
}

func NewApiHandler(baseHandler http.Handler) *ApiHandler {

	var proxy *httputil.ReverseProxy
	errSkipProxy := fmt.Errorf("skip proxying")
	proxy = httputil.NewSingleHostReverseProxy(nil)
	proxy.ModifyResponse = func(res *http.Response) error {
		if baseHandler == nil {
			return nil
		}

		if res.StatusCode == http.StatusSwitchingProtocols {
			return nil
		}

		if res.StatusCode == http.StatusNotFound || res.StatusCode == http.StatusMethodNotAllowed {
			return errSkipProxy
		}

		return nil
	}

	proxy.ErrorHandler = func(rw http.ResponseWriter, r *http.Request, err error) {
		if baseHandler != nil && errors.Is(err, errSkipProxy) {
			logger.Printf("'%s' returned not found, using AssetHandler", r.URL)
			baseHandler.ServeHTTP(rw, r)
		} else {
			logger.Printf("Proxy error: %v", err)
			rw.WriteHeader(http.StatusBadGateway)
		}
	}

	return &ApiHandler{
		api:     NewApi(),
		proxy:   proxy,
		handler: baseHandler,
	}
}

func (h *ApiHandler) Startup(ctx context.Context) {
	ApiSession.ctx = ctx
	h.ctx = ctx
	h.api.ctx = ctx
}

// 这也是一种方法，不过感觉比较复杂，需要自己处理请求参数之类的
func (h *ApiHandler) ServeHTTP(rw http.ResponseWriter, req *http.Request) {
	h.proxy.Director = func(request *http.Request) {
		rewriteRequestURL(request)
		request.Body = req.Body
	}
	h.proxy.ServeHTTP(rw, req)
}
