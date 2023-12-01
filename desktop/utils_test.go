package desktop

import (
	"fmt"
	"testing"
)

// 解析路径中的 :id 字段
func TestParseId(t *testing.T) {

	fmt.Println(ParsePathParam("/nginx/10", "/nginx/:id"))
	fmt.Println(ParsePathParam("/nginx/1/refresh", "/nginx/:id/refresh"))
	fmt.Println(ParsePathParam("/nginx/134/refresh", "/nginx/:id/refresh"))
	fmt.Println(ParsePathParam("/nginx/125/http/refresh", "/nginx/:id/http/refresh"))
	fmt.Println(ParsePathParam("/nginx/125/http/refresh", "/nginx/:id/http"))
	fmt.Println(ParsePathParam("/nginx/125/admin/http/refresh", "/nginx/:id/:user/http/refresh"))

	fmt.Println(ParsePathParam("/nginx/123/wew/789", "/nginx/:id"))

}
