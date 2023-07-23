package controllers

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/astaxie/beego/logs"
	"github.com/astaxie/beego/orm"
	"server/models"
	nginx2 "server/nginx"
	"server/utils"
	"strings"
	"time"
)

type CertController struct {
	BaseController
}

// 这个是根据域名的名称来的，自定义命令，即文件名称
func saveOrUpdate(cert *models.NginxCerts) error {
	o := orm.NewOrm()
	find := models.NginxCerts{ServiceName: cert.ServiceName, NginxId: cert.NginxId}
	err := o.Read(&find, "service_name", "nginx_id")
	if err != nil && err != orm.ErrNoRows {
		return err
	}
	if err == orm.ErrNoRows {
		_, err := o.Insert(cert)
		return err
	}
	_, err = o.Update(cert)
	return err
}

// Get getAll
// get /nginx/:id/certs
func (c *CertController) Get() {
	nginx, err := c.CheckNginxPermission()
	if err != nil {
		return
	}
	if nginx.DataDir == "" {
		c.setCode(-1).setMsg("请先配置数据目录位置！").json()
		return
	}
	o := orm.NewOrm()
	var list []models.NginxCerts
	_, err = o.QueryTable((*models.NginxCerts)(nil)).Filter("NginxId", nginx.Id).All(&list)
	if err != nil {
		c.ErrorJson(err)
		return
	}
	c.setData(list).json()
}

// Sync 从配置的证书路径同步证书到数据库
// post /nginx/:id/certs/sync
func (c *CertController) Sync() {
	nginx, err := c.CheckNginxPermission()
	if err != nil {
		return
	}
	ins := nginx2.GetInstance(nginx)
	names := strings.Split(ins.GetCerts(), "\n")
	var certs []models.NginxCerts
	for i := range names {
		name := names[i]
		if strings.HasSuffix(name, ".key") {
			serviceName := name[0 : len(name)-4]
			cert, err := ins.GetCertData(serviceName)
			cert.NginxId = nginx.Id
			cert.CreatedAt = time.Now().Format("2006-02-01 15:04")
			if err != nil {
				logs.Warn("getCertData fail", err, serviceName)
			} else {
				err = saveOrUpdate(cert)
				if err != nil {
					logs.Warn("save certs fail", err, serviceName)
				} else {
					certs = append(certs, *cert)
				}
			}
		}
	}
	c.setData(true).json()
}

// Post save certs
// post /nginx/:id/certs
func (c *CertController) Post() {
	nginx, err := c.CheckNginxPermission()
	if err != nil {
		return
	}
	var cert models.NginxCerts
	err = json.Unmarshal(c.Ctx.Input.RequestBody, &cert)
	if err != nil {
		logs.Error(err, string(c.Ctx.Input.RequestBody))
		c.ErrorJson(err)
		return
	}
	if cert.Pem == "" || cert.Key == "" {
		c.setCode(-1).setMsg("请输入证书私钥和公钥内容！").json()
		return
	}

	parse, err := utils.CheckHttps(cert.Pem)
	if err != nil {
		cert.HintMsg = fmt.Sprintf("证书公钥解析异常：%s", err.Error())
	} else {
		cert.ExpiresAt = parse.NotAfter.Format("2006-01-02 15:04")
		cert.SubjectName = parse.Subject.CommonName
	}
	logs.Info("parse", cert.SubjectName)
	o := orm.NewOrm()
	cert.NginxId = nginx.Id
	if cert.Id > 0 {
		_, err = o.Update(&cert)
	} else {
		cert.CreatedAt = time.Now().Format("2006-01-02 15:04")
		_, err = o.Insert(&cert)
	}
	if err != nil {
		c.ErrorJson(err)
		return
	}
	ins := nginx2.GetInstance(nginx)
	err = ins.SaveCerts(&cert)
	if err != nil {
		c.ErrorJson(err)
		return
	}
	c.json()
}

// Delete del certs
// delete /nginx/:id/certs
func (c *CertController) Delete() {
	nginx, err := c.CheckNginxPermission()
	if err != nil {
		return
	}
	ins := nginx2.GetInstance(nginx)
	certId, err := c.GetInt("id", -1)
	if err != nil {
		c.ErrorJson(err)
		return
	}
	if certId < 0 {
		c.ErrorJson(errors.New("参数错误"))
		return
	}

	dirs := ins.CheckDirs()
	if dirs.CertsDir == "" || dirs.CertsDir == "/" {
		c.setCode(-1).setMsg("请先配置证书路径，不能为根路径。")
		c.json()
		return
	}
	o := orm.NewOrm()
	cert := models.NginxCerts{Id: certId, NginxId: nginx.Id}
	err = o.Read(&cert, "id", "nginx_id")
	if err != nil && err != orm.ErrNoRows {
		c.ErrorJson(err)
		return
	} else if err != nil && err == orm.ErrNoRows {
		c.json()
		return
	}

	_, err = o.Delete(&cert)
	if err != nil && err != orm.ErrNoRows {
		c.ErrorJson(err)
		return
	}
	certName := cert.ServiceName
	cmd1 := fmt.Sprintf("cd %s && if [ -f %s.key ];then mv -f %s.key %s;fi", dirs.CertsDir, certName, certName, dirs.BackupDir)
	cmd2 := fmt.Sprintf("cd %s && if [ -f %s.pem ];then mv -f %s.pem %s;fi", dirs.CertsDir, certName, certName, dirs.BackupDir)
	resp, err := ins.Run(fmt.Sprintf("%s;%s", cmd1, cmd2))
	if err != nil {
		c.ErrorJson(err)
		return
	}
	c.setData(resp).json()
}
