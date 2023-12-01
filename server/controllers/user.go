package controllers

import (
	"encoding/json"
	"github.com/astaxie/beego/logs"
	"nginx-ui/server/models"
	"nginx-ui/server/service"
)

type UserController struct {
	BaseController
	service *service.UserService
}

func NewUserController() *UserController {

	return &UserController{
		service: service.NewUserService(),
	}
}

// Login 登录
func (c *UserController) Login() {
	var user *models.User
	err := json.Unmarshal(c.Ctx.Input.RequestBody, user)
	if err != nil {
		logs.Error(err, string(c.Ctx.Input.RequestBody))
		c.ErrorJson(err)
		return
	}
	resp := c.service.Login(user)
	if resp.Success() {
		c.SetSession("user", user)
	}
	c.postJson(resp)
}

func (c *UserController) User() {
	user := c.RequiredUser()
	if user == nil {
		return
	}
	c.setData(user).json()
}

// Register 用户注册
func (c *UserController) Register() {
	resp := c.service.SignUp(c.Ctx.Input.RequestBody)
	c.postJson(resp)
}
