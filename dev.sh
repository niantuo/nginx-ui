#/usr/bin/sh
export DOCKER_BUILDKIT=1
docker-compose -f ./docker-compose-dev.yaml build
docker-compose -f ./docker-compose-dev.yaml up -d


