function convert_to_float(csv_data) {

    // For each variable, check whether categorical and if not convert to float

    _.each(_.keys(csv_data[0]), function(this_key) {
        var is_categorical = _.some(csv_data, function(d) {

                    this_value = d[this_key];
                    if (this_value !== "") {
                        var pf = parseFloat(this_value)

                        if (isNaN(pf)) {
                            return true
                        }
                    }
                    return false

        })

        if (!(is_categorical)) {
            _.each(csv_data, function(d) {
                d[this_key] = +d[this_key]
            })
        }
    })
    return csv_data
}

function get_min_max_from_csv(csv_data, key) {
    var all_values = _.map(csv_data, function(d) {
                    return d[key]
                });

                var minMetric = Math.min.apply(null, all_values);
                var maxMetric = Math.max.apply(null, all_values);

    return {"min": minMetric, "max": maxMetric}
}

function draw_options(selector, data) {

  d3.select(selector).selectAll('option')
      .data(data)
      .enter()
      .append("option")
      .attr("value", function(d) {
          return d["value"]
      })
      .text(function(d) {
          return d["text"]
      })

};

function draw_options_inc_non(selector, data) {
    data = data.slice()
    data.unshift({"value": "none", "text": "None"})
    draw_options(selector, data)
}

  //  Get rid of rows which don't have lat lng
    this.filter_out_invalid_coordinates = function() {
        this.all_csv_data = _.filter(this.all_csv_data, function(d) {
            if (isNaN(d["lat"])) {
                return false
            }
            if (isNaN(d["lng"])) {
                return false
            }
            return true
        })
    }


//http://tributary.io/inlet/e9c894c68af525ebe5e31e72fef74dc5
function produced_condensed() {
    my_scale = d3.scale.linear()
                        .domain([0,0.333,0.666,1])
                        .range(["#6AE817", "#FFD52D", "#B30409", "#000"]);


    nums =[0,0.05,0.1,0.15,0.2,0.25,0.3,0.35,0.4,0.45,0.5,0.55,0.6,0.65,0.7,0.75,0.8,0.85,0.9,0.95,1]


    nums =[0,0.3,0.6,0.7,0.8,0.9,0.925,0.95,0.975,1]


    console.log(nums.map(function(d) {return '"' + my_scale(d) + '"'}))
}


 function roundNumber(number, to) {
            return Math.round(number / to) * to;
        }
function computeTopology(diagram) {
  var cells = diagram.cells,
      arcs = [],
      arcIndex = -1,
      arcIndexByEdge = {};

  return {
    objects: {
      voronoi: {
        type: "GeometryCollection",
        geometries: cells.map(function(cell) {
          var cell,
              site = cell.site,
              halfedges = cell.halfedges,
              cellArcs = [],
              clipArc;

          halfedges.forEach(function(halfedge) {
            var edge = diagram.edges[halfedge];
            if (edge.right) {
              var l = edge.left.index,
                  r = edge.right.index,
                  k = l + "," + r,
                  i = arcIndexByEdge[k];
              if (i == null) arcs[i = arcIndexByEdge[k] = ++arcIndex] = edge;
              cellArcs.push(site === edge.left ? i : ~i);
              clipArc = null;
            } else if (clipArc) { // Coalesce border edges.
              if (edge.left) edge = edge.slice(); // Copy-on-write.
              clipArc.push(edge[1]);
            } else {
              arcs[++arcIndex] = clipArc = edge;
              cellArcs.push(arcIndex);
            }
          });

          // Ensure the last point in the polygon is identical to the first point.
          var firstArcIndex = cellArcs[0],
              lastArcIndex = cellArcs[cellArcs.length - 1],
              firstArc = arcs[firstArcIndex < 0 ? ~firstArcIndex : firstArcIndex],
              lastArc = arcs[lastArcIndex < 0 ? ~lastArcIndex : lastArcIndex];
          lastArc[lastArcIndex < 0 ? 0 : lastArc.length - 1] = firstArc[firstArcIndex < 0 ? firstArc.length - 1 : 0].slice();

          return {
            type: "Polygon",
            data: site.data,
            arcs: [cellArcs]
          };
        })
      }
    },
    arcs: arcs
  };
}

