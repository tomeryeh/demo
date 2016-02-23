# Kuzzle - Chat Tutorial

**Original Author :** [ScreamZ](https://github.com/ScreamZ)


The step-by-step tutorial can be found [here](./tutorial.md).
Simple tutorial project used to demonstrate Kuzzle basic features.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [Running the demo](#running-the-demo)
  - [Kuzzle + Demo package with Docker Compose](#kuzzle--demo-package-with-docker-compose)
  - [Stand alone](#stand-alone)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->


## Running the demo

### Kuzzle + Demo package with Docker Compose

Prerequisites:

* [Bower](http://bower.io/)
* [Docker](https://docs.docker.com/installation/#installation)
* [Docker Compose](https://docs.docker.com/compose/install/)

From this directory you can use the default `docker-compose.yml` to run Kuzzle and this demo within a container:

```
$ bower install
$ docker-compose up
```

Now, you can try to access the chat demo on http://localhost

### Stand alone

* A running [kuzzle](https://github.com/kuzzleio/kuzzle) instance
* (Optional) Edit the the ``js/config.js`` file to configure your Kuzzle instance URL, if you don't opt for a default installation
* You can directly open the `index.html` file in your browser.

**Note:**

In order to avoid problem with Cross-Origin by opening the file directly in your browser, you can also use nginx. With docker, you can use something like:

    $ docker run -d -p 80:80 -v $(pwd)/chat/:/usr/share/nginx/html nginx

And access to the URL http://localhost

## License

This tutorial is published under [MIT License](LICENSE)
