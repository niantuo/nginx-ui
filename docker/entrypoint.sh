#!/bin/sh


dataDir=${DATADIR:-/app/data}
echo "dataDir: $dataDir"

if [ -f "$dataDir/nginx.conf" ];then
  if [ -f /etc/nginx/nginx.conf ]; then
      mv -f /etc/nginx/nginx.conf /etc/nginx/nginx.conf.bak
  fi
  ln -s $dataDir/nginx.conf  /etc/nginx/nginx.conf
fi
nginx -g "daemon on;"
## 启用 nginx-ui的服务
/app/app
