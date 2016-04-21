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
		var margin = {top: 20, right: 20, bottom: 30, left: 40};
    	vis.width = 450 - margin.left - margin.right;
    	vis.height = 300 - margin.top - margin.bottom;

		vis.svg = d3.select("#plant-type").append("svg")
			.attr("width", vis.width + margin.left + margin.right)
			.attr("height", vis.height + margin.top + margin.bottom)
			.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		// tooltip
		vis.tip = d3.tip()
			.attr('class', 'd3-tip')
			.offset([-10, 0])
			.html(function(d) {
				return d.value;
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
		var capacity_by_type = plants.getCapacityByType();

		// update scale and axis based on capacity
		vis.xScale
			.domain([0, d3.max(capacity_by_type, function(d) { return d.value; })]) // CHANGE
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
		var bars = vis.svg.selectAll(".bar")
			.data(capacity_by_type, function(d) { return d.key; }); // keep track of data based on plant type

		bars
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
					.attr("opacity", COLOR_OPACITY)
					.style({ cursor: "pointer" });
				// vis.tip.show(d);
			})
			.on("mouseout", function(d) {
				d3.select(this)
					.attr("opacity", COLOR_OPACITY + 0.25)
					.style({ cursor: "auto" });
				// vis.tip.hide(d);
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

		bars
			.transition()
			.duration(DURATION_LENGTH)
			.attr("width", function(d) { 
				if(d.value < 0) { d.value = 0; } // corrects bug: d.value can be very small and negative (e.g. e-10)
				return vis.xScale(d.value); 
			});

	}
}

// 1-dimensional scatterplot
// one line for each power plant
// power plant lines placed based on capacity value
function AttributeChart() {
	this.initVis = function() {
		var vis = this;

		// contains a count of power plants for each observed attribute value
		var capacities = plants.getCapacityValues();

		// create svg area
		var margin = { top: 10, right: 50, bottom: 20, left: 70 };
		vis.width = 450 - margin.left - margin.right,
		vis.height = 100 - margin.top - margin.bottom;

		vis.svg = d3.select("#capacity").append("svg")
		    .attr("width", vis.width + margin.left + margin.right)
		    .attr("height", vis.height + margin.top + margin.bottom)
			.append("g")
		    	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		// create placeholder for the bars
		vis.barsVisual = vis.svg.append("g")
		    .attr("class", "bars")

		// create x scale and x axis
		var max_capacity = d3.max(capacities, function(d){
			return d.key;
		});

		vis.xScale = d3.scale.linear()
			.domain([0, max_capacity])
		    .range([0, vis.width])
		    .nice();

		vis.xAxisVisual = vis.svg.append("g")
			.attr("class", "x-axis axis")
			.attr("transform", "translate(0," + vis.height + ")");

		// create brush component
		// http://bl.ocks.org/mbostock/4349545
		vis.brush = d3.svg.brush()
		    .x(vis.xScale)
		    .extent([0, vis.xScale.domain()[1]])
		    .on("brushstart", brushstart)
		    .on("brush", brushmove)
		    .on("brushend", brushend);

		var arc = d3.svg.arc()
		    .outerRadius(vis.height / 2)
		    .startAngle(0)
		    .endAngle(function(d, i) { return i ? -Math.PI : Math.PI; });

		vis.brushVisual = vis.svg.append("g")
		    .attr("class", "brush")
		    .call(vis.brush);

		vis.brushVisual.selectAll(".resize").append("path")
		    .attr("transform", "translate(0," +  vis.height / 2 + ")")
		    .attr("d", arc);

		vis.brushVisual.selectAll("rect")
		    .attr("height", vis.height); 

		brushstart();
		brushmove();

		function brushstart() {
			vis.svg.classed("selecting", true);
		}

		// update data based on changes in selected data
		function brushmove() {
			var s = vis.brush.extent();

			// allows updating color of bars that are selected
			vis.svg.selectAll("rect.bar")
				.classed("selected", function(d) {
					return s[0] <= d.key && d.key <= s[1]; 
				});

			// filter power plants and update other visualizatoins accordingly
			plants.filterCapacity(s);
			updateAllVis("capacity");
		}

		function brushend() {
			vis.svg.classed("selecting", !d3.event.target.empty());
		}

		vis.updateVis()
	}

	this.updateVis = function() {
		var vis = this;

		// contains a count of power plants for each observed attribute value
		var capacities = plants.getCapacityValues();

		// get brush extent and max x value prior to updating the scales
		// used when updating the brush
		// also used when determining whether a plant stripe is within the brush range
		var old_brush_extent = vis.brush.extent();
		var old_x_max = vis.xScale.domain()[1];

		// update scale based on selected attribute
		vis.xScale
			.domain([0, d3.max(capacities, function(d){
				return (d.value > 0) * d.key; // assure that there is at least 1 plant at this attribute value
			})])
			.nice();

		// update axis
		vis.xAxis = d3.svg.axis()
    		.scale(vis.xScale)
    		.orient("bottom")
    		.ticks(5);

  		vis.xAxisVisual
			.transition()
			.duration(DURATION_LENGTH)
			.call(vis.xAxis);

		// enter, update, exit bars
		vis.bars = vis.barsVisual.selectAll(".bar")
			.data(capacities, function(d) { return d.key; });

		vis.bars
			.enter()
			.append("rect")
			.attr("class", "bar")
			.attr("width", 1)
			.attr("height", vis.height)
			.attr("fill", "gray")
			.classed("selected", function(d) { // currently selected by the brush
				return old_brush_extent[0] <= d.key && d.key <= old_brush_extent[1]; 
			})
			.attr("y", 0 );

		vis.bars
			.transition()
			.duration(DURATION_LENGTH)
			.attr("x", function(d) {
				return vis.xScale(d.key); 
			})
			.attr("opacity", function(d) {
				return Math.min(1, d.value * 1.0 / 10.0); // d.value is the number of plants with attribute value = d.key
			});

		vis.bars
			.exit()
			.remove();

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
}

// stacked area chart
// an area for each plant type
// values for each year
function YearChart() {
	this.initVis = function() {
		var vis = this;

		// http://bl.ocks.org/mbostock/6452972

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