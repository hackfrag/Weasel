var Weasel = require('../../lib/weasel.server');


exports.move = function(server, client, params) {
	

	this.response(server.clients, {
		sessionId: client.sessionId,
		position: {
			top:	params.top,
			left: 	params.left
		}
	});

	
}


