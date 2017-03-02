docker service rm redisservice
docker service rm cachingservice
docker service create --name redisservice --publish 6379:6379 --replicas 3 hypriot/rpi-redis
docker service create --name cachingservice --publish 3000:3001 --replicas 1 edgepi01:5000/cachingapp 
