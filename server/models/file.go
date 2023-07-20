package models

type FileReq struct {
	Path string `json:"path"`
	Key  string `json:"key"`
}

type DeployReq struct {
	// 已上传的文件夹根目录
	Key     string `json:"key"`
	NginxId int    `json:"nginxId"`
	// 部署目录
	Dir string `json:"dir"`
	// 是否先清空文件夹，再部署
	Clear bool `json:"clear"`
}
