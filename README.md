Weasel - a command based websocket application framework on node.js
============================================

Weasel provides a command based websocket application framework for real-time applications
like chats, games and other high performance server/client problems.

 - supports for a variety of transports (websockets, flashsockets, XHR Polling) with the help from socket.io-node.
 - simple command based communication between server and client.
 - javascript on server and client side
 - integrated document based database mongodb

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
-------------------

	cd tests
	sudo node server.js

and point your browser to http://localhost:8080. In addition to 8080, 
if the transport `flashsocket` is enabled, a server will be initialized to listen to requests on the port 843.

How to use weasel
-------------------

/server.js

	var weasel = require('../lib/weasel.server');

	var Example = new weasel.Server().listen(8080);

/app/controllers/UserController.js

	Controller('User', {

		/**
		 * a simple chat command
		 *
		 * Can be called from the client with 'user/chat'
		 *
		 * @param	{Server}	server	the weasel server instance
		 * @param	{Client}	client	the current client who request this command
		 * @param	{Object}	requested params eg. params.message
		 */
		chat: function(server, client, params) {
			
			/**
			 * clientArray is a array of client who get the response
			 * responseParams are the response params
			 * this.response(clientArray, responseParams)
			 */
			this.response(server.clients,{
				message: params.message;
			})
		}
	})

/app/public/index.html
	<html>
		<head>
			<!--
				You dont have to include these files in the public folder.
			-->
			<script type="text/javascript" src="/server/vendor/socket.io/socket.io.js"> </script>
			<script type="text/javascript" src="/server/weasel.client.js"> </script>
		</head>
		<body>

			Weasel.subscribe('user/chat', function(params){
				console.log('Called by another connected client:' +params.message);
			})
			Weasel.ready(function() {
				Weasel.command('user/chat', {message: 'test'}, function(params) {
					console.log(params.message);
				})
			})
		</body>
	</html>


ToDos
-----

 - add unit tests
 - add a access log (http and websocket calls)
 - add command line options to weasel (like node server.js start/restart)
 - add 'run as daemon'
 - add configuration files



