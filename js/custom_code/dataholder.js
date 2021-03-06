function DataHolder(facilities_points_and_durations_csv, point_to_census_metrics_csv, facilities_list_csv) {

    var me = this
        //Parse and convert to float
    this.facilities_points_and_durations_csv = convert_to_float(d3.csvParse(facilities_points_and_durations_csv[0]));
    this.point_to_census_metrics_csv = convert_to_float(d3.csvParse(point_to_census_metrics_csv[0]));
    this.facilities_list_csv = convert_to_float(d3.csvParse(facilities_list_csv[0]));

    _.each(this.facilities_list_csv, function(d) {
        d["activated"] = true
    })

    //Need lookups that go from point_id to census metrics
    this.point_id_to_census_metrics = {}

    _.each(this.point_to_census_metrics_csv, function(d) {
        me.point_id_to_census_metrics[d.point_id] = d
    })

    //
    var census_metrics = _.filter(_.keys(this.point_to_census_metrics_csv[0]), function(d) {
        return d != "point_id"
    })


    function add_keys(this_metric_key) {

        if (!(_.has(VMT.metric_meta_data, this_metric_key))) {
            VMT.metric_meta_data[this_metric_key] = {}
        }

        if (!(_.has(VMT.metric_meta_data[this_metric_key], "format"))) {
            if (this_metric_key.indexOf("percentage") != -1) {
                VMT.metric_meta_data[this_metric_key]["format"] = d3.format(",.1%");
            } else {
                VMT.metric_meta_data[this_metric_key]["format"] = d3.format(",.0f");
            }
        }

        if (!(_.has(VMT.metric_meta_data[this_metric_key], "long_name"))) {
            VMT.metric_meta_data[this_metric_key]["long_name"] = this_metric_key
        }


        if (!(_.has(VMT.metric_meta_data[this_metric_key], "colour_option"))) {
            VMT.metric_meta_data[this_metric_key]["colour_option"] = _.keys(VMT.colour_options)[0]
        }

    }

    this.initialise_meta_data = function() {

        //Add keys where they don't exist

        _.each(census_metrics, function(metric) {
            _.each(["", "_percentage"], function(s) {
                add_keys(metric + s)

            })
            census_metrics.push(metric + "_percentage")
        })
        add_keys(VMT.round_measure)




    }


    this.initialise_meta_data()

    this.recompute_round_stats = function() {

        me.stats_lookup = {}

        _.each(this.voronoi_dataset, function(d) {
            d["rounded"] = roundNumber(d[VMT.round_measure], VMT.band_width)
            me.stats_lookup[d["rounded"]] = {}
        })

        _.each(me.stats_lookup, function(d) {

            _.each(census_metrics, function(c) {
                d[c] = 0
            })
        })




        // Compute a lookup of population vs rounded
        _.each(this.voronoi_dataset, function(d) {

            _.each(census_metrics, function(c) {
                try {
                    me.stats_lookup[d["rounded"]][c] += me.point_id_to_census_metrics[d.point_id][c]
                } catch (err) {}
            })
            me.stats_lookup[d["rounded"]][VMT.round_measure] = d["rounded"]
        })


        //Domain and number of bands
        me.num_contours = _.keys(me.stats_lookup).length


        var contour_values = _.map(_.keys(me.stats_lookup), parseFloat)



        this.min_contour_value = Math.min.apply(null, contour_values);
        this.max_contour_value = Math.max.apply(null, contour_values);

        //Also want each metric as a percentage

        _.each(census_metrics, function(metric_key) {

            if (metric_key.indexOf("percentage") != -1) {

                var key_without_perc = metric_key.replace("_percentage", "")

                var this_total = 0
                    // Get total
                _.each(me.stats_lookup, function(d) {
                    this_total += d[key_without_perc]
                })

                _.each(me.stats_lookup, function(d) {
                    d[metric_key] = d[key_without_perc] / this_total

                })
            }


        })



        // Finally we need to compute domain, range and colour scale

        var all_metrics = census_metrics.slice()
        all_metrics.push(VMT.round_measure)

        _.each(all_metrics, function(metric_key) {
            //Get max annd min and map to domain

            var this_meta_data = VMT.metric_meta_data[metric_key]

            var all_values = _.map(me.stats_lookup, function(d) {
                return d[metric_key]
            });



            var all_values = _.filter(all_values, function(d) {
                return !(isNaN(d))
            })

            var minMetric = Math.min.apply(null, all_values);
            var maxMetric = Math.max.apply(null, all_values);

            // Need to split min to max depending on how many items in colour scale

            // get colour scale 

            var c_options = VMT.colour_options[this_meta_data["colour_option"]]


            var num_colours = c_options.length
            var diff = maxMetric - minMetric

            domain = d3.range(minMetric, maxMetric + diff / 100, diff / (c_options.length - 1))


            this_meta_data["colour_scale"] = d3.scaleLinear()
                .domain(domain)
                .range(c_options);

            this_meta_data["minmax"] = [minMetric, maxMetric]



        })




    }

    

    this.compute_new_min_distances = function() {
// want a dataset that looks like htis
        // point_id,lat,lng,distance_km
// 1,49.956467399,-6.35238910875,315.120706832

        // For each point, what is the minimum duration?

        var active_prisons = {}
        _.each(this.facilities_list_csv, function(d) {
            if (d.activated) {
                active_prisons[d.moj_prison_name] = null
            }
        })

        //Want a dict for each point
        var points_dict = {}
        _.each(this.facilities_points_and_durations_csv, function(d) {

            if (d.moj_prison_name in active_prisons) {

                if (!(_.has(points_dict, d.point_id))) {
                    points_dict[d.point_id] = d
                } else {
                    if (points_dict[d.point_id][VMT.round_measure] > d[VMT.round_measure]) {
                        points_dict[d.point_id][VMT.round_measure] = d[VMT.round_measure]
                        points_dict[d.point_id]["moj_prison_name"] = d["moj_prison_name"]
                    }
                }
            }

        })

        me.voronoi_dataset = _.map(points_dict, function(d) {return d})

    }


    this.compute_new_min_distances()
    this.recompute_round_stats()



};