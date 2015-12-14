#! /bin/sh

npm install
npm install -g bower
bower install --allow-root --config.interactive=false
npm start
