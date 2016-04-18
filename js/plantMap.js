$(document).ready(function(){

    var chkYear = true;
    var selSizeBy = "capacity";
    var selBalance = "all";

    var selYear = "2009";
    var ranCapac = [0, 800];
    var chkTypeCoal = true;
    var chkTypeNaturalGas = true;
    var chkTypeWind = true;
    var chkTypeSolar = true;
    var chkTypeNuclear = true;


// Sliders

    $("#range_02").ionRangeSlider({
        grid: true,
        min: 1,
        max: 5,
        step: 1,
        values: [2009, 2010, 2011, 2012, 2013, 2014]
    });

    $("#range_03").ionRangeSlider({
        type: "double",
        grid: true,
        min: 0,
        max: 2000,
        from: 0,
        to: 800,
        onFinish: function (data) {
            ranCapac = [data.from, data.to];
            dataLoading();
        }
    });

    $("#selSizeBy").change(function() {
        selSizeBy = this.value;
    });
    $("#selBalance").change(function() {
        selBalance = this.value;
    });

    $("#chkYear").change(function() {
        chkYear = this.value;
    });

    $("#range_02").change(function() {
        selYear = this.value;
        dataLoading();
    });

    $('#chkTypeCoal').change(function() {
        chkTypeCoal = this.checked;
        dataLoading();
    });

    $('#chkTypeNaturalGas').change(function() {
        chkTypeNaturalGas = this.checked;
        dataLoading();
    });

    $('#chkTypeWind').change(function() {
        chkTypeWind = this.checked;
        dataLoading();
    });

    $('#chkTypeSolar').change(function() {
        chkTypeSolar = this.checked;
        dataLoading();
    });

    $('#chkTypeNuclear').change(function() {
        chkTypeNuclear = this.checked;
        dataLoading();
    });

// Create map

    var mapZoom = 6;
    var map = L.map('map').setView([37.0902, -95.7129], 4);
    mapLink = '<a href="http://openstreetmap.org">OpenStreetMap</a>';
    L.tileLayer(
        'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
            attribution: '&copy; ' + mapLink + ' Contributors',
            zoom: mapZoom,
            maxZoom: 13,
        }).addTo(map);

    /* Initialize the SVG layer */
    map._initPathRoot()

    var colourScale = d3.scale.category20();

    /* We simply pick up the SVG from the map object */
    var svg , g;
    var arr = [];

    function dataLoading(){
        //d3.select("svg").remove();
        d3.select("svg").selectAll("*").remove();
        d3.select("#legend-svg-holder").selectAll("*").remove();

        svg = d3.select("#map").select("svg");
        g = svg.append("g");

        d3.json("data/plants-2.0.0.json", function(json) {
            arr = $.map(json, function(el) { return el });
            var objects = [];

            for (var i = 0; i < arr.length; i++) {
                if(arr[i].hasOwnProperty("annual_data"))
                {
                    if(arr[i].long != null && arr[i].lat != null)
                    {

                        var annual_data = arr[i].annual_data;
                        if(annual_data.hasOwnProperty(selYear))
                        {
                            if(+annual_data[selYear].capacity > +ranCapac[0] && +annual_data[selYear].capacity < +ranCapac[1])
                            {
                                var circle = {
                                    "circle":{
                                        "coordinates":[arr[i].lat, arr[i].long],
                                        "plant_type": annual_data[selYear].plant_type,
                                        "generation":annual_data[selYear].generation,
                                        "capacity":annual_data[selYear].capacity,
                                        "year":selYear,
                                        "type":arr[i].type,
                                        "name":arr[i].name,
                                        "addr_info":arr[i].address + ", " + arr[i].county + " " + arr[i].city,
                                        "indexOf":i
                                    }
                                };
                                if(chkTypeCoal && annual_data[selYear].plant_type == "Coal")
                                {
                                    objects.push(circle);
                                }
                                if(chkTypeNaturalGas && annual_data[selYear].plant_type == "Gas")
                                {
                                    objects.push(circle);
                                }
                                if(chkTypeSolar && annual_data[selYear].plant_type == "Solar")
                                {
                                    objects.push(circle);
                                }
                                if(chkTypeWind && annual_data[selYear].plant_type == "Wind")
                                {
                                    objects.push(circle);
                                }
                                if(chkTypeNuclear && annual_data[selYear].plant_type == "Nuclear")
                                {
                                    objects.push(circle);
                                }

                            }
                        }
                    }
                }
            }

            updateGraph(objects);
        });
    }

    function updateGraph(objects)
    {

        var persistGentypeSelection = false, persistedGentype;
        var collection = {"objects":objects};

        collection.objects.forEach(function(d) {
            d.LatLng = new L.LatLng(d.circle.coordinates[0], d.circle.coordinates[1])
        })

        var feature = g.selectAll("circle")
            .data(collection.objects);
            feature.enter().append("circle")
            .attr("r", function(d) {
                var r = (+d.circle.generation)/(+d.circle.capacity);
                r = Math.sqrt(r) * mapZoom/4.5
                if(r < 3) r = 3;

                return r;
            })
            /*.attr("r", function(d) {
             var r = (+d.circle.generation)/(+d.circle.capacity);
             if( r > 20) r = 20;
             console.log(r);
             return r;
             })*/
            .style("fill", function(d) {return colourScale(d.circle.plant_type)})
            .attr("class", function(d) {return "point point-" + colourScale.domain().indexOf(d.circle.plant_type)})
            //.sort(function(a, b) { return b.properties["ICE"] - a.properties["ICE"]; })
            .on("mouseover", function(d) {
                d3.select("#plant_name").html(d.circle.name);
                d3.select("#addr_info").html(d.circle.addr_info);
                d3.select("#tech_type").html(d.circle.type);
                d3.select("#inst_cap").html(d.circle.capacity + " MW");
                d3.select("#gen_commenced").html(d.circle.year + ": " + d.circle.generation);

                var detail_obj = arr[d.circle.indexOf].annual_data;
                var key_arr = Object.keys(detail_obj);
                detail_obj = $.map(detail_obj, function(el) { return el });
                var dataset = [];
                for(var i = 0; i < key_arr.length; i++)
                {
                    var obj = {x: i, year:key_arr[i], y:detail_obj[0].capacity};
                    dataset.push(obj);

                }
                detail_draw(dataset);
            });

        // Create map legend

        var legendSvg = d3.select("#legend-svg-holder").append("svg")
            .attr("width", "400px")
            .attr("height", "90px");
        legendSvg.selectAll("rect")
            .data(colourScale.domain())
            .enter()
            .append("rect")
            .attr("x", function(d,i) {
                if( i > 3)
                    return 95;
                else
                    return 15;
            })
            .attr("y", function(d,i) {
                if( i > 3)
                    return (i - 4) * 20 + 2;
                else
                    return i * 20 + 2
            })
            .attr("width", '78px')
            .attr("height", '20px')
            .attr("fill", 'white')
            .attr("stroke", 'none')
            .on("mouseover", function(d) {
                if (!persistGentypeSelection) {
                    d3.select(this).style('fill', '#e8e8e8');
                    feature
                        .classed("inactive",function(p) {
                            return d != p.circle.plant_type
                        });
                }
            })
            .on("click", function(d) {

                if (!persistGentypeSelection || persistedGentype != d) {
                    // persist the selected gen type
                    persistGentypeSelection = true;
                    persistedGentype = d;
                    legendSvg.selectAll("rect")
                        .style('fill', 'white');
                    d3.select(this).style('fill', '#ddd');
                    feature
                        .classed("inactive",function(p) {
                            return d != p.circle.plant_type
                        });
                } else {
                    // show all gen types
                    persistGentypeSelection = false;
                    d3.select(this)
                        .style('fill', 'white');
                    feature
                        .classed("inactive",false);
                }
            })
            .on("mouseout", function(d) {
                if (!persistGentypeSelection) {
                    d3.select(this).style('fill', 'white');
                    feature.classed("inactive",false);
                }
            });
        legendSvg.selectAll("circle")
            .data(colourScale.domain())
            .enter()
            .append("circle")
            .attr("cx", function(d,i) {
                if( i > 3)
                    return 110;
                else
                    return 30;
            })
            .attr("cy", function(d,i) {
                if( i > 3)
                    return (i - 4) * 20 + 12;
                else
                    return i * 20 + 12
            })
            .attr("r", 7)
            .attr("fill", function(d) {return colourScale(d)})
            .attr('pointer-events', 'none');
        legendSvg.selectAll("text")
            .data(colourScale.domain())
            .enter()
            .append("text")
            .attr("x",function(d,i) {
                if( i > 3)
                    return 125;
                else
                    return 45;
            })
            .attr("y", function(d,i) {
                if( i > 3)
                    return (i - 4) * 20 + 15;
                else
                    return i * 20 + 15
            })
            .text(function(d) {return d})
            .attr('pointer-events', 'none');
        var legendSizeCircle = legendSvg.selectAll(".size-circle")
            .data([100, 50, 10])
            .enter()
            .append("circle")
            .attr('class', 'size-circle')
            .attr("cx", 245)
            .attr("cy", function(d, i) { return [20, 50, 75][i] })
            .attr("r", function(d) {return Math.sqrt(d) * mapZoom/4.5});
        var legendSizeText = legendSvg.selectAll(".size-text")
            .data([100, 50, 10])
            .enter()
            .append("text")
            .attr('class', 'size-text')
            .attr("x", 280)
            .attr("y", function(d, i) { return [20, 50, 75][i] + 5})
            .text(function(d) {return d/4 + ' million MWh'});

        map.on("viewreset", update);
        update();

        function update() {
            feature.attr("transform",
                function(d) {
                    return "translate("+
                        map.latLngToLayerPoint(d.LatLng).x +","+
                        map.latLngToLayerPoint(d.LatLng).y +")";
                }
            )
        }

    }

    dataLoading();

});