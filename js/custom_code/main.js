// The key displays the current colour scale - which is minutes, or population, or whatever


// The info panel shows a table that has the bands, then the metrics.  Text is coloured according to the relevant colour scale.



var p1 = $.ajax(VMT.shapefile_path)
var p2 = $.ajax(VMT.facility_to_point_csv_path)
var p3 = $.ajax(VMT.point_to_census_metrics_csv_path)


// To enable this to be shared on the shared drives, comment out the above two lines, and uncomment the following:

// var p3 = jQuery.Deferred();
// p3.resolve("hurray")
// $.when(p3).done(function() { topo_data = [topo_data]

$.when(p1,p2,p3).done(function(topo_data, facility_to_point_csv, point_to_census_metrics_csv) {

  //Convert topo_json to geojson
  var geo_collection = topo_data[0]
  var geo_collection = topojson.feature(geo_collection, geo_collection.objects.subunits)

  //England, Wales 
  geo_collection.features = [geo_collection.features[0], geo_collection.features[4]]   
  VMT.geo_collection = geo_collection


  //Add the csv data to the data manager 
  VMT.dataholder = new DataHolder(facility_to_point_csv, point_to_census_metrics_csv)

  var option_data=  _.map(VMT.metric_meta_data, function(d,k) {
    return {value:k, text: d.long_name}

  })
  // Populate selection boxes.
  draw_options("#shadingOptions",option_data)
  $("#shadingOptions").val(VMT.round_measure)
  VMT.band_metric = $("#shadingOptions").val()



  VMT.voronoimap = new VoronoiMap()

  $("#shadingOptions").on("change", function(d) {
  
    VMT.voronoimap.style_overlay()
  })

    $("#input_band_width").on("change", function(d) {
    VMT.band_width = $("#input_band_width").val()
    VMT.dataholder.recompute_round_stats()
    VMT.voronoimap.draw_from_scratch()
  })

  
})


