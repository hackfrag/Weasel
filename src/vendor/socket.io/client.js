var options = require('./util/options').options, urlparse = require('url').parse;

exports.Client = Class({
	
	include: [options],
	
	options: {
		closeTimeout: 0,
		heartbeatInterval: 5000
	},

	init: function(listener, req, res, options, head){
		this.listener = listener;
		this.setOptions(options);
		this.connections = 0;
		this.connected = false;
		this.upgradeHead = head;
		this._onConnect(req, res);
	},

	send: function(message){
		if (!this.connected || !(this.connection.readyState === 'open' ||
				this.connection.readyState === 'writeOnly')) {
			return this._queue(message);
		}
		
		this._write(JSON.stringify({messages: [message]}));
		return this;
	},

	broadcast: function(message){
		if (!('sessionId' in this)) {
			return this;
		}
		this.listener.broadcast(message, this.sessionId);
		return this;
	},

	_onMessage: function(data){
	  try {
	    var messages = JSON.parse(data);
	  } catch(e){
	    return this.listener.options.log('Bad message received from client ' + this.sessionId);
	  }
		for (var i = 0, l = messages.length; i < l; i++){
			this.listener._onClientMessage(messages[i], this);
		}		
	},

	_onConnect: function(req, res){
		var self = this;
		this.request = req;
		this.response = res;
		this.connection = this.request.connection;
		if (this._disconnectTimeout) {
			clearTimeout(this._disconnectTimeout);
		}
	},

	_payload: function(){
		var payload = [];

		this.connections++;
		this.connected = true;

		if (!this.handshaked){
			this._generateSessionId();
			payload.push(JSON.stringify({
				sessionid: this.sessionId
			}));
			this.handshaked = true;
		}

		payload = payload.concat(this._writeQueue || []);
		this._writeQueue = [];

		if (payload.length) {
			this._write(JSON.stringify({messages: payload}));
		}
		if (this.connections === 1) {
			this.listener._onClientConnect(this);
		}
	},

	_onClose: function(){
		var self = this;
		if (this._heartbeatInterval) {
			clearInterval(this._heartbeatInterval);
		}
		this.connected = false;
		this._disconnectTimeout = setTimeout(function(){
			self._onDisconnect();
		}, this.options.closeTimeout);
	},

	_onDisconnect: function(){	
		if (!this.finalized){
			this._writeQueue = [];
			this.connected = false;
			this.finalized = true;
			if (this.handshaked) {
				this.listener._onClientDisconnect(this);
			}
		}
	},

	_queue: function(message){
		if (!('_writeQueue' in this)) {
			this._writeQueue = [];
		}
		this._writeQueue.push(message);
		return this;
	},

	_generateSessionId: function(){
		if (this.sessionId) {
			return this.listener.options.log('This client already has a session id');
		}
		this.sessionId = Math.random().toString().substr(2);
		return this;
	},

	_verifyOrigin: function(origin){
		var parts = urlparse(origin), origins = this.listener.options.origins;
		return origins.indexOf('*:*') !== -1 ||
			origins.indexOf(parts.host + ':' + parts.port) !== -1 ||
			origins.indexOf(parts.host + ':*') !== -1 ||
			origins.indexOf('*:' + parts.port) !== -1;
	}

});