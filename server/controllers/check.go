package controllers

import (
	"errors"
	"github.com/astaxie/beego/logs"
	"github.com/astaxie/beego/orm"
	"server/middleware"
	"server/models"
	"strconv"
)

// CheckNginxPermission 从path中获取nginx的参数
func (c *BaseController) CheckNginxPermission() (*models.Nginx, error) {
	idStr := c.getParam(":id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		logs.Warn("strconv.Atoi(idStr) fail", idStr)
		c.setCode(-1).setMsg("请传递正确的参数！").json()
		return nil, err
	}
	return c.CheckNginxPermissionById(id)
}

// CheckNginxPermissionById 验证权限，如果无权操作该nginx，返回nil,否则返回
func (c *BaseController) CheckNginxPermissionById(nginxId int) (*models.Nginx, error) {
	current := c.RequiredUser()
	if current == nil {
		middleware.WriteForbidden(c.Ctx.ResponseWriter)
		return nil, errors.New("当前未登录，无法操作")
	}
	if nginxId < 1 {
		c.setCode(-1).setMsg("Nginx ID must gt 0！").json()
		return nil, errors.New("nginx ID must gt 0！")
	}
	nginx := models.Nginx{Id: nginxId}
	o := orm.NewOrm()
	err := o.Read(&nginx)
	if err != nil {
		c.ErrorJson(err)
		return nil, err
	}
	if !current.IsAdmin() && current.Account != nginx.Uid {
		c.Forbidden()
		return nil, errors.New("forbidden")
	}
	return &nginx, nil
}
