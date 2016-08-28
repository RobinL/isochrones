//There are three styles:  
// Shaded Voronoi polygons
// Coloured points
// Points of different sizes

//But these are all really the same thing - you always plot the voronoi areas to
//make the hover functionality work.  You just turn the shading off in some cases

function VoronoiMap() {

    this.voronoi_cells_layer = d3.select("#voronoi_cells_layer")
    this.facility_location_layer = d3.select("#facility_location_layer")
    this.clip_path_layer = d3.select("#clip_path_layer")
    this.map = VMT.mapholder.map

    var me = this;


    //When the data changes we just need to redraw the overlay
    //This function styles the points and the shaded area
    this.style_overlay = function() {

        VMT.band_metric = $("#shadingOptions").val()
        me.colour_bands()
        me.plot_table()

    }


    //Remove overlay and redraw
    this.draw_from_scratch = function() {

        VMT.mapholder.redraw()
        me.voronoi_cells_layer.selectAll("*").remove()

        var bounds = me.map.getBounds(),
            topLeft = me.map.latLngToLayerPoint(bounds.getNorthWest()),
            bottomRight = me.map.latLngToLayerPoint(bounds.getSouthEast())

        //Add an svg that sits on top of the leaflet map, which we draw the d3 svg elements to
        var svg = me.voronoi_cells_layer.append("svg")
       
        me.svg = svg

    
        var g = svg.append("g").attr("class", "leaflet-zoom-hide")

        //Account for padding etc. to make sure the overlay is correctly placed


        //Use leaflet's internal functions to convert the 
        //points' lat lng into x y values corresponding to the leaflet map
        VMT.dataholder.current_points = VMT.dataholder.facility_to_point_csv.map(function(d) {

            var latlng = new L.LatLng(d.lat, d.lng);
            var point = me.map.latLngToLayerPoint(latlng);

            d.x = point.x;
            d.y = point.y;

            return d

        });



        //The Voronoi layout associates a path with each point that represents the x,y of the voronoi cell
        //This is the function that defines the layout

        bottomRight = me.map.latLngToLayerPoint(bounds.getSouthEast())
        var voronoi = d3.voronoi()
            .x(function(d) {
                return d.x + (Math.random() - 0.5) * 0.001; //To avoid two points being at the same pixel values and therefore having an uncomputable voronoi
            })
            .y(function(d) {
                return d.y + (Math.random() - 0.5) * 0.001; //To avoid two points being at the same pixel values
            })
            .extent([
                [-10000, -10000],
                [bottomRight.x+10000, bottomRight.y+10000]
            ])


        var computed_data = voronoi(VMT.dataholder.current_points)

        //For each point in current points, add the voronoi array to the point (the array of points defining the cell)
        //Put it in a property called cell


        var computed_voronoi = voronoi(VMT.dataholder.current_points)
        var topology = computeTopology(voronoi(VMT.dataholder.current_points));

        var multilinestring = topojson.mesh(topology, topology.objects.voronoi,
            function(a, b) {
                return a.data.rounded !== b.data.rounded
            });

        function projectPointVoronoi(x, y) {
            this.stream.point(x, y);
        }

        var transformVoronoi = d3.geoTransform({
            point: projectPointVoronoi
        })

        var path_voronoi = d3.geoPath().projection(transform);


        g.selectAll(".voronoi_borders").remove()

        g
            .selectAll(".voronoi_borders")
            .data([multilinestring])
            .enter()
            .append("path")
            .attr("class", "voronoi_borders")
            .attr("d", path_voronoi)



        g.selectAll(".voronoi_fill").remove()

        var min = VMT.dataholder.min_contour_value
        var max = VMT.dataholder.max_contour_value

        var c_scale = d3.scaleLinear().domain([min,(min+max)/4, max]).range(["#10FF00", "#FFAE00", "#FF0004"])


        _.each(VMT.dataholder.stats_lookup, function(d,k) {

            k = parseFloat(k)

            var multipolygon = topojson.merge(topology, topology.objects.voronoi.geometries.filter(function(d) {
                return d.data.rounded == k
            }));

            g
                .selectAll(".voronoi_fill_" + k)
                .data([{multipolygon:multipolygon, data:d}])
                .enter()
                .append("path")
                .attr("class", "voronoi_fill_" + k)
                .attr("d", function(d) {return path_voronoi(d.multipolygon)})
                .on("mouseover", function(d) {

                    on_mouseover(d.data)
                    
                })
            

        })


        function projectPoint(x, y) {
            var point = me.map.latLngToLayerPoint(new L.LatLng(y, x));
            this.stream.point(point.x, point.y);
        }

        var transform = d3.geoTransform({
            point: projectPoint
        })

        var path = d3.geoPath().projection(transform);

        //Draw the clipping path and apply it
        g.append("svg:clipPath")
            .attr("id", "EWClipPath")
            .append("svg:path")
            .datum(VMT.geo_collection)
            .attr("d", path);

        g.attr("clip-path", "url(#EWClipPath)")

        me.colour_bands()
        plot_table()


    }

    this.colour_bands = function() {

        _.each(VMT.dataholder.stats_lookup, function(d,k) {

            this_band = d3.selectAll(".voronoi_fill_" + k)

            this_band.attr("fill", function(band) {
                return VMT.metric_meta_data[VMT.band_metric]["colour_scale"](d[VMT.band_metric])
            })



        })  

    }

    function on_mouseover(d) {

        // Update hover panel
        var source = $("#hp_info").html();
        var template = Handlebars.compile(source);

        //For each in template dict, format if format exists
        var template_dict = {data: []}

        _.each(d, function(k, v) {

            if (VMT.metric_meta_data[v]) {
                var obj = {}
                obj.long_name = VMT.metric_meta_data[v]["long_name"]
                obj.value  =  VMT.metric_meta_data[v].format(d[v])
                template_dict.data.push(obj)
            }
        })

        var html = template(template_dict);
        d3.select('#hover_panel')
            .html(html)

      

    }

    function on_mouseout(d) {
    

    }


    function rounded_value_to_band(value) {

        fr = value -  VMT.band_width/2
        fr = Math.max(0,fr)
        to = value +  VMT.band_width/2

        return fr + " - " + to + " km"

    }

    function plot_table() {

        d3.select("#table_panel").selectAll("*").remove()
        table_div = d3.select("#table_panel")

        _.each(VMT.dataholder.stats_lookup, function(d) {
            d["band_text"] = rounded_value_to_band(d[VMT.round_measure])
        })

        var data = _.map(VMT.dataholder.stats_lookup, function(d,k) {


           
            d2 = _.map(d, function(d,k){

                

                var obj = {}
                obj["key"] = k
                obj["value"] = d
               
                return obj
            })

            d2 = d2.filter(function(d) {return d.key != VMT.round_measure})

            d2.sort(
                  function(x, y)
                  {
                     return x.key != "band_text";
                  }
                );
            return d2
        })
       
        var table = table_div.append("table").attr("class", "pure-table-striped pure-table pure-table-horizontal");

        var headers = _.map(data[0], function(d) {
            return d.key
        })

        table.selectAll("th").data(headers).enter().append("th").text(function(d) {return d})

        var tr = table.selectAll("tr")
            .data(data)
          .enter().append("tr");

        var td = tr.selectAll("td")
            .data(function(d) { return d; })
          .enter().append("td")
            .text(function(d) {
                 if (d.key != "band_text") {
                    return  VMT.metric_meta_data[d.key].format(d.value)
                }  
                else {
                    return d.value
                }
                
            })
            .style("color", function(d,i,p) {   

                if (d.key == "band_text") {

                    _.each(VMT.dataholder.stats_lookup, function(d2) {
                        if (d2.band_text == d.value) {
                            colour = VMT.metric_meta_data[VMT.round_measure]["colour_scale"](d2[VMT.round_measure])
                        }
                    })
                    return colour

                  
                } else {
                    
                    return VMT.metric_meta_data[d.key]["colour_scale"](d.value)
                }
            })

    }

    var me = this;

    var geo_collection = geo_collection;

    

    me.map.on('viewreset moveend', this.draw_from_scratch);

    this.draw_from_scratch()



}