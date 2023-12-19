package service

import (
	"encoding/json"
	"errors"
	"github.com/astaxie/beego/logs"
	"github.com/astaxie/beego/orm"
	"nginx-ui/server/models"
	ngx "nginx-ui/server/nginx"
	"strconv"
)

type NginxService struct {
}

const ReplacePassword = "******"

// CheckNginxPermission 从path中获取nginx的参数
func (c *NginxService) CheckNginxPermission(user *models.User, nginxId string) (*models.Nginx, error) {
	id, err := strconv.Atoi(nginxId)
	if err != nil {
		logs.Warn("strconv.Atoi(idStr) fail", nginxId)
		return nil, errors.New("请传递正确的参数！")
	}
	return c.CheckNginxPermissionById(user, id)
}

// CheckNginxPermissionById 验证权限，如果无权操作该nginx，返回nil,否则返回
func (c *NginxService) CheckNginxPermissionById(current *models.User, nginxId int) (*models.Nginx, error) {
	if nginxId < 1 {
		return nil, errors.New("nginx ID must gt 0！")
	}
	nginx := models.Nginx{Id: nginxId}
	o := orm.NewOrm()
	err := o.Read(&nginx)
	if err != nil {
		return nil, err
	}
	if !current.IsAdmin() && current.Account != nginx.Uid {
		return nil, errors.New("您无权操作该实例")
	}
	return &nginx, nil
}

// Get getAll,
// 管理员获取全部，非管理员或者自己名下的
func (c *NginxService) ListNginx(current *models.User) *models.RespData {

	if current == nil {
		return models.UnAuthResp
	}
	o := orm.NewOrm()
	qs := o.QueryTable("nginx")
	if !current.IsAdmin() {
		qs = qs.Filter("Uid", current.Account)
	}
	var list []*models.Nginx
	_, err := qs.All(&list)
	for i := range list {
		item := list[i]
		if item.Password != "" {
			item.Password = ReplacePassword
		}
	}
	if err != nil {
		return models.NewErrorResp(err)
	} else {
		return models.SuccessResp(list)
	}
}

// Post add nginx instance
func (c *NginxService) Add(current *models.User, req []byte) *models.RespData {
	if current == nil {
		return models.UnAuthResp
	}
	var nginx models.Nginx
	err := json.Unmarshal(req, &nginx)
	if err != nil {
		logs.Error(err, string(req))
		return models.NewErrorResp(err)
	}
	nginx.Check()
	o := orm.NewOrm()

	nginx.Uid = current.Account
	nginx.NginxPath = "/usr/sbin/nginx"
	nginx.NginxDir = "/etc/nginx"
	if nginx.IsLocal {
		nginx.IsServer = true
	}
	nginx.DataDir = "/app/data"
	_, err = o.Insert(&nginx)

	if err != nil {
		return models.NewErrorResp(err)
	}
	logs.Info("post", nginx)

	instance := ngx.GetInstance(&nginx)
	err = instance.Connect()
	if err != nil {
		return models.SuccessResp(nginx).SetCode(1).SetMsg(err.Error())
	}
	out, err := instance.GetVersion()
	if err != nil {
		return models.SuccessResp(nginx).SetCode(1).SetMsg(err.Error())
	}
	nginx.VersionInfo = out
	_, _ = o.Update(&nginx, "VersionInfo")
	return models.SuccessResp(nginx)
}

// Update modify nginx instance
// post /nginx/:id
func (c *NginxService) Update(nginxId string, current *models.User, req []byte) *models.RespData {
	if current == nil {
		return models.UnAuthResp
	}

	var nginx models.Nginx
	err := json.Unmarshal(req, &nginx)
	if err != nil {
		logs.Error(err, string(req))
		return models.NewErrorResp(err)
	}

	exist, err := c.CheckNginxPermission(current, nginxId)
	if err != nil {
		return models.NewErrorResp(err)
	}

	nginx.Id = exist.Id
	nginx.Uid = exist.Uid
	nginx.Check()
	o := orm.NewOrm()

	if nginx.Password == ReplacePassword {
		nginx.Password = exist.Password
	}
	nginx.HttpConf = exist.HttpConf
	_, err = o.Update(&nginx)

	if err != nil {
		return models.NewErrorResp(err)
	}
	logs.Info("post", nginx)

	instance := ngx.GetInstance(&nginx)
	err = instance.Connect()
	if err != nil {
		return models.NewResp(1, err.Error(), nginx)
	}
	out, err := instance.GetVersion()
	if err != nil {
		return models.NewResp(1, err.Error(), nginx)
	}
	nginx.VersionInfo = out
	_, _ = o.Update(&nginx, "VersionInfo")
	return models.SuccessResp(nginx)
}

// StartNginx startNginx
// post /nginx/:id/start
func (c *NginxService) StartNginx(nginxId string, user *models.User) *models.RespData {
	if user == nil {
		return models.UnAuthResp
	}

	nginx, err := c.CheckNginxPermission(user, nginxId)
	if err != nil {
		return models.NewErrorResp(err)
	}

	instance := ngx.GetInstance(nginx)
	err = instance.Start()
	isRun, msg := instance.Status()
	return models.SuccessResp(isRun).SetMsg(msg)
}

// StopNginx add nginx instance
// post /nginx/:id/stop
func (c *NginxService) StopNginx(nginxId string, user *models.User) *models.RespData {
	if user == nil {
		return models.UnAuthResp
	}

	nginx, err := c.CheckNginxPermission(user, nginxId)
	if err != nil {
		return models.NewErrorResp(err)
	}
	instance := ngx.GetInstance(nginx)
	err = instance.Stop()
	isRun, msg := instance.Status()
	return models.SuccessResp(isRun).SetMsg(msg)
}

// RefreshHttp nginx detail data
// post /nginx/:id/http/refresh
func (c *NginxService) RefreshHttp(nginxId string, user *models.User, req []byte) *models.RespData {
	if user == nil {
		return models.UnAuthResp
	}

	exist, err := c.CheckNginxPermission(user, nginxId)
	if err != nil {
		return models.NewErrorResp(err)
	}

	var nginx models.Nginx
	err = json.Unmarshal(req, &nginx)
	if err != nil {
		logs.Error(err, string(req))
		return models.NewErrorResp(err)
	}

	logs.Info("id", nginx)

	o := orm.NewOrm()
	if nginx.HttpConf != "" {
		_, err = o.Update(&nginx, "HttpConf", "HttpData")
		if err != nil {
			return models.NewErrorResp(err)
		}
		exist.HttpConf = nginx.HttpConf
		exist.HttpData = nginx.HttpData
	}

	ins := ngx.GetInstance(exist)
	err = ins.RefreshHttp(*exist)
	if err != nil {
		return models.NewErrorResp(err)
	}
	return models.SuccessResp(nil)
}

// GetNginx nginx detail data
// get /nginx/:id
func (c *NginxService) GetNginx(nginxId string, user *models.User) *models.RespData {
	if user == nil {
		return models.UnAuthResp
	}

	nginx, err := c.CheckNginxPermission(user, nginxId)
	if err != nil {
		return models.NewErrorResp(err)
	}
	if nginx.Password != "" {
		nginx.Password = ReplacePassword
	}
	var resp = map[string]interface{}{}
	resp["nginx"] = nginx
	o := orm.NewOrm()

	var servers []models.ServerHost
	_, err = o.QueryTable((*models.ServerHost)(nil)).Filter("NginxId", nginx.Id).All(&servers)
	if err != nil {
		return models.NewErrorResp(err)
	}
	resp["servers"] = servers
	return models.SuccessResp(resp)
}

// DelNginx delete a instance
// delete /nginx/:id
func (c *NginxService) DelNginx(nginxId string, user *models.User) *models.RespData {
	if user == nil {
		return models.UnAuthResp
	}

	nginx, err := c.CheckNginxPermission(user, nginxId)
	if err != nil {
		return models.NewErrorResp(err)
	}
	o := orm.NewOrm()
	count, err := o.Delete(nginx, "Id")
	if err != nil {
		return models.NewErrorResp(err)
	} else {
		return models.SuccessResp(count)
	}
}

// StatusNginx add nginx instance
// post /nginx/:id/status
func (c *NginxService) StatusNginx(nginxId string, user *models.User) *models.RespData {
	if user == nil {
		return models.UnAuthResp
	}

	nginx, err := c.CheckNginxPermission(user, nginxId)
	if err != nil {
		return models.NewErrorResp(err)
	}
	instance := ngx.GetInstance(nginx)
	isRun, msg := instance.Status()
	return models.SuccessResp(isRun).SetMsg(msg)
}
