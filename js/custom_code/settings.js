var VMT = {} //VoronoiMapTemplate


VMT.shapefile_path = "topojson/uk_boundaries.json"
VMT.facility_to_point_csv_path = "data/first_attempt.csv"
VMT.point_to_census_metrics_csv_path = "data/point_id_and_population.csv"
VMT.facilities_list_csv_path = "data/facility_list.csv"

//Colour options for shading
VMT.colour_options = {
    "Red (high) to green (low)": ["#6AE817","#FFA200", "#B30409"],
    "Blues": ["#B5EED9", "#37BAE5",  "#132978", "#0D162C"],
    "Blue orange" :["#0413FD" , "#FF6900"],
    "Condensed" : ["#6ae817","#c3dd24","#f0ab26","#c22d10","#a10408","#6b0205","#360103","#1b0101","#0d0001","#000000"]
};

VMT.round_measure = "distance_km"
VMT.band_metric = "population"

VMT.band_width = $("#input_band_width").val()

VMT.categorical_colours = ["#777",
                             "#dc3912",
                             "#ff9900",
                             "#0E8917",
                             "#990099",
                             "#0099c6",
                             "#dd4477",
                             "#A6FF3C",
                             "#FF3F42",
                             "#1C3C5D",
                             "#D860DA"];

//Manual overrides on the description of the columns in the csv file.
VMT.metric_meta_data = {
   
    "population": {
        "long_name": "Population in band",
        "colour_option": "Red (high) to green (low)"
    },
    "population_percentage": {
        "long_name": "Percentage of population in band",
        "colour_option": "Red (high) to green (low)"
    },
    "distance_km": {
        "long_name": "Distance from nearest facility",
        "format": d3.format(",.0f"),
        "colour_option": "Condensed"
    }

};



VMT.transitionDuration = 500
