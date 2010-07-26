require.paths.unshift(__dirname +'/vendor/mongoose');

var http	= require('http'),
	url		= require('url'),
	fs		= require('fs'),
	path	= require('path'),
	io		= require('./vendor/socket.io-node/lib/socket.io'),
	sys		= require('sys'),
	fileserver = require('./vendor/paperboy/lib/paperboy'),
	crypto	= require('crypto'),
	Database = require('mongoose').Mongoose;


var Server = exports.Server = Class({

	include: [process.EventEmitter.prototype],
	
	init: function(options) {
		
		this.APPLICATION_ROOT = process.cwd();
		
		this.options = options;
		this.controllers = {
			defaults: CoreCommands
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
	execute: function(command, params, client, commandId) {
		
		var commandNameSplitted = command.split('/'),
			self = this
		
		if(commandNameSplitted.length == 2) {
			commandFunction = self.controllers[commandNameSplitted[0]][commandNameSplitted[1]];
		} else {
			commandFunction = self.controllers.defaults[command];
		}
		
		
		
		if(commandFunction) {
			commandFunction.response = function(to, responseParams) {
			
			var response = {
					'id'		: commandId,
					'command'	: command,
					'params'	: responseParams
				}
			
				for (var i in to) {
					if(to[i]) {
						
						self.listener.clientsIndex[to[i].sessionId].send(JSON.stringify(response) + "\n");	
					}
				}	
			};
			
			
			commandFunction.call(commandFunction, self, client, params);
		}	
		
	},
	onClientMessage: function(message, socket){
	
		var client 	= this.clients[socket.sessionId],
			commandObject, self	= this;
			
		commandObject	= JSON.parse(message);
		
		this.execute(commandObject.command, commandObject.params, client, commandObject.id);
		this.emit("onClientMessage", message, client);
	},
	
	onClientDisconnect: function(socket){
				
		var client = this.clients[socket.sessionId],id;
		
		id = crypto.createHash('md5').update("" + (new Date()).getTime() + client.sessionId).digest("hex");
		
		this.clients[socket.sessionId] = null;
		this.execute('disconnect', {}, client, id);
		
		this.emit("onClientDisconnect", client);
		
	},
	onClientConnect: function(socket){
				
		var client = new Client(socket.sessionId);
		
		this.clients[socket.sessionId] = client; 
		this.emit("onClientConnect", client);
	},
	command: function(command, params, client) {
		
		var id = crypto.createHash('md5').update("" + (new Date()).getTime() + client.sessionId).digest("hex");
		
		this.execute(command, params, client, id)
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
				context['Server'] = self;
				
				scriptObj = Script.runInNewContext(scriptContent, context);
				
				
				
			});
			
		}
	}
	
});


var CoreCommands = {
	
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




var Client = function(sessionId) {
	this.sessionId = sessionId;
}


