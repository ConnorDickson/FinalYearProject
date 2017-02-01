echo -e "${GREEN}Starting quickdeploy of machine learning application":
cd ..
docker build -t machinelearningapp .
echo -e "${GREEN}Built machine learning app"
docker tag machinelearningapp edgepi01:5000/machinelearningapp
echo -e "${GREEN}Tagged as registry image"
docker push edgepi01:5000/machinelearningapp
echo -e "${GREEN}Pushed to private registry"
docker service rm machinelearningservice
echo -e "${GREEN}Removed the old service"
docker service create --name machinelearningservice --publish 3004:3005 --replicas 1 edgepi01:5000/machinelearningapp 
echo -e "${GREEN}Deployed new service"
echo -e "${GREEN}Finished quickdeploy"
