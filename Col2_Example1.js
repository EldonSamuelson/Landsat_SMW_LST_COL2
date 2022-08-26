/*
Original Author: Sofia Ermida (sofia.ermida@ipma.pt; @ermida_sofia)
https://github.com/sofiaermida/Landsat_SMW_LST

Updated to USGS Collection 2 Definitions by Séamus O'Donnell 
(https://www.linkedin.com/in/seamusodonnell/)

This code is free and open. 
By using this code and any data derived with it, you agree to cite the following 
reference in any publications derived from them:
Ermida, S.L., Soares, P., Mantas, V., Göttsche, F.-M., Trigo, I.F., 2020. 
    Google Earth Engine open-source code for Land Surface Temperature estimation from the Landsat series.
    Remote Sensing, 12 (9), 1471; https://doi.org/10.3390/rs12091471

Example 1:
  This example shows how to compute Landsat LST from Landsat-9 over Kerry, Ireland.
  This example is a modified version from the original images shown in Ermida et al. (2020), 
  updated for Collection 2 by Séamus.
    
*/
// link to the code that computes the Col 2 Landsat LST
var LandsatLST = require('users/SeamusWOD/SE_LST_COL2:Modules/Col2_Landsat_LST.js');

// select region of interest, date range, and landsat satellite
var geometry = 
    /* color: #98ff00 */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[-10.74497362323008, 52.34948719034636],
          [-10.74497362323008, 51.98899298221422],
          [-9.34421678729258, 51.98899298221422],
          [-9.34421678729258, 52.34948719034636]]], null, false);

var satellite = 'L9';
var date_start = '2022-01-01';
var date_end = '2022-08-31';
var use_ndvi = true;
var IC_List_Number = 24;

// get landsat collection with added variables: NDVI, FVC, TPW, EM, LST
var LandsatColl = LandsatLST.collection(satellite, date_start, date_end, geometry, use_ndvi);
print(LandsatColl);



// select the X (number) feature of the image collection
print('Previewing Tile: ' + IC_List_Number);
print('Change the IC_List_Number to get a different Tile (results may vary)')
var listOfImages = LandsatColl.toList((LandsatColl.size()));
//print(listOfImages);
var exImage = ee.Image(listOfImages.get(IC_List_Number));

// Visualisation Palettes
var LSTmap = {
        min: 273,
        max: 303,
        opacity: 0.45,
        palette: ['blue', 'cyan', 'green', 'yellow', 'red']
        };
        
var BTmap = {
        min: 35852,
        max: 43988,
        palette: ['blue', 'cyan', 'green', 'yellow', 'red']
        };
        
var tpwmap = {
        min: 0,
        max: 60,
        palette: ['F2F2F2','EFC2B3','ECB176','E9BD3A','E6E600','63C600','00A600']
        }; 

var tpwposmap = {
        min: 0,
        max: 9,
        palette: ['F2F2F2','EFC2B3','ECB176','E9BD3A','E6E600','63C600','00A600']
        }; 

var fvcmap = {
        min: 0,
        max: 1,
        palette: ['F2F2F2','EFC2B3','ECB176','E9BD3A','E6E600','63C600','00A600']
        }; 

var emmap = {
        min: 0.9,
        max: 1,
        palette: ['F2F2F2','EFC2B3','ECB176','E9BD3A','E6E600','63C600','00A600']
        }; 
        
// center and zoom map to AOI
Map.centerObject(geometry, 9);

// Adding Map Layers
Map.addLayer(exImage.select('TPW'),tpwmap,'TCWV', false);
Map.addLayer(exImage.select('TPWpos'),tpwposmap,'TCWVpos', false);
Map.addLayer(exImage.select('FVC'),fvcmap, 'FVC', false);
Map.addLayer(exImage.select('EM'),emmap, 'Emissivity', false);
    // Add Thermal B10 Brightness Temperature Band (will give the unsigned 16 bit integer value, remove the /**/ for LST Scaling Factor)
Map.addLayer(exImage.select('ST_B10')/*.multiply(0.00341802).add(149.0)*/,BTmap, 'TIR BT', false);
    // Add SR RGB with new Col2 Scaling Factor. Inspector gives unsigned 16-bit values
Map.addLayer(exImage.multiply(0.0000275).add(-0.2),{bands: ['SR_B4', 'SR_B3', 'SR_B2'], min:0, max:0.3}, 'RGB');
    // LST already has scaling factor applied, which matches ST_B10 with Scaling Factor applied
Map.addLayer(exImage.select('LST'),LSTmap, 'LST');


//LEGEND (Vertical, Gradient, position can be changed intuitvely)
// set position of panel
var legendpos = ui.Panel({
  style: {
    position: 'bottom-right',
    padding: '8px 15px'
  }
});
 
// Create legend title
var legendTitle = ui.Label({
  value: 'Land\nSurface\nTemperature\n(K)',
  style: {
    fontWeight: 'bold',
    fontSize: '16px',
    margin: '0 0 4px 0',
    padding: '0',
    whiteSpace: 'pre'
    }
});

 // Add the title to the panel
legendpos.add(legendTitle); 

// create the legend image
var lon = ee.Image.pixelLonLat().select('latitude');
var gradient = lon.multiply((BTmap.max-BTmap.min)/100).add(BTmap.min);
var legendImage = gradient.visualize(BTmap);

// create text on top of legend
var panel = ui.Panel({
    widgets: [
      ui.Label(LSTmap['max'])
    ],
  });

legendpos.add(panel);
  
// create thumbnail from the image
var thumbnail = ui.Thumbnail({
  image: legendImage, 
  params: {bbox:'0,0,10,100', dimensions:'10x200'},  
  style: {padding: '1px', position: 'bottom-center'}
});

// add the thumbnail to the legend
legendpos.add(thumbnail);

// create text on top of legend
var panel = ui.Panel({
    widgets: [
      ui.Label(LSTmap['min'])
    ],
  });

legendpos.add(panel);

Map.add(legendpos);

// uncomment the code below to export a image band to your drive
/*
Export.image.toDrive({
  image: exImage.select('LST'),
  description: 'LST',
  scale: 30,
  region: geometry,
  fileFormat: 'GeoTIFF',
});
*/
