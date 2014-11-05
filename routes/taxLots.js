var express = require('express');
var router = express.Router();
var pg = require('pg');

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
  //console.log('taxLots.js calling getData: ', req, res);
  getData(req.coords, res);
});

var conString = "pg://localhost/nyc_pluto";
var client = new pg.Client(conString);
client.connect();

// this one will take coordinates from leaflet and return data from the server
function getData(req, res) {

  //var coords =req.query.coords;
  var coords = req;

  var sql_poly = []

  //console.log('postData called. polydata: ', JSON.parse());

  for (var i in coords) {
      sql_poly.push("ST_SetSRID(ST_Point(" + 
                              coords[i].lng + "," + 
                              coords[i].lat + "), 4326)");
    }

  // close the polygon
  sql_poly.push("ST_SetSRID(ST_MakePoint(" + 
                          coords[0].lng + "," + 
                          coords[0].lat +   "), 4326)");

  var sql =  "SELECT address, zipcode, borough, borocode, block, lot, cd, ownername, ownertype,"+
                  "numfloors, yearbuilt, zonedist1, zonedist2, zonedist3," +
                  "zone_style, " +
                  " ST_AsGeoJSON(wkb_geometry)" + 
                  " AS geom FROM bk_pluto WHERE ST_Intersects(wkb_geometry," +
                  " ST_MakePolygon(ST_MakeLine(Array["+ sql_poly.join() +"])));";
  
  console.log('the sql: ', sql);

  var fc = {
    "type" : "FeatureCollection",
    "features" : []
  };


  client.query(sql, function(err, result) {
    
    if (err) { console.log("error: ", err); }

    console.log('client query sql res: ', result);
    
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
          "zonestyle" : feature.zone_style
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

