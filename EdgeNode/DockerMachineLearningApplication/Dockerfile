FROM hypriot/rpi-node:boron

RUN npm install request && \
    npm install http-proxy --save && \
    npm install big-integer

ADD . .

WORKDIR /src
 
RUN npm install
 
EXPOSE 3004
 
CMD ["npm", "start"]
