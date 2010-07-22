Database.model('User', {
	
	properties: ['username', 'password', {'position': ['top', 'left']}, 'sessionId'],

	indexes: ['username', 'sessionId','password']
	
});