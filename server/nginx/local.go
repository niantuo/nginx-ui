package nginx

import (
	"errors"
	"fmt"
	"github.com/astaxie/beego/logs"
	"io"
	"nginx-ui/server/models"
	"nginx-ui/server/utils"
	"os"
	"os/exec"
	"path/filepath"
)

// LocalInstance 本地实例
type LocalInstance struct {
	nginx *models.Nginx
}

func (n *LocalInstance) Connect() error {
	return nil
}

func (n *LocalInstance) Close(onlySession bool) {

}
func (n *LocalInstance) SetNginx(nginx *models.Nginx) {
	n.nginx = nginx
}

func (n *LocalInstance) Run(cmd string) (string, error) {
	logs.Info("Run: ", cmd)
	command := exec.Command("/usr/bin/sh", "-c", cmd)
	out, err := command.CombinedOutput()
	if err != nil {
		logs.Warn("local run cmd fail", err, string(out))
		msg := fmt.Sprintf("%s;\n%s", err.Error(), string(out))
		return string(out), errors.New(msg)
	}
	logs.Info("Run resp", string(out))
	return string(out), nil
}

// SendFile Local 就是copy文件了
func (n *LocalInstance) SendFile(src string, remote string) error {
	srcFile, err := os.Open(src)
	if err != nil {
		return err
	}
	defer srcFile.Close()
	base := filepath.Base(remote)
	if !utils.IsExist(base) {
		err = os.MkdirAll(base, 0777)
	}
	if err != nil {
		return err
	}
	dst, err := os.OpenFile(remote, os.O_CREATE|os.O_WRONLY, 0777)
	if err != nil {
		return err
	}
	defer dst.Close()

	_, err = io.Copy(dst, srcFile)
	return err
}
