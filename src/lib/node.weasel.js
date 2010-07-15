var http = require('http'),
	url = require('url'),
	fs = require('fs'),
	io = require('../vendor/socket.io'),
	sys = require('sys');

var send404 = function(res){
	res.writeHead(404);
	res.write('404');
	res.end();
}

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



var Server = function(options){

	this.options = options;
	this.clients = [];
	
	var self = this;
	process.EventEmitter.call(this);

	this.socket = http.createServer(function(req, res){
		var path = url.parse(req.url).pathname;
		
		switch (path) {
			default:
				if (/\.(js|html|swf|css)$/.test(path)) {
					
					try {
					
						var swf = path.substr(-4) === '.swf';
						res.writeHead(200, {
							'Content-Type': swf ? 'application/x-shockwave-flash' : ('text/' + (path.substr(-3) === '.js' ? 'javascript' : 'html'))
						});
						
						res.write(fs.readFileSync(self.options.path  + "/public"  + path, swf ? 'binary' : 'utf8'), swf ? 'binary' : 'utf8');
						res.end();
					} 
					catch (e) {
						send404(res);
					}
					break;
				}
				
				send404(res);
				break;
		}
	});
	
	var commandFiles = fs.readdirSync(self.options.path + "/commands");
	
	commandFiles.forEach(function(file) {
		var commandName = file.replace(/\.js/,'');
		var command = require(self.options.path + "/commands/" + commandName)[commandName];
		
		
		Commands[commandName] = command;
		
	});

	
	
	this.socket.listen(8080, {
		transports: ['websocket', 'server-events', 'htmlfile', 'xhr-multipart', 'xhr-polling'],
		log: function(message) {
			sys.log(message);
		}
	});
	
	this.listener = io.listen(this.socket, {

		onClientConnect: function(socket){
			
			var client = new Client(socket.sessionId);
			
			self.clients[socket.sessionId] = client; 
			
			self.emit("onClientConnect", client);
		},
	
		onClientDisconnect: function(socket){
			
			var client = self.clients[socket.sessionId];; 
			
			var result = Commands['disconnect'](self, client, {});
			var response = {
				'id'		: 'no-id',
				'command'	: 'disconnect',
				'params'	: result.params
			}
	
			for (var i in result.to) {
				if(result.to[i]) {
					var tmp = self.listener.clientsIndex[result.to[i].sessionId];
					
					if(tmp) {
						tmp.send(JSON.stringify(response))
					}
					//sys.log(sys.inspect(self.listener.clientsIndex[result.to[i]]));
					//self.listener.clientsIndex[result.to[i].sessionId].send(JSON.stringify(response));	
				}
			}			
			self.emit("onClientDisconnect", client);
			
			self.clients[socket.sessionId] = null;
		},
	
		onClientMessage: function(message, socket){
		
			var client = self.clients[socket.sessionId];; 
			
			
			var commandObject = JSON.parse(message);
			var result = Commands[commandObject.command](self, client, commandObject.params);
	
			var response = {
				'id'		: commandObject.id,
				'command'	: commandObject.command,
				'params'	: result.params
			}
		
		
			
			for (var i in result.to) {
				if(result.to[i]) {
					self.listener.clientsIndex[result.to[i].sessionId].send(JSON.stringify(response));	
				}
			}
			
			self.emit("onClientMessage", message, client);
		}
	});
	
	
}


sys.inherits(Server, process.EventEmitter); 


exports.Server = Server;



var Client = function(sessionId) {
	this.sessionId = sessionId;
}


var Response = function(to, params) {
	return {
		"to" : to,
		"params" : params
	}
} 

exports.Response = Response;



