package desktop

import (
	"context"
	"encoding/json"
	"fmt"
	"nginx-ui/server/models"
	"os"
)

type Session struct {
	ctx context.Context
	//缓存当前的用户信息
	user *models.User
}

func (s *Session) SetUser(user *models.User) {
	s.user = user
	j, err := json.Marshal(user)
	if err != nil {
		fmt.Println("json fail", err)
		return
	}
	err = os.MkdirAll("./data/sessions", 0666)
	if err != nil {
		fmt.Printf("mkdir dir fail: %s\n\n", err)
		return
	}
	err = os.WriteFile("./data/sessions/local", j, 0666)
	if err != nil {
		fmt.Println("save session fail", err)
	} else {
		fmt.Printf("save session ok: %s\n", user.Account)
	}
}

func (s *Session) Load() {
	by, err := os.ReadFile("./data/sessions/local")
	if err != nil {
		fmt.Printf("session read fail: %s\n", err)
		return
	}
	var user *models.User
	err = json.Unmarshal(by, &user)
	if err != nil {
		fmt.Printf("session read fail: %s\n", err)
		return
	}
	s.user = user
	fmt.Printf("session load: %s\n", user.Account)
}
