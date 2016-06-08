#!/bin/bash
cd /tmp/epub/
sudo node server.js > /dev/server.log 2> /dev/null < /dev/null &
