#!/usr/bin/env sh

cd src/basilisk
wget -O disk.zip $DISK_URL
unzip -o disk.zip
rm disk.zip
ls -al
cd -
