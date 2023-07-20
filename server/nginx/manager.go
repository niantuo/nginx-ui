package nginx

import (
	"server/models"
)

var INSTANCES = map[int]*Instance{}

func GetInstance(nginx *models.Nginx) *Instance {
	var instance *Instance = INSTANCES[nginx.Id]
	if instance != nil {
		old := instance.nginx
		if old.IpAddr != nginx.IpAddr || old.Port != nginx.Port || old.User != nginx.User || old.Password != nginx.Password {
			instance.Close(false)
			instance = nil
			INSTANCES[nginx.Id] = nil
		} else {
			instance.nginx = nginx
			instance.SetNginx(nginx)
			return instance
		}
	}
	if nginx.IsLocal {
		instance = &Instance{
			&LocalInstance{
				nginx: nginx,
			},
			nginx,
		}
	} else {
		instance = &Instance{
			&RemoteInstance{
				nginx: nginx,
			},
			nginx,
		}
	}
	INSTANCES[nginx.Id] = instance
	return instance
}
