// bar chart
// values based on selected attribute
// bins based on plant types
function PlantTypeChart() {

	this.initVis = function() {
		var vis = this;

		// track whether a plant type should be displayed or not (depending on whether the user filtered it out)
		vis.is_displayed = {
			"Coal": true,
			"Gas": true,
			"Solar": true,
			"Other": true,
			"Oil": true,
			"Nuclear": true,
			"Hydro": true,
			"Wind": true
		}

		// create chart area
		vis.margin = {top: 5, right: 40, bottom: 30, left: 50};
    	vis.width = parseInt(d3.select('#plant-type').style('width'), 10) - vis.margin.left - vis.margin.right;
    	vis.height = 300 - vis.margin.top - vis.margin.bottom;

		vis.svg = d3.select("#plant-type").append("svg")
			.attr("width", vis.width + vis.margin.left + vis.margin.right)
			.attr("height", vis.height + vis.margin.top + vis.margin.bottom)
			.append("g")
				.attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

		// tooltip
		vis.tip = d3.tip()
			.attr('class', 'd3-tip')
			.offset([0, 10])
			.direction("e")
			.html(function(d) {
				var value = d.value;
				if(value < .005) {
					value = Math.round(value * 10) / 10;
				}
				else {
					value = Math.round(value);
				}
				return d3.format("0,000")(value);
			});

		vis.svg.call(vis.tip);

		// create scales
		var plant_types = Object.keys(PLANT_COLORS);

		vis.xScale = d3.scale.linear()
			.range([0, vis.width]);

		vis.yScale = d3.scale.ordinal()
    		.rangeRoundBands([vis.height, 0], .1)
    		.domain(plant_types);

		vis.colorScale = d3.scale.quantize()
			.domain([0,plant_types.length])
			.range(plant_types.map(function(key) { return PLANT_COLORS[key]; }));

		// create axes
		vis.yAxis = d3.svg.axis()
    		.scale(vis.yScale)
    		.orient("left");

    	vis.xAxisVisual = vis.svg.append("g")
			.attr("class", "x-axis axis")
			.attr("transform", "translate(0," + vis.height + ")");

		vis.yAxisVisual = vis.svg.append("g")
			.attr("class", "y-axis axis");

		vis.updateVis();
	};

	this.updateVis = function() {
		var vis = this;

		// sum for each plant type
		vis.data = plants.getAttributeTotalByType();

		// update scale and axis based on max attribute total
		var old_x_max = vis.xScale.domain()[1]; // default domain extent is [0, 1] when not set
		var new_x_max = d3.max(vis.data, function(d) { return d.value; });
		var pct_diff = (new_x_max - old_x_max) / (old_x_max);

		var x_max;
		if(new_x_max > old_x_max) { // always expand the axis to the right
			x_max = new_x_max; 
		} 
		else if(new_x_max < old_x_max && pct_diff <= -.2) { // only compress the axis to the left if if there is a considerable change in the max value (so can see changes rather than axis always updating)
			x_max = new_x_max; 
		}
		else { x_max = old_x_max; }

		vis.xScale
			.domain([0, Math.max(10, x_max)]) // no less than 10 MW or else the scale can have odd behavior when no plants are selected
			.nice();

		vis.xAxis = d3.svg.axis()
    		.scale(vis.xScale)
    		.orient("bottom")
    		.ticks(5);

  		vis.xAxisVisual
			.transition()
			.duration(DURATION_LENGTH)
			.call(vis.xAxis);

		vis.yAxisVisual
			.call(vis.yAxis)

		// enter, update bars
		vis.bars = vis.svg.selectAll(".bar")
			.data(vis.data, function(d) { return d.key; }); // keep track of data based on plant type

		vis.bars
			.enter()
			.append("rect")
			.attr("class", "bar")
			.attr("x", 0)
			.attr("height", vis.yScale.rangeBand())
			.attr("fill", function(d) { return PLANT_COLORS[d.key]; })
			.attr("opacity", 0.75)
			.attr("y", function(d) { return vis.yScale(d.key); })
			.on("mouseover", function(d) {
				d3.select(this)
					.attr("opacity", COLOR_OPACITY + 0.25)
					.style({ cursor: "pointer" });
				vis.tip.show(d);
			})
			.on("mouseout", function(d) {
				d3.select(this)
					.attr("opacity", COLOR_OPACITY)
					.style({ cursor: "auto" });
				vis.tip.hide(d);
			})
			.on("click", function() {
				// toggle between displaying plants of this type and not displaying plants of this type
				d3.select(this)
					.attr("fill", function(d) {
						var plant_type = d.key;
						if(vis.is_displayed[plant_type]) {
							vis.is_displayed[plant_type] = false;
							return "gray";
						}
						else {
							vis.is_displayed[plant_type] = true;
							return PLANT_COLORS[plant_type];
						}
					})

				// filter power plants accordingly and update other visualizations
				plants.filterPlantType(vis.is_displayed);
				updateAllVis("plant_type");
			});

		vis.bars
			.transition()
			.duration(DURATION_LENGTH)
			.attr("width", function(d) { 
				if(d.value < 0) { d.value = 0; } // corrects bug: d.value can be very small and negative (e.g. e-10)
				return vis.xScale(d.value); 
			});
	}

	this.resizeVis = function() {
		var vis = this;

		// resize based on width of container
		// http://eyeseast.github.io/visible-data/2013/08/28/responsive-charts-with-d3/
		vis.width = parseInt(d3.select('#plant-type').style('width'), 10) - vis.margin.left - vis.margin.right;
		vis.xScale
			.range([0, vis.width]);

		d3.select(vis.svg.node().parentNode) // svg element
	        .style('width', (vis.width + vis.margin.left + vis.margin.right) + 'px');

	    vis.xAxis = d3.svg.axis()
    		.scale(vis.xScale)
    		.orient("bottom")
    		.ticks(5);

  		vis.xAxisVisual
			.call(vis.xAxis);

		vis.bars
			.attr("width", function(d) { 
				if(d.value < 0) { d.value = 0; } // corrects bug: d.value can be very small and negative (e.g. e-10)
				return vis.xScale(d.value); 
			});
	}

}

// 1-dimensional scatterplot
// one line for each power plant
// power plant lines placed based on value (e.g. capacity, year built)
function PlantsDistributionChart(dimension) {
	this.initVis = function() {
		var vis = this;

		vis.dimension = dimension;

		// contains a count of power plants for each observed attribute value
		vis.dimension_vals = plants.getDimensionValues(dimension);

		// create svg area
		vis.margin = { top: 10, right: 20, bottom: 20, left: 20 };
		vis.width = parseInt(d3.select("#" + dimension).style('width'), 10) - vis.margin.left - vis.margin.right;
		vis.height = 60 - vis.margin.top - vis.margin.bottom;

		vis.svg = d3.select("#" + dimension).append("svg")
		    .attr("width", vis.width + vis.margin.left + vis.margin.right)
		    .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
			.append("g")
		    	.attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

		// create placeholder for the bars
		vis.barsVisual = vis.svg.append("g")
		    .attr("class", "bars")

		// create x scale and x axis
		var max_dimension_val = d3.max(vis.dimension_vals, function(d){
			return d.key;
		});

		var extent;
		if(dimension == "capacity") { extent = [0, max_dimension_val]; }
		else { extent = [1875, 2015]; }

		vis.xScale = d3.scale.linear()
			.domain(extent)
		    .range([0, vis.width])
		    .nice();

		vis.xAxis = d3.svg.axis()
	    	.orient("bottom");

		vis.xAxisVisual = vis.svg.append("g")
			.attr("class", "x-axis axis")
			.attr("transform", "translate(0," + vis.height + ")");

		// create brush component
		// http://bl.ocks.org/mbostock/4349545
		vis.brush = d3.svg.brush()
		    .x(vis.xScale)
		    .extent(vis.xScale.domain())
		    .on("brushstart", brushstart)
		    .on("brush", brushmove)
		    .on("brushend", brushend);

		vis.brushVisual = vis.svg.append("g")
		    .attr("class", "brush")
		    .call(vis.brush);

		vis.brushVisual.selectAll("rect")
        	.attr("height", vis.height);

		vis.brushVisual.selectAll(".resize")
        	.append("path")
        	.attr("d", function(d) {
				// style the brush resize handles
				// based on https://github.com/nyquist212/CMSMSPB
				// modified based on http://stackoverflow.com/a/32875327
				var e = +(d == "e");
				var x = e ? 1 : -1;
				var y = vis.height;

				return "M" + (.5 * x) + "," + 0 + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (0 + 6) + "V" + (y - 6) + "A6,6 0 0 " + e + " " + (.5 * x) + "," + y + "Z";
        	});

		function brushstart() {
			vis.svg.classed("selecting", true);
		}

		// update data based on changes in selected data
		function brushmove() {
			// filter power plants and update other visualizations accordingly
			var s = vis.brush.extent();
			plants.filterDimension(s, vis.dimension);
			updateAllVis(dimension);
		}

		function brushend() {
			vis.svg.classed("selecting", !d3.event.target.empty());
		}

		vis.updateVis();
	}

	this.updateVis = function() {
		var vis = this;

		// contains a count of power plants for each observed attribute value
		vis.dimension_vals = plants.getDimensionValues(dimension);

		if(vis.dimension == "capacity") {
			// get brush extent and max x value prior to updating the scales
			// used when updating the brush
			// also used when determining whether a plant stripe is within the brush range
			var old_brush_extent = vis.brush.extent();
			var old_x_max = vis.xScale.domain()[1];

			// update scale based on selected attribute
			vis.xScale
				.domain([0, d3.max(vis.dimension_vals, function(d){
					return (d.value > 0) * d.key; // assure that there is at least 1 plant at this attribute value
				})]);

			// update axis
			vis.xAxis
	    		.scale(vis.xScale);

	    	vis.setTicks();

	  		vis.xAxisVisual
				.transition()
				.duration(DURATION_LENGTH)
				.call(vis.xAxis);

			vis.updateBars();

			// update brush
			var range = old_brush_extent;
			range[1] = Math.min(vis.xScale.domain()[1], range[1]); // rightmost brush value should not be greater than max x-scale value

			if(old_brush_extent[1] == old_x_max){
				range[1] = vis.xScale.domain()[1]; // if rightmost brush value was at the max x value, then the rightmost brush value should be at the new max value 
			}

			vis.brush
			    .x(vis.xScale)
			    .extent(range);

	  		vis.brushVisual
				.transition()
				.duration(DURATION_LENGTH)
				.call(vis.brush);
		}
		else { // year_built_chart

			vis.xAxis
	    		.scale(vis.xScale)
	    		.tickFormat(d3.format("d"));

	    	vis.setTicks();

	  		vis.xAxisVisual
				.transition()
				.duration(DURATION_LENGTH)
				.call(vis.xAxis);

			vis.updateBars();

			vis.brush
			    .x(vis.xScale)
			    .extent(vis.brush.extent());

	  		vis.brushVisual
				.transition()
				.duration(DURATION_LENGTH)
				.call(vis.brush);
		}
	}

	this.updateBars = function() {
		var vis = this;

		// enter, update, exit bars
		vis.bars = vis.barsVisual.selectAll(".bar")
			.data(vis.dimension_vals, function(d) { return d.key; });

		vis.bars
			.enter()
			.append("rect")
			.attr("class", "bar")
			.attr("width", function() {
				if(vis.attribute == "capacity"){ return 1; }
				else { return 5; }
			})
			.attr("height", vis.height)
			.attr("fill", "gray")
			.attr("y", 0 );

		vis.bars
			.transition()
			.duration(DURATION_LENGTH)
			.attr("x", function(d) {
				return vis.xScale(d.key); 
			})
			.attr("opacity", function(d) {
				return Math.min(1, d.value * 1.0 / 20.0); // d.value is the number of plants with attribute value = d.key
			});

		vis.bars
			.exit()
			.remove();
	}

	this.resizeVis = function() {
		var vis = this;

		// resize based on width of container
		// http://eyeseast.github.io/visible-data/2013/08/28/responsive-charts-with-d3/
		vis.width = parseInt(d3.select('#' + vis.dimension).style('width'), 10) - vis.margin.left - vis.margin.right;
		vis.xScale
			.range([0, vis.width]);

		d3.select(vis.svg.node().parentNode) // svg element
	        .style('width', (vis.width + vis.margin.left + vis.margin.right) + 'px');

	    // redraw axis
	    vis.xAxis = d3.svg.axis()
    		.scale(vis.xScale)
    		.orient("bottom");

    	vis.setTicks();

  		vis.xAxisVisual
			.call(vis.xAxis);

		vis.bars
			.attr("x", function(d) {
				return vis.xScale(d.key); 
			});

		// update brush
		vis.brush
		    .x(vis.xScale)
		    .extent(vis.brush.extent());

  		vis.brushVisual
			.call(vis.brush);
	}

	// helper function for setting the appropriate number of x-axis ticks based on the width of the container
	this.setTicks = function() {
		var vis = this;

		var nTicks;
		if(vis.width < 500) {
			nTicks = 4;
		}
		else {
			nTicks = 10;
		}

		vis.xAxis
			.ticks(nTicks);
	}
}


// stacked area chart
// an area for each plant type
// values for each year
function YearChart() {
	this.initVis = function() {
		var vis = this;

		// contains plant attributes by year
		var data = plants.getAttributeByYearType();

		// create chart area
		var margin = {top: 20, right: 20, bottom: 30, left: 40};
    	vis.width = 450 - margin.left - margin.right;
    	vis.height = 50 - margin.top - margin.bottom;

		vis.svg = d3.select("#year-chart").append("svg")
			.attr("width", vis.width + margin.left + margin.right)
			.attr("height", vis.height + margin.top + margin.bottom)
			.append("g")
		    	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		// create x area
		vis.xScale = d3.scale.linear()
		    .domain([2009, 2014])
		    .range([0, vis.width])
		    .clamp(true);

		vis.yScale = d3.scale.linear()
			.range([vis.height, 0])

		vis.brush = d3.svg.brush()
		    .x(vis.xScale)
		    .extent([0, 0])
		    .on("brush", brushed)
		    .on("brushend", brushend);

		vis.svg.append("g")
		    .attr("class", "x axis")
		    .attr("transform", "translate(0," + vis.height / 2 + ")")
		    .call(d3.svg.axis()
				.scale(vis.xScale)
				.orient("bottom")
				.tickFormat(d3.format("d"))
				.tickSubdivide(0)
				.ticks(6 - 1)) // CHANGE THIS
			.select(".domain")
			.select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
				.attr("class", "halo");



		vis.slider = vis.svg.append("g")
			.attr("class", "slider")
			.call(vis.brush);

		vis.slider.selectAll(".extent,.resize")
			.remove();

		vis.handle = vis.slider.append("circle")
		    .attr("class", "handle")
		    .attr("transform", "translate(0," + vis.height / 2 + ")")
		    .attr("r", 9);

		vis.slider
			.call(vis.brush.event)
			.call(vis.brush.extent([70, 70]))
			.call(vis.brush.event);

		function brushed() {
			var year = vis.brush.extent()[0];

			if (d3.event.sourceEvent) { // not a programmatic event
				year = vis.xScale.invert(d3.mouse(this)[0]);

			}

			vis.handle
				.attr("cx", vis.xScale(year));
		}

		function brushend() {
			if (d3.event.sourceEvent) { // not a programmatic event
				var year = Math.round(vis.xScale.invert(d3.mouse(this)[0]));
				vis.brush.extent([year, year]);
				vis.handle
					.transition()
					.duration(DURATION_LENGTH / 2)
					.attr("cx", vis.xScale(year));

				plants.filterYear(year);
				updateAllVis("all");
			}
		}
	}

	this.updateVis = function() {
		var vis = this;
	}
}
