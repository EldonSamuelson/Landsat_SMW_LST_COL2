/*
Original Author: Sofia Ermida (sofia.ermida@ipma.pt; @ermida_sofia)

Updated to Collection 2 Definitions by Séamus O'Donnell

This code is free and open. 
By using this code and any data derived with it, 
you agree to cite the following reference 
in any publications derived from them:
Ermida, S.L., Soares, P., Mantas, V., Göttsche, F.-M., Trigo, I.F., 2020. 
    Google Earth Engine open-source code for Land Surface Temperature estimation from the Landsat series.
    Remote Sensing, 12 (9), 1471; https://doi.org/10.3390/rs12091471

This function selects the Landsat data based on user inputs
and performes the LST computation

to call this function use:

var LandsatLST = require('users/SeamusWOD/SE_LST_COL2:Modules/Col2_Landsat_LST.js')
var LandsatCollection = LandsatLST.collection(landsat, date_start, date_end, geometry)

USES (Col2):
    - NCEP_TPW.js
    - cloudmask.js
    - compute_NDVI.js
    - compute_FVC.js
    - compute_emissivity.js
    - SMWalgorithm.js

INPUTS:
        - landsat: <string>
                  the Landsat satellite id
                  valid inputs: 'L4', 'L5', 'L7', 'L8' and 'L9'
        - date_start: <string>
                      start date of the Landsat collection
                      format: YYYY-MM-DD
        - date_end: <string>
                    end date of the Landsat collection
                    format: YYYY-MM-DD
        - geometry: <ee.Geometry>
                    region of interest
        - use_ndvi: <boolean>
                if true, NDVI values are used to obtain a
                dynamic emissivity; if false, emissivity is 
                obtained directly from ASTER
OUTPUTS:
        - <ee.ImageCollection>
          image collection with bands:
          - landsat original bands: all from SR excpet the TIR bands (from TOA) 
          - cloud masked
          - 'NDVI': normalized vegetation index
          - 'FVC': fraction of vegetation cover [0-1]
          - 'TPW': total precipitable water [mm]
          - 'EM': surface emissvity for TIR band
          - 'LST': land surface temperature
          
  14-08-2020: update to avoid using the getInfo() and if() 
    (Thanks Tyler Erickson for the suggestion)
*/

// MODULES DECLARATION -----------------------------------------------------------
// Total Precipitable Water 
var NCEP_TPW = require('users/SeamusWOD/SE_LST_COL2:Modules/Col2_NCEP_TPW.js');
//cloud mask
var cloudmask = require('users/SeamusWOD/SE_LST_COL2:Modules/Col2_cloudmask.js');
//Normalized Difference Vegetation Index
var NDVI = require('users/SeamusWOD/SE_LST_COL2:Modules/Col2_compute_NDVI.js');
//Fraction of Vegetation cover
var FVC = require('users/SeamusWOD/SE_LST_COL2:Modules/Col2_compute_FVC.js');
//surface emissivity
var EM = require('users/SeamusWOD/SE_LST_COL2:Modules/Col2_compute_emissivity.js');
// land surface temperature
var LST = require('users/SeamusWOD/SE_LST_COL2:Modules/Col2_SMWalgorithm.js');
// --------------------------------------------------------------------------------

// Note: the original script only had 'TIR' 
var COLLECTION = ee.Dictionary({
  'L4': {
    'TOA': ee.ImageCollection('LANDSAT/LT04/C02/T1_TOA'),
    'SR': ee.ImageCollection('LANDSAT/LT04/C02/T1_L2'),
	'TOA_TIR': ['B6',],
	'SR_TIR': ['ST_B6',]
  },
  'L5': {
    'TOA': ee.ImageCollection('LANDSAT/LT05/C02/T1_TOA'),
    'SR': ee.ImageCollection('LANDSAT/LT05/C02/T1_L2'),
    'TOA_TIR': ['B6',],
	'SR_TIR': ['ST_B6',]
  },
  'L7': {
    'TOA': ee.ImageCollection('LANDSAT/LE07/C02/T1_TOA'),
    'SR': ee.ImageCollection('LANDSAT/LE07/C02/T1_L2'),
    'TOA_TIR': ['B6_VCID_1','B6_VCID_2'],
	'SR_TIR': ['ST_B6',]
  },
  'L8': {
    'TOA': ee.ImageCollection('LANDSAT/LC08/C02/T1_TOA'),
    'SR': ee.ImageCollection('LANDSAT/LC08/C02/T1_L2'),
    'TOA_TIR': ['B10','B11'],
	'SR_TIR': ['ST_B10',]
  },
  'L9': {
    'TOA': ee.ImageCollection('LANDSAT/LC09/C02/T1_TOA'),
    'SR': ee.ImageCollection('LANDSAT/LC09/C02/T1_L2'),
    'TOA_TIR': ['B10','B11'],
  'SR_TIR': ['ST_B10',]
}});


exports.collection = function(landsat, date_start, date_end, geometry, use_ndvi) {

  // load TOA Radiance/Reflectance
  var collection_dict = ee.Dictionary(COLLECTION.get(landsat));

  var landsatTOA = ee.ImageCollection(collection_dict.get('TOA'))
                .filter(ee.Filter.date(date_start, date_end))
                .filterBounds(geometry)
                .map(cloudmask.toa);
              
  // load Surface Reflectance collection for NDVI
  var landsatSR = ee.ImageCollection(collection_dict.get('SR'))
                .filter(ee.Filter.date(date_start, date_end))
                .filterBounds(geometry)
                .map(cloudmask.sr)
                .map(NDVI.addBand(landsat))
                .map(FVC.addBand(landsat))
                .map(NCEP_TPW.addBand)
                .map(EM.addBand(landsat,use_ndvi));

  // combine collections
  // all channels from surface reflectance collection
  // all channels from TOA collection EXCEPT TIR
  // select TIR bands
  var tir = ee.List(collection_dict.get('SR_TIR'));
  var landsatALL = (landsatSR.combine(landsatTOA.select(tir), true));
  
  // compute the LST
  var landsatLST = landsatALL.map(LST.addBand(landsat));

  return landsatLST;
};


