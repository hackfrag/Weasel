var MoveDemo = {
	pointID : '',

	createPoint : function(params) {
		var point = $('<div>');

		point.attr('id', 'point-' + params.id);
		point.attr('class', 'box');
		point.css({
			'top' 		: params.top,
			'left'		: params.left,
		});

		// add message div (use jquer append!?)
		point.html('<div class="message"></div>');

		

		return point;
	},
	draw : function(params) {
		// jquery each doesnt work in my case ...
		// use simple for each :)
		// should use jquery each ....
		for each (var item in params) {
			var point = MoveDemo.createPoint(item);
			$('#movebox').append(point);

		}
		/*
		$(params.points).each(function(i, item) {
			var point = createPoint(item);
			$('#movebox').append(point);
		});
		*/
	},

	chat: function(params) {
		var bubble = $('#point-' + params.client + ' > div.message');
		bubble.stop().hide();
		bubble.html(params.message);
		bubble.fadeIn('fast', function() {
			$(this).fadeOut(2000)
		})
	},
	move: function(params) {
		var bubble = $('#point-' + params.client);
		bubble.animate({
			top: params.positions[0],
			left: params.positions[1],
		}, 1500 );

	},
	identifyClient: function(params) {
		Weasel.SessionID = params.id;
	},
	newPoint: function(params) {
		var point = MoveDemo.createPoint(params.positions);
		$('#movebox').append(point);
	},
	getAllPoints: function(params) {
		var point = MoveDemo.createPoint(params);
		$('#movebox').append(point);
	}


}
