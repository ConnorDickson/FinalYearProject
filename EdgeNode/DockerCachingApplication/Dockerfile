FROM hypriot/rpi-node:boron

RUN npm install python-shell
 
ADD . .

WORKDIR /src
 
RUN npm install
 
EXPOSE 3000
 
CMD ["npm", "start"]
