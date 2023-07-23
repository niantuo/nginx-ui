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
// Get /nginx/:id/server
func (c *ServerController) Get() {
	nginx, err := c.CheckNginxPermission()
	if err != nil {
		return
	}

	id, err := c.GetInt("id", 0)
	if err != nil {
		c.ErrorJson(err)
		return
	}

	o := orm.NewOrm()
	server := models.ServerHost{Id: id, NginxId: nginx.Id}
	err = o.Read(&server, "Id", "NginxId")
	if err != nil {
		c.ErrorJson(err)
		return
	}
	c.setData(server).json()
}

// Post add or update nginx instance
// POST /nginx/:id/server
func (c *ServerController) Post() {
	nginx, err := c.CheckNginxPermission()
	if err != nil {
		return
	}
	var server models.ServerHost
	err = json.Unmarshal(c.Ctx.Input.RequestBody, &server)
	if err != nil {
		c.ErrorJson(err)
		return
	}
	o := orm.NewOrm()
	var saveErr error
	server.NginxId = nginx.Id
	server.Uid = nginx.Uid
	if server.Id > 0 {
		tmp := models.ServerHost{Id: server.Id, NginxId: nginx.Id}
		err := o.Read(&tmp, "Id", "NginxId")
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
// DELETE /nginx/:id/server
func (c *ServerController) Delete() {
	nginx, err := c.CheckNginxPermission()
	if err != nil {
		return
	}
	var server models.ServerHost
	err = json.Unmarshal(c.Ctx.Input.RequestBody, &server)
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

	ins := nginx2.GetInstance(nginx)
	server.Enable = false
	err = ins.RefreshServer(server)
	if err != nil {
		c.ErrorJson(err)
		return
	}
	delServer := models.ServerHost{Id: server.Id, NginxId: nginx.Id}
	_, err = o.Delete(&delServer, "Id", "NginxId")
	if err != nil {
		c.ErrorJson(err)
		return
	}
	c.setData("success").json()
}

// Refresh check and refresh to disk
// POST /nginx/:id/server/refresh
func (c *ServerController) Refresh() {
	nginx, err := c.CheckNginxPermission()
	if err != nil {
		return
	}
	var postData models.ServerHost
	err = json.Unmarshal(c.Ctx.Input.RequestBody, &postData)
	if err != nil {
		c.ErrorJson(err)
		return
	}

	postData.NginxId = nginx.Id
	postData.Uid = nginx.Uid
	
	o := orm.NewOrm()
	_, err = o.Update(&postData)
	if err != nil {
		c.ErrorJson(err)
		return
	}

	ins := nginx2.GetInstance(nginx)
	err = ins.RefreshServer(postData)
	if err != nil {
		c.ErrorJson(err)
		return
	}
	postData.LastName = postData.Name
	_, _ = o.Update(&postData)
	c.setData(true).json()
}
