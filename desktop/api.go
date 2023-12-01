package desktop

import (
	"context"
	"encoding/json"
	"github.com/astaxie/beego/logs"
	"nginx-ui/server/models"
	"nginx-ui/server/service"
)

var ApiSession = Session{}

var userService = service.NewUserService()
var nginxApi = NewNginxApi()

// Api struct
type Api struct {
	ctx context.Context
}

// NewApi NewApp creates a new App application struct
func NewApi() *Api {
	return &Api{}
}

// Startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *Api) Startup(ctx context.Context) {
	ApiSession.ctx = ctx
	a.ctx = ctx
	ApiSession.Load()
	logs.Info("Startup finish")
}

type ApiResp struct {
	Data *models.RespData `json:"data"`
}

// PostApi 做一个统一的适配层
func (a *Api) PostApi(path string, req string) ApiResp {
	logs.Info("[POST] path: %s, data: %s", path, req)

	if nginxApi.Match(path) {
		return nginxApi.PostApi(path, req)
	}
	var data *models.RespData

	switch path {
	case "/user/login":
		var user *models.User
		err := json.Unmarshal([]byte(req), user)
		if err != nil {
			logs.Error(err, req)
			data = models.NewErrorResp(err)
		}
		data = userService.Login(user)
		if data.Success() {
			ApiSession.SetUser(user)
		}
		break
	case "/user/register":
		data = userService.SignUp([]byte(req))
		break
	}
	return ApiResp{Data: data}
}

func (a *Api) GetApi(path string, req string) ApiResp {
	logs.Info("[GET] path: %s, data: %s", path, req)
	if nginxApi.Match(path) {
		return nginxApi.GetApi(path, req)
	}
	var data *models.RespData
	switch path {
	case "/user/info":
		data = models.SuccessResp(ApiSession.user)
		break
	}

	logs.Info("resp:{}", data)
	return ApiResp{Data: data}
}

func (a *Api) DeleteApi(path string, req string) ApiResp {
	logs.Info("[DELETE] path: %s, data: %s", path, req)
	if nginxApi.Match(path) {
		return nginxApi.DeleteApi(path, req)
	}
	return ApiResp{}
}

func (a *Api) PutApi(path string, req string) ApiResp {
	logs.Info("[PUT] path: %s, data: %s", path, req)
	if nginxApi.Match(path) {
		return nginxApi.PutApi(path, req)
	}
	return ApiResp{}
}
