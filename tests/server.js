var weasel = require('../lib/weasel.server'),
	sys = require('sys');
	


var Example = new weasel.Server({
	debug : true
}).listen(8080);



Example.addListener("onClientConnect", function(client) {
	client.position = {
		top: random(50,250),
		left: random(50,550)
	}
})




Example.addListener("onClientDisconnect", function(client) {
	
})

Example.addListener("onClientMessage", function(message, client) {
	
})



function random( min, max ) {
	if( min > max ) {
		return( -1 );
	}
	if( min == max ) {
		return( min );
	}
	return( min + parseInt( Math.random() * ( max-min+1 ) ) );
}
