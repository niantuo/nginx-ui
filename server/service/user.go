package service

import (
	"errors"
	"github.com/astaxie/beego/orm"
	"nginx-ui/server/models"
	"nginx-ui/server/utils"
)

type UserService struct {
}

func NewUserService() *UserService {
	return &UserService{}
}

func (u *UserService) Login(user models.User) models.RespData {
	cipherPassword := user.Password
	o := orm.NewOrm()
	err := o.Read(&user, "Account")
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

func (u *UserService) SignUp(user models.User) error {

	if len(user.Account) == 0 || len(user.Password) == 0 {
		return errors.New("账号或者密码不能为空！")
	}
	if len(user.Nickname) == 0 {
		user.Nickname = user.Account
	}
	user.Password = utils.GetSHA256HashCode(user.Password)
	o := orm.NewOrm()
	_, err := o.Insert(&user)
	return err
}
