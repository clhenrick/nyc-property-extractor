var express = require('express');
var router = express.Router();
var pg = require('pg');

//pg.defaults.user = "dude";
//pg.defaults.host = '/var/run/postgresql';

router.param('coords', function(req, res, next, coords) {
  // do validation on coords here
  // blah blah validation
  // log something so we know its working
  console.log('doing geom validations on ' + JSON.parse(coords));

  // once validation is done save the new item in the req
  req.coords = JSON.parse(coords);
  // go to the next thing
  next(); 
});

router.get('/:coords', function(req, res) {
  getData(req.coords, res);
});

var conString = "pg://dude:1234@localhost:5432/nyc_pluto";
var client = new pg.Client(conString);
console.log('connection string: ', conString);
client.connect();

// this one will take coordinates from leaflet and return data from the server
function getData(req, res) {

  var coords = req,
        sql_poly = [],
        points = [];

  for (var i in coords) {
      sql_poly.push(coords[i].lng);
      sql_poly.push(coords[i].lat);
    };

  // close the polygon
  sql_poly.push(coords[0].lng);
  sql_poly.push(coords[0].lat);

  // write the correct number of st_point functions
  for (var j=1; j<=sql_poly.length; j+=2) {
    points.push('ST_SetSRID(ST_Point($' + j + ',' + '$' +(j+1) + '), 4326)');
  }

  var sql =   "SELECT address, zipcode, borough, borocode, block, lot, cd, ownername, ownertype,"+
                  "numfloors, yearbuilt, zonedist1, zonedist2, zonedist3," +
                  "zoning_style, " +
                  " ST_AsGeoJSON(geom)" + 
                  " AS geom FROM map_pluto2014v2 WHERE " +
                  " ST_Intersects(geom, ST_MakePolygon(ST_MakeLine( ARRAY[" + 
                  points.join() +
                  " ] )));";
  
  console.log('the sql: ', sql);

  var fc = {
    "type" : "FeatureCollection",
    "features" : []
  };


  client.query(sql, sql_poly, function(err, result) {
    
    if (err) { 
      console.log("error: ", err);
      return;
    }

    // console.log('client query sql res: ', result);
    
    result.rows.forEach(function(feature) {

      var f = {
        "type" : "Feature",
        "geometry" : JSON.parse(feature.geom),
        "properties" : {
        "borough" : feature.borough,
        "boroughcode" : feature.borocode,
        "block": feature.block,
        "lot": feature.lot,
        "address": feature.address,
        "zipcode": feature.zipcode,
        "communitydistrict": feature.cd,
        "ownername" : feature.ownername,
        "ownertype" : feature.ownertype,
        "numberfloors" : feature.numfloors,
        "yearbuilt" : feature.yearbuilt,
        "zoningprimary" : feature.zonedist1,
        "zoningsecondary" : feature.zonedist2,
        "zoningtertiary" : feature.zonedist3,
        "zonestyle" : feature.zoning_style
        }
      };
      fc.features.push(f);
    });

      res.setHeader("Access-Control-Allow-Origin", "*")
      res.send(fc);
      //client.end(); 
      // console.log('queried data: ', fc);
  });

};

module.exports = router;

