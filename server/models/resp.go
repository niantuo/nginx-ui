package models

type RespData struct {
	Code int         `json:"code"`
	Msg  string      `json:"msg"`
	Data interface{} `json:"data"`
}

func (r *RespData) Success() bool {
	return r.Code == 0
}

func (r *RespData) SetCode(code int) *RespData {
	r.Code = code
	return r
}

func (r *RespData) SetMsg(msg string) *RespData {
	r.Msg = msg
	return r
}

func SuccessResp(data interface{}) *RespData {
	return &RespData{
		Code: 0,
		Msg:  "请求成功",
		Data: data,
	}
}

func ErrorResp(msg string) *RespData {
	return &RespData{
		Code: -1,
		Msg:  msg,
		Data: nil,
	}
}

func NewErrorResp(error error) *RespData {
	return &RespData{
		Code: -1,
		Msg:  error.Error(),
		Data: nil,
	}
}

func NewResp(code int, msg string, data interface{}) *RespData {
	return &RespData{
		Code: code,
		Msg:  msg,
		Data: data,
	}
}

// 未登录
var UnAuthResp = ErrorResp("未登录").SetCode(401)
