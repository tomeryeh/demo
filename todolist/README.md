# Kuzzle - TODO list demo

A simple real-time collaborative TODO list based on Kuzzle.io. This tools allows a set of users to share a common TODO list across multiple devices. TODOs are synchronized in real time across all the usesrs: create, update or delete a TODO and other users will instantly see the effect.
In this demo you'll learn to use Kuzzle.io to
* search documents within a collection,
* subscribe to a collection and be notified of all the changes that occur on it,
* add a new document to a collection,
* delete a document from a collection.
The demo front-end layer is based on AngularJS, a very simple way to dive straight into Kuzzle.io!

The step-by-step tutorial can be found [here](./tutorial.md).
Simple tutorial project used to demonstrate Kuzzle basic features.

# Running the demo

## Kuzzle + Demo package with Docker Compose

Prerequisites:

* [Bower](http://bower.io/)
* [Docker](https://docs.docker.com/installation/#installation)
* [Docker Compose](https://docs.docker.com/compose/install/)

If your Docker Machine runs with a specific IP address (e.g. you're using Docker Toolkit on a Mac), you may want to specify it in the `config.js` file before launching the demo.

Just type

```
$ bower install
$ docker-compose up
```

from the root of the demo. Docker Compose will launch using the default `docker-compose.yml` file (use `-f` to specify your own configuration file).

If everything went right, you can play with the TodoList demo at http://localhost (or at the Docker Machine's IP address).

## How to run this demo without docker

* You need to have a running [Kuzzle](https://github.com/kuzzleio/kuzzle).
* Configure the `config.js` file to change the Kuzzle URL if needed.
* You can directly open the `index.html` file in your browser.

**Note:**

In order to avoid problems with Cross-Origin by opening the file directly in your browser, you can also use nginx. With docker, you can use something like

    $ docker run -d -p 80:80 -v $(pwd)/todolist/:/usr/share/nginx/html nginx

And access to the URL http://localhost (or at the Docker Machine's IP address).
