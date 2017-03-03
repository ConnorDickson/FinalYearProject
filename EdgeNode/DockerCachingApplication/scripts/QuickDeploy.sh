echo -e "${GREEN}Starting quickdeploy of caching application":
cd ..
docker build -t cachingapp .
echo -e "${GREEN}Built cachingapp"
docker tag cachingapp edgepi01:5000/cachingapp
echo -e "${GREEN}Tagged as registry image"
docker push edgepi01:5000/cachingapp
echo -e "${GREEN}Pushed to private registry"
docker service rm cachingservice
docker service rm redisservice
echo -e "${GREEN}Removed the old services"
docker service create --name redisservice --mode global --publish 6379:6379 hypriot/rpi-redis
docker service create --name cachingservice --publish 3000:3001 --replicas 1 edgepi01:5000/cachingapp
echo -e "${GREEN}Deployed new services"
echo -e "${GREEN}Finished quickdeploy"
