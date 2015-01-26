-- add column name for styling data based on zoning
ALTER TABLE map_pluto2014v2 ADD COLUMN zoning_style TEXT;

-- set zoning_style to 'R' for residential 
UPDATE map_pluto2014v2 SET zoning_style = 'R' WHERE allzoning1 ILIKE 'R%';

-- set zoning_style to 'C' for commericial
UPDATE map_pluto2014v2 SET zoning_style = 'C' WHERE allzoning1 ILIKE 'C%' and allzoning1 not ILIKE '%R%';

-- set zoning_style to 'RC' for residential & commericial
UPDATE map_pluto2014v2 SET zoning_style = 'RC' WHERE allzoning1 ILIKE 'C%R%';

-- set zoning_style to 'M' for manufacturing
UPDATE map_pluto2014v2 SET zoning_style = 'M' WHERE allzoning1 ILIKE 'M%';

-- set zoning_style to 'P' for parkland
UPDATE map_pluto2014v2 SET zoning_style = 'P' WHERE allzoning1 ILIKE 'P%';

-- set zoning_style to 'null' for NULL values
UPDATE map_pluto2014v2 SET zoning_style = 'null' WHERE allzoning1 = '';

-- create a new column for available FAR
ALTER TABLE map_pluto2014v2 ADD COLUMN availablefar REAL DEFAULT 0;

--- For Calculating FAR difference from total residential to built
UPDATE map_pluto2014v2 SET availablefar = residfar - builtfar WHERE allzoning1 ILIKE '%R%'; 

-- set negative and null values to 0
UPDATE map_pluto2014v2 SET availablefar = 0 WHERE availablefar < 0 OR availablefar IS NULL;

-- add column for long version of borough names 
ALTER TABLE map_pluto2014v2 ADD COLUMN boro_name_long TEXT;

-- create borough names from abbreviations:
UPDATE map_pluto2014v2 set boro_name_long = 'Manhattan' where borough = 'MN';

UPDATE map_pluto2014v2 set boro_name_long = 'Brooklyn' where borough = 'BK';

UPDATE map_pluto2014v2 set boro_name_long = 'Queens' where borough = 'QN';

UPDATE map_pluto2014v2 set boro_name_long = 'Staten Island' where borough = 'SI';

UPDATE map_pluto2014v2 set boro_name_long = 'Bronx' where borough = 'BX'

-- clean up after updating
vacuum analyze map_pluto2014v2;
cluster map_pluto2014v2 using map_pluto2014v2_gix;
