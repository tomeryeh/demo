# Kuzzle - TODO list demo

A simple real-time collaborative TODO list with Kuzzle.

# How to run this demo

You can directly open the `index.html` file in your browser.
 
You can also use nginx and docker:

    $ docker run -d -p 80:80 -v $(pwd)/todolist/:/usr/share/nginx/html/todolist nginx
    
And access to the URL http://localhost/todolist