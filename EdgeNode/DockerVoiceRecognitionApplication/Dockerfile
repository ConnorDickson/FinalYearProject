FROM hypriot/rpi-node:boron

ADD . .

WORKDIR /src
 
RUN npm install
 
EXPOSE 3002
 
CMD ["npm", "start"]
