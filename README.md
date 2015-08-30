# Kuzzle - Cabble demo

##Description
Cabble is a life-changing web application (demo) for both taxis and their customers.

With Cabble, taxis can easily find customers, without paying booking companies fees. This money saving allow them to improve their level of service up to those of others private transportation companies.

Cabble eases customers life as well: they can now hail a taxi with their fingertip.

Stay tuned! Upcoming versions of Cabble will also include social functionalities like the possibility for customers to rate their taxis, to comment their ride, to share their trip to their favorite social network, and more!


<figure>
  <img src="./docs/cabble-sketch.png"  width="400" >
  <figcaption style="width:300px;" >A customer ask a taxi for a ride.</figcaption>  
</figure>

<figure>
  <img src="./docs/cabble-sketch2.png"  width="400" >
   <figcaption style="width:300px;" >The taxi see in realtime the ride proposal. He can accept or decline it. </figcaption>  
</figure>


#Iconography

<figure>
	<img src="./assets/img/customer.png" width="40" >
	<figcaption>The icon for the customer.</figcaption>
</figure>

<figure >
	<img src="./assets/img/customeranimated.gif" width="40" >
	<figcaption >A customer asking for a ride.</figcaption>
</figure>

<figure>
	<img src="./assets/img/taxi.jpg"  width="40" >
	<figcaption >The icon for the customer.</figcaption>
</figure>
<figure>
	<img src="./assets/img/taxianimated.gif"  width="40" >
	<figcaption >A taxi proposing a ride.</figcaption>
</figure>

<figure>
	<img src="./assets/img/unknown.jpg" width="40" >
	<figcaption>The user has not choose betweeen beeing a customer or beeing a taxi.</figcaption>
</figure>



#How to install Cabble

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
* Configure the `config.js` file for change the Kuzzle URL if you have changed the default Kuzzle installation
* You can directly open the `index.html` file in your browser.
 

# The three Authors

 * [Émilie Esposito](https://twitter.com/emilieesposito)
 * [Sébastien Cottinet](https://github.com/scottinet)
 * [Éric Alvernhe](https://github.com/Ealv)

# The three Cabble Dependancies :

 * [Bluebird](https://github.com/petkaantonov/bluebird) (For Promise Styling)
 * [localForage](https://mozilla.github.io/localForage) (For local storage persistency)
 * [Leafletjs](http://leafletjs.com/) (awesome library for drawing map with OpenStreetMap Database)

# Licence
This demo is published under the MIT licence