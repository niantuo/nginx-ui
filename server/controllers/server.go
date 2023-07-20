package controllers

import (
	"encoding/json"
	"github.com/astaxie/beego/orm"
	"server/models"
	nginx2 "server/nginx"
)

type ServerController struct {
	BaseController
}

// Get getAllServers
func (c *ServerController) Get() {

	id, err := c.GetInt("id", 0)
	if err != nil {
		c.ErrorJson(err)
		return
	}

	o := orm.NewOrm()
	server := models.ServerHost{Id: id}
	err = o.Read(&server)
	if err != nil {
		c.ErrorJson(err)
		return
	}
	c.setData(server).json()
}

// Post add or update nginx instance
func (c *ServerController) Post() {
	var server models.ServerHost
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &server)
	if err != nil {
		c.ErrorJson(err)
		return
	}
	o := orm.NewOrm()
	var saveErr error
	if server.Id > 0 {
		tmp := models.ServerHost{Id: server.Id}
		err := o.Read(&tmp, "last_name")
		if err == nil {
			server.LastName = tmp.LastName
			server.ServerConf = tmp.ServerConf
		}
		_, saveErr = o.Update(&server)
	} else {
		_, saveErr = o.Insert(&server)
	}

	if saveErr != nil {
		c.ErrorJson(saveErr)
	} else {
		c.setData(server).json()
	}
}

// Delete add or update nginx instance
func (c *ServerController) Delete() {
	var server models.ServerHost
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &server)
	if err != nil {
		c.ErrorJson(err)
		return
	}
	o := orm.NewOrm()
	err = o.Read(&server)
	if err != nil {
		c.ErrorJson(err)
		return
	}
	nginx := models.Nginx{Id: server.NginxId}
	err = o.Read(&nginx)
	if err != nil {
		c.ErrorJson(err)
		return
	}
	ins := nginx2.GetInstance(&nginx)
	server.Enable = false
	err = ins.RefreshServer(server)
	if err != nil {
		c.ErrorJson(err)
		return
	}
	delServer := models.ServerHost{Id: server.Id}
	_, err = o.Delete(&delServer)
	if err != nil {
		c.ErrorJson(err)
		return
	}
	c.setData("success").json()
}

// Refresh check and refresh to disk
func (c *ServerController) Refresh() {
	var postData models.ServerHost
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &postData)
	if err != nil {
		c.ErrorJson(err)
		return
	}
	o := orm.NewOrm()
	_, err = o.Update(&postData)
	if err != nil {
		c.ErrorJson(err)
		return
	}

	var nginx = models.Nginx{Id: postData.NginxId}
	err = o.Read(&nginx)
	if err != nil {
		c.ErrorJson(err)
		return
	}
	ins := nginx2.GetInstance(&nginx)
	err = ins.RefreshServer(postData)
	if err != nil {
		c.ErrorJson(err)
		return
	}
	postData.LastName = postData.Name
	_, _ = o.Update(&postData)
	c.setData(true).json()
}
