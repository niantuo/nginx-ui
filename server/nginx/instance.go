package nginx

import (
	"errors"
	"fmt"
	"github.com/astaxie/beego/logs"
	"nginx-ui/server/models"
	"strings"
	"time"
)

var logger = logs.GetLogger()

type Dirs struct {
	DataDir   string
	ConfDir   string
	StreamDir string
	CertsDir  string
	BackupDir string
}

type InstanceInter interface {
	Connect() error
	Close(onlySession bool)
	Run(cmd string) (string, error)
	SetNginx(nginx *models.Nginx)
	SendFile(src string, remote string) error
}

type Instance struct {
	InstanceInter
	nginx *models.Nginx
}

func (n *Instance) CheckDirs() Dirs {
	nginx := n.nginx
	dataDir := nginx.DataDir
	if strings.HasSuffix(dataDir, "/") {
		dataDir = dataDir[0 : len(dataDir)-1]
	}
	streamDir := fmt.Sprintf("%s/stream.d", dataDir)
	certsDir := fmt.Sprintf("%s/certs", dataDir)
	backupDir := fmt.Sprintf("%s/backup", dataDir)
	confDir := fmt.Sprintf("%s/conf.d", dataDir)
	_, _ = n.Run(fmt.Sprintf("mkdir -p %s %s %s %s", confDir, streamDir, certsDir, backupDir))
	return Dirs{
		DataDir:   dataDir,
		ConfDir:   confDir,
		StreamDir: streamDir,
		CertsDir:  certsDir,
		BackupDir: backupDir,
	}
}

func (n *Instance) RefreshServer(server models.ServerHost) error {
	dirs := n.CheckDirs()
	var confDir string
	if server.IsStream {
		confDir = dirs.StreamDir
	} else {
		confDir = dirs.ConfDir
	}
	// id_server_name.conf
	realName := fmt.Sprintf("%s/%d_%s.conf", confDir, server.Id, server.Name)
	var lastName string
	if server.LastName != "" {
		lastName = fmt.Sprintf("%s/%d_%s.conf", confDir, server.Id, server.LastName)
	} else {
		lastName = fmt.Sprintf("%s/%d_%s.conf", confDir, server.Id, server.Name)
	}
	backName := fmt.Sprintf("%s/%s.conf_%s", dirs.BackupDir, server.Name, time.Now().Format("20060102150405"))

	res, err := n.Run(fmt.Sprintf("if [ -f %s ];then mv -f %s %s;fi;rm -rf %s/%d_*.conf", lastName, lastName, backName, confDir, server.Id))
	if err != nil {
		return err
	}

	defer n.Close(true)
	if !server.Enable {
		return nil
	}
	serverConf := strings.ReplaceAll(server.ServerConf, "\"", "\\\"")
	serverConf = strings.ReplaceAll(serverConf, "$", "\\$")
	cmd := fmt.Sprintf("echo \"%s\" > %s", serverConf, realName)
	res, err = n.Run(cmd)
	if err != nil {
		logger.Printf("echo conf fail", err, res)
		return err
	}
	if err := n.Check(); err != nil {
		_, recoveryErr := n.Run(fmt.Sprintf("if [ -f %s ];then mv -f %s %s;fi", backName, backName, realName))
		if recoveryErr != nil {
			return errors.New(fmt.Sprintf("配置文件异常: %s;且文件恢复异常，请手动处理或者修正后重新刷新！", err.Error()))
		}
		return err
	}
	if err := n.Reload(); err != nil {
		return err
	}
	return nil
}

func (n *Instance) RefreshHttp(nginx models.Nginx) error {
	dirs := n.CheckDirs()
	var confDir = nginx.NginxDir

	realName := fmt.Sprintf("%s/nginx.conf", dirs.DataDir)
	linkName := fmt.Sprintf("%s/nginx.conf", confDir)
	backName := fmt.Sprintf("%s/%d.http_%s", dirs.BackupDir, nginx.Id, time.Now().Format("060102150405"))

	res, err := n.Run(fmt.Sprintf("find %s -name nginx.conf -type l -delete", confDir))
	if err != nil {
		logger.Printf("echo rm conf file fail", err, res)
		return err
	}
	// 如果非软连接，就先mv 备份
	res, err = n.Run(fmt.Sprintf("cd %s && if [ -f nginx.conf ];then mv -f nginx.conf nginx.conf.bak ;fi", confDir))
	defer n.Close(true)

	httpConf := strings.ReplaceAll(nginx.HttpConf, "\"", "\\\"")
	httpConf = strings.ReplaceAll(httpConf, "$", "\\$")
	cmd := fmt.Sprintf("echo \"%s\" > %s && cp %s %s", httpConf, realName, realName, backName)
	res, err = n.Run(cmd)
	if err != nil {
		logger.Printf("echo conf fail", err, res)
		return err
	}
	res, err = n.Run(fmt.Sprintf("ln -s %s %s", realName, linkName))
	if err != nil {
		return err
	}
	if err := n.Check(); err != nil {
		return err
	}
	if err := n.Reload(); err != nil {
		return err
	}
	return nil
}

func (n *Instance) GetVersion() (string, error) {
	out, err := n.Run(fmt.Sprintf("%s -V", n.nginx.NginxPath))
	if err != nil {
		logs.Warn("CheckConf", err)
		return "", err
	}
	logs.Info("CheckConf", out)
	return out, err
}

func (n *Instance) Check() error {
	nginx := n.nginx
	_ = n.CheckDirs()
	out, err := n.Run(fmt.Sprintf("%s -t", nginx.NginxPath))
	if err != nil {
		logs.Warn("CheckConf fail", err, out)
		return err
	}
	logs.Info("CheckConf", out)
	return nil
}

// Reload 如果nginx未启动，这个返回码为 1
func (n *Instance) Reload() error {
	isRun, _ := n.Status()
	if !isRun {
		logs.Info("nginx not running")
		return nil
	}
	var cmd string
	if n.nginx.IsServer {
		cmd = "service nginx reload"
	} else {
		cmd = fmt.Sprintf("%s -s reload", n.nginx.NginxPath)
	}
	out, err := n.Run(cmd)
	if err != nil {
		logs.Warn("Reload", err)
		return err
	}
	logs.Info("Reload", out)
	return nil
}

func (n *Instance) Status() (bool, string) {

	var cmd string
	if n.nginx.IsServer {
		cmd = "service nginx status"
	} else { // 得想其它办法，这个没有直接的命令，ps也不见得有
		cmd = fmt.Sprintf("%s -s reload", n.nginx.NginxPath)
	}
	out, err := n.Run(cmd)
	if err != nil {
		logs.Warn("Status", err)
		return false, out
	}
	logs.Info("Status", out)
	return true, out
}

// Start 如果已经启动，这里会返回-1
func (n *Instance) Start() error {
	var cmd string
	if n.nginx.IsServer {
		cmd = "service nginx start"
	} else {
		cmd = fmt.Sprintf("%s", n.nginx.NginxPath)
	}
	go func() {
		out, err := n.Run(cmd)
		if err != nil {
			logs.Warn("Start", err)
		}
		logs.Info("Start", out)
	}()
	time.Sleep(time.Second * 5)
	return nil
}

func (n *Instance) Stop() error {
	var cmd string
	if n.nginx.IsServer {
		cmd = "service nginx stop"
	} else {
		cmd = fmt.Sprintf("%s -s stop", n.nginx.NginxPath)
	}
	out, err := n.Run(cmd)
	if err != nil {
		logs.Warn("Stop", err)
		return err
	}
	logs.Info("Stop", out)
	return nil
}

func (n *Instance) GetCerts() string {
	dirs := n.CheckDirs()
	cmd := fmt.Sprintf("cd %s && /usr/bin/ls -l *.key | /usr/bin/awk '{print $9}'", dirs.CertsDir)
	out, err := n.Run(cmd)
	if err != nil {
		logs.Warn("GetCerts", err)
		return ""
	}
	logs.Info("GetCerts", out)
	return out
}

func (n *Instance) GetCertData(name string) (*models.NginxCerts, error) {
	cert := models.NginxCerts{
		ServiceName: name,
	}
	dirs := n.CheckDirs()
	pemPath := fmt.Sprintf("%s/%s.pem", dirs.CertsDir, name)
	keyPath := fmt.Sprintf("%s/%s.key", dirs.CertsDir, name)
	cmd := "/usr/bin/cat " + keyPath
	out, err := n.Run(cmd)
	if err != nil {
		logs.Warn("Stop", err)
		return &cert, err
	}
	cert.Key = out
	cmd = "/usr/bin/cat " + pemPath
	out, err = n.Run(cmd)
	if err != nil {
		logs.Warn("Stop", err)
		return &cert, err
	}
	cert.Pem = out
	return &cert, nil
}

func (n *Instance) SaveCerts(cert *models.NginxCerts) error {
	dirs := n.CheckDirs()
	pemPath := fmt.Sprintf("%s/%s.pem", dirs.CertsDir, cert.ServiceName)
	keyPath := fmt.Sprintf("%s/%s.key", dirs.CertsDir, cert.ServiceName)
	cmd := fmt.Sprintf("echo '%s' > %s;echo '%s' > %s", cert.Pem, pemPath, cert.Key, keyPath)
	out, err := n.Run(cmd)
	if err != nil {
		logs.Warn("SaveCerts", err)
		return err
	}
	logs.Info("SaveCerts ", out)
	return nil
}
