Weasel - a command based websocket application framework on node.js
============================================

Weasel provides a command based websocket application framework for rapid 
development.

 - supports for a variety of transports (websockets, flashsockets, XHR Polling) with the help from socket.io-node.
 - simple command based communication between server and client.
 - ´javascript´ on server and client side
 - integrated document based database ´mongodb´ (soon!)

Requirements
------------

- Node v0.1.94+



How to install
--------------

IMPORTANT! When checking out the git repo, make sure to include the submodules. One way to do it is:

	git clone git://github.com/hackfrag/Weasel.git
	
Another, once cloned
	
	cd Weasel
	git submodule update --init --recursive
	
How to run the demo
----------

	cd tests
	sudo node server.js

and point your browser to http://localhost:8080. In addition to 8080, 
if the transport `flashsocket` is enabled, a server will be initialized to listen to requests on the port 843.

ToDos
-----

 - add unit tests
 - add a access log (http and websocket calls)
 - add command line options to weasel (like node server.js start/restart)
 - add 'run as daemon'
 - add mongodb as database layer
 - add configuration files



