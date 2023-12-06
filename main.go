package main

import (
	"embed"
	"github.com/astaxie/beego"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"nginx-ui/desktop"
	_ "nginx-ui/server/init"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Create an instance of the app structure

	api := desktop.NewApi()

	go beego.Run()

	// Create application with options
	err := wails.Run(&options.App{
		Title:  "nginx-ui-desktop",
		Width:  1200,
		Height: 800,
		AssetServer: &assetserver.Options{
			Assets: assets,
			//如果你想为你的前端动态加载或生成资产，你可以使用 AssetsHandler 选项 来实现。
			//AssetsHandler 是一个通用的 http.Handler，对于资产服务器上的任何非 GET 请求以及由于找不到文件而无法从捆绑资产提供服务的 GET 请求，都会调用它。
			Handler: desktop.NewApiHandler(nil),
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        api.Startup,
		Bind:             []interface{}{},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
