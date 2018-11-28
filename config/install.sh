#!/bin/sh
echo "--- Downloading Node.js and BCM2835 library\n"
wget https://nodejs.org/dist/latest-v8.x/node-v8.14.0-linux-armv6l.tar.xz
wget http://www.airspayce.com/mikem/bcm2835/bcm2835-1.57.tar.gz

echo "--- Installing BCM library for C/C++\n"
tar zxvf bcm2835-1.57.tar.gz && cd bcm2835-1.57 && ./configure && make && sudo make install && cd ..

echo "\n--- Installing \"node\" and \"npm\"\n"
sudo tar -C /usr/local --strip-components 1 -xvJf node-v8.14.0-linux-armv6l.tar.xz

echo "\n--- Updating the package sources\n"
sudo apt-get update

echo "\n--- Latest git version\n"
sudo apt-get install git

echo "\n--- Copy and configure service file\n"
sudo cp soccer-bot.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl start soccer-bot.service && sudo systemctl enable soccer-bot.service