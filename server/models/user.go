package models

// User 用户表
type User struct {
	Id int `orm:"pk;auto" json:"id"`
	// 用户账号，唯一标识， Uid
	Account  string `orm:"unique" json:"account"`
	Nickname string `json:"nickname"`
	// 用户角色，admin为管理员，多个使用逗号分割
	// 现在没多大用
	Roles    string `json:"roles"`
	Password string `json:"password"`
	Remark   string `json:"remark"`
}
