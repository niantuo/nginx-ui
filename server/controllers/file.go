package controllers

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/astaxie/beego/logs"
	"github.com/astaxie/beego/orm"
	"os"
	config2 "server/config"
	"server/models"
	nginx2 "server/nginx"
	"server/utils"
	"strings"
	"time"
)

type FileController struct {
	BaseController
}

func getRootDir() (string, error) {
	root := fmt.Sprintf("%s/files", config2.GetDataDir())
	if exist := utils.IsExist(root); exist != true {
		err := os.MkdirAll(root, 0777)
		if err != nil {
			return "", err
		}
	}
	return root, nil
}

// Get getAll
func (c *FileController) Get() {
	fileName := c.GetString("filename")
	logs.Info("get file: {}", fileName)
	root, err := getRootDir()
	if err != nil {
		c.Ctx.Output.SetStatus(404)
		return
	}

	fromFile := fmt.Sprintf("%s/%s", root, fileName)
	c.Ctx.Output.Download(fromFile, fileName)
}

// Post save certs
func (c *FileController) Post() {
	f, header, err := c.GetFile("file")
	if err != nil {
		c.Ctx.Output.SetStatus(500)
		c.ErrorJson(err)
		return
	}

	var req models.FileReq
	err = c.ParseForm(&req)
	if err != nil {
		c.Ctx.Output.SetStatus(500)
		c.ErrorJson(err)
		return
	}

	defer f.Close()
	root, err := getRootDir()
	if err != nil {
		c.ErrorJson(err)
		return
	}
	if strings.HasPrefix(req.Path, "/") {
		req.Path = req.Path[1:len(req.Path)]
	}
	root = fmt.Sprintf("%s/%s", root, req.Key)
	index := strings.LastIndex(req.Path, "/")
	if index > 0 {
		subDir := req.Path[0:index]
		root = fmt.Sprintf("%s/%s", root, subDir)
	}
	if !utils.IsExist(root) {
		err = os.MkdirAll(root, 0777)
	}
	if err != nil {
		c.Ctx.Output.SetStatus(500)
		c.ErrorJson(err)
		return
	}

	toFile := fmt.Sprintf("%s/%s", root, header.Filename)
	err = c.SaveToFile("file", toFile)
	if err != nil {
		c.Ctx.Output.SetStatus(500)
		c.ErrorJson(err)
		return
	}
	c.setData(toFile).json()
}

// Deploy 部署到服务器
func (c *FileController) Deploy() {
	var req models.DeployReq
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &req)
	if err != nil {
		logs.Error(err, string(c.Ctx.Input.RequestBody))
		c.ErrorJson(err)
		return
	}
	if err != nil {
		c.ErrorJson(err)
		return
	}
	err = HandleDeploy(req)
	if err != nil {
		c.ErrorJson(err)
		return
	}
	c.json()
}

func HandleDeploy(req models.DeployReq) error {
	root, err := getRootDir()
	if err != nil {
		return err
	}
	root = fmt.Sprintf("%s/%s", root, req.Key)
	if !utils.IsExist(root) {
		logs.Warn("dir not exist: ", root)
		return errors.New("未上传文件或者文件已被删除！")
	}
	o := orm.NewOrm()
	nginx := models.Nginx{
		Id: req.NginxId,
	}
	err = o.Read(&nginx)
	if err != nil {
		return err
	}
	ins := nginx2.GetInstance(&nginx)
	dirs := ins.CheckDirs()
	if nginx.IsLocal {
		cmd := fmt.Sprintf("if [ ! -d %s ];then mkdir -p %s;fi && cp -r %s/* %s", req.Dir, req.Dir, root, req.Dir)
		_, err := ins.Run(cmd)
		return err
	}

	tarPath := fmt.Sprintf("%s.tar.gz", root)
	if !utils.IsExist(tarPath) {
		err = utils.TarXz(tarPath, root)
		if err != nil {
			return err
		}
	}

	timeNow := time.Now().Format("20060102150105")
	dst := fmt.Sprintf("%s/%s_%s.tar.gz", dirs.BackupDir, req.Key, timeNow)
	err = ins.SendFile(tarPath, dst)
	if err != nil {
		return err
	}
	cmd := fmt.Sprintf("if [ ! -d %s ];then mkdir -p %s;fi && tar -zxvf %s -C %s", req.Dir, req.Dir, dst, req.Dir)
	if req.Clear {
		cmd = fmt.Sprintf("rm -rf %s;%s", req.Dir, cmd)
	}
	_, err = ins.Run(cmd)
	if err != nil {
		return err
	}
	return nil
}

// Delete del certs
func (c *FileController) Delete() {

}
