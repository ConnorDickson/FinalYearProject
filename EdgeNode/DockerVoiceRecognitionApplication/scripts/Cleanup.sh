docker rm -v $(docker ps -a -q -f status=exited);
docker rmi $(docker images --filter "dangling=true" -q --no-trunc);
