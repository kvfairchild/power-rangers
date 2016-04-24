function detail_draw(datas)
{

    d3.select("#tooltip-chart").selectAll("*").remove();

    var detail_m = {top: 10, right: 50, bottom: 60, left: 150},
        detail_w = $("#tooltip-chart").width() - detail_m.left - detail_m.right,
        detail_h = 200 - detail_m.top - detail_m.bottom;

    var detail_xScale = d3.scale.linear()
        .domain(d3.extent(datas, function(d){ return d.year; }))
        .range([0, detail_w])
        .nice();

    var detail_yScale = d3.scale.linear()
        .domain([0, d3.max(datas, function(d){ return d.generation; })])
        .range([detail_h, 0]);

    var detail_xAxis = d3.svg.axis()
        .scale(detail_xScale)
        .orient("bottom")
        .innerTickSize(-detail_h)
        .outerTickSize(5)
        .tickPadding(10)
        .tickFormat(d3.format("d"));

    var detail_yAxis = d3.svg.axis()
        .scale(detail_yScale)
        .orient("left")
        .innerTickSize(-detail_w)
        .outerTickSize(0)
        .tickPadding(10);

    var detail_line = d3.svg.line()
        .x(function(d) { return detail_xScale(d.year); })
        .y(function(d) { return detail_yScale(d.generation); });

    var svgDetail = d3.select("#tooltip-chart").append("svg")
        .attr("width", detail_w + detail_m.left + detail_m.right)
        .attr("height", detail_h + detail_m.top + detail_m.bottom)
        .append("g")
        .attr("transform", "translate(" + detail_m.left + "," + detail_m.top + ")");

    svgDetail.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + detail_h + ")")
        .call(detail_xAxis)

    svgDetail.append("g")
        .attr("class", "y axis")
        .call(detail_yAxis)

    svgDetail.append("path")
        .data([datas])
        .attr("class", "line")
        .attr("d", detail_line);
}
