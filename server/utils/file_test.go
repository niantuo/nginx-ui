package utils

import (
	"github.com/astaxie/beego/logs"
	"testing"
)

func TestZipDir(t *testing.T) {
	src := "../data/files/fcKFrcJamnjUTCI"
	dst := "../data/files/fcKFrcJamnjUTCI.tar.xz"
	err := TarXz(dst, src)

	if err != nil {
		logs.Error("zip fail", err)
	} else {
		logs.Info("zip ok")
	}

}
