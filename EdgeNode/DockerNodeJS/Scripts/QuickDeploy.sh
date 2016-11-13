echo -e "${GREEN}Starting quickdeploy":
cd ..
docker build -t dockernodejs .
echo -e "${GREEN}Built dockernodejs"
docker service rm nodejsservice
echo -e "${GREEN}Removed the old service"
docker service create --name nodejsservice --publish 80:3000 dockernodejs 
echo -e "${GREEN}Deployed new service"
echo -e "${GREEN}Finished quickdeploy"
