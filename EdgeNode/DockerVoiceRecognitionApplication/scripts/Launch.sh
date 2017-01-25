docker service rm voicerecognitionservice
docker service create --name voicerecognitionservice --publish 3002:3003 --replicas 1 edgepi01:5000/voicerecognitionapp
