/*
	== UTILS.Map ==

	ex. var map = new UTILS.Map({
			target: $('#map'),
			title: 'title to show in the marker',
			address: 'address of the marker',
			styles: [], //to make sure default styles are used
			map_icon: '/images/icons/map_icon.png'
		}).show();

	== definitions ==
	@target - (required) DOM elm to hold the map
	@address - (required) specifies the address of the map
	@styles - (optional) map styles that define the visual settings (colors, border, etc...) - defaults to 'this.defaults('styles')'
	@settings - (optional) map settings that define the map settings (zoom level, scroll, etc...) - defaults to 'this.defaults('settings')'
	@title - (optional) specifies the title of the map --> defaults to ''
	@type - (optional) specifies what type of map to show --> defaults to 'roadmap'
	@latlong - (optional) specifies the center of the map --> defaults to '{lat:0,long:0}'
	@map_icon - (optional) defines the map icon to use --> defaults to 'this.values.map_icon_default'
	@map_marker - (optional) defines the type of marker to use --> defaults to default map marker
		--> @is_special_marker - (optional) to use custom marker, defaults to 'false' --> if custom marker, the map will be static
		--> @contact - (optional) to display contact info in the special marker, defaults to '{}' --> you can pass @phone,@fax,@email,etc...
	@is_static - (optional) whether to make the map interractive or static (no scrolling, dragging, etc...)
	@onShow - (optional) function to execute when the map is loaded (REPEAT EXECUTION) --> defaults to 'null'
	@onHide - (optional) function to execute when the map is hidden (REPEAT EXECUTION) --> defaults to 'null'
	@onMarkerShow - (optional) function to execute when the marker is shown (REPEAT EXECUTION) --> defaults to 'null'

*/

UTILS.Map = class extends UTILS.Base {
	constructor(data={}){
		super(data);

		this.setStyles(this.getDefaultConfig('styles'));
		this.setSettings(this.getDefaultConfig('settings'));
		this.setMarker(this.getDefaultConfig('marker'));
		this.setAddress(null);
		this.setType('roadmap');
		this.setMapIcon(null);
		this.setMapStatic(false);
		this.setTitle('');

		('api_key' in data) && this.setApiKey(data.api_key);
		('styles' in data) && this.setStyles(data.styles);
		('title' in data) && this.setTitle(data.title);
		('settings' in data) && this.setSettings(data.settings);
		('address' in data) && this.setAddress(data.address);
		('type' in data) && this.setType(data.type);
		('latlong' in data) && this.setLatLong(data.latlong);
		('map_icon' in data) && this.setMapIcon(data.map_icon);
		('is_static' in data) && this.setMapStatic(data.is_static);
		('map_marker' in data) && this.setMarker(data.map_marker);
		('onShow' in data) && this.addCallback('onShow',data.onShow);
		('onHide' in data) && this.addCallback('onHide',data.onHide);
		('onMarkerShow' in data) && this.addCallback('onMarkerShow',data.onMarkerShow);

		return this;
	}
	getDefaults(){
		return {
			object: 'utils.map',
			version: '1.0.0',
			$target: null,
			map_icon_default: '/images/icons/map-marker.png', //need to have it as its own variable so that in case we use it, we can center properly
			is_shown: false,
			api_key: '', //holds the api key
			map: {
				config: { styles:{}, settings:{} },
				plugins: {
					maps: { plugin:'maps', ver:'3', options:{ other_params:'sensor=false'}, is_loaded:false }
				}
			},
			marker: {
				is_created: false
			},
			latlong: { lat:0, long:0 }
		};
	}
	// @config - name of the map config
	getDefaultConfig(config){
		var defaults = {
			styles: [
				{featureType:'landscape',stylers:[{gamma:.8},{visibility:'simplified'},{color:'#938080'},{saturation:-100},{lightness:51}]},
				{featureType:'road.local',stylers:[{saturation:-100}, {lightness:-13}, {visibility:'on'}]},
				{featureType:'road.highway',stylers:[{gamma:1.39}, {saturation:3}, {lightness:-10}, {visibility:'on'}]},
				{featureType:'road.arterial',stylers:[{gamma:.86}, {lightness:14}, {visibility:'on'}, {saturation:-25}]},
				{featureType:'water',stylers:[{lightness:-11}, {saturation:-35}]},
				{featureType:'poi',stylers:[{visibility:'on'}, {saturation:-100}, {lightness:-24}, {gamma:.88}]},
				{featureType:'poi'}
			],
			settings: {
				zoom: 16,
				scrollwheel: true,
				disableDefaultUI: false,
				panControl: true,
				zoomControl: true,
				mapTypeControl: true,
				scaleControl: true,
				streetViewControl: true,
				overviewMapControl: true,
				draggable: true,
				disableDoubleClickZoom: true
			},
			marker: {
				$elm: $('<div id="map-marker-'+this.getId()+'" class="map-marker">'),
				$content: $('<div class="map-content">'),
				$img: $('<img>'),
				$header: $('<h2 class="map-marker-header">'),
				$body: $('<div class="map-marker-body">'),
				$shadow: $('<div class="map-shadow">'),
				is_special_marker: false, //whether the marker should be a default one or custom
				//contact info to show when @is_special_marker is set to TRUE
				contact: {
					img: '/images/icons/map-marker-340x160.jpg'
				},
				offset: { lat:-0.00096, lng:0.0015 } //lat - up/down, lng - left/right ... from the center
			}
		};

		return defaults[config];
	}
	//private - shows an error
	showError(error){
		alert(error||'unknown error has occurred.');
	}
	getApiKey(){
		return this.values.api_key;
	}
	setApiKey(api_key){
		this.values.api_key = api_key;
		return this;
	}
	getDom($elm){
		return $elm[0];
	}
	getMapIcon(type){
		return (type && /^default$/i.test(type)) ? this.values.map_icon_default : this.values.map_icon;
	}
	setMapIcon(map_icon){
		this.values.map_icon = map_icon;
		return this;
	}
	getTitle(){
		return this.values.title;
	}
	setTitle(title){
		this.values.title = title;
		return this;
	}
	getOffset(){
		return this.values.offset;
	}
	setOffset(offset){
		_.assign(this.values.offset,offset);
		return this;
	}
	getMarker(){
		return this.values.marker;
	}
	setMarker(options){
		var marker = this.getMarker();
		_.extend(marker,options);

		//we need to make sure all default contact values have been specified, or we put the default values back in
		var contact = this.getDefaultConfig('marker').contact; //get default settings for contact
		for (var k in contact){
			if (!(k in marker.contact))
				marker.contact[k] = contact[k];
		}

		var offset = this.getDefaultConfig('marker').offset;
		for (var k in offset){
			if (!(k in marker.offset))
				marker.offset[k] = offset[k];
		}

		//update img src
		marker.$img.attr('src',marker.contact.img);

		//if not default marker, make the map static so that the special marker can be shown
		this.setMapStatic(!!marker.is_special_marker);

		return this;
	}
	isMapStatic(){
		return !!this.values.is_static;
	}
	setMapStatic(state){
		this.values.is_static = !!(state);
		var settings = { panControl:true, zoomControl:true, mapTypeControl:true, scaleControl:true, streetViewControl:true, overviewMapControl:true, draggable:true, disableDoubleClickZoom:true, scrollwheel:true };

		if (state){
			for (var k in settings){
				settings[k] = false;
			}
		}

		this.setSettings(settings);
		return this;
	}
	getAddress(){
		return this.values.address;
	}
	setAddress(address){
		this.values.address = address;
		return this;
	}
	getType(){
		return this.values.type;
	}
	setType(type){
		this.values.type = type;
		return this;
	}
	getLatLong(){
		return this.values.latlong;
	}
	setLatLong(latlong){
		_.extend(this.values.latlong,latlong||{});
		return this;
	}
	getSettings(){
		return this.values.map.config.settings;
	}
	setSettings(settings){
		_.extend(this.getSettings(),settings);
		return this;
	}
	getStyles(){
		return this.values.map.config.styles;
	}
	setStyles(styles){
		_.isArray(styles) && (this.values.map.config.styles = styles);
		return this;
	}
	allRrequirementsLoaded(){
		var allow = true,
			msgs = [];

		if (!this.getTarget())
			msgs.push('@target must be specified');

		if (!this.getAddress().length)
			msgs.push('@address must be specified');

		if (msgs.length){
			allow = false;
			console.error(msgs.join('\n\n'));
		}

		return allow;
	}
	//loads the google maps, if there are changes to the settings, we can always re-load it again
	show(){
		if (this.allRrequirementsLoaded()){
			this.loadPlugin('maps',function(){
				//map types
				var gtypes = { roadmap:'ROADMAP', satellite:'SATELLITE', hybrid:'HYBRID', terrain:'TERRAIN'},
					settings = this.getSettings(),
					map_icon = this.getMapIcon(),
					latlong = this.getLatLong(),
					marker = this.getMarker();

				settings.mapTypeId = google.maps.MapTypeId[gtypes[this.getType()]];
				settings.styles = this.getStyles();
				settings.center = new google.maps.LatLng(latlong.lat,latlong.long); //set center
				var Map = new google.maps.Map(this.getDom(this.getTarget()),settings);
				var geocoder = new google.maps.Geocoder();
				geocoder.geocode({ address:this.getAddress() },function(results,status){
					if (status==google.maps.GeocoderStatus.OK){
						var loc = results[0].geometry.location;

						if (marker.is_special_marker)
							var coords = new google.maps.LatLng(loc.lat()+marker.offset.lat,loc.lng()+marker.offset.lng);
						else
							var coords = new google.maps.LatLng(loc.lat(),loc.lng());

						Map.setCenter(coords);
						var data = {
							map:Map,
							//position:map.getCenter(),
							position:loc,
							title:this.getTitle(),
							disableAutoPan:true
						};

						//check if there is a map icon
						if (map_icon)
							data.icon = map_icon;
						else { //default map icon
							data.icon = this.getMapIcon('default');
							//custom marker
							(marker.is_special_marker) && (data.position = new google.maps.LatLng(loc.lat()+0.000005,loc.lng()+0.00001));
						}

						var Marker = new google.maps.Marker(data);
						var content = this.renderMarker();
						var info_window = new google.maps.InfoWindow({
							content:content,
							maxWidth:340
						});

						if (!marker.is_special_marker)
							google.maps.event.addListener(Marker,'click',function(event){
								info_window.open(Map,Marker);
								this.fns('onMarkerShow');
							}.bind(this));
						else
							Marker.setMap(Map);

						google.maps.event.addListener(Marker,'click',function(event){ _log(event); });
					}
				}.bind(this));

				this.fns('onShow');
				this.values.is_shown = true;
			}.bind(this));
		}
		return this;
	}
	hide(){
		this.fns('onHide');
		return this;
	}
	/* MARKER FUNCTIONS */

	//private - creates the marker html
	createMarker(){
		if (!this.values.marker.is_created){
			var $target = this.getTarget(),
				marker = this.getMarker();

			$target.append(
				marker.$elm.append(
					marker.$content.append(marker.$img,marker.$header,marker.$body),
					marker.$shadow
				)
			);
			marker.is_created = true;
		}
		
		return this;
	}
	//private - formats the content for proper display
	formatMarkerContent(content,type,_class){
		var html = null;
		
		if (content && type){
			switch(type){
				case 'phone': html = '<span class="phone">'+content+'</span>'; break;
				case 'fax': html = '<span class="fax">'+content+'</span>'; break;
				case 'email': html = '<span class="email"><a href="#" onclick="mailto:'+content+',\'Please get in touch\');return false;">'+content+'</a></span>'; break;
				case 'address':
					var address = content.replace(/(,){1}/,'</span><span class="addr">'); //replace the 1st comma
					html = '<span class="addr">'+address+'</span>';
					break;
				case 'directions': html = '<span><a href="http://maps.google.com/maps?q='+UTILS.format.urlEncode(content)+'" target="_blank"><i class="mdi mdi-map-marker"></i> Get Directions</a></span>'; break;
			}
		}
		
		return html;
	}
	//private - generates the html to display inside the special marker
	//since the map is static, we are displaying additional information such as 'get directions' link
	getMarkerContent(){
		var marker = this.getMarker(),
			address = this.getAddress(),
			html = `<table class="map-marker-content">
				<tr>
					<td>
						<ul class="address">
							<li>
								${ this.formatMarkerContent(address,'address') }
								${ ('email' in marker.contact) && this.formatMarkerContent(marker.contact.email,'email') }
							</li>
						</ul>
					</td>
					<td>
						<ul class="address">
							<li>
								${ ('phone' in marker.contact) && this.formatMarkerContent(marker.contact.phone,'phone') }
								${ this.formatMarkerContent(address,'directions') }
							</li>
						</ul>
					</td>
				</tr>
			</table>`;

		return html;
	}
	//private - get the content for the marker info window
	renderMarker(){
		var $content = null,
			marker = this.getMarker(),
			title = this.getTitle(),
			address = this.getAddress();

		if (marker.is_special_marker){
			if (!marker.is_created)
				this.createMarker();
			
			//set content
			marker.$header.html(title);
			marker.$body.html(this.getMarkerContent());
			$content = this.getDom(marker.$elm);
		}
		else
			$content = (title.length ? title+'<br>' : '')+address;

		return $content;
	}
	/* PLUGIN FUNCTIONS */

	//loads the map plugin, then call 'callback'
	//e.q. this.loadPlugin('year_view');
	loadPlugin(plugin,callback){
		var _plugin = this.getPlugin(plugin);

		//must deffer the callback to inject the initialization of the xcal plugin
		var _callback = function(){
			if (_plugin && !_plugin.is_loaded)
				_plugin.is_loaded = true;

			_.isFunction(callback) && callback(); //only now call the real callback
		}.bind(this);

		if (_plugin && !_plugin.is_loaded){
			google.load(
				_plugin.plugin,
				_plugin.ver,
				_.extend(_plugin.options,{
					callback:_callback,
					other_params:'key='+this.getApiKey()
				})
			);
		}
		else
			_callback();

		return this;
	}
	//private - resets the plugin, then re-loads it again
	resetPlugin(plugin,callback){
		var _plugin = this.getPlugin(plugin);

		if (_plugin){
			_plugin.is_loaded = false;
			this.loadPlugin(_plugin,callback);
		}

		return this;
	}
	getPlugin(plugin){
		return _.isString(plugin) ? this.values.map.plugins[plugin] : plugin;
	}
	//private - returns true|false whether a plugin is loaded
	isPluginLoaded(plugin){
		var _plugin = this.getPlugin(plugin);
		return (_plugin) ? _plugin.is_loaded : false;
	}
};

// Export node module.
if ( typeof module !== 'undefined' && module.hasOwnProperty('exports') ){
	module.exports = UTILS.Map;
}