var http	= require('http'),
	url		= require('url'),
	fs		= require('fs'),
	io		= require('../vendor/socket.io-node/lib/socket.io'),
	sys		= require('sys'),
	fileserver = require('../vendor/paperboy/lib/paperboy');



var Commands = {
	
	connect: function(server, client, params) {
	
		return new Response(server.clients, {
			'client' : client
		})
	},
	disconnect: function(server, client, params) {
		
		return new Response(server.clients, {
			'client' : client
		})
	},
	getAllClients: function(server, client, params) {
		var clients = [];
		
		for (var i in server.clients) {
			if(server.clients[i] && i != client.sessionId) {
				clients.push(server.clients[i])	
			}
			
		}

		return new Response([client], {
			'clients' : clients
		})	
	}
}



var Server = exports.Server = Class({

	include: [process.EventEmitter.prototype],
	
	init: function(options) {
		this.options = options;
		this.clients = [];
		
		var self = this;
		
		process.EventEmitter.call(this);
	
		this.socket = http.createServer(function(req, res){
			
			fileserver
				.deliver(process.cwd()  + "/public" , req, res)
				.otherwise(function(err) {
					res.writeHead(404);
					res.write('404');
					res.end();
				});
	
		});
		

		this.loadCommands();

		
		
	},
	listen: function(port) {
		
		var self = this;
		
		this.socket.listen(8080);
		
		this.listener = io.listen(this.socket, {
	
			onClientConnect: function(socket) {
				self.onClientConnect(socket)
			},
			onClientDisconnect: function(socket) {
				self.onClientDisconnect(socket);
			},
			onClientMessage: function(message, socket) {
				self.onClientMessage(message, socket);
			}
		});
		return this;
	},
	
	onClientMessage: function(message, socket){
	

		var client 	= this.clients[socket.sessionId],
			commandObject, result, response,
			self	= this;
			
		
		
		commandObject = JSON.parse(message);
		result = Commands[commandObject.command](this, client, commandObject.params);

		response = {
			'id'		: commandObject.id,
			'command'	: commandObject.command,
			'params'	: result.params
		}
	

		
		for (var i in result.to) {
			if(result.to[i]) {
				this.listener.clientsIndex[result.to[i].sessionId].send(JSON.stringify(response));	
			}
		}
		
		self.emit("onClientMessage", message, client);
	},
	
	onClientDisconnect: function(socket){
				
		var client = this.clients[socket.sessionId],
			result = Commands['disconnect'](this, client, {}),
			response,
			self = this;
		
		
		response = {
			'id'		: 'no-id',
			'command'	: 'disconnect',
			'params'	: result.params
		}
	
		for (var i in result.to) {
			if(result.to[i]) {
				var current = this.listener.clientsIndex[result.to[i].sessionId];
				
				if(current) {
					current.send(JSON.stringify(response))
				}	
			}
		}			
		self.emit("onClientDisconnect", client);
		
		this.clients[socket.sessionId] = null;
	},
	onClientConnect: function(socket){
				
		var client = new Client(socket.sessionId);
		
		this.clients[socket.sessionId] = client; 
		
		this.emit("onClientConnect", client);
	},
	
	loadCommands: function() {
		var commandFiles = fs.readdirSync(process.cwd() + "/commands"),
			self = this, commandName, command;
		
		commandFiles.forEach(function(file) {
			commandName = file.replace(/\.js/,'');
			command = require(process.cwd() + "/commands/" + commandName)[commandName];
					
			Commands[commandName] = command;
			
		});
	}
});





var Client = function(sessionId) {
	this.sessionId = sessionId;
}


var Response = exports.Response = function(to, params) {
	return {
		"to" : to,
		"params" : params
	}
} 




