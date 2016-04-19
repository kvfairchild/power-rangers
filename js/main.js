// ***************************************
// helpful constants

// duration of d3 transitions
var DURATION_LENGTH = 800;

// colors of the different types of plants
// http://colorbrewer2.org/?type=qualitative&scheme=Set1&n=8
var PLANT_COLORS = {
	"Coal": "#a65628", // "brown",
	"Gas": "#e41a1c", // "red",
	"Solar": "gold",
	"Other": "#ff7f00", // "orange",
	"Oil": "black",
	"Nuclear": "#984ea3", // "purple",
	"Hydro": "blue",
	"Wind": "green"
}

// opacity used for plant circles / bars / etc
var COLOR_OPACITY = 0.75;

// ***************************************
// core global variables
var plants;
var map;
var plant_type_chart;
var attribute_chart;
var year_chart;

// ***************************************
// load the data and initialize the visualiations
queue()
	// annual_data contains a record for each plant-year combination
	// plant_info contains a record for each plant and has info like name
	.defer(d3.json, "data/annual_data.json")
	.defer(d3.json, "data/plant_info.json")
	.await(function (error, annual_data, plant_info) {
    	plants = new PowerPlants(annual_data, plant_info);
    	plants.filterYear(2009);

    	map = new Map;
		map.initVis();

		plant_type_chart = new PlantTypeChart;
		plant_type_chart.initVis();

		attribute_chart = new AttributeChart;
		attribute_chart.initVis();

		year_chart = new YearChart;
		year_chart.initVis();
	});

// ***************************************
// update all visualizations when the data changes
// "chart" specifies which chart is causing the change (and thus shouldn't be updated)
function updateAllVis(chart) {
	if(chart != "capacity") { attribute_chart.updateVis(); }
	if(chart != "plant_type") { plant_type_chart.updateVis(); }
	if(chart != "map") { map.updateVis(); }
}

// ***************************************
// html element filters

$("#size-by").change(function() {
    // console.log(this.value);
});

/*
$("#selBalance").change(function() {
    console.log(this.value);
});
*/