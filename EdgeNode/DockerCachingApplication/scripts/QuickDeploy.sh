echo -e "${GREEN}Starting quickdeploy of caching application":
cd ..
docker build -t cachingapp .
echo -e "${GREEN}Built cachingapp"
docker tag cachingapp edgepi01:5000/cachingapp
echo -e "${GREEN}Tagged as registry image"
docker push edgepi01:5000/cachingapp
echo -e "${GREEN}Pushed to private registry"
docker service rm cachingservice
echo -e "${GREEN}Removed the old service"
docker service create --name cachingservice --publish 3000:3001 --replicas 3 edgepi01:5000/cachingapp 
echo -e "${GREEN}Deployed new service"
echo -e "${GREEN}Finished quickdeploy"
