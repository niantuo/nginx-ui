package controllers

import (
	"encoding/json"
	"github.com/astaxie/beego/logs"
	"github.com/astaxie/beego/orm"
	"server/models"
	"server/utils"
)

type UserController struct {
	BaseController
}

// Login 登录
func (c *UserController) Login() {
	var user models.User
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &user)
	if err != nil {
		logs.Error(err, string(c.Ctx.Input.RequestBody))
		c.ErrorJson(err)
		return
	}
	cipherPassword := user.Password
	o := orm.NewOrm()
	err = o.Read(&user, "Account")
	if err != nil {
		c.ErrorJson(err)
		return
	}
	encryptPassword := utils.GetSHA256HashCode(cipherPassword)
	if encryptPassword != user.Password {
		c.setCode(-1).setMsg("用户名或者密码不正确！").json()
		return
	}
	user.Password = ""
	c.SetSession("user", user)
	c.setData(user).json()
}

// Register 用户注册
func (c *UserController) Register() {
	var user models.User
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &user)
	if err != nil {
		logs.Error(err, string(c.Ctx.Input.RequestBody))
		c.ErrorJson(err)
		return
	}
	if len(user.Account) == 0 || len(user.Password) == 0 {
		c.setCode(-1).setMsg("账号或者密码不能为空！")
		c.json()
		return
	}
	if len(user.Nickname) == 0 {
		user.Nickname = user.Account
	}
	user.Password = utils.GetSHA256HashCode(user.Password)
	o := orm.NewOrm()
	_, err = o.Insert(&user)
	if err != nil {
		c.ErrorJson(err)
		return
	}
	c.setMsg("注册成功！").json()
}
