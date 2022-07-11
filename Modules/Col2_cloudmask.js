/*
Original Author: Sofia Ermida (sofia.ermida@ipma.pt; @ermida_sofia)
https://github.com/sofiaermida/Landsat_SMW_LST

Ermida, S.L., Soares, P., Mantas, V., Göttsche, F.-M., Trigo, I.F., 2020. 
    Google Earth Engine open-source code for Land Surface Temperature estimation from the Landsat series.
    Remote Sensing, 12 (9), 1471; https://doi.org/10.3390/rs12091471
    
Updated to USGS Collection 2 Definitions by Séamus O'Donnell 
(https://www.linkedin.com/in/seamusodonnell/)

This code is free and open. 

this function mask clouds and cloud shadow using the Quality bands from the USGS

to call this function use:

var cloudmask = require('users/SeamusWOD/SE_LST_COL2:Modules/Col2_cloudmask.js')
var TOAImageMasked = cloudmask.toa(image)
var SRImageMasked = cloudmask.sr(image)
or
var TOAcollectionMasked = ImageCollection.map(cloudmask.toa)
var SRcollectionMasked = ImageCollection.map(cloudmask.sr)


INPUTS:
        - image: <ee.Image>
                image for which clouds are masked 
OUTPUTS:
        - <ee.Image>
          the input image with updated mask
*/


// cloudmask for TOA data
exports.toa = function(image) {
  var qa = image.select('QA_PIXEL');
  var mask = qa.bitwiseAnd(1 << 3)
    .or(qa.bitwiseAnd(1 << 4));
  return image.updateMask(mask.not());
};

// cloudmask for SR data
exports.sr = function(image) {
  var qa = image.select('QA_PIXEL');
  var mask = qa.bitwiseAnd(1 << 3)
    .or(qa.bitwiseAnd(1 << 4));
  return image.updateMask(mask.not());
};