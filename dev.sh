#/usr/bin/sh
dos2unix docker/entrypoint.sh
chmod +x *.sh
sh ./build-nginx-with-ui.sh
docker-compose -f ./docker-compose-dev.yaml up -d


