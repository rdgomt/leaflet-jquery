// Posição inicial do mapa (coordenadas LatLong e Zoom)
const posicaoInicial = [-30.47, -53.675, 7]

// Inicializa o mapa
let map = new L.Map('map', { 
	center: new L.LatLng(posicaoInicial[0], posicaoInicial[1]), 
	zoom: posicaoInicial[2]
});

// Tile Layers
const osm = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>'
});
const esriTopo = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri'
});
const esriSat = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri'
});
map.addLayer(esriTopo);

// Estilos
const defaultStroke = '#4d4d4d'
const defaultStrokeLight = '#999999'
const highlightStyle = {	
    color: 'deepskyblue',
    fillColor: 'transparent',
	weight: 2,
    opacity: 1,    
}
function getColor(id) {
	return id == 1 ? '#009933' :
		   id == 2 ? '#ffeda0' : 
		   'black'
}

// Carregar camadas GeoJSON via leaflet-ajax
const geoserverURL = {
	estado: "http://localhost:8080/geoserver/rsbiomonitora/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=rsbiomonitora:estado_sem_lagoas&maxFeatures=50&outputFormat=application%2Fjson",
	biomas: "http://localhost:8080/geoserver/rsbiomonitora/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=rsbiomonitora:biomas_sirgas2000&maxFeatures=50&outputFormat=application%2Fjson",
	mun: "http://localhost:8080/geoserver/rsbiomonitora/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=rsbiomonitora:municipios_com_lagoas&maxFeatures=500&outputFormat=application%2Fjson",
	bacias: "http://localhost:8080/geoserver/rsbiomonitora/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=rsbiomonitora:bacias_sirgas2000&maxFeatures=50&outputFormat=application%2Fjson",
}
const estado = new L.GeoJSON.AJAX("estado.geojson",{
	titulo: 'Estado',
	onEachFeature: onEachFeature,
	style: function (feature) {
		return {
			weight: 1.5,
			color: defaultStroke,
			fillColor: 'transparent',					
		}
	}	
}).addTo(map)
const biomas = new L.GeoJSON.AJAX("biomas.geojson",{
	titulo: 'Biomas',
	onEachFeature: onEachFeature,
	style: function (feature) {
		return {        
			weight: 1,
			color: "transparent",
			fillColor: getColor(feature.properties.gid),
			fillOpacity: .5
		}
	},
})
const mun = new L.GeoJSON.AJAX("municipios.geojson",{
	titulo: 'Municípios',
	onEachFeature: onEachFeature,
	style: function (feature) {
		return {
			weight: 1,
			color: defaultStrokeLight,
			fillColor: 'transparent',
			opacity: 1,
		}
	}
})
/* const bacias = new L.GeoJSON.AJAX("bacias_simplificado.geojson",{
	titulo: 'Bacias Hidrográficas',
	onEachFeature: onEachFeature,
		style: function (feature) {
		return {
			weight: 1,
			color: 'blue',
			fillColor: 'transparent',
			opacity: 1,			
		}
	}		
}) */

// IMPORTANTE!!!
// Explorar as diferenças entre requisições AJAX e jQuery!!!



// Map events
const coordenadasDiv = document.getElementById('coordenadas')
map.on({
	click: () => dehighlight(),
	popupclose: () => dehighlight(),
	/* mousemove: (e) => {
		// Exibir coordenadas no canto da tela conforme movimento do mouse	
		coordenadasDiv.innerHTML = 
			`Latitude: ${(e.latlng.lat).toFixed(6)}, Longitude: ${(e.latlng.lng).toFixed(6)}`
	}, */
	overlayadd: (e) => {
		let layDiv = `#lgnd${(e.name).replace(' ', '')}`		
		$(layDiv).show()		
	},
	overlayremove: (e) => {
		let layDiv = `#lgnd${(e.name).replace(' ', '')}`		
		$(layDiv).hide()		
	}
})

// Função disparada para cada feição no mapa
let featureHighlighted = null
function onEachFeature (feature, layer) {
	layer.on({
		click: function(e) {				
				zoomReference = this
				// Alterar estilo ao selecionar feições (highlight e dehighlight)				
				if(featureHighlighted === null) {
					featureHighlighted = L.geoJSON(this.feature, {
						style: highlightStyle
					}).addTo(map);								
				} else {
					map.removeLayer(featureHighlighted);					
					featureHighlighted = L.geoJSON(this.feature, {
						style: highlightStyle
					}).addTo(map);					
				}
			}
		})
	// Conteúdo da popUp ao selecionar feições
	let popupContent = `<h3>${layer.options.titulo}</h3><table>`
	for (let i in feature.properties) {		
		popupContent += `<tr><th>${i}</th><td>${feature.properties[i]}</td></tr>`
	}
	popupContent += `</table></br><a href="#" onClick="zoomToFeature(zoomReference)">Zoom para</a>`
	layer.bindPopup(popupContent)	
}

// Dehighlight feição ao clicar no mapa (qualquer posição fora das camadas ativas)
// ou ao clicar no botão close de uma popup ativa
function dehighlight() {
	if (featureHighlighted !== null && featureHighlighted !== undefined) {
		map.removeLayer(featureHighlighted)
		featureHighlighted = null			
	}
}

// Voltar o mapa para posição inicial
function defaultZoom() {
	map.setView(L.latLng(posicaoInicial), posicaoInicial[2]);	
};

// Centralizar a feição selecionada
function zoomToFeature(f) {
	map.fitBounds(f.getBounds())
}

// Escala do mapa
const escala = L.control.scale({imperial: false, position: 'bottomleft',}).addTo(map)

// Sliders para controle de opacidade
const estadoSlider = $('#estadoSlider').slider({
	range: "min", min: 0, max: 1, value: 1, step: .01, slide: (event, ui) => {updateOpacity(ui.value, layer = estado)},
})
const biomasSlider = $('#biomasSlider').slider({
	range: "min", min: 0, max: 1, value: .5, step: .01, slide: (event, ui) => {updateOpacity(ui.value, layer = biomas)},
})
const munSlider = $('#munSlider').slider({
	range: "min", min: 0, max: 1, value: 1, step: .01, slide: (event, ui) => {updateOpacity(ui.value, layer = mun)},
})
const baciasSlider = $('#baciasSlider').slider({
	range: "min", min: 0, max: 1, value: 1, step: .01, slide: (event, ui) => {updateOpacity(ui.value, layer = bacias)},
})

// Atualiza o valor da opacidade das camadas
function updateOpacity(v, layer) {
	layer.setStyle({opacity: v, fillOpacity: v})	
}

// Controle de camadas
const baseMaps = {	
	"Esri Topográfico": esriTopo,
	"Esri Satélite": esriSat,
	"OpenStreetMap": osm,
};
const overlayMaps = {
	"Estado": estado,
	"Biomas": biomas,
	"Municípios": mun,	
};
L.control.layers(baseMaps, overlayMaps, {collapsed: false}).addTo(map)

// Botão para Tela Cheia
/* const fullScreen = L.control.fullscreen({
	position: 'topleft',
	title: 'Modo de tela cheia',
	titleCancel: 'Sair do modo tela cheia',
	content: null, // change the content of the button, can be HTML, default null
	forceSeparateButton: false, // force seperate button to detach from zoom buttons, default false
	forcePseudoFullscreen: false, // force use of pseudo full screen even if full screen API is available, default false
	fullscreenElement: false // Dom element to render in full screen, false by default, fallback to map._container
}).addTo(map); */


/////////////////////////////////////// TESTES /////////////////////////////////////////

$('#checkEstado').on('change', function() {    
	if (map.hasLayer(estado)) {
		map.removeLayer(estado)
	} else {
		map.addLayer(estado)
	}
})
$('#checkBiomas').on('change', function() {    
	if (map.hasLayer(biomas)) {
		map.removeLayer(biomas)
	} else {
		map.addLayer(biomas)
	}
})
$('#checkMun').on('change', function() {    
	if (map.hasLayer(mun)) {
		map.removeLayer(mun)
	} else {
		map.addLayer(mun)
	}
})