// Definierte Koordinaten der Bounding Box (BBOX). Die BBOX zeigt den groben Verlauf des Eisbergs
var coordinates = [
    [-39.50206272675964,-76.52540786659259],
    [-35.76671116425964,-76.14125875932427],
    [-35.15147678925964,-74.65813891593739],
    [-37.04112522675964,-73.63817240214726],
    [-43.19346897675964,-71.86043324936844],
    [-47.884350220299225,-70.791445322477],
    [-52.53147126246047,-68.7882328638025],
    [-50.98312330341858,-65.867401087748],
    [-48.42799218316733,-63.444147948486986],
    [-48.70265038629233,-62.36705064194698],
    [-48.41700585504233,-61.36210135090695],
    [-45.057894505134094,-60.61172855774463],
    [-41.876514544386396,-58.942023501000094],
    [-42.975147356886396,-56.599365433673064],
    [-49.632862200636396,-56.768326427129814],
    [-53.88741056277516,-59.39744992316877],
    [-56.58253335105747,-62.51261747305229],
    [-57.918121261305274,-65.854366426379],
    [-59.653961105055274,-68.52439176778273],
    [-59.0381181350501,-70.44921735933092],
    [-56.34534982597935,-72.06819787799117],
    [-50.47865060722935,-73.76618859497654],
    [-45.02943185722935,-74.85892782562598],
    [-44.66754263108324,-75.92180673668479],
    [-42.27252309983324,-76.58479227459244],
    [-39.50206272675964,-76.52540786659259]
  ];
  
  // Bounding Box als Polygon erstellen
  var bbox = ee.Geometry.Polygon([coordinates]);
  
  // Bounding Box Layer anzeigen
  Map.centerObject(bbox);
  Map.addLayer(bbox, {color: 'red'}, 'Bounding Box');
  
  // Zielprojektion (EPSG:3031 für Südpolare Stereographic-Projektion)
  var polarProj = ee.Projection('EPSG:3031');
  
  // Definiere Visualisierungsparameter für HH in der Google Earth Engine
  var visualizationHH = {
    bands: ['HH'],
    min: -18,
    max: 0,
    palette: ['blue', 'white', 'cyan']
  };
  
  // Funktion zum Generieren eines Bildes für einen bestimmten Monat
  function addMonthlyImage(year, month) {
    // Formatierung des Monats mit führender Null
    var formattedMonth = month < 10 ? '0' + month : month;
    
    // Formatierung des Monats
    var startDate = ee.Date.fromYMD(year, month, 1);
    var endDate = startDate.advance(1, 'month');
  
    // Filtern der Sentinel-1 Bildersammlung nach der Bounding Box und HH-Band
    var datasetHH = ee.ImageCollection('COPERNICUS/S1_GRD')
      .filterDate(startDate, endDate)
      .filterBounds(bbox)
      .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'HH'))
      .select(['HH']);
    
    // Merge der Bilder, weil BBOX zu groß ist um mit einem Sentinel 1 Foto alles abzudecken
    var imageHH = datasetHH.mosaic().clip(bbox);
  
    // Reprojiziere das Bild auf die Zielprojektion
    var reprojectedImageHH = imageHH.reproject({
      crs: polarProj,
      scale: 100 // Anpassen der Auflösung nach Bedarf. 100 heißt: Ein Pixel ist 100 Meter mal 100 Meter groß
    });
  
    // Füge das reprojizierte Bild zur Karte hinzu
    Map.addLayer(reprojectedImageHH, visualizationHH, 'Sentinel-1 HH Image ' + year + '-' + formattedMonth, false);
  
    // Exportiere das Bild in die Google Drive
    Export.image.toDrive({
      image: reprojectedImageHH,
      description: 'Sentinel1_HH_' + year + '_' + formattedMonth,
      folder: 'Sentinel1_Images', // Ordner in Google Drive, anpassen falls benötigt
      scale: 100,
      region: bbox,
      crs: 'EPSG:3031',
      maxPixels: 1e13
    });
  }
  
  // Bestimme das Zeitintervall (Januar 2022 bis Juni 2024)
  var startYear = 2022;
  var startMonth = 1;
  var endYear = 2024;
  var endMonth = 6;
  
  // Schleife durch die Jahre und Monate vom vorher festgelegten Zeitintervall
  for (var year = startYear; year <= endYear; year++) {
    var startM = (year === startYear) ? startMonth : 1;
    var endM = (year === endYear) ? endMonth : 12;
    for (var month = startM; month <= endM; month++) {
      addMonthlyImage(year, month);
    }
  }
  