// JavaScript-challenge
// UT-TOR-DATA-PT-01-2020-U-C Week 17 Homework
// (c) Boris Smirnov


/**
 * Layer with tectonic boundaries (fault lines)
 */
var faultLines;

/**
 * Makes overlay layer with tectonic boundaries
 * @param {Object} data - GeoJSON features collection
 */
function makeFaultLines(data) {
    faultLines = L.geoJSON(data, {
        style: {
            color: 'orange', // base layers can change that
            weight: 2
        }
    });
}


/**
 * Returns color based on earthquake magnitude
 * @param {float} mag - magnitude
 * @return {string} - HTML color code
 */
function getColor(mag) {
    return  mag < 1.0 ? '#6dac00' :
            mag < 2.0 ? '#98ee00' :
            mag < 3.0 ? '#d4ee00' :
            mag < 4.0 ? '#eecc00' :
            mag < 5.0 ? '#ee9c00' :
                        '#ea822c';
}


/**
 * Style a feature
 * @param {Object} feat - GeoJSOn feature with one Earthquake info
 * @return {Object} - style
 */
function styleFeature(feat) {
    const scale = 4;
    const mag = feat.properties.mag;

    return {
        color: '#888400',
        weight: 1,
        fillColor: getColor(mag),
        fillOpacity: 1.0,
        radius: mag * scale
    }
}


/**
 * Creates a popup for a given feature (earthquake)
 * @param {Object} layer - a marker layer with a feature corresponding to an earthquake
 */
function popupContent(layer) {
    const props = layer.feature.properties;
    let d = new Date(props.time);
    return `<strong>Magnitude: ${props.mag}</strong><br><a href="${props.url}" target="#blank">${props.place}</a><br>${d.toUTCString()}`;
}


/**
 * Legend object for the earthquakes layer.
 * Keeping it global to be able show/hide it along with the earthquakes layer.
 * Curtesy to Vladimir Agafonkin
 * https://leafletjs.com/examples/choropleth/#custom-legend-control
 */
var legend;

/**
 * Makes legend custom control
 * @return {L.Control} - legend custom control
 */
function makeLegend() {
    legend = L.control({position: 'bottomright'});

    legend.onAdd = function(map) {

        let div = L.DomUtil.create('div', 'info legend');
        let grades = [0, 1, 2, 3, 4, 5];

        // loop through our density intervals and generate a label with a colored square for each interval
        for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<i style="background:' + getColor(grades[i]) + '"></i> ' +
                grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
        }

        return div;
    };
}


/**
 * Layer with earthquake markers
 */
var earthquakes;

/**
 * Makes overlay layer with earthquake markers and legend control
 * @param {Object} data - GeoJSON features collection
 */
function makeEarthquakes(data) {
    earthquakes = L.geoJSON(data, {
        pointToLayer: (geoJsonPoint, latlng) => { return L.circleMarker(latlng) },
        style: styleFeature
    }).bindPopup(popupContent, { className: 'leaflet-popup-content-wrapper' });

    makeLegend();
}


/**
 * Makes tiles of different flavours for base maps layer
 * @return {Object} - base maps object
 */
function makeTiles() {
    const tiles = [
        ['Satellite', 'mapbox/satellite-v9', 'orange'],
        ['Grayscale', 'mapbox/light-v10', 'yellow'],
        ['Outdoors', 'mapbox/outdoors-v11', 'white']
    ];
    var baseMaps = {};

    tiles.forEach(tile => {
        const name = tile[0];
        const id = tile[1];
        const flColor = tile[2];

        var t = L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
            attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
            maxZoom: 18,
            id: id,
            accessToken: API_KEY
        });
        baseMaps[name] = t;

        // Add some interactivity: change color of the fault lines depending on the selected base layer
        t.on({
            add: e => { faultLines.setStyle({color: flColor}) }
        });
    });

    return baseMaps;
}


/**
 * Function creates a map and puts everything on it...
 */
function createMap() {

    // Create base layers and collect all previously created overlays
    let baseMaps = makeTiles();
    let overlayMaps = {
        'Fault Lines': faultLines,
        'Earthquakes' : earthquakes
    };

    // Create a map
    let map = L.map('map', {
        center: [15, -15],
        tileSize: 512,
        zoomOffset: -1,
        zoom: 3,
        maxZoom: 18,
        layers: [ faultLines, earthquakes, Object.values(baseMaps)[0] ]
    });

    // Put legend and layer control on the map
    legend.addTo(map);
    L.control.layers(baseMaps, overlayMaps, { collapsed: false }).addTo(map);
    
    // Add interactivity: show/hide the legend with earthquakes layer
    earthquakes.on({
        add: e => { legend.addTo(map) },
        remove: e => { legend.remove() }
    });
}


/**
 * Spinner to show until all data is loaded and the map is created
 */
var spinner = d3.select('#spinner');


/**
 * URL for tectonic plates boundaries data
 * https://github.com/fraxen/tectonicplates/blob/master/GeoJSON/PB2002_boundaries.json
 */
const flURL = 'PB2002_boundaries.json';

/**
 * URL to Earthquake feed on USGS website
 * Past Day/All Earthquakes/Updated every minute
 */
const eqURL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';

/**
 * Load data, create the map
 */
d3.json(flURL) // First promise: loading tectonic boundaries data
    .then(data => {
        makeFaultLines(data);
        return d3.json(eqURL); // Second promise: loading earthquakes data
    })
    .then(data => {
        makeEarthquakes(data);
        createMap();
        spinner.style('display', 'none'); // hide the spinner
    })
    .catch(error => {
        console.log(error);
        alert(error);
    });
