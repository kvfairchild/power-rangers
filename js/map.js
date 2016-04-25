function Map() {

	this.initVis = function() {
		var vis = this;

		// create Leaflet map
		vis.map = L.map('map').setView([37.0902, -95.7129], 4);
		L.tileLayer(
			'http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
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

		// filter dataset based on which plants are in the initial view
		var bounds = vis.map.getBounds();
		plants.filterLocation([bounds._southWest.lat, bounds._northEast.lat], [bounds._southWest.lng, bounds._northEast.lng]);

		// create a legend
		/* vis.createLegend(); */

		// update the power plants and the legend
		vis.updateVis();
	}

	this.updateVis = function(attribute_change) {
		var vis = this;

		// get attribute to use for sizing circles
		vis.attribute = plants.getAttribute();

		// get all plants with lat/long values, exclude all others
		// http://stackoverflow.com/questions/21216347/achieving-animated-zoom-with-d3-and-leaflet
		var allPlants = plants.getAllPlants().filter(function(p){
			return p["lat"] != null && p["long"] != null && p[vis.attribute] > 0;
		});

		// set Leaflet LatLng value to use when setting position
		allPlants.forEach(function(d) {
			d.LatLng = new L.LatLng(d.lat, d.long);
		});

		// enter/update/exit power plants on map
		var circles = vis.svg.selectAll(".plant")
			.data(allPlants, function(d) { return d["plant_id"]; });

		circles
			.enter()
			.append("circle")
			.attr("class", "plant")
	        .attr("fill", function(d) { return PLANT_COLORS[d["plant_type"]]})
	        .attr("opacity", 0.625)
	        .on("mouseover", function(d) {
				d3.select("#intro-div")
					.attr("hidden", true);
				d3.select("#details-table")
					.attr("hidden", null);
	        	d3.select(this)
					.attr("opacity", 1);

	        	// update plant-specific information
				var plant = plants.getPlant(d["plant_id"]);
	            d3.select("#plant_name").html(plant["name"]);
	            d3.select("#addr_info").html(plant["city"] + ", " + d["state"]);
	            d3.select("#tech_type").html(d["plant_type"]);
	            d3.select("#inst_cap").html(d3.format("0,000")(Math.round(d["capacity"] * 10) / 10) + " MW");

	            // create plant-specific chart
	            var data = plants.getUnfilteredPlants().filter(function(p){
					return d["plant_id"] == p["plant_id"] && p["generation"] != null && p["generation"] >= 0; // keep strings with length < 3
				});

	            detail_draw(data);
	        })

	        .on("mouseout", function(d) {
				d3.select("#intro-div")
					.attr("hidden", null);
				d3.select("#details-table")
					.attr("hidden", true);
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
	        .attr("cy", function(d) { return vis.map.latLngToLayerPoint(d.LatLng).y });

	    if(attribute_change) {
	    	circles
		        .transition()
		        .duration(DURATION_LENGTH)
		        .attr("r", function(d) { return vis.getCircleSize(d[vis.attribute]); });
	    }
	    else {
	    	circles
		        .attr("r", function(d) { return vis.getCircleSize(d[vis.attribute]); });
	    }
		
	    // update legend
	 /*   vis.updateLegend(); */
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

	    // create circles for power plant sizes
	    var size_circles = vis.legend.selectAll(".size")
	        .data([1000, 100, 10]);

	    size_circles
	        .enter()
	        .append("circle")
	        .attr('class', 'size')
	        .attr("cx", function(d, i){
	        	return 100 + i * 100;
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
	        	return 100 + i * 100;
	        })
	        .attr("y", 60)
	        .text(function(d) { return d3.format("0,000")(d) + ' MW'; });
	}

	// helper function for calculating the size of a circle based on attribute value and map zoom level
	this.getCircleSize = function(attr_val) {
		var vis = this;

		var z = Math.min(6, vis.map.getZoom()); // cut off circle size alteration at zoom = 6

		var r;
		if(vis.attribute == "capacity") {
			r = Math.sqrt(attr_val) / 80 * Math.pow(2, z);
		}
		else if(vis.attribute == "generation") {
			r = Math.sqrt(attr_val) / 5 * Math.pow(2, z);
		}
		else if(vis.attribute == "co2_emissions") {
			r = Math.sqrt(attr_val) / 80 * Math.pow(2, z);
		}

	    return r;
	}
}