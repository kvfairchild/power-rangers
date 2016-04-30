// http://boundingbox.klokantech.com/
// long-lat pairs
// bottom left corner and top right corner of bounding box
var BOUNDING_BOXES = {
	"AL": [-88.4732,30.1941,-84.8882,35.0079],
	"AK": [-165.835171,54.113578,-142.547859,70.568625], // got this one from here: http://www.storybench.org/one-way-give-national-map-geographical-detail/
	"AZ": [-114.8166,31.3322,-109.0452,37.0043],
	"AR": [-94.6179,33.0041,-89.6448,36.4997],
	"CA": [-124.42,32.53,-114.13,42.01],
	"CO": [-109.0603,36.9924,-102.0409,41.0034],
	"CT": [-73.7278,40.987,-71.7872,42.0506],
	"DE": [-75.7891,38.451,-75.0487,39.8395],
	"DC": [-77.11974,38.803149,-76.909393,38.995548],
	"FL": [-87.6349,24.5211,-80.0311,31.001],
	"GA": [-85.6052,30.3556,-80.8408,35.0007],
	"HI": [-161.04,18.86,-154.76,22.92],
	"ID": [-117.24,41.99,-111.04,49.0],
	"IL": [-91.5131,36.9703,-87.4952,42.5083],
	"IN": [-88.0979,37.7717,-84.7847,41.7607],
	"IA": [-96.6395,40.3754,-90.1401,43.5012],
	"KS": [-102.0518,36.993,-94.5884,40.0045],
	"KY": [-89.5715,36.4971,-81.965,39.1475],
	"LA": [-94.0434,28.9254,-88.8162,33.0195],
	"ME": [-71.0843,42.9747,-66.9454,47.4597],
	"MD": [-79.4877,37.8895,-75.0492,39.723],
	"MA": [-73.5081,41.239,-69.9286,42.8868],
	"MI": [-90.42,41.7,-82.41,48.2],
	"MN": [-97.24,43.5,-89.49,49.38],
	"MS": [-91.653,30.1741,-88.0994,34.9961],
	"MO": [-95.7747,35.9957,-89.0995,40.6136],
	"MT": [-116.05,44.3582,-104.0396,49.0014],
	"NE": [-104.0535,39.9999,-95.3083,43.0017],
	"NV": [-120.01,35.0,-114.04,42.0],
	"NH": [-72.5572,42.697,-70.6027,45.3055],
	"NJ": [-75.5598,38.9286,-73.9024,41.3574],
	"NM": [-109.0502,31.3322,-103.002,37.0003],
	"NY": [-79.7624,40.4774,-71.7897,45.0159],
	"NC": [-84.3219,33.841,-75.46,36.5882],
	"ND": [-104.05,45.9351,-96.5545,49.0007],
	"OH": [-84.8203,38.4034,-80.5182,41.9773],
	"OK": [-103.0025,33.6158,-94.4307,37.0023],
	"OR": [-124.6129,41.9918,-116.4633,46.292],
	"PA": [-80.5199,39.7198,-74.6895,42.2694],
	"RI": [-71.8923,41.1467,-71.1205,42.0188],
	"SC": [-83.3533,32.0346,-78.5408,35.2155],
	"SD": [-104.0577,42.4797,-96.4366,45.9457],
	"TN": [-90.3103,34.9829,-81.6469,36.6781],
	"TX": [-106.65,25.84,-93.51,36.5],
	"UT": [-114.053,36.9979,-109.0411,42.0016],
	"VT": [-73.4306,42.7268,-71.465,45.0167],
	"VA": [-83.6754,36.5408,-75.2422,39.466],
	"WA": [-124.7857,45.5486,-116.9156,49.0024],
	"WV": [-82.6444,37.2015,-77.719,40.6388],
	"WI": [-92.8894,42.4919,-86.764,47.0807],
	"WY": [-111.0569,40.9947,-104.0522,45.0059],
	"all": [-126.3,24.21,-65.92,49.61]
};

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

		// create detail dot area
		vis.dot = d3.select("#plant-color").append("svg")
			.attr("width", "30px")
			.attr("height", "30px");

		// create a legend
	    vis.legend = d3.select("#legend").append("svg")
	        .attr("width", "200px")
	        .attr("height", "200px");

	    vis.plant_types = Object.keys(PLANT_COLORS);

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
		circles = vis.svg.selectAll(".plant")
			.data(allPlants, function(d) { return d["plant_id"]; });

		circles
			.enter()
			.append("circle")
			.attr("class", "plant")
	        .attr("fill", function(d) {return PLANT_COLORS[d["plant_type"]]})
	        .attr("opacity", 0.625)
	        .on("mouseover", function(d) {
				d3.select("#intro-div")
					.attr("hidden", true);
				d3.select("#tooltip-data")
					.attr("hidden", null);
				d3.select("#plant-color")
					.attr("hidden", null);
				d3.select(this)
					.attr("opacity", 1);

				// update plant detail dot
				vis.updateDetailDot(PLANT_COLORS[d["plant_type"]]);

	        	// update plant-specific information
				var plant = plants.getPlant(d["plant_id"]);
	            d3.select("#plant_name").html(plant["name"]);
				d3.select("#address").html(plant["address"]);
	            d3.select("#city_state").html(plant["city"] + ", " + d["state"]);
	            d3.select("#tech_type").html(plant["type"]);
				d3.select("#gen_commenced").html("Built in " + d["min_year_built"]);
	            d3.select("#inst_cap").html("<b>" + d3.format("0,000")(Math.round(d["capacity"] * 10) / 10) + "</b>" + " MW");

	            // create plant-specific chart
	            var data = plants.getUnfilteredPlants().filter(function(p){
					return d["plant_id"] == p["plant_id"] && p["generation"] != null && p["generation"] >= 0; // keep strings with length < 3
				});

	            detail_draw(data);
	        })

	        .on("mouseout", function(d) {
				d3.select("#intro-div")
					.attr("hidden", null);
				d3.select("#plant-color")
					.attr("hidden", true);
	        	d3.select(this)
					.attr("opacity", 0.75);

				// clear colored dot

				// clear plant-specific information
				d3.select("#plant_name").html("");
				d3.select("#address").html("");
	            d3.select("#city_state").html("");
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
	 	vis.updateLegend();
    }

	this.updateDetailDot = function(d) {
		var vis = this;

		// create circle
		vis.color_circle = vis.dot.selectAll("circle")
			.data([d]);

		vis.color_circle
			.enter()
			.append("circle")
			.attr("cx", 20)
			.attr("cy", 20)
			.attr("r", 10);

		vis.color_circle
			.attr("fill", function(d) { return d; });
	}

	this.updateLegend = function() {
		var vis = this;

		var amounts;
		var unit;
		if(vis.attribute == "capacity") {
			amounts = [2000, 500, 100];
			unit = "MW";
		}
		else if(vis.attribute == "generation") {
			amounts = [10, 5, 1];
			unit = "MM MWh"
		}
		else {
			amounts = [3, 1, .5];
			unit = "MM tons"
		}

	    // create circles for power plant sizes
	    var size_circles = vis.legend.selectAll(".size")
	        .data(amounts);

	    size_circles
	        .enter()
	        .append("circle")
	        .attr('class', 'size')
	        .attr("cx", 40)
	        .attr("cy", function(d, i){
	        	return 40 + i * 70;
	        })
	        .attr("fill", "#555");

	    size_circles
	    	.transition()
	    	.duration(DURATION_LENGTH)
	        .attr("r", function(d) { return vis.getCircleSize(d); });
	    
	    // create text for power plant sizes
	    var size_text = vis.legend.selectAll("text")
	        .data(amounts)
	    
	    size_text
		    .enter()
	        .append("text")
	        .attr("x", 90)
	        .attr("y", function(d, i){
	        	return 40 + i * 70;
	        });

		size_text
			.text(function(d) { return d3.format("0,000")(d) + " " + unit; });
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
			r = Math.sqrt(attr_val) / 4 * Math.pow(2, z);
		}

	    return r;
	}

	this.zoomToState = function(state) {
		var vis = this;

		var bounds = BOUNDING_BOXES[state];
		vis.map.fitBounds([
			[bounds[1], bounds[0]],
			[bounds[3], bounds[2]]
		]);
	}
}