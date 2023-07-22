package nginx

import (
	"errors"
	"fmt"
	"github.com/astaxie/beego/logs"
	"github.com/pkg/sftp"
	"golang.org/x/crypto/ssh"
	"io"
	"net"
	"os"
	"server/models"
	"time"
)

// RemoteInstance 远程
type RemoteInstance struct {
	nginx      *models.Nginx
	client     *ssh.Client
	LastResult string
}

func (n *RemoteInstance) Connect() error {
	if n.client != nil {
		return nil
	}
	config := ssh.ClientConfig{}
	config.SetDefaults()
	config.User = n.nginx.User
	config.Auth = []ssh.AuthMethod{
		ssh.Password(n.nginx.Password),
	}
	config.HostKeyCallback = func(hostname string, remote net.Addr, key ssh.PublicKey) error {
		return nil
	}
	config.Timeout = time.Second * 60
	addr := fmt.Sprintf("%s:%d", n.nginx.IpAddr, n.nginx.Port)
	client, err := ssh.Dial("tcp", addr, &config)
	if err != nil {
		logs.Warn("connect error", err)
		return err
	}
	n.client = client
	go n.onDisConnect()
	return nil
}

// Run RemoteInstance 这里应该要处理session断开的流程吧
func (n *RemoteInstance) Run(cmd string) (string, error) {
	logs.Info("Run: ", cmd)
	if n.client == nil {
		err := n.Connect()
		if err != nil {
			return "", err
		}
	}
	session, err := n.client.NewSession()
	if err != nil {
		logs.Warn("NewSession fail", err)
		return "", err
	}
	defer session.Close()
	buf, err := session.CombinedOutput(cmd)
	n.LastResult = string(buf)
	logger.Printf("out: %v", n.LastResult)
	if err != nil {
		err = errors.New(fmt.Sprintf("%s;\n%s", err.Error(), n.LastResult))
	}
	return n.LastResult, err
}

func (n *RemoteInstance) Close(onlySession bool) {
	if onlySession {
		return
	}
	if n.client != nil {
		n.client.Close()
		n.client = nil
	}
}

func (n *RemoteInstance) onDisConnect() {
	if n.client != nil {
		err := n.client.Wait()
		logger.Printf("disconnect", err)
	}
	n.client = nil
}
func (n *RemoteInstance) SetNginx(nginx *models.Nginx) {
	n.nginx = nginx
}

func (n *RemoteInstance) getSSHConfig() ssh.ClientConfig {
	config := ssh.ClientConfig{}
	config.SetDefaults()
	config.User = n.nginx.User
	config.Auth = []ssh.AuthMethod{
		ssh.Password(n.nginx.Password),
	}
	config.HostKeyCallback = func(hostname string, remote net.Addr, key ssh.PublicKey) error {
		return nil
	}
	config.Timeout = time.Second * 60
	return config
}

// SendFile RemoteInstance 这里应该要处理session断开的流程吧
func (n *RemoteInstance) SendFile(src string, remote string) error {
	session, err := sftp.NewClient(n.client)
	if err != nil {
		return err
	}
	defer session.Close()
	srcFile, err := os.Open(src)
	if err != nil {
		return err
	}
	defer srcFile.Close()
	dstFile, err := session.Create(remote)
	if err != nil {
		return err
	}
	defer dstFile.Close()
	l, err := io.Copy(dstFile, srcFile)
	logs.Info("sendFile ok with size: ", l)
	return err
}
