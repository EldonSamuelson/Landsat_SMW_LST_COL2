/*
Original Author: Sofia Ermida (sofia.ermida@ipma.pt; @ermida_sofia)
https://github.com/sofiaermida/Landsat_SMW_LST

Updated to USGS Collection 2 Definitions by Séamus O'Donnell (https://bit.ly/3P0jXUO)

This code is free and open. 
By using this code and any data derived with it, you agree to cite the following 
reference in any publications derived from them:
Ermida, S.L., Soares, P., Mantas, V., Göttsche, F.-M., Trigo, I.F., 2020. 
    Google Earth Engine open-source code for Land Surface Temperature estimation from the Landsat series.
    Remote Sensing, 12 (9), 1471; https://doi.org/10.3390/rs12091471

this function computes NDVI values for Landsat from SR(L2) Products

to call this function use:

var NDVIfun = require('users/SeamusWOD/SE_LST_COL2:Modules/Col2_compute_NDVI.js')
var ImagewithNDVI = NDVIfun.addBand(landsat)(image)
or
var collectionwithNDVI = ImageCollection.map(NDVIfun.addBand(landsat))

INPUTS:
        - landsat: <string>
                  the Landsat satellite id
                  valid inputs: 'L4', 'L5', 'L7', 'L8' and 'L9'
        - image: <ee.Image>
                image for which to calculate the NDVI
OUTPUTS:
        - <ee.Image>
          the input image with 1 new band: 
          'NDVI': normalized difference vegetation index
      
  11-07-2022: Scaling factor changed in Lines 50-51, as per:
              https://www.usgs.gov/faqs/how-do-i-use-scale-factor-landsat-level-2-science-products
*/

exports.addBand = function(landsat){
  var wrap = function(image){
    
    // choose bands
	// If it's Landsat 8/9, NIR = B5, RED = B4. Otherwise (L4/5/7), NIR = B4, RED = B3
    var nir = ee.String(ee.Algorithms.If(landsat==='L9','SR_B5',
						ee.Algorithms.If(landsat==='L8','SR_B5','SR_B4')));
    var red = ee.String(ee.Algorithms.If(landsat==='L9','SR_B4',
						ee.Algorithms.If(landsat==='L8','SR_B4','SR_B3')));
  
    // compute NDVI 
    return image.addBands(image.expression('(nir-red)/(nir+red)',{
      'nir':image.select(nir).multiply(0.0000275).add(-0.2),
      'red':image.select(red).multiply(0.0000275).add(-0.2)
    }).rename('NDVI'));
  };
  return wrap;
};