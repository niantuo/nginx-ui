package desktop

import (
	"context"
	"github.com/astaxie/beego/logs"
	"nginx-ui/server/models"
	"nginx-ui/server/routers"
	"nginx-ui/server/service"
	"strings"
)

var logger = logs.GetLogger("NginxApi")

var nginxService = service.NginxService{}

// NginxApi struct
type NginxApi struct {
	ctx context.Context
}

// NewNginxApi creates a new App application struct
func NewNginxApi() *NginxApi {
	return &NginxApi{}
}

func (a *NginxApi) Match(path string) bool {
	return strings.HasPrefix(path, "/nginx")
}

// PostApi 做一个统一的适配层
func (a *NginxApi) PostApi(path string, req string) ApiResp {
	logger.Printf("[POST] path: %s, data: %s", path, req)
	var user = ApiSession.user
	if path == routers.NginxR {
		return ApiResp{
			Data: nginxService.Add(user, []byte(req)),
		}
	}

	var data *models.RespData

	if result := ParsePathParam(path, routers.NginxGetR); result.Match {
		id := result.GetParam("id")
		data = nginxService.GetNginx(id, user)
	} else if result := ParsePathParam(path, routers.NginxStatusR); result.Match {
		//id := result.GetParam("id")
	}
	return ApiResp{Data: data}
}

func (a *NginxApi) GetApi(path string, req string) ApiResp {
	logger.Printf("[GET] path: %s, data: %s", path, req)
	var user = ApiSession.user
	if path == routers.NginxR {
		return ApiResp{
			Data: nginxService.ListNginx(user),
		}
	}
	if r := ParsePathParam(path, routers.NginxGetR); r.Match {
		id := r.GetParam("id")
		logs.Info("param: ", r, id)
		return ApiResp{
			Data: nginxService.GetNginx(id, user),
		}
	}

	var data *models.RespData

	logs.Info("resp:{}", data)
	return ApiResp{Data: data}
}

func (a *NginxApi) DeleteApi(path string, req string) ApiResp {
	logger.Printf("[DELETE] path: %s, data: %s", path, req)

	return ApiResp{}
}

func (a *NginxApi) PutApi(path string, req string) ApiResp {
	logger.Printf("[PUT] path: %s, data: %s", path, req)
	return ApiResp{}
}
