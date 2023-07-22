package controllers

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/astaxie/beego/logs"
	"github.com/astaxie/beego/orm"
	"io"
	"server/config"
	"server/models"
	"server/utils"
)

type Oauth2Controller struct {
	BaseController
}

type Oauth2SSOReq struct {
	Code  string `json:"code"`
	Scope string `json:"scope"`
	State string `json:"state"`
}

// Get 获取oauth2.0的登录url
func (c *Oauth2Controller) Get() {
	state, err := utils.RandPassword(6)
	if err != nil {
		c.ErrorJson(err)
		return
	}
	url := config.OauthConfig.AuthCodeURL(state)
	c.addRespData("redirect_url", url).addRespData("state", state).json()
}

// Callback 用户注册
func (c *Oauth2Controller) Callback() {
	var ssoReq Oauth2SSOReq
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &ssoReq)
	if err != nil {
		logs.Error(err, string(c.Ctx.Input.RequestBody))
		c.ErrorJson(err)
		return
	}
	oauth := config.OauthConfig
	if len(ssoReq.Code) == 0 {
		c.setCode(-1).setMsg("登录失败(Code)：code is empty").json()
		return
	}
	token, err := oauth.Exchange(context.Background(), ssoReq.Code)
	if err != nil {
		logs.Error("ExchangeToken", err)
		c.setCode(-1).setMsg("登录失败(Exchange)：" + err.Error()).json()
		return
	}
	client := oauth.Client(context.Background(), token)
	resp, err := client.Get(oauth.Userinfo)
	if err != nil {
		logs.Error("GetUserinfo", err)
		c.setCode(-1).setMsg(fmt.Sprintf("登录失败(Userinfo)：%s", err.Error())).json()
		return
	}
	defer resp.Body.Close()
	content, err := io.ReadAll(resp.Body)
	if err != nil {
		logs.Error("GetUserinfo Read Body", err)
		c.setCode(-1).setMsg(fmt.Sprintf("登录失败(Userinfo)：%s", err.Error())).json()
		return
	}
	user := models.User{}
	err = json.Unmarshal(content, &user)
	if err != nil {
		logs.Error("GetUserinfo Unmarshal", err)
		c.setCode(-1).setMsg(fmt.Sprintf("登录失败(Unmarshal)：%s", err.Error())).json()
		return
	}
	if len(user.Account) == 0 {
		c.setCode(-1).setMsg("登录失败,请确认userinfo接口返回了account字段").json()
		return
	}
	o := orm.NewOrm()
	err = o.Read(&user, "Account")
	if err != nil {
		_, err = o.Insert(&user)
	}
	user.Password = ""
	if err != nil {
		c.setCode(-1).setMsg(fmt.Sprintf("保存用户失败：%s", err.Error())).json()
		return
	}
	c.SetSession("user", user)
	c.setData(user).json()
}
