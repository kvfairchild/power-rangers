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

	this.lat = this.annual_data.dimension(function (d) {
		return d.lat;
	});

	this.long = this.annual_data.dimension(function (d) {
		return d.long;
	});

	// create groups
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
	this.getCapacityByType = function() {
		return this.capacity_by_type.all();
	}

	this.getCapacityValues = function() {
		return this.capacities.all();
	}

	this.getAllPlants = function() {
		return this.capacity.top(Infinity);
	}

	this.getPlant = function(plant_id) {
		return plant_info[plant_id];
	}

	this.getUnfilteredPlants = function(plant_id) {
		return this.data;
	}

	// filter functions
	this.filterCapacity = function(extent) {
		this.capacity.filterRange(extent);
	}

	this.filterPlantType = function(is_displayed) {
		this.plant_type.filter(function(d){
			return is_displayed[d];
		});
	}

	this.filterYear = function(year) {
		this.year.filterExact(year);
	}

	this.filterLocation = function(lats, longs) {
		this.lat.filterRange(lats);
		this.long.filterRange(longs);
	}

/*
	dimensions.year.filterExact(2014);
	dimensions.plant_type.filterExact("Coal");
	console.log(dimensions.year.top(Infinity));
	dimensions.year.filter(2011);
*/
}