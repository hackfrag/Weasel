Controller('User', {
	
	chat: function(server, client, params) {
		
		this.response(server.clients, {
			message: params.message,
			sessionId: client.sessionId
		})
		
	},
	move: function(server, client, params) {
		
		this.response(server.clients, {
			sessionId: client.sessionId,
			position: {
				top:	params.top,
				left: 	params.left
			}
		});
		
	}
});
