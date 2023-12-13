#!/bin/bash
CURRENT_DIR=$(cd $(dirname $0); pwd)

mkdir -p local/data/db
mkdir -p local/static/web

cp -rf ./conf ./local

export GOODS=linux
export GOARCH=amd64
go build -o local/server  app.go

cp -rf ./frontend/dist/* ./local/static/web/
rm -rf ./local/static/web/config.js
chmod +x ./local/server

tar -czf nginx-ui.tar.gz ./local
