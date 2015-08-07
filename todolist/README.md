# Kuzzle - TODO list demo

A simple real-time collaborative TODO list with [Kuzzle](https://github.com/kuzzleio/kuzzle).

# How to run this demo

* You need to have a running [Kuzzle](https://github.com/kuzzleio/kuzzle).
* Configure the `script.js` file for change the Kuzzle URL if you change the default Kuzzle installation
* You can directly open the `index.html` file in your browser.
 
**Note:**

In order to avoid problem with Cross-Origin by opening the file directly in your browser, you can also use nginx and docker:

    $ docker run -d -p 80:80 -v $(pwd)/todolist/:/usr/share/nginx/html/todolist nginx
    
And access to the URL http://localhost/todolist