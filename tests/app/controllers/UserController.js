var sys = require('sys');

Controller('User', {
	register: function(server, client, params) {
		var User = server.db.model('User'),self = this;
		
		user = new User();
		
		user.username = params.username;
		user.password = params.password;
		user.position.top = (50 + parseInt( Math.random() * ( 250-50+1 ) ));
		user.position.left = (50 + parseInt( Math.random() * ( 550-50+1 ) ));
		user.sessionId = client.sessionId;
		
		user.save(function() {
			
			client.user = user.toObject();
			
			self.response(server.clients,{
				'client': client
			})
		})
	},
	login: function(server, client, params) {
		
		var User = server.db.model('User'),self = this;
		
		
		User.find({username: params.username, password: params.password}).one(function(user) {
			
			if(user) {
				
				user.sessionId = client.sessionId;
				
				user.save(function() {
					client.user = user.toObject();;
					self.response(server.clients,{
						'client': client
					})	
				})
				

			} else {
				
				self.response(server.clients,{
					'client': null
				})
			}		
		
						
		})

	},
	
	chat: function(server, client, params) {
		
		this.response(server.clients, {
			message: params.message,
			sessionId: client.sessionId
		})
		
	},
	move: function(server, client, params) {
		
		var User = server.db.model('User'),self = this;

		User.find({sessionId: client.sessionId}).one(function(user) {
			
			user.position.top = params.top;
			user.position.left = params.left;
			
			user.save();
		})
		
		this.response(server.clients, {
			sessionId: client.sessionId,
			position: {
				top:	params.top,
				left: 	params.left
			}
		});
		
	}
});




