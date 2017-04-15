FROM edgepi01:5000/cachingbase:latest 

RUN npm install redis && \
    npm install request && \
    npm install http-proxy --save

ADD . .

WORKDIR /src
 
RUN npm install
 
EXPOSE 3000
 
CMD ["npm", "start"]
