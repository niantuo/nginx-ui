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
	// 文件上传后执行后置命令，适用于简单的部署
	Cmd string `json:"cmd"`
}

type LoggerReq struct {
	Start int `json:"start"`
	End   int `json:"end"`
	// 文件的绝对路径
	FileName string `json:"fileName"`
	// 最大显示行数
	MaxLines int `json:"maxLines"`
}
