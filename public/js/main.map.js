var app = app || {};

app.map = ( function (w, d) {

  var elements = {
    map : null,
    lots : null,
    test : null,
    utfGrid : null,
    editableLayers: null,
    info : null,
    lotColors : {
      res : '#7fc97f',
      com : '#386cb0',
      nul : '#B2B2B2',
      mixRes : '#f0027f',
      man : '#beaed4',
      park : '#fdc086'           
    },
    legend : null
  };

  // setup the leaflet map
  var initMap = function(){
      console.log('initMap called');
      var config = {
          baselayer : new L.StamenTileLayer("toner-lite"),
          initLatLng : new L.LatLng(40.7, -74),
          zoom : 12,
          minZoom : 12,
          maxZoom : 20,
          zoomControl : false,          
          attributionControl : true,
          maxBounds : L.latLngBounds([40.539373,-74.117203],[40.771182,-73.798599])
      };      

      elements.map = L.map('map', config);
      elements.map.addLayer(config.baselayer);
      elements.map.setView(config.initLatLng, config.zoom);
      elements.test = L.tileLayer('http://localhost:8888/v2/nyc_pluto_test/{z}/{x}/{y}.png', {opacity: 0.5});
      //elements.map.addLayer(elements.test);

      // move zoom control to top-right corner of map
      new L.control.zoom({position: 'topright'}).addTo(elements.map);
      
      // editable layers to store leafet data
      elements.editableLayers = new L.FeatureGroup();

  };  

  //setup a UTF Grid layer & interaction
  var initUTF = function() {
    // create a new utfgrid layer
    elements.utfGrid = new L.UtfGrid('http://localhost:8888/v2/nyc_pluto_test/{z}/{x}/{y}.grid.json?callback={cb}', {
      resolution: 4
    });

    // add utfGrid interactivity
    elements.utfGrid.on('mouseover', function(e){ info.update(e);}).on('mouseout', function(e){ info.update();})

    // info box to display utfGrid data
    var info = L.control();
    info.options.position = 'bottomright';
    info.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
        this.update();
        return this._div;
    };

    // update the utfGrid info box
    info.update = function (props) {
      this._div.innerHTML = "<h4>Block Lot Info</h4>" +  (props ?
      "<values><b>" + props.data.Block + "</b><br>Lot <rank>" + props.data.Lot+"</rank></values>"
      : 'Hover over a tax lot<br>to view info.');
    };
    
    // add the grid layer and and control to the map
     e.map.addLayer(e.utfGrid)
               .addControl(info);
  }

 // set up the leaflet draw plug-in 
 var initDraw = function() {
    var options = {
        position: 'topright',
        draw: {
            polyline: false,
            polygon: {
              allowIntersection: false, // Restricts shapes to simple polygons
              drawError: {
                  color: '#e1e100', // Color the shape will turn when intersects
                  message: '<strong>Oh snap!<strong> you can\'t draw that!' // Message that will show when intersect
              },
              shapeOptions: {
                  color: '#bada55',
                  fill: false
              }
            },
            circle: false, 
            rectangle: {
                shapeOptions: {
                    clickable: false, 
                    fill: false
                }
            },
            marker: false
        },
        edit: {
            featureGroup: elements.editableLayers, 
            remove: false
        }
    };

    var drawControl = new L.Control.Draw(options);      

    elements.map.addLayer(elements.editableLayers);
    elements.map.addControl(drawControl);
    elements.map.on('draw:drawstart', function(e) {
      // hide the instruction UI element
      app.ui.el.pointer.style.visibility="hidden";
    });

    elements.map.on('draw:created', function (e) {
        var type = e.layerType,
            layer = e.layer;

        // grab pluto vector layer from db
        updateLayer(layer);
        // clear any existing features
        elements.editableLayers.clearLayers();
        //turn off the stroke for the drawing layer as its not needed        
        elements.editableLayers.addLayer(layer.setStyle({stroke: false}));
        // zoom the map to the extent of the drawing feature's bounds
        elements.map.fitBounds(elements.editableLayers.getBounds());
    });          
  }

  // display vector feature properties on mouse hover
  // called after user draws a polygon and data request is successful
  var initInfo = function() {

    elements.info = L.control({position: 'bottomright'});
    
    elements.info.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'box leaflet'); // create a div with a classes "box" and "leaflet"
        this.update();
        return this._div;
    };

    // method that we will use to update the control based on feature properties passed
    elements.info.update = function (props) {
        this._div.innerHTML = '<h4>Tax Lot Info</h4>' +  (props ?
            '<b>Address: </b>' + props.address + '<br>' + 
            '<b>Owner Name: </b>' + props.ownername + '<br>' + 
            '<b>Zoning: </b>' + props.zoningprimary + '<br>' + 
            '<b>Year Built: </b>' + props.yearbuilt
            : '<i>Hover over a tax lot<br>to view info </i>' );
    };

    elements.info.addTo(elements.map);    
  }

  // create zone color legend. Renders dynamically.
  var initLegend = function() {
    elements.legend = L.control({position: 'bottomleft'});
    elements.legend.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'box leaflet legend'),
            zones = ['R','C', 'M', 'MR', 'P','N'],
            labels = ['Residential', 'Commercial', 'Manufacturing', 'Manufacturing / Residential', 'Park', 'Info unavailable'];

        div.innerHTML = '<h4>Zoning:</h4>';
        // loop through zoning styles and generate a label with a colored square for each interval
        for (var i = 0; i < zones.length; i++) {
            div.innerHTML +=                
                '<i style="background:' + getColor(zones[i]) + '"></i> ' +
                labels[i] + '<br>'  ;
        }

        return div;
    };

    elements.legend.addTo(elements.map);
  }    

  // used to highlight vector features on mouse over
  var highlightFeature =  function(e) {
      var layer = e.target;

      layer.setStyle({
          weight: 3,
          opacity: 1,
          color: '#FFFF03',
          fill: '#FFFF03',
          fillOpacity: 0.2
      });

      if (!L.Browser.ie && !L.Browser.opera) {
          layer.bringToFront();
      }

      elements.info.update(layer.feature.properties);
  }  

  // used to reset default style on mouseout
  var resetHighlight = function(e) {
      elements.lots.resetStyle(e.target);
      elements.info.update();
  }

  var zoomToFeature = function(e) {
    elements.map.fitBounds(e.target.getBounds());
  }

  // used to call above two functions
  var onEachFeature = function(feature, layer) {
      layer.on({
          mouseover: highlightFeature,
          mouseout: resetHighlight,
          click: zoomToFeature
      });
  }    

  // get the color for a lot based on its primary zone
  var getColor = function(d) {
    return d == 'R' ? elements.lotColors.res :
               d == 'C' ? elements.lotColors.com :
               d == 'N' ? elements.lotColors.nul :
               d == 'MR' ? elements.lotColors.mixRes :
               d == 'M' ? elements.lotColors.man :
               d == 'P' ? elements.lotColors.park :
                              elements.lotColors.nul;
  };

  // styles the vector lots
  var style = function(feature) {
    return {
      weight: 2,
      opacity: 0.5,
      color: "white",
      fillColor: getColor(feature.properties.zonestyle),
      fillOpacity: 0.7
    };
  }  

  // grabs the pluto tax lots from the db when draw:created is called
  var updateLayer = function(layer) {

    var latLngs = layer.getLatLngs();    
    var data = JSON.stringify(latLngs);
    //console.log('latLngs: ', latLngs, ' data: ', data);
    var sql_poly = [];

    $.ajax({
      url: 'http://localhost:3000/leafletData/' + data,
      type: 'GET',
      dataType: 'json'
      // data: shallowEncoded
    })
    .done( function (data, textStatus, jqXHR) {

      console.log("success: ", data);

      if (elements.lots !== null) {
        console.log('erasing elements.lots');
        elements.lots.clearLayers();
      }

      elements.lots = L.geoJson(data, {
        style : style,
        onEachFeature : onEachFeature
      }).addTo(elements.map);

      if (elements.info === null ) { 
        initInfo(); 
      }

      if (elements.legend === null) {
        initLegend();
      }

    })
    .fail(function() {
      console.log("error");
    })
    .always(function() {
      console.log("complete");
    });    
  }

  // call the functions that set up the leaflet map and draw plugin
  var init = function() {
    console.log('app.map init called');
    initMap();
    initDraw();    
  };

  return {
    init : init,
    elements : elements
  };

})( window, document );
