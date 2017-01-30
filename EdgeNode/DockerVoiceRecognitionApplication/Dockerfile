FROM edgepi01:5000/voicerecognitionbase:latest

RUN npm install http-proxy --save

ADD . .

WORKDIR /src
 
RUN npm install
 
EXPOSE 3002
 
CMD ["npm", "start"]
