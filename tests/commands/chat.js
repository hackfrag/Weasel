var Weasel = require('../../lib/weasel.server');


exports.chat = function(server, client, params) {
	
	
	this.response(server.clients, {
		message: params.message,
		sessionId: client.sessionId
	})
}



