function Map() {

	this.initVis = function() {
		var vis = this;

		// create Leaflet map
		vis.map = L.map('map').setView([37.0902, -95.7129], 4);
		L.tileLayer(
		    'http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png',
		    {
		        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
		        //minZoom: 5,
		        zoom: 6,
		    }).addTo(vis.map);

		// create svg to attach d3 to
		vis.map._initPathRoot() // initializes the SVG layer
		vis.svg = d3.select("#map").select("svg")
			.append("g");

		// update circles based on map view
		function update() {
			var bounds = vis.map.getBounds();
			plants.filterLocation([bounds._southWest.lat, bounds._northEast.lat], [bounds._southWest.lng, bounds._northEast.lng]); // filter power plants based on new map view

			updateAllVis("all"); // update all visualizations
		}
		vis.map.on("moveend", update); // used moveend instead of move to minimize the number of times filtering the data

		// filter dataset based on which plants are in the current view
		var bounds = vis.map.getBounds();
		plants.filterLocation([bounds._southWest.lat, bounds._northEast.lat], [bounds._southWest.lng, bounds._northEast.lng]);

		// create a legend
		vis.createLegend();

		// update the power plants and the legend
		vis.updateVis();
	}

	this.updateVis = function() {
		var vis = this;

		// get all plants with lat/long values, exclude all others
		// http://stackoverflow.com/questions/21216347/achieving-animated-zoom-with-d3-and-leaflet
		var allPlants = plants.getAllPlants().filter(function(p){
			return p.lat != null && p.long != null;
		});

		// set Leaflet LatLng value to use when setting position
		allPlants.forEach(function(d) {
			d.LatLng = new L.LatLng(d.lat, d.long);
		});

		// enter/update/exit power plants on map
		var circles = vis.svg.selectAll(".plant")
			.data(allPlants, function(d) { return d.plant_id; });

		circles
			.enter()
			.append("circle")
			.attr("class", "plant")
	        .attr("fill", function(d) { return PLANT_COLORS[d.plant_type]})
	        .attr("opacity", 0.625)
	        .on("mouseover", function(d) {
	        	d3.select(this)
					.attr("opacity", 1);

	        	// update plant-specific information
				var plant = plants.getPlant(d.plant_id);
	            d3.select("#plant_name").html(plant.name);
	            d3.select("#addr_info").html(plant.city + ", " + plant.state);
	            d3.select("#tech_type").html(d.plant_type);
	            d3.select("#inst_cap").html(d3.format("0,000")(Math.round(d.capacity * 10) / 10) + " MW");
	            d3.select("#gen_commenced").html("50");

	            // create plant-specific chart
	            var data = plants.getUnfilteredPlants().filter(function(p){
					return d.plant_id == p.plant_id; // keep strings with length < 3
				});
	            detail_draw(data);
	        })
	        .on("mouseout", function(d) {
	        	d3.select(this)
					.attr("opacity", 0.75);

				// clear plant-specific information
				d3.select("#plant_name").html("");
	            d3.select("#addr_info").html("");
	            d3.select("#tech_type").html("");
	            d3.select("#inst_cap").html("");
	            d3.select("#gen_commenced").html("");
	            d3.select("#tooltip-chart").html("");
	        });

	    // remove power plants that have been filtered out
	    circles
	    	.exit()
	    	.remove();

	    // set/update circle positions and sizes based on the map view
	    
		circles
	        .attr("cx", function(d) { return vis.map.latLngToLayerPoint(d.LatLng).x })
	        .attr("cy", function(d) { return vis.map.latLngToLayerPoint(d.LatLng).y }) 
	        .attr("r", function(d) { 
				if(d.LatLng == null) { console.log(d.plant_id); }
				return vis.getCircleSize(d.capacity); });
		
	    // update legend
	    vis.updateLegend();
    }

    this.createLegend = function() {
    	var vis = this;

    	// create legend area
	    vis.legend = d3.select("#legend").append("svg")
	        .attr("width", "1100px")
	        .attr("height", "80px");

	    vis.plant_types = Object.keys(PLANT_COLORS);
	}

	this.updateLegend = function() {
		var vis = this;

	    // create colored circles for power plant types
	    var type_circles = vis.legend.selectAll("circle")
	        .data(vis.plant_types);

	    type_circles
	        .enter()
	        .append("circle")
	        .attr("cx", function(d,i) {
	            return i * 80 + 30;
	        })
	        .attr("cy", function(d,i) {
	            return 40;
	        })
	        .attr("r", 10)
	        .attr("fill", function(d) {
	        	return PLANT_COLORS[d]; });

	    // create text for power plant types
	    var type_text = vis.legend.selectAll("text")
	        .data(vis.plant_types);

	    type_text
	        .enter()
	        .append("text")
	        .attr("x",function(d,i) {
	            return i * 80 + 50;
	        })
	        .attr("y", function(d,i) {
	            return 40;
	        })
	        .text(function(d) { return d; });

	    // create circles for power plant sizes
	    var size_circles = vis.legend.selectAll(".size")
	        .data([1000, 100, 10]);

	    size_circles
	        .enter()
	        .append("circle")
	        .attr('class', 'size')
	        .attr("cx", function(d, i){
	        	return (100 * 7 + 50) + 100 + i * 100;
	        })
	        .attr("cy", 40);

	    size_circles
	        .attr("r", function(d) { return vis.getCircleSize(d); });
	    
	    // create text for power plant sizes
	    var size_text = vis.legend.selectAll(".size-text")
	        .data([1000, 100, 10])
	        .enter()
	        .append("text")
	        .attr('class', 'size-text')
	        .attr("x", function(d, i){
	        	return (100 * 7 + 50) + 100 + i * 100;
	        })
	        .attr("y", 60)
	        .text(function(d) { return d3.format("0,000")(d) + ' MW'; });
	}

	// helper function for calculating the size of a circle based on capacity and map zoom level
	this.getCircleSize = function(capacity) {
		var vis = this;

		var z = Math.min(6, vis.map.getZoom()); // cut off circle size alteration at zoom = 6
	    var r = Math.sqrt(capacity) / 80 * Math.pow(2, z);
	    return r;
	}
}