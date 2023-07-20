package models

import "github.com/astaxie/beego"

// Nginx nginx data
type Nginx struct {
	Id          int    `orm:"pk;auto" json:"id"`
	Name        string `json:"name"`
	Uid         string `json:"uid"`
	VersionInfo string `json:"versionInfo"`
	// 是否以服务的形式进行托管
	IsServer bool `json:"isServer"`

	NginxPath string `json:"nginxPath"`
	// nginx的配置文件所在目录，即nginx.conf所在的目录
	NginxDir string `json:"nginxDir"`
	// 数据目录，所有的配置文件目录
	DataDir  string `json:"dataDir"`
	IsLocal  bool   `json:"isLocal"`
	IpAddr   string `json:"ipAddr"`
	Port     int    `json:"port"`
	User     string `json:"user"`
	Password string `json:"password"`
	HttpData string `json:"httpData"`
	HttpConf string `json:"httpConf"`
	Remark   string `json:"remark"`
}

// Check 检查参数，给默认值
func (t *Nginx) Check() {
	if t.DataDir == "" {
		t.DataDir = beego.AppConfig.String("datadir")
	}
	if t.NginxPath == "" {
		t.NginxPath = beego.AppConfig.String("nginxPath")
	}
	if t.NginxDir == "" {
		t.NginxDir = beego.AppConfig.String("nginxDir")
	}
}

// ServerHost nginx data
type ServerHost struct {
	Id     int  `orm:"pk;auto" json:"id"`
	Enable bool `json:"enable"`
	// is tcp or udp, default is false
	IsStream bool   `json:"isStream"`
	NginxId  int    `json:"nginxId"`
	Name     string `json:"name"`
	// 记录一下上一次刷新保存的名字
	LastName string `json:"lastName"`
	// 前端完整的 server_host配置数据
	ServerData string `json:"serverData"`

	// nginx server.conf content
	ServerConf string `json:"serverConf"`
	Remark     string `json:"remark"`
}

// NginxCerts nginx证书， ServiceName域名，唯一不可重复
type NginxCerts struct {
	Id          int    `orm:"pk;auto" json:"id"`
	ServiceName string `orm:"unique" json:"serviceName"`
	Key         string `json:"key"`
	Pem         string `json:"pem"`
	NginxId     int    `json:"nginxId"`
	ExpiresAt   string `json:"expiresAt"`
	SubjectName string `json:"subjectName"`
	// 系统的提示信息
	HintMsg   string `json:"hintMsg"`
	CreatedAt string `json:"createdAt"`
	Remark    string `json:"remark"`
}
