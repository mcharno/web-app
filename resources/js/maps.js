/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

var map = new OpenLayers.Map({
    div: "map",
    projection: "EPSG:900913",
    displayProjection: "EPSG:4326",
    numZoomLevels: 18
});
// create Google Mercator layers
var gphy = new OpenLayers.Layer.Google(
    "Google Physical",
    {type: google.maps.MapTypeId.TERRAIN}
);
var gsat = new OpenLayers.Layer.Google(
    "Google Satellite",
    {type: google.maps.MapTypeId.SATELLITE, numZoomLevels: 22}
);

var center = new OpenLayers.LonLat(-12.0,12.0);

map.addLayers([
    gphy, gsat
]);
//map.addControl(new OpenLayers.Control.LayerSwitcher());
map.addControl(new OpenLayers.Control.Permalink());
map.addControl(new OpenLayers.Control.MousePosition());
map.setCenter(new OpenLayers.LonLat(-14, 18).transform(
                    new OpenLayers.Projection("EPSG:4326"),
                    map.getProjectionObject()
                ), 2
            );  