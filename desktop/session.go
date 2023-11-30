package desktop

import (
	"context"
	"nginx-ui/server/models"
)

type Session struct {
	ctx context.Context
	//缓存当前的用户信息
	user *models.User
}

func (s *Session) SetUser(user *models.User) {
	s.user = user
}
