#!/bin/bash
CURRENT_DIR=$(cd $(dirname $0); pwd)

mkdir -p ./local
mkdir -p ./local/data/db
cp -rf ./server/conf ./local
cp -rf ./server/static ./local

cd ./server
export GOODS=linux
export GOARCH=amd64
go build server/main.go -o ../local/server
cd $CURRENT_DIR
cp -rf ./dist/* ./local/static/web/
rm -rf ./local/static/web/config.js
chmod +x ./local/server

tar -czf nginx-ui.tar.gz ./local
