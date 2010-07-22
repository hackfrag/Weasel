require.paths.unshift(__dirname +'/vendor/mongoose');

var http	= require('http'),
	url		= require('url'),
	fs		= require('fs'),
	path	= require('path'),
	io		= require('./vendor/socket.io-node/lib/socket.io'),
	sys		= require('sys'),
	fileserver = require('./vendor/paperboy/lib/paperboy'),
	Database = require('mongoose').Mongoose;



var Commands = {
	
	connect: function(server, client, params) {

		this.response(server.clients, {
			'client' : client
		})
	},
	disconnect: function(server, client, params) {
		
		this.response(server.clients, {
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

		this.response([client], {
			'clients' : clients
		})	
	}
}




var Server = exports.Server = Class({

	include: [process.EventEmitter.prototype],
	
	init: function(options) {
		
		this.options = options;
		this.controllers = {
			defaults: Commands
		}
		this.clients = [];
		this.db	= Database.connect('mongodb://localhost/db');
		
		

		var self = this,
			webroot;
		
		process.EventEmitter.call(this);
	
		this.socket = http.createServer(function(req, res){
			var requestPath = url.parse(req.url).pathname;
			
			if (/\/server.*$/.test(requestPath)){
				webroot = path.normalize(__dirname);
				req.url = req.url.replace(/server\//, "");
			} else {
				webroot = process.cwd()  + "/public";
			}

	
			fileserver
				.deliver(webroot , req, res)
				.otherwise(function(err) {
					res.writeHead(404);
					res.write('404');
					res.end();
				});
	
		});
		

		this.loadController();
	
		this.loadModels();
		
		
	},
	listen: function(port) {
		
		var self = this;
		
		this.socket.listen(port);
		
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
			commandObject, self	= this, command;
			
		
		
		commandObject	= JSON.parse(message);
		
		var commandNameSplitted = commandObject.command.split('/');
		
		if(commandNameSplitted.length == 2) {
			command = self.controllers[commandNameSplitted[0]][commandNameSplitted[1]];
		} else {
			command 		= self.controllers.defaults[commandObject.command];
		}
		
		
		
		if(command) {
			command.response = function(to, params) {
		
			var response = {
					'id'		: commandObject.id,
					'command'	: commandObject.command,
					'params'	: params
				}
				
			
					
				for (var i in to) {
					if(to[i]) {
						self.listener.clientsIndex[to[i].sessionId].send(JSON.stringify(response) + "\n");	
					}
				}	
			};
			
			
			command.call(command, this, client, commandObject.params);
		}
		

		
		
		self.emit("onClientMessage", message, client);
	},
	
	onClientDisconnect: function(socket){
				
		var client = this.clients[socket.sessionId],
			response,
			self = this;
		
		

		command = Commands['disconnect'];
		
		command.response = function(to, params) {
		
			response = {
				'id'		: 'no-id',
				'command'	: 'disconnect',
				'params'	: params
			}
			
		
				
			for (var i in to) {
				if(to[i]) {
					var current = self.listener.clientsIndex[to[i].sessionId];
					if(current) {
						current.send(JSON.stringify(response) + "\n")
					}
				}
			} 		
		};
		
		command.call(command, this, client, {});
		
		self.emit("onClientDisconnect", client);
		
		this.clients[socket.sessionId] = null;
	},
	onClientConnect: function(socket){
				
		var client = new Client(socket.sessionId);
		
		this.clients[socket.sessionId] = client; 
		
		this.emit("onClientConnect", client);
	},
	loadModels: function() {
		var modelFiles, scriptObj, context = [], self = this;
		
		var Script = process.binding('evals').Script;
		
		if(fs.readdirSync(process.cwd() + "/app/models")) {
	
			modelFiles = fs.readdirSync(process.cwd() + "/app/models");
			modelFiles.forEach(function(file) {
				
				var scriptContent = fs.readFileSync(process.cwd() + "/app/models/" + file);
				context['Database'] = Database;
				context['sys'] = sys;
				context['require'] = require;
				context['process'] = process;
				
				scriptObj = Script.runInNewContext(scriptContent, context);
				
			});
		}

	},
	loadController: function() {
		
		var commandFiles, self = this, ControllerName, command, scriptContent, context = [];
		
		var Script = process.binding('evals').Script;

		if(fs.readdirSync(process.cwd() + "/app/controllers")) {
			
			commandFiles = fs.readdirSync(process.cwd() + "/app/controllers")
			
			commandFiles.forEach(function(file) {
			
				
				
				scriptContent = fs.readFileSync(process.cwd() + "/app/controllers/" + file);
			
				context['Controller'] = function(ctrlName, commands) {
					self.controllers[ctrlName.toLowerCase()] = commands;
				};
				context['require'] = require;
				context['process'] = process;
				
				scriptObj = Script.runInNewContext(scriptContent, context);
				
				
				
			});
			
		}
	}
	
});





var Client = function(sessionId) {
	this.sessionId = sessionId;
}


