# Prerequist

* An available Kuzzle instance
* A webserver to host the sources

# Installation

* Host the source files on a webserver
* Configure the webserver to serve the root of the folder
* Change the url of the Kuzzle instance in js/app.js (first line)
* Follow the Data Initialization below

# Data Initialization

* Please send the following body with PUT method to the route api/chooseyourday/_mapping of Kuzzle :

```
{
    "properties" : {
        "event" : {"type" : "string", "store" : true, "index" : "not_analyzed" }
    }
}
```