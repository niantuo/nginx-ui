package controllers

import (
	"encoding/json"
	"github.com/astaxie/beego/logs"
	"github.com/astaxie/beego/orm"
	"nginx-ui/server/models"
	ngx "nginx-ui/server/nginx"
)

type NginxController struct {
	BaseController
}

const ReplacePassword = "******"

// Get getAll,
// 管理员获取全部，非管理员或者自己名下的
func (c *NginxController) Get() {
	current := c.RequiredUser()
	if current == nil {
		return
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
		c.ErrorJson(err)
		return
	} else {
		c.setData(list).json()
	}
}

// Post add nginx instance
func (c *NginxController) Post() {
	current := c.RequiredUser()
	if current == nil {
		return
	}
	var nginx models.Nginx
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &nginx)
	if err != nil {
		logs.Error(err, string(c.Ctx.Input.RequestBody))
		c.ErrorJson(err)
		return
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
		c.ErrorJson(err)
		return
	}
	logs.Info("post", nginx)

	instance := ngx.GetInstance(&nginx)
	err = instance.Connect()
	if err != nil {
		c.setCode(1).setMsg(err.Error()).setData(nginx)
		c.json()
		return
	}
	out, err := instance.GetVersion()
	if err != nil {
		c.setCode(1).setMsg(err.Error()).setData(nginx)
		c.json()
		return
	}
	nginx.VersionInfo = out
	_, _ = o.Update(&nginx, "VersionInfo")
	c.setData(nginx).json()
}

// Update modify nginx instance
// post /nginx/:id
func (c *NginxController) Update() {

	exist, err := c.CheckNginxPermission()
	if err != nil {
		return
	}

	var nginx models.Nginx
	err = json.Unmarshal(c.Ctx.Input.RequestBody, &nginx)
	if err != nil {
		logs.Error(err, string(c.Ctx.Input.RequestBody))
		c.ErrorJson(err)
		return
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
		c.ErrorJson(err)
		return
	}
	logs.Info("post", nginx)

	instance := ngx.GetInstance(&nginx)
	err = instance.Connect()
	if err != nil {
		c.setCode(1).setMsg(err.Error()).setData(nginx)
		c.json()
		return
	}
	out, err := instance.GetVersion()
	if err != nil {
		c.setCode(1).setMsg(err.Error()).setData(nginx)
		c.json()
		return
	}
	nginx.VersionInfo = out
	_, _ = o.Update(&nginx, "VersionInfo")
	c.setData(nginx).json()
}

// StartNginx startNginx
// post /nginx/:id/start
func (c *NginxController) StartNginx() {

	nginx, err := c.CheckNginxPermission()
	if err != nil {
		return
	}

	instance := ngx.GetInstance(nginx)
	err = instance.Start()
	isRun, msg := instance.Status()
	c.setData(isRun).setMsg(msg).json()
}

// StopNginx add nginx instance
// post /nginx/:id/stop
func (c *NginxController) StopNginx() {
	nginx, err := c.CheckNginxPermission()
	if err != nil {
		return
	}
	instance := ngx.GetInstance(nginx)
	err = instance.Stop()
	isRun, msg := instance.Status()
	c.setData(isRun).setMsg(msg).json()
}

// RefreshHttp nginx detail data
// post /nginx/:id/http/refresh
func (c *NginxController) RefreshHttp() {
	exist, err := c.CheckNginxPermission()
	if err != nil {
		return
	}

	var nginx models.Nginx
	err = json.Unmarshal(c.Ctx.Input.RequestBody, &nginx)
	if err != nil {
		logs.Error(err, string(c.Ctx.Input.RequestBody))
		c.ErrorJson(err)
		return
	}

	logs.Info("id", nginx)

	o := orm.NewOrm()
	if nginx.HttpConf != "" {
		_, err = o.Update(&nginx, "HttpConf", "HttpData")
		if err != nil {
			c.ErrorJson(err)
			return
		}
		exist.HttpConf = nginx.HttpConf
		exist.HttpData = nginx.HttpData
	}

	ins := ngx.GetInstance(exist)
	err = ins.RefreshHttp(*exist)
	if err != nil {
		c.ErrorJson(err)
		return
	}
	c.json()
}

// GetNginx nginx detail data
// get /nginx/:id
func (c *NginxController) GetNginx() {
	nginx, err := c.CheckNginxPermission()
	if err != nil {
		return
	}
	if nginx.Password != "" {
		nginx.Password = ReplacePassword
	}
	c.addRespData("nginx", nginx)

	o := orm.NewOrm()

	var servers []models.ServerHost
	_, err = o.QueryTable((*models.ServerHost)(nil)).Filter("NginxId", nginx.Id).All(&servers)
	if err != nil {
		c.ErrorJson(err)
		return
	}
	c.addRespData("servers", servers)
	c.json()
}

// DelNginx delete a instance
// delete /nginx/:id
func (c *NginxController) DelNginx() {
	nginx, err := c.CheckNginxPermission()
	if err != nil {
		return
	}
	o := orm.NewOrm()
	count, err := o.Delete(nginx, "Id")
	if err != nil {
		c.ErrorJson(err)
	} else {
		c.setData(count).json()
	}
}

// StatusNginx add nginx instance
// post /nginx/:id/status
func (c *NginxController) StatusNginx() {
	nginx, err := c.CheckNginxPermission()
	if err != nil {
		return
	}
	instance := ngx.GetInstance(nginx)
	isRun, msg := instance.Status()
	c.setData(isRun).setMsg(msg).json()
}
