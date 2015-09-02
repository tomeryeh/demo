# Kuzzle Tournament Demo

**Kuzzle Tournament** is a multiplayer combat game running in web browsers.

This demo uses [Kuzzle](http://kuzzle.io) to handle communications between a game server and game clients, and [Phaser](http://phaser.io/) for the graphical part of the game.

# Code tutorial

You can find the tutorial of this demo [here](./tutorial.md).

Please note that this is an advanced demo, meant to show you specific parts of Kuzzle only.

Namely:

* How to setup a back-end server using Kuzzle
* How to handle client disconnections


# Running the demo

Simply ``git clone`` the project, and in the ``tournament`` directory, execute the following command:

```sh
docker-compose up
```

# Configuration

The default Kuzzle URL is ``http://localhost:7512``.

To change the host name, simply edit the ``config.js`` file, located in this demo root directory.

You may want to change the default TCP port too. To do so, in addition to the ``config.js`` file, you also need to edit the ``docker-compose.yml`` file.


# License

This demo is released under the [MIT License](./LICENSE)

# Credits

Thanks to [Samuel Bouic](https://github.com/samniisan) for this amazing demo!
