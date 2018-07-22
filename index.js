//color for the magnitude color depth legend
function getColor(d) {
  return d > 8 ? '#800026' :
    d > 7 ? '#bd0026' :
      d > 6 ? '#e31a1c' :
        d > 5 ? '#fc4e2a' :
          d > 4 ? '#fd8d3c' :
            d > 3 ? '#feb24c' :
              d > 2 ? '#fed976' :
                d > 1 ? '#ffeda0' :
                  '#ffffcc';
}


function getColor_depth(depth) {
  var intensity = 0,
    logscale_divider = 10;

  if (depth >= 0) {
    intensity = 255 - Math.round(255 * Math.log(1 + depth / logscale_divider) / Math.log(1 + 700 / logscale_divider));
    return "rgb(" + intensity + ", " + intensity + ", " + intensity + ")";
  } else {
    intensity = 255 + Math.round(depth * 20);
    return "rgb(" + 0 + ", " + Math.floor(intensity*0.75) + ", " + intensity + ")";
  }


}

// tile layers
var light = L.tileLayer(
  "https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?" +
  "access_token=pk.eyJ1IjoiaXZhbnZvZG92b3pvdiIsImEiOiJjampmaDh1aXYwODFyM3BsZ2R3dGp5dmthIn0.Gmzoivw8Ic2xTXqLzHaZXw"
);

var dark = L.tileLayer(
  "https://api.mapbox.com/styles/v1/mapbox/dark-v9/tiles/256/{z}/{x}/{y}?" +
  "access_token=pk.eyJ1IjoiaXZhbnZvZG92b3pvdiIsImEiOiJjampmaDh1aXYwODFyM3BsZ2R3dGp5dmthIn0.Gmzoivw8Ic2xTXqLzHaZXw"
);

var outdoors = L.tileLayer(
  "https://api.mapbox.com/styles/v1/mapbox/outdoors-v9/tiles/256/{z}/{x}/{y}?" +
  "access_token=pk.eyJ1IjoiaXZhbnZvZG92b3pvdiIsImEiOiJjampmaDh1aXYwODFyM3BsZ2R3dGp5dmthIn0.Gmzoivw8Ic2xTXqLzHaZXw"
);

var satellite = L.tileLayer(
  "https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}?" +
  "access_token=pk.eyJ1IjoiaXZhbnZvZG92b3pvdiIsImEiOiJjampmaDh1aXYwODFyM3BsZ2R3dGp5dmthIn0.Gmzoivw8Ic2xTXqLzHaZXw"
);


var baseMaps = {
  "Outdoors": outdoors,
  "Satellite": satellite,
  "Light": light,
  "Dark": dark

};

// Create map object first with just the map
var myMap = L.map("map", {
  center: [0, 0],
  zoom: 2,
  layers: [outdoors]
});

// add ayer controls and expand
var layer_controls = L.control.layers(baseMaps, null, { sortLayers: true });
layer_controls.addTo(myMap);



//render tectonic plates layer
var plates_url = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_plates.json";
d3.json(plates_url, function (geo_json_data) {
  // Creating a geoJSON layer with the retrieved data
  var tekPlates = [];
  var tekPlates_labels = [];
  
  tekPlates.push(L.geoJson(geo_json_data, {
    // Style each feature
    style: {
      color: "#777777",
      opacity: 0.3,
      weight: 1.5,
      fillOpacity: 0
    }
  }));

  tekPlates_labels.push(L.geoJson(geo_json_data, {
    // Style each feature
    style: {
      color: "grey",
      opacity: 0,
      weight: 0,
      fillOpacity: 0
    },
    onEachFeature: function (features, layer) {
      layer.bindTooltip(features.properties.PlateName, { permanent: true, opacity: 0.75, direction: 'right' });
    }
  }));


  // render the layer
  var tpLayer = L.layerGroup(tekPlates).addTo(myMap);;
  var tpLayer_labels = L.layerGroup(tekPlates_labels);
  
  // tpLayer.addTo(myMap);

  // add layer to the layer control
  layer_controls.addOverlay(tpLayer, "Tectonic plates").addTo(myMap);
  layer_controls.addOverlay(tpLayer_labels, "Tectonic plates names").addTo(myMap);
  
});


//render earthquake layers - loop through array of json urls
var data_urls = [
  'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_hour.geojson',
  'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_day.geojson',
  'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_week.geojson',
  'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson',
  'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson',
  'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson',
  'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson',
  'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson'];

for (var k = 0; k < data_urls.length; k++) {
  // load json and render current earthquake layer
  d3.json(data_urls[k], function (response) {
    var eqMarkers = [],
      eqMarkers_depth = [],
      eqLayer = [],
      eqLayer_depth = [];
    // max_depth = 0,
    // min_depth = 0;
    // loop through geo json response
    for (var i = 0; i < response.features.length; i++) {
      // set the  location property to a variable
      var location = response.features[i].geometry.coordinates;
      // If the data has a location property...
      if (location) {
        // Add a new marker and bind a pop-up
        eqMarkers.push(L.circleMarker(L.latLng([location[1], location[0]]), {
          radius: 4 + response.features[i].properties.mag * 2, color: '#555555', opacity: 0.25, weight: 1,
          fillOpacity: 0.75, fillColor: getColor(response.features[i].properties.mag)
        }).bindTooltip(response.features[i].properties.place + ". Mag: " + response.features[i].properties.mag +
          ". Depth, km: " + location[2], { opacity: 1, direction: 'top' }));
        // max_depth = max_depth > location[2] ? max_depth : location[2];
        // min_depth = min_depth < location[2] ? min_depth : location[2];
      }
    }

    //generate dataset with visualization of depth
    for (var i = 0; i < response.features.length; i++) {
      // set the  location property to a variable
      var location = response.features[i].geometry.coordinates;
      // If the data has a location property...
      if (location) {
        // Add a new marker and bind a pop-up
        eqMarkers_depth.push(L.circleMarker(L.latLng([location[1], location[0]]), {
          radius: 4 + response.features[i].properties.mag * 2, color: '#555555', opacity: 0.1, weight: 1,
          fillOpacity: 0.75, fillColor: getColor_depth(location[2])
        }).bindTooltip(response.features[i].properties.place + ". Mag: " + response.features[i].properties.mag +
          ". Depth, km: " + location[2], { opacity: 1, direction: 'top' }));
      }
    }


    eqLayer = L.layerGroup(eqMarkers);
    eqLayer_depth = L.layerGroup(eqMarkers_depth);
    var layer_title = response.metadata.title;
    if (layer_title.indexOf("Significant") !== -1 & layer_title.indexOf("Month") !== -1) {
      eqLayer.addTo(myMap);
    }
    layer_controls.addOverlay(eqLayer, layer_title + ' (' + response.metadata.count + ') - Magnitude');
    layer_controls.addOverlay(eqLayer_depth, layer_title + ' (' + response.metadata.count + ') - Depth');



  });
}


// generate the magnitude color legend
var legend = L.control({ position: 'bottomleft' });
legend.onAdd = function (map) {
  var div = L.DomUtil.create('div', 'info legend'),
    grades = [0, 1, 2, 3, 4, 5, 6, 7, 8],
  grades_depth = [-3, -1, 0, 1, 5, 25, 100, 300, 700];
  div.innerHTML += "Magnitude<br><br>";
  // loop through our color density intervals and generate a label with a colored square for each interval
  for (var i = 0; i < grades.length; i++) {
    div.innerHTML +=
      '<i style="background:' + getColor(grades[i] + 0.1) + '"></i> ' +
      grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
  }
  div.innerHTML += "<br><br>Depth, km<br><br>";

  for (var i = 0; i < grades_depth.length; i++) {
    div.innerHTML +=
      '<i style="background:' + getColor_depth(grades_depth[i]) + '"></i> ' + (grades_depth[i]? grades_depth[i]:'0(SL)')+'<br>';
  }

  return div;
};
legend.addTo(myMap);

