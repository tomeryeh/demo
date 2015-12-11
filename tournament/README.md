# Kuzzle Tournament Demo

**Kuzzle Tournament** is a multiplayer combat game running in web browsers.

This demo uses [Kuzzle](http://kuzzle.io) to handle communications between a game server and game clients, and [Phaser](http://phaser.io/) for the graphical part of the game.

# Code tutorial

You can find the tutorial of this demo [here](./tutorial.md).

Please note that this is an advanced demo, only meant to show you specific parts of Kuzzle.

Namely:

* How to setup a back-end server using Kuzzle
* How to handle client disconnections


# Getting started

## Prerequisites

For this demo, you'll need:

* [NodeJS](https://nodejs.org/en/) v4 or higher
* [Bower](http://bower.io/#install-bower)
* [Docker](http://docs.docker.com/linux/started/) v1.7 or higher
* [docker-compose](https://docs.docker.com/compose/install/) v1.2 or higher

## Setting up

Clone the demo project and install dependencies:

```sh
$ git clone https://github.com/kuzzleio/demo.git
$ cd demo/tournament
$ npm install
$ bower install
```

## Configuration

The default Kuzzle URL is ``http://localhost:7512``.

To change the host name, simply edit the ``config.js`` file, located in the root directory of this demo.


## Launching the demo

```sh
docker-compose up
```

If you're behind a proxy, Kuzzle won't be able to download the necessary plugins. You may use ``forgetproxy`` as a quick way to bypass proxy configuration:

```sh
$ docker pull klabs/forgetproxy
$ docker run -ti --net=host --privileged -e http_proxy=$http_proxy \
-e https_proxy=$https_proxy klabs/forgetproxy
```

Once done, you may access the demo directly in your browser, using the following URL: ``http://localhost``

# License

This demo is released under the [MIT License](./LICENSE)

# Credits

Thanks to [Samuel Bouic](https://github.com/samniisan) for this amazing demo!
