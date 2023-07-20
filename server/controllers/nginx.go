package controllers

import (
	"encoding/json"
	"github.com/astaxie/beego/logs"
	"github.com/astaxie/beego/orm"
	"server/models"
	ngx "server/nginx"
	"strconv"
)

type NginxController struct {
	BaseController
}

const ReplacePassword = "******"

// Get getAll
func (c *NginxController) Get() {
	o := orm.NewOrm()
	qs := o.QueryTable("nginx")
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
	var nginx models.Nginx
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &nginx)
	if err != nil {
		logs.Error(err, string(c.Ctx.Input.RequestBody))
		c.ErrorJson(err)
		return
	}
	nginx.Check()
	o := orm.NewOrm()
	var saveErr error
	if nginx.Id == 0 {
		_, err = o.Insert(&nginx)
		saveErr = err
	} else {
		tmp := models.Nginx{
			Id: nginx.Id,
		}
		err = o.Read(&tmp)
		if err != nil {
			c.ErrorJson(err)
			return
		}
		if nginx.Password == ReplacePassword {
			nginx.Password = tmp.Password
		}
		nginx.HttpConf = tmp.HttpConf
		_, err = o.Update(&nginx)
		saveErr = err
	}

	if saveErr != nil {
		c.ErrorJson(saveErr)
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
func (c *NginxController) StartNginx() {
	idStr := c.getParam(":id")
	id, err := strconv.Atoi(idStr)
	logs.Info("id", id)
	if err != nil {
		c.ErrorJson(err)
		return
	}
	var nginx = models.Nginx{
		Id: id,
	}
	o := orm.NewOrm()
	err = o.Read(&nginx)
	if err != nil {
		c.ErrorJson(err)
		return
	}
	instance := ngx.GetInstance(&nginx)
	err = instance.Start()
	isRun, msg := instance.Status()
	c.setData(isRun).setMsg(msg).json()
}

// StopNginx add nginx instance
func (c *NginxController) StopNginx() {
	idStr := c.getParam(":id")
	id, err := strconv.Atoi(idStr)
	logs.Info("id", id)
	if err != nil {
		c.ErrorJson(err)
		return
	}

	var nginx = models.Nginx{
		Id: id,
	}
	o := orm.NewOrm()
	err = o.Read(&nginx)
	if err != nil {
		c.ErrorJson(err)
		return
	}
	instance := ngx.GetInstance(&nginx)
	err = instance.Stop()
	isRun, msg := instance.Status()
	c.setData(isRun).setMsg(msg).json()
}

// RefreshHttp nginx detail data
func (c *NginxController) RefreshHttp() {
	var nginx models.Nginx
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &nginx)
	if err != nil {
		logs.Error(err, string(c.Ctx.Input.RequestBody))
		c.ErrorJson(err)
		return
	}

	logs.Info("id", nginx)

	o := orm.NewOrm()
	if nginx.HttpConf != "" {
		_, err = o.Update(&nginx, "HttpConf","HttpData")
		if err != nil {
			c.ErrorJson(err)
			return
		}
	}
	err = o.Read(&nginx)
	if err != nil {
		c.ErrorJson(err)
		return
	}
	ins := ngx.GetInstance(&nginx)
	err = ins.RefreshHttp(nginx)
	if err != nil {
		c.ErrorJson(err)
		return
	}
	c.setData(nginx)
	c.json()
}

// GetNginx nginx detail data
func (c *NginxController) GetNginx() {
	idStr := c.getParam(":id")
	id, err := strconv.Atoi(idStr)
	logs.Info("id", id)
	if err != nil {
		c.ErrorJson(err)
		return
	}
	o := orm.NewOrm()

	var nginx = models.Nginx{Id: id}
	err = o.Read(&nginx)
	if err != nil {
		c.ErrorJson(err)
		return
	}
	if nginx.Password != "" {
		nginx.Password = ReplacePassword
	}
	c.addRespData("nginx", nginx)

	var servers []models.ServerHost
	_, err = o.QueryTable((*models.ServerHost)(nil)).Filter("NginxId", id).All(&servers)
	if err != nil {
		c.ErrorJson(err)
		return
	}
	c.addRespData("servers", servers)
	c.json()
}

// DelNginx delete a instance
func (c *NginxController) DelNginx() {
	id, err := c.getIntParam(":id")
	if err != nil {
		c.ErrorJson(err)
		return
	}
	o := orm.NewOrm()
	nginx := models.Nginx{Id: id}
	count, err := o.Delete(&nginx)
	if err != nil {
		c.ErrorJson(err)
	} else {
		c.setData(count).json()
	}
}

// StopNginx add nginx instance
func (c *NginxController) StatusNginx() {
	idStr := c.getParam(":id")
	id, err := strconv.Atoi(idStr)
	logs.Info("id", id)
	if err != nil {
		c.ErrorJson(err)
		return
	}

	var nginx = models.Nginx{
		Id: id,
	}
	o := orm.NewOrm()
	err = o.Read(&nginx)
	if err != nil {
		c.ErrorJson(err)
		return
	}
	instance := ngx.GetInstance(&nginx)
	isRun, msg := instance.Status()
	c.setData(isRun).setMsg(msg).json()
}
