// controls filtering of the dataset
function PowerPlants(annual_data, plant_info) {
	var pp = this; // needed to reference "this" within certain scopes

	// **********************************
	// data
	this.data = annual_data;
	this.annual_data = crossfilter(annual_data.filter(function(p){
		return p["plant_type"] != null;
	}));
	this.plant_info = plant_info;

	// **********************************
	// helpful variables
	this.plant_types = Object.keys(PLANT_COLORS);
	this.attribute; // capacity, generation, or co2_emissions

	// **********************************
	// create dimensions
	this.year = this.annual_data.dimension(function (d) {
	    return d.year;
	});

	this.plant_type = this.annual_data.dimension(function (d) {
	    return d.plant_type;
	});

	this.capacity = this.annual_data.dimension(function (d) {
		return d.capacity;
	});

	this.lat = this.annual_data.dimension(function (d) {
		return d.lat; // latitude
	});

	this.long = this.annual_data.dimension(function (d) {
		return d.long; // longitude
	});

	this.state = this.annual_data.dimension(function (d) {
		return d.state; // state or District of Columbia
	});

	// **********************************
	// create groups

	// sum attributes by plant type
	this.attribute_total_by_type = this.plant_type.group().reduce(
		// https://github.com/square/crossfilter/wiki/API-Reference#group_reduce
		function(p, v) { // reduceAdd
			p["capacity"] += v["capacity"];
			p["generation"] += v["generation"];
			p["co2_emissions"] += v["co2_emissions"];
			return p;
		},
		function(p, v) { // reduceRemove
			p["capacity"] -= v["capacity"];
			p["generation"] -= v["generation"];
			p["co2_emissions"] -= v["co2_emissions"];
			return p;
		},
		function() { // reduceInitial
			return { "capacity": 0, "generation": 0, "co2_emissions": 0 };
		}
	);

	// sum capacity by plant type and year
	this.capacity_by_year_type = this.year.group().reduce(
		// http://stackoverflow.com/a/28014830
		function(p, v) {
			for(var i = 0; i < pp.plant_types.length; i++) {
				var type = pp.plant_types[i];
				p[type] += v["capacity"] * (v["plant_type"] == type);
			}
		    return p;
		},
		function(p, v) {
			for(var i = 0; i < pp.plant_types.length; i++) {
				var type = pp.plant_types[i];
				p[type] -= v["capacity"] * (v["plant_type"] == type);
			}
			return p;
		},
		function() {
			// array of plant_type: attribute_sum
			var cap_by_type = {};

			for(var i = 0; i < pp.plant_types.length; i++) {
				cap_by_type[pp.plant_types[i]] = 0;
			}

			return cap_by_type;
		}
	);

	this.capacities = this.capacity.group();

	// **********************************
	// set functions
	this.setAttribute = function(selected_attribute) {
		this.attribute = selected_attribute;
	}

	// **********************************
	// get functions

	this.getAttribute = function() {
		return this.attribute;
	}

	// get attribute total by fuel type
	this.getAttributeTotalByType = function() {
		var totals_by_type =  this.attribute_total_by_type.all();

		// filter out all null values
		console.log(totals_by_type);
		
		// reduce down to only the currently selected attribute
		var return_data = [];
		for(var i = 0; i < totals_by_type.length; i++) {
			var type = {"key": totals_by_type[i]["key"], "value": totals_by_type[i]["value"][pp.attribute]};
			return_data.push(type);
		}

		return return_data;
	}

	// get capacity by fuel type for each year
	this.getCapacityByYearType = function() {
		return this.capacity_by_year_type.all();
	}

	this.getAttributeByYearType = function() {
		return this.getCapacityByYearType();
	}

	// get count of power plants for each capacity value
	this.getCapacityValues = function() {
		return this.capacities.all();
	}

	// get all power plants, ordered by capacity
	this.getAllPlants = function() {
		return this.capacity.top(Infinity);
	}

	// get plant info for a particular power plant
	this.getPlant = function(plant_id) {
		return plant_info[plant_id];
	}

	// get annual_data without any filters applied
	this.getUnfilteredPlants = function(plant_id) {
		return this.data;
	}

	// **********************************
	// filter functions

	// filter plants by capacity range
	this.filterCapacity = function(extent) {
		this.capacity.filterRange(extent);
	}

	// filter plants by plant type
	this.filterPlantType = function(is_displayed) {
		this.plant_type.filter(function(d){
			return is_displayed[d];
		});
	}

	// filter annual_data by current year
	this.filterYear = function(year) {
		this.year.filterExact(year);
	}

	// filter annual_data by current map view
	this.filterLocation = function(lats, longs) {
		this.lat.filterRange(lats);
		this.long.filterRange(longs);
	}

	// filter by state of the US
	this.filterState = function(selected_state) {
		if(selected_state === "all") {
			this.state.filter(null); // clear filter
		}
		else {
			this.state.filterExact(selected_state);
		}
	}

}