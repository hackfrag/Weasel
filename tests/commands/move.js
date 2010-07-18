var Weasel = require('../../src/lib/weasel.server');


exports.move = function(server, client, params) {
	
	return new Weasel.Response(server.clients, {
		sessionId: client.sessionId,
		position: {
			top:	params.top,
			left: 	params.left
		}
	})
}



