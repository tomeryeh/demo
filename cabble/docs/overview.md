#Sketchup User interface Cabble in three screens.


This is the basic process in three sceens that Cabble rely on.

On Cabble, the user is always centered on the map.
The user can be a taxi or a customer, he will see some candidates (i.e some taxi if you are a customer and vice versa).
The user can propose a ride to a candidate or accept a proposed ride.


<div >Step 1 : The customer see some taxi.</div>
<a href="./cabble-sketch.png" >
<img style="vertical-align:middle" src="./cabble-sketch.png"  width="100%">
</a>

<br>

<div>Setp 2 : The customer click on the taxi icon and propose a ride with the popped dialog. </div>
<a href="./cabble-sketch2.png" >
<img style="vertical-align:middle" src="./cabble-sketch2.png"  width="100%">
</a>

<br>

<div>Step 3 : The ride has been accepted by the taxi.
A blue button in bottom right position appears on both taxi and customer screen. They can end the ride at anytime.</div>
<a href="./cabble-sketch3.png" >
<img  src="./cabble-sketch3.png" width="100%">
</a>


Well that's it ! you can test the application alone with two browsers by "cheating" on the geolocalisation for both taxi and customer (see next section).

#Without Geolocalisation

Suppose :

 * your navigator has no geolocalisation,
 * you don't want to send your real position,
 * no other user than you use Cabble in your town (it is a shame),
 * you want to test the demo with two browsers, with faking positions for your taxi an customer.

Then you can :

 * click on the top right button,
 * drag your user where you want.


# Iconography

 * <img src="../assets/img/customer.png" width="40" > The icon for the customer
 * <img src="../assets/img/customeranimated.gif" width="40" > A customer asking for a ride
 * <img src="../assets/img/taxi.png"  width="40" > The icon for the customer.
 * <img src="../assets/img/taxianimated.gif"  width="40" > A taxi proposing a ride.
 * <img src="../assets/img/unknown.png" width="40" > The user has not yet choosen betweeen beeing a customer or a taxi.
