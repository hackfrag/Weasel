var Weasel = require('../../src/lib/node.weasel');


exports.chat = function(server, client, params) {
	
	
	
	return new Weasel.Response(server.clients, {
		message: params.message,
		sessionId: client.sessionId
	})
}



