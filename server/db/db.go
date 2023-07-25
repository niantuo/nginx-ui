package db

import (
	"github.com/astaxie/beego/orm"
	_ "github.com/mattn/go-sqlite3"
	"os"
	"server/config"
	"server/models"
	"server/utils"
	"time"
)

func Init() {
	dir := config.Config.DBDir
	if !utils.IsExist(dir) {
		os.MkdirAll(dir, 0777)
	}
	orm.RegisterDriver("sqlite3", orm.DRSqlite)
	orm.RegisterDataBase("default", "sqlite3", dir+"/sqlite.db")
	orm.SetMaxIdleConns("default", 50)
	orm.SetMaxOpenConns("default", 200)

	//设置数据库时区
	orm.DefaultTimeLoc = time.Local

	orm.RegisterModel(new(models.Nginx))
	orm.RegisterModel(new(models.ServerHost))
	orm.RegisterModel(new(models.NginxCerts))
	orm.RegisterModel(new(models.User))

	orm.RunSyncdb("default", false, true)

}
