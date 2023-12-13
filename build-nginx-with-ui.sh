#/usr/bin/sh
export DOCKER_BUILDKIT=1
docker build . -f docker/Dockerfile-with-nginx  -t registry.cn-hangzhou.aliyuncs.com/tuon-pub/nginx-with-ui:latest
