$(document).ready( function() {
	var chart = d3.select("#forSvg").append("svg");

	var sortBy;

	$("#commNum").click(function() {
		sortBy = "commNum";
		resort();
		redraw();
	});

	$("#callsNum").click(function() {
		sortBy = "callsNum";
		resort();
		redraw();
	});

	$("#chatNum").click(function() {
		sortBy = "chatNum";
		resort();
		redraw();
	});

	$("#emailNum").click(function() {
		sortBy = "emailNum";
		resort();
		redraw();
	});

	$("#facebookNum").click(function() {
		sortBy = "facebookNum";
		resort();
		redraw();
	})

	var data = [ {commNum: 2, color: "red"},
		{commNum: 1, color: "blue"},
		{commNum: 3, color: "black"},
		{commNum: 0, color: "blue"},
		{commNum: 5, color: "green"},
		{commNum: 5, color: "green"},
		{commNum: 5, color: "green"},
		{commNum: 5, color: "green"},
		{commNum: 5, color: "green"}];

	var size = 160;

	var resort = function() {
		data.sort(function(a, b) {return b[sortBy] - a[sortBy]});
		console.log(data);
	};

	var y = function(d, i) {
		return parseInt(i / 5) * size; 
	};

	var x = function(d, i) {
		return i % 5 * size;
	};


	var redraw = function() {
		console.log(data);
		chart.selectAll("rect")
			.data(data, function(d) {
				return d;
			})
			.enter().append("rect")
			.attr("y", y)
			.attr("x", x)
			.attr("width", size)
			.attr("height", size)
			.attr("stroke", "white")
			.style("fill", function(d, i) {
				return d.color;
		});

		chart.selectAll("rect")
			.data(data)
			.transition()
			.duration(1000)
			.attr("y", y)
			.attr("x", x)
			.style("fill", function(d, i) {
				return d.color
			});
	};

	redraw();

});