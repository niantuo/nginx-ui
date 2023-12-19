package service

import (
	"encoding/json"
	"github.com/astaxie/beego/logs"
	"github.com/astaxie/beego/orm"
	"nginx-ui/server/models"
	"nginx-ui/server/utils"
)

type UserService struct {
}

func NewUserService() *UserService {
	return &UserService{}
}

func (u *UserService) Login(user *models.User) *models.RespData {
	cipherPassword := user.Password
	o := orm.NewOrm()
	err := o.Read(user, "Account")
	if err != nil {
		return models.NewErrorResp(err)
	}
	encryptPassword := utils.GetSHA256HashCode(cipherPassword)
	if encryptPassword != user.Password {
		return models.ErrorResp("用户名或者密码不正确！")
	}
	user.Password = ""
	return models.SuccessResp(user)
}

func (u *UserService) SignUp(req []byte) *models.RespData {

	var user models.User
	err := json.Unmarshal(req, &user)
	if err != nil {
		logs.Error(err, req)
		return models.NewErrorResp(err)
	}

	if len(user.Account) == 0 || len(user.Password) == 0 {
		return models.ErrorResp("账号或者密码不能为空！")
	}
	if len(user.Nickname) == 0 {
		user.Nickname = user.Account
	}
	user.Password = utils.GetSHA256HashCode(user.Password)
	o := orm.NewOrm()
	_, err = o.Insert(&user)

	if err != nil {
		return models.NewErrorResp(err)
	}

	return models.SuccessResp(user).SetMsg("注册成功！")
}
