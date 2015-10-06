# Kuzzle - "Arrow Hero" Demo

**Original authors:** [bostalowski](https://github.com/bostalowski) & [lpoiret](https://github.com/lpoiret)

A *Guitar Hero* like game, using your keyboard arrows showing how to implement a basic but addictive real time game with levels, rooms, and two ways interactions.

# Running the demo

## Kuzzle + Demo package with Docker Compose

### Prerequisites:

* [Docker](https://docs.docker.com/installation/#installation)
* [Docker Compose](https://docs.docker.com/compose/install/)

In this directory you can use the default `docker-compose.yml` with all you need for running Kuzzle container and this demo:

```
$ docker-compose up
```

Now, you can try to use the ToDoList at http://localhost

## Stand alone

* A running [kuzzle](https://github.com/kuzzleio/kuzzle) instance
* (Optional) Edit the first line of the ``js/config.js`` file to configure your Kuzzle instance URL, if you opt out for a default installation
* You can directly open the `index.html` file in your browser.

**Note:**

In order to avoid problem with Cross-Origin by opening the file directly in your browser, you can also use nginx. With docker, you can use something like:

    $ docker run -d -p 80:80 -v $(pwd)/chat/:/usr/share/nginx/html nginx
    
And gain access to the URL http://localhost

## Code License

This demo code is published under [MIT License](LICENSE)

## Sprites credits

* [Explosion sprites](assets/sprites/explosion.png) courtesy of [ClipArtHut](http://www.cliparthut.com/explosion-sprite-sheet-clipart-Jp1tC6.html)
* [Kirby sprites](assets/sprites/kirby.png) courtesy of [The ShyGuy Kingdom](http://tsgk.captainn.net/index.php?p=search&q=kirby)
* [Pacman sprites](assets/sprites/pacman_28x28.png) courtesy of [Phaser.io](http://examples.phaser.io/assets/sprites/pacman_by_oz_28x28.png)
