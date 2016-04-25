// ***************************************
// helpful constants

// duration of d3 transitions
var DURATION_LENGTH = 800;

// colors of the different types of plants
// http://colorbrewer2.org/
var PLANT_COLORS = {
	"Coal": "#23527c", // "dk blue",
	"Gas": "#b2df8a", // "lt green",
	"Solar": "#ffff99", // "lt yellow",
	"Other": "#e31a1c", // "red",
	"Oil": "#ff7f00", // "orange",
	"Nuclear": "#fb9a99", // "pink",
	"Hydro": "#a6cee3", // "lt blue",
	"Wind": "darkgreen" // "dk green"
}

// used for setting axis labels
var ATTRIBUTE_LABELS = {
	"capacity": "capacity in MW",
	"generation": "generation in millions of MWh",
	"co2_emissions": "carbon dioxide emissions in thousands of short tons"
};

// opacity used for plant circles / bars / etc
var COLOR_OPACITY = 0.75;

// ***************************************
// core global variables
var plants;
var map;
var plant_type_chart;
var capacity_chart;
var year_chart;
var year_built_chart;
var area_chart;


// ***************************************
// preloader

$(document).ready(function(){

	// calculate height
	var screen_ht = $(window).height();
	var preloader_ht = 5;
	var padding =(screen_ht/2)-preloader_ht;

	$("#preloader").css("padding-top",padding+"px");

});

// ***************************************
// load the data and initialize the visualiations
queue()
	// annual_data contains a record for each plant-year combination
	// plant_info contains a record for each plant and has info like name, address, etc.
	.defer(d3.json, "data/annual_data.json")
	.defer(d3.json, "data/plant_info.json")
	.await(function (error, annual_data, plant_info) {
    	plants = new PowerPlants(annual_data, plant_info);
    	
    	// set initial filters based on html selections
    	plants.filterYear(2009); // PUT THIS IN YEARCHART CLASS

    	var e = document.getElementById("selState");
		plants.filterState(e.options[e.selectedIndex].value);

		var e = document.getElementById("sizeBy");
		var attribute = e.options[e.selectedIndex].value;
		plants.setAttribute(attribute);

		// set initial axis label for attribute total by plant type chart
		d3.select("#plant-type-label")
    		.html(ATTRIBUTE_LABELS[attribute])

    	// the map must be the first visualization created because its initial bounds will filter the other dimensions
    	map = new Map;
		map.initVis();

		plant_type_chart = new PlantTypeChart;
		plant_type_chart.initVis();

		capacity_chart = new PlantsDistributionChart("capacity");
		capacity_chart.initVis();

		year_built_chart = new PlantsDistributionChart("year_built");
		year_built_chart.initVis();

		year_chart = new YearChart;
		year_chart.initVis();

		area_chart = new StackedAreaChart();
		area_chart.initVis();

	});

// ***************************************
// allow visualizations to be updated and resized

// update all visualizations when the data changes
// "chart" specifies which chart is causing the change (and thus shouldn't be updated)
function updateAllVis(chart) {
	if(chart != "capacity") { capacity_chart.updateVis(); }
	if(chart != "year_built") { year_built_chart.updateVis(); }
	if(chart != "plant_type") { plant_type_chart.updateVis(); }
	if(chart != "map") { map.updateVis(); }
	if(chart != "area_chart") { area_chart.updateVis(); }
}

// resize all visualizations when the window is resized
function resizeAllVis() {
	plant_type_chart.resizeVis();
	capacity_chart.resizeVis();
	year_built_chart.resizeVis();
}

d3.select(window).on('resize', resizeAllVis); 

// ***************************************
// html element filters

$("#sizeBy").change(function() {
	// update axis label for attribute total by plant type chart
    d3.select("#plant-type-label")
    	.style({background: "yellow"})
    	.html(ATTRIBUTE_LABELS[this.value])
    	.transition()
    	.duration(DURATION_LENGTH * 2)
    	.style({background: "#fff"});

    // update visualizations
    plants.setAttribute(this.value);
    updateAllVis("all");
});

$("#selState").change(function() {
    plants.filterState(this.value);
    updateAllVis("all");
});
