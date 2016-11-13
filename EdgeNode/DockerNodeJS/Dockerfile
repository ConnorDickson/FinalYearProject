FROM hypriot/rpi-node:argon

RUN npm install python-shell
 
ADD . .

WORKDIR /src
 
RUN npm install
 
EXPOSE 80
 
CMD ["npm", "start"]
