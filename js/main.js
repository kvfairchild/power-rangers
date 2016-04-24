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

    	// the map must be the first visualizaiton created because its initial bounds will filter the other dimensions
    	map = new Map;
		map.initVis();

		plant_type_chart = new PlantTypeChart;
		plant_type_chart.initVis();

		capacity_chart = new PlantsDistributionChart;
		capacity_chart.initVis();

		year_chart = new YearChart;
		year_chart.initVis();
	});

// ***************************************
// allow visualizations to be updated and resized

// update all visualizations when the data changes
// "chart" specifies which chart is causing the change (and thus shouldn't be updated)
function updateAllVis(chart) {
	if(chart != "capacity") { capacity_chart.updateVis(); }
	if(chart != "plant_type") { plant_type_chart.updateVis(); }
	if(chart != "map") { map.updateVis(); }
}

// resize all visualizations when the window is resized
function resizeAllVis() {
	plant_type_chart.resizeVis();
	capacity_chart.resizeVis();
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
