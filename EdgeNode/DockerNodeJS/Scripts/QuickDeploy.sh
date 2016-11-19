echo -e "${GREEN}Starting quickdeploy":
cd ..
docker build -t dockernodejs .
echo -e "${GREEN}Built dockernodejs"
docker tag dockernodejs edgepi01:5000/dockernodejs
echo -e "${GREEN}Tagged as registry image"
docker push edgepi01:5000/dockernodejs
echo -e "${GREEN}Pushed to private registry"
docker service rm nodejsservice
echo -e "${GREEN}Removed the old service"
docker service create --name nodejsservice --publish 80:3000 --replicas 3 edgepi01:5000/dockernodejs 
echo -e "${GREEN}Deployed new service"
echo -e "${GREEN}Finished quickdeploy"
