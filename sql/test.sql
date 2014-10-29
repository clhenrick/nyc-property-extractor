SELECT * FROM bk_pluto 
    WHERE ST_Intersects(
        wkb_geometry, 
        ST_MakePolygon(
            ST_MakeLine(
                Array[
                    ST_SetSRID(ST_Point(40.63688312646408,-74.01866912841798), 4326),
                    ST_SetSRID(ST_Point(40.66345202337171,-74.01866912841798), 4326),
                    ST_SetSRID(ST_Point(40.66345202337171,-73.9592742919922), 4326),
                    ST_SetSRID(ST_Point(40.63688312646408,-73.9592742919922), 4326),
                    [40.63688312646408,-74.01866912841798]]))) 

    SELECT name, address, block, lot, ST_AsGeoJSON(wkb_geometry) 
        FROM bk_pluto 
        WHERE ST_Intersects(
            wkb_geometry, 
            ST_MakePolygon(
                ST_MakeLine(
                    Array[
                        ST_SetSRID(ST_Point(40.6629311662891,-73.96648406982423), 4326),
                        ST_SetSRID(ST_Point(40.683241578458706,-73.96648406982423), 4326),
                        ST_SetSRID(ST_Point(40.683241578458706,-73.94210815429689), 4326),
                        ST_SetSRID(ST_Point(40.6629311662891,-73.94210815429689), 4326),
                        ST_SetSRID(ST_Point(40.6629311662891,-73.96648406982423), 4326)
                        ]
                    )
                )
            );

        