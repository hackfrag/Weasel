var Weasel = require('../../src/lib/node.weasel');


exports.move = function(server, client, params) {
	
	
	
	
	return new Weasel.Response(server.clients, {
		sessionId: client.sessionId,
		position: {
			top:	params.top,
			left: 	params.left
		}
	})
}



