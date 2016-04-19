// controls filtering of the dataset
function PowerPlants(annual_data, plant_info) {
	this.data = annual_data;
	this.annual_data = crossfilter(annual_data);
	this.plant_info = plant_info;

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

	// latitude
	this.lat = this.annual_data.dimension(function (d) {
		return d.lat;
	});

	// longitude
	this.long = this.annual_data.dimension(function (d) {
		return d.long;
	});

	// create groups

	// sum capacity by plant type
	this.capacity_by_type = this.plant_type.group().reduce(
		// https://github.com/square/crossfilter/wiki/API-Reference#group_reduce
		function(p, v) {
			return p + v["capacity"];
		},
		function(p, v) {
			return p - v["capacity"];
		},
		function() { // reduceInitial
			return 0;
		}
	);

	this.capacities = this.capacity.group();

	// return functions

	// get capacity by fuel type
	this.getCapacityByType = function() {
		return this.capacity_by_type.all();
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

}