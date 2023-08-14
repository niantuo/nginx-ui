package controllers

import (
	"encoding/json"
	"fmt"
	"github.com/astaxie/beego/logs"
	"server/models"
	nginx2 "server/nginx"
)

type LoggerController struct {
	BaseController
}

// Post file upload
// POST /file
func (c *LoggerController) Post() {
	nginx, err := c.CheckNginxPermission()
	if err != nil {
		return
	}
	logs.Info("get ", nginx.Id)
	var req models.LoggerReq
	err = json.Unmarshal(c.Ctx.Input.RequestBody, &req)
	if err != nil {
		logs.Error(err, string(c.Ctx.Input.RequestBody))
		c.ErrorJson(err)
		return
	}
	if req.MaxLines <= 0 {
		req.MaxLines = 1000
	}

	var cmd = fmt.Sprintf("cat %s", req.FileName)
	if req.End <= 0 {
		cmd = fmt.Sprintf("%s | head -n %d", cmd, req.MaxLines)
	} else if req.Start >= 0 {
		cmd = fmt.Sprintf("%s | head -n %d | tail -n +%d", cmd, req.End, req.Start)
	} else {
		cmd = fmt.Sprintf("%s | tail -n %d", cmd, req.MaxLines)
	}
	logs.Info("get logs cmd: ", cmd)

	ins := nginx2.GetInstance(nginx)

	resp, err := ins.Run(cmd)
	if err != nil {
		c.ErrorJson(err)
		return
	}
	c.setData(resp).json()
}
