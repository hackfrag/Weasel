var weasel = require('../lib/weasel.server');	

/**
 * Create a new weasel server instance and listen on 
 * port 8080
 * 
 * You can also extend the Server Class
 * 
 * var Example = weasel.Server.extend({
 * 		init: function(options) {
 * 			this.__super__(options)
 * 		
 * 			// your code
 * 		} 
 * })
 * 
 * var myServer = new Example();
 * 
 * myServer.listen(5050);
 * 
 */
var Example = new weasel.Server().listen(8080);



Example.addListener("onClientConnect", function(client) {
	
})

Example.addListener("onClientDisconnect", function(client) {
	
})

Example.addListener("onClientMessage", function(message, client) {
	
})