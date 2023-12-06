# nginx-ui desktop

参考文档： https://wails.io/zh-Hans/docs/reference/project-config

## 开发
```shell
wails dev
```

## 打包
```shell
## 生产版本
wails build -webview2=embed
## 带debug
wails build -webview2=embed -debug
```