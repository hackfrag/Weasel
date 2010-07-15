var Client = require('../client').Client,
		url = require('url'),
		Buffer = require('buffer').Buffer,
		crypto = require('crypto');

exports.websocket = Client.extend({

	_onConnect: function(req, socket){
		var self = this, headers = [];
		this.request = req;
		this.connection = socket;
		this.data = '';

		if (this.request.headers.upgrade !== 'WebSocket' || !this._verifyOrigin(this.request.headers.origin)){
			this.listener.options.log('WebSocket connection invalid');
			this.connection.end();
		}

		this.connection.setTimeout(0);
		this.connection.setEncoding('utf8');
		this.connection.setNoDelay(true);

		if ('sec-websocket-key1' in this.request.headers) {
			this.draft = 76;
		}

		if (this.draft == 76) {

			var origin = this.request.headers.origin;

			headers = [
				'HTTP/1.1 101 WebSocket Protocol Handshake',
				'Upgrade: WebSocket',
				'Connection: Upgrade',
				'Sec-WebSocket-Origin: ' + (origin || 'null'),
				'Sec-WebSocket-Location: ws://' + this.request.headers.host + this.request.url
			];
			
			if ('sec-websocket-protocol' in this.request.headers) {
				headers.push('Sec-WebSocket-Protocol: ' + this.request.headers['sec-websocket-protocol']);
			}
		}
		else {
			
			headers = [
				'HTTP/1.1 101 Web Socket Protocol Handshake',
				'Upgrade: WebSocket',
				'Connection: Upgrade',
				'WebSocket-Origin: ' + this.request.headers.origin,
				'WebSocket-Location: ws://' + this.request.headers.host + this.request.url
			];
			
			try {
				this.connection.write(headers.concat('', '').join('\r\n'));
			} catch(e){
				this._onClose();
			}
		}
		
		this.connection.addListener('end', function(){self._onClose();});
		this.connection.addListener('data', function(data){self._handle(data);});

		if (this._proveReception(headers)){
			this._payload();
		}

		setInterval(function(){
			self._write(JSON.stringify({heartbeat: '1'}));
		}, 10000);
	},

	_handle: function(data){
		var chunk, chunks, chunk_count;
		this.data += data;
		chunks = this.data.split('\ufffd');
		chunk_count = chunks.length - 1;
		for (var i = 0; i < chunk_count; i++) {
			chunk = chunks[i];
			if (chunk[0] !== '\u0000') {
				this.listener.options.log('Data incorrectly framed by UA. Dropping connection');
				this.connection.destroy();
				return false;
			}
			this._onMessage(chunk.slice(1));
		}
		this.data = chunks[chunks.length - 1];
	},

	// http://www.whatwg.org/specs/web-apps/current-work/complete/network.html#opening-handshake
	_proveReception: function(headers){
		var k1 = this.request.headers['sec-websocket-key1'],
				k2 = this.request.headers['sec-websocket-key2'];
		
		if (k1 && k2) {
			var md5 = crypto.createHash('md5');

			[k1, k2].forEach(function(k) {
				var n = parseInt(k.replace(/[^\d]/g, '')),
						spaces = k.replace(/[^ ]/g, '').length;
						
				if (spaces === 0 || n % spaces !== 0) {
					this.listener.options.log('Invalid WebSocket key: "' + k + '". Dropping connection');
					this.connection.destroy();
					return false;
				}

				n /= spaces;
				
				md5.update(String.fromCharCode(
					n >> 24 & 0xFF,
					n >> 16 & 0xFF,
					n >> 8  & 0xFF,
					n       & 0xFF));
			});

			md5.update(this.upgradeHead.toString('binary'));
			
			try {
				this.connection.write(headers.concat('', '').join('\r\n') + md5.digest('binary'), 'binary');
			} catch(e){
				this._onClose();
			}
		}
		
		return true;
	},

	_write: function(message){
		try {
			this.connection.write('\u0000', 'binary');
			this.connection.write(message, 'utf8');
			this.connection.write('\uffff', 'binary');
		} catch(e){
			this._onClose();
		}
	}

});

exports.websocket.httpUpgrade = true;