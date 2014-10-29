var express = require('express');
var router = express.Router();
var pg = require('pg');
var tags = {};

router.get('/', function(req, res) {
  getAmenities(req.body, res);
});

// router.get('/', function(req, res) {
//   getData(req, res);
// });

var conString = "pg://localhost/nyc_pluto";
var client = new pg.Client(conString);
client.connect();

function getAmenities(amenities, res) {

  var fc = {
    "type": "FeatureCollection",
    "features": []
  };

  var sql = "SELECT address, block, lot, ST_AsGeoJSON(wkb_geometry) AS geom FROM bk_pluto LIMIT 1000;"

  client.query(sql, function(err, result) {
    result.rows.forEach(function(feature){

      //tags = feature.tags;

      var f = {
        "type": "Feature",
        "geometry": JSON.parse(feature.geom),
        "properties": {
          "name": feature.name,
          "block": feature.block,
          "lot": feature.lot,
          "address": feature.address
        }
      };
      fc.features.push(f);
    });

    res.setHeader("Access-Control-Allow-Origin", "*")
    res.send(fc);
    //client.end();
  });

}

// this one will take coordinates from leaflet and return data from the server
function getData(req, res) {

  var coords =req.query.coords;

  var sql_poly = []

  //console.log('postData called. polydata: ', JSON.parse());

  for (var i in coords) {
      sql_poly.push("ST_SetSRID(ST_Point(" + coords[i].lng + "," + coords[i].lat + "), 4326)");
    }

  // close the polygon
  sql_poly.push("ST_SetSRID(ST_MakePoint(" + coords[0].lng + "," + coords[0].lat +   "), 4326)");

  var sql =  "SELECT address, block, lot, ST_AsGeoJSON(wkb_geometry) AS geom FROM bk_pluto WHERE ST_Intersects(wkb_geometry, ST_MakePolygon(ST_MakeLine(Array["+ sql_poly +"])));";
  
  console.log('sql: ', sql);

  var fc = {
    "type" : "FeatureCollection",
    "features" : []
  };


  client.query(sql, function(err, res) {
    
    if (err) { console.log("error: ", err); }

    //console.log('client query sql res: ', res);
    
    res.rows.forEach(function(feature) {

      var f = {
        "type" : "Feature",
        "geometry" : JSON.parse(feature.geom),
        "properties" : {
          "name": feature.name,
          "block": feautre.block,
          "lot": feature.lot,
          "address": feature.address
        }
      };
      fc.features.push(f);
    });

      res.setHeader("Access-Control-Allow-Origin", "*")
      res.send(fc);
      //client.end(); 
      console.log('queried data: ', fc);
  });

};

module.exports = router;

