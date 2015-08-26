# Kuzzle - TODO list demo

A simple real-time collaborative TODO list with [Kuzzle](https://github.com/kuzzleio/kuzzle).

The step-by-step tutorial can be found [here](./tutorial.md).
Simple tutorial project used to demonstrate Kuzzle basic features.

# Running the demo

## Kuzzle + Demo package with Docker Compose

Prerequisites:

* [Docker](https://docs.docker.com/installation/#installation)
* [Docker Compose](https://docs.docker.com/compose/install/)

In this directory you can use the default `docker-compose.yml` with all you need for running Kuzzle container and this demo:

```
$ docker-compose up
```

Now, you can try to use the todolist at http://localhost

## How to run this demo without docker

* You need to have a running [Kuzzle](https://github.com/kuzzleio/kuzzle).
* Configure the `script.js` file for change the Kuzzle URL if you have changed the default Kuzzle installation
* You can directly open the `index.html` file in your browser.
 
**Note:**

In order to avoid problem with Cross-Origin by opening the file directly in your browser, you can also use nginx. With docker, you can use something like

    $ docker run -d -p 80:80 -v $(pwd)/todolist/:/usr/share/nginx/html nginx
    
And access to the URL http://localhost