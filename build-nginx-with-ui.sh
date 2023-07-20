#/usr/bin/sh
export DOCKER_BUILDKIT=1
docker build . -f docker/Dockerfile-with-nginx  -t tuonina/nginx-with-ui:latest
