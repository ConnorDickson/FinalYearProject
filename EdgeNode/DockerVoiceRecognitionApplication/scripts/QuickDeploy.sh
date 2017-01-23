echo -e "${GREEN}Starting quickdeploy of voice recognition application":
cd ..
docker build -t voicerecognitionapp .
echo -e "${GREEN}Built voice recognition app"
docker tag voicerecognitionapp edgepi01:5000/voicerecognitionapp
echo -e "${GREEN}Tagged as registry image"
docker push edgepi01:5000/voicerecognitionapp
echo -e "${GREEN}Pushed to private registry"
docker service rm voicerecognitionservice
echo -e "${GREEN}Removed the old services"
docker service create --name voicerecognitionservice --publish 3002:3003 --replicas 1 edgepi01:5000/voicerecognitionapp
echo -e "${GREEN}Deployed new service"
echo -e "${GREEN}Finished quickdeploy"
