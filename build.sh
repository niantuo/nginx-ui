#/usr/bin/sh
dos2unix docker/entrypoint.sh
chmod +x *.sh
export DOCKER_BUILDKIT=1
docker build . -f docker/Dockerfile  -t registry.cn-hangzhou.aliyuncs.com/tuon-pub/nginx-ui:latest
