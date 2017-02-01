docker service rm machinelearningservice
docker service create --name machinelearningservice --publish 3004:3005 --replicas 1 edgepi01:5000/machinelearningapp 
