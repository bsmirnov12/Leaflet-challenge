// JavaScript-challenge
// UT-TOR-DATA-PT-01-2020-U-C Week 17 Homework
// (c) Boris Smirnov

/**
 * Returns color based on the earthquake magnitude
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
 * Creates a popup for given feature (earthquake)
 * @param {Object} layer - a marker layer with a feature corresponding to an earthquake
 */
function popupContent(layer) {
    const props = layer.feature.properties;
    let d = new Date(props.time);
    return `<strong>Magnitude: ${props.mag}</strong><br><a href="${props.url}" target="#blank">${props.place}</a><br>${d.toUTCString()}`;
}

/**
 * Makes legend custom control
 * Curtesy to Vladimir Agafonkin
 * https://leafletjs.com/examples/choropleth/#custom-legend-control
 */
function makeLegend() {
    let legend = L.control({position: 'bottomright'});

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

    return legend;
}

/**
 * Function gets a GeoJSON dataset, creates a map and puts earthquake markers on it
 * @param {Object} data - GeoJSON object with array of features corresponding to earthquake
 */
function mapEarthquakes(data) {

    var map = L.map('map', {
        center: [15, -15],
        tileSize: 512,
        zoomOffset: -1,
        zoom: 3,
        maxZoom: 18
    });

    L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
        attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
        maxZoom: 18,
        id: 'mapbox/light-v10',
        accessToken: API_KEY
    }).addTo(map);

    L.geoJSON(data, {
        pointToLayer: (geoJsonPoint, latlng) => { return L.circleMarker(latlng) },
        style: styleFeature
    }).bindPopup(popupContent, { className: 'popup' }).addTo(map);

    makeLegend().addTo(map);
}

/**
 * URL to Earthquake feed on USGS website
 * Past Day/All Earthquakes/Updated every minute
 */
const url = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';

/**
 * Loads Earthquake feed from USGS website
 */
d3.json(url)
    .then(mapEarthquakes)
    .catch(error => { console.log(error) });
  