#/usr/bin/sh
export DOCKER_BUILDKIT=1
docker build . -f docker/Dockerfile  -t tuonina/nginx-ui:latest
