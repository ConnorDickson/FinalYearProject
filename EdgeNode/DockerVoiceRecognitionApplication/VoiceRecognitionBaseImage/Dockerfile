FROM hypriot/rpi-node:boron

RUN sudo apt-get update && \
sudo apt-get upgrade && \
sudo apt-get install bison && \
sudo apt-get install libasound2-dev && \
sudo apt-get install swig && \
sudo apt-get install python-dev && \
sudo apt-get install mplayer && \
cd ~/ && \
wget http://sourceforge.net/projects/cmusphinx/files/sphinxbase/5prealpha/sphinxbase-5prealpha.tar.gz && \
tar -zxvf ./sphinxbase-5prealpha.tar.gz && \
cd ./sphinxbase-5prealpha && \
./configure --enable-fixed && \
make clean all && \
make check && \
sudo make install && \
cd ~/ && \
wget http://sourceforge.net/projects/cmusphinx/files/pocketsphinx/5prealpha/pocketsphinx-5prealpha.tar.gz && \
tar -zxvf pocketsphinx-5prealpha.tar.gz && \
cd ./pocketsphinx-5prealpha && \
./configure && \
make clean all && \
make check && \
sudo make install 
