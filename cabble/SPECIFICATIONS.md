#Cabble specifications

##Launching Cabble and identifying user
* I launch Cabble and a pop-in displays with two options:
  * “I need a ride”
  * “I’m looking for a customer”
* Cabble checks if there already is a user id in local storage.
  * **If there is no user id in local storage**, this is my first connection to Cabble. Cabble creates a new persisted ```user``` in Kuzzle :
```JSON
{ type: ’’ }
```
Kuzzle returns a document id which will be used as user id.
Cabble stores this user id in the local storage.
  * **If there is a user id in local storage**, this is not my first connection to Cabble. Retrieve user id from local storage and use it for the rest of the process.


##Profile selection
###As a customer
* I click on “I need a ride”.
* The profile-selection pop-in disappear.
* Cabble displays a map (full screen), centered on me (displayed with a meeple icon)
* Cabble updates my type in Kuzzle:
```JSON
{ _id: my_id,
type: ’customer’ }```
* Cabble unsubscribes for me to customer positions if I had subscribed to it (room_id stored in session storage).
* Cabble subscribes for me to available taxi positions, that means to positions collection, with a filter on user ```type = 'taxi'```:
```JSON
{
   and: [
      { term: { type:’taxi’ } },
      { geoBoundingBox: <Bounding Box> } //see scale management
   ]
}```
Kuzzle returns a room_id which is stored in session storage.

* Cabble sends my position every 3 seconds to Kuzzle (this data is not persisted):
```JSON
{
   user: my_id,
   type: 'customer',
   available: 'true',
   position: my_position
}```

* Cabble subscribes for me to rides proposed to me, that means to rides collection, with a filter on ```customer = 'my_id'```:
```JSON
{
   term: { customer: my_id }
}```

###As a taxi
* I click on “I’m looking for a customer”.
* The profile-selection pop-in disappear.
* Cabble displays a map (full screen), centered on me (displayed with a taxi icon)
* Cabble updates user type in Kuzzle:
```JSON
{
   _id: my_id,
   type: 'taxi'
}```
* Cabble unsubscribes for me to taxi positions if I had subscribed to it (room_id stored in session storage).
* Cabble subscribes for me to available customer positions, that means to positions collection, with a filter on ```type = 'customer'```:
```JSON
{
   and: [
      { term: { type: 'customer' } },
      { geoBoundingBox: <Bounding box> } //see scale management
   ]
}```
Kuzzle returns a room_id which is stored in session storage.
* Cabble sends my position every 3 seconds to Kuzzle (this data is not persisted):
```JSON
{
   user: my_id,
   type: 'taxi',
   available: 'true',
   position: my_position
}```
* Cabble subscribes for me to rides proposed to me, that means to rides collection, with a filter on ```taxi = my_id``` :
```JSON
{
   term: { taxi:my_id }
}```

## Display management
Every second, Cabble refreshes my position on the map, which remains centered on me.

###As a customer
* Each time I receive an available taxi position:
```JSON
{
   user:taxi_id,
   type:’taxi’,
   available:’true’,
   position:taxi_position
}```
  * if taxi_id is not already displayed, Cabble displays a taxi icon on its position on the map
  * if Cabble is already displaying taxi_id position on the map, Cabble updates it

* Each time I receive an unavailable taxi position:
```JSON
{
   user:taxi_id,
   type:’taxi’,
   available:’false’,
   position:taxi_position
}```
    * if taxi_id is not already displayed, Cabble does nothing
      * if Cabble is already displaying taxi_id position on the map, Cabble suppresses it.

###As a taxi
* Each time I receive an availble customer position:
```JSON
{
   user:customer_id,
  type:’customer’,
  available:’true’,
  position:customer_position
}```
  * if customer_id is not already displayed, Cabble displays a meeple icon on its position on the map
  * if Cabble is already displaying customer_id position on the map, Cabble updates it

* Each time I receive an unavailable customer position:
```JSON
{
   user:customer_id,
  type:’customer’,
  available:’false’,
  position:customer_position
}```
  * if customer_id is not already displayed, Cabble does nothing
  * if Cabble is already displaying customer_id position on the map, Cabble suppress it.


##Scale management
Cabble subscribes to customer / taxi positions only in the zone of the map it displays.

By default, when launched, Cabble displays the map :
* centered on user position
* in full screen
* with a default length of 5 km

When the user changes the map’s zoom level with google maps functionnality, Cabble retrieve from google maps the top left and bottom right corners positions.

The filter on positions contains a geolocalised bounding box so that only positions which can be displayed are listened to.
The box is defined this way, using top left and right bottom corners of the displayed map:
```JSON
geoBoundingBox: {
  position: {
    top_left: {
      lat: topleftcorner_latitude,
      lon: topleftcorner_longitude
    },
    bottom_right: {
      lat: bottomrightcorner_latitude,
      lon: bottomrightcorner_longitude
    }
  }
}```

A taxi updates its subscription filter every 10 seconds :
unsubscribe to previous filter (room_id stored in session storage)
subscribe to new filter (with new geoBoundingBox)

A customer updates its subscription filter every minute.

##Ride management from a taxi point of vue
###Propose a ride
As a taxi, I can propose a ride to a customer.

* When I select a customer on the map :
  * the customer’s icon is highlighted on the map
  * A message is linked to the customer, with:
    * estimated reaching time to this customer (if possible using google maps API)
    * “Propose this customer a ride”
    * “Cancel”
* If I select “Cancel”, the message disappear and the customer is no longer highlighted.
* If I select “Propose this customer a ride”, Cabble creates a persisted ```ride``` object:
```JSON
{
   customer: customer_id,
   taxi: taxi_id,
   status: “proposed_by_taxi”
}```

On the customer side, Cabble receive this ```ride``` proposal.
```JSON
{
  _id : ride_id,
  customer: customer_id,
  taxi: taxi_id,
  status: “proposed_by_taxi”
}```

As the selected customer, I see :
* the proposing taxi’s icon highlighted on the map
* a message appears, linked to the taxi, with :
* estimated waiting time (if possible using google maps API)
  * “Yes, pick me up !”
  * “No, thank you.”


###Accept a ride
I select “Yes, pick me up !”.

Cabble updates the ```ride``` object:
```JSON
{ _id : ride_id,
customer: customer_id,
taxi: taxi_id,
status: “accepted_by_customer”
}```


The taxi receives this update on the ride.
He unsubscribes to customer positions and subscribes to his customer positions:
```JSON
{ user: customer_id }
```

Taxi’s Cabble suppresses every other customer on the map and updates taxi’s availability status so that he doesn’t appear anymore on other customer maps:
```JSON
{ user:taxi_id,
type:’taxi’,
available:’false’,
position:taxi_position }```

On customer side, Cabble updates customer availability status so that he doesn’t appear anymore on other taxis maps:
```JSON
{ user:customer_id,
type:’customer’,
available:’false’,
position:customer_position }```

The customer unsubscribes to taxi positions and subscribes to his taxi positions:
```JSON
{ user: taxi_id }
```

Customer’s Cabble suppresses every other taxi on the map.

###Refuse a ride
I select “No, thank you.”

Cabble updates the ```ride``` object:
```JSON
{ _id : ride_id,
customer: customer_id,
taxi: taxi_id,
status: “refused_by_customer”
}```

The taxi receives this update on the ride. Cabble displays a message “No, thank you” linked to the customer. The taxi can close the message.

##Customer asking for a ride
###Ask for a ride
As a customer, I can ask for a ride to a taxi.

* When I select a taxi on the map :
  * the taxi’s icon is highlighted on the map
  * A message is linked to the taxi, with :
    * estimated waiting time(if possible using google maps API)
    * “Ask this taxi for a ride”
    * “Cancel”

If I select “Cancel”, the message disappear and the taxi is no longer highlighted.

If I select “Ask this taxi for a ride”, Cabble creates a persisted ```ride``` object:
```JSON
{ customer: customer_id,
taxi: taxi_id,
status: “proposed_by_customer”
}```

On the taxi side, Cabble receive this ```ride``` proposal.
```JSON
{ _id : ride_id,
customer: customer_id,
taxi: taxi_id,
status: “proposed_by_customer”
}```

As the selected taxi, I see :
* the proposing customer’s icon highlighted on the map
* a message appears, linked to the customer, with:
  * estimated reaching time (if possible using google maps API)
  * “Yes, I pick you up !”
  * “No, sorry.”

###Accept a ride
I select “Yes, I pick you up !”.

Cabble updates the ride object:
```JSON
{ _id : ride_id,
customer: customer_id,
taxi: taxi_id,
status: “accepted_by_taxi”
}```

The customer receives this update on the ride.
He unsubscribes to taxi positions and subscribes to his taxi positions :
```JSON
{ user: taxi_id }```

Customer’s Cabble suppresses every other taxi on the map and updates customer’s availability status so that he doesn’t appear anymore on other taxi maps :
```JSON
{ user:customer_id,
type:’customer’,
available:’false’,
position:customer_position }```


On taxi side, Cabble updates taxi availability status so that he doesn’t appear anymore on other customer maps :
```JSON
{ user:taxi_id,
type:’taxi’,
available:’false’,
position:taxi_position }```

The taxi unsubscribes to customer positions and subscribes to his customer positions:
```JSON
{ user: customer_id }```

Taxi’s Cabble suppresses every other customer on the map.

###Refuse a ride
I select “No, sorry.”

Cabble updates the ```ride``` object :
```JSON
{ _id : ride_id,
customer: customer_id,
taxi: taxi_id,
status: “refused_by_taxi”
}```

The customer receives this update on the ride. Cabble displays a message “No, sorry” linked to the taxi. The customer can close the message.

##During the ride
Once both parties have accepted the ride, they only see each other on their Cabble map.

On the bottom of the map, each of these two users can select “End the ride”.

When one of them selects “End the ride”:
* Cabble updates the ride object :
```JSON
{ _id : ride_id,
customer: customer_id,
taxi: taxi_id,
status: “completed”
}```
* the user who has not ended the ride receives this update. Both users are aware that the ride is over
* Both users unsubscribe to the other’s position
  * customer unsubscribe to his taxi position
  * taxi unsuscribe to his customer position
* On both sides, Cabble displays a pop-in with 2 options : “I need a ride” / “I’m looking for a customer”. If selected, see above.
