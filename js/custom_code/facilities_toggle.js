function PointsMap() {

    //When the data changes we just need to redraw the overlay
    //This function styles the points and the shaded area
    this.style_overlay = function() {

   

        var facility_locations_sel = d3.selectAll(".facility_locations")

        var va = facility_locations_sel
            .data(VMT.dataholder.facilities_list_csv)

        va
            .attr("cy", function(d) {
                return d.y
            })
            .attr("cx", function(d) {
                return d.x
            })
            .style('fill', function(d) {
                if (d.activated) {
                    return "red"
                } else {
                    return "grey"
                }
            })
            .attr("r", function(d) {
                return 10
            })
            .attr("fill-opacity", function(d) {
                return 1
            })
            .attr("stroke", "black")


        d3.select('#map_key').remove();
        // draw_map_key_continuous()


    }



    function facilities_on_click(d) {
        // If we click the facility, we want to toggle activation and redraw




        _.each(VMT.dataholder.facilities_list_csv,function(d2) {
            if (d.moj_prison_name == d2.moj_prison_name) {
                d2.activated = !d2.activated
            }

            me.style_overlay()
        
        })

        VMT.dataholder.compute_new_min_distances()
        VMT.dataholder.recompute_round_stats()
        VMT.voronoimap.draw_from_scratch()


      
    }


    //Remove overlay and redraw
    this.draw_from_scratch = function() {



        //Get layer 
        g = d3.select("#facility_location_layer")

        //Use leaflet's internal functions to convert the 
        //points' lat lng into x y values corresponding to the leaflet map
        VMT.dataholder.facilities_list_csv = VMT.dataholder.facilities_list_csv.map(function(d) {

            var latlng = new L.LatLng(d.lat, d.lng);
            var point = VMT.mapholder.map.latLngToLayerPoint(latlng);

            d.x = point.x;
            d.y = point.y;

            return d

        });



        //Now our 'current points' contain all the information we need to draw the voronoi map
        //For each filtered point, covert the lat lng into x y point in svg space
        var facility_locations_sel = g.selectAll(".facility_locations")
            .data(VMT.dataholder.facilities_list_csv)
            .enter()


        facility_locations_sel.append("circle")
            .attr("class", "facility_locations")
            .on("click", facilities_on_click)



        me.style_overlay()


    }

    var me = this;

    VMT.mapholder.map.on('viewreset moveend', this.draw_from_scratch);

    this.draw_from_scratch()



}