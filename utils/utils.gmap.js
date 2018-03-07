/*
	== GMAP ==

	ex. var map = new GMAP({
			target:ART.GE('map'),
			title:'title to show in the marker',
			address:'address of the marker',
			styles:[], //to make sure default styles are used
			map_icon:'/images/icons/map_icon.png'
		}).show();

	== definitions ==
	@target - (required) DOM elm to hold the map
	@address - (required) specifies the address of the map
	@styles - (optional) gmap styles that define the visual settings (colors, border, etc...) - defaults to 'this.defaults('styles')'
	@settings - (optional) gmap settings that define the map settings (zoom level, scroll, etc...) - defaults to 'this.defaults('settings')'
	@marker - (optional) defines the type of marker to use --> defaults to default gmap marker
		--> @is_special_marker - (optional) to use custom marker, defaults to 'false' --> if custom marker, the map will be static
		--> @contact - (optional) to display contact info in the special marker, defaults to '{}' --> you can pass @phone,@fax,@email,@facebook, etc...
	@title - (optional) specifies the title of the map --> defaults to ''
	@type - (optional) specifies what type of map to show --> defaults to 'roadmap'
	@latlong - (optional) specifies the center of the map --> defaults to '{lat:0,long:0}'
	@map_icon - (optional) defines the map icon to use --> defaults to 'this.values.map_icon_default'
	@is_static - (optional) whether to make the map interractive or static (no scrolling, dragging, etc...)
	@onShow - (optional) function to execute when the map is loaded (REPEAT EXECUTION) --> defaults to 'null'
	@onHide - (optional) function to execute when the map is hidden (REPEAT EXECUTION) --> defaults to 'null'
	@on_marker_show - (optional) function to execute when the marker is shown (REPEAT EXECUTION) --> defaults to 'null'

*/

const GMAP = class extends UTILS.Base {
	constructor(data){
		super(data);

		_log(this.getObjectName()+' --> instantiated!', this.getId(), this);

		if (_.isPlainObject(data)){
			('onEnable' in data) && this.addCallback('onEnable', data.onEnable);
			('onDisable' in data) && this.addCallback('onDisable', data.onDisable);
			('onShow' in data) && this.addCallback('onShow', data.onShow);
			('onHide' in data) && this.addCallback('onHide', data.onHide);
			('onMarkerShow' in data) && this.addCallback('onMarkerShow', data.onMarkerShow);
		}
		return this;
	}
	getDefaults(){
		return {
			object: 'utils.gmap',
			version: '1.0.0',
			$target: null,
			map_icon_default: 'images/icons/gmap-marker.png', //need to have it as its own variable so that in case we use it, we can center properly
			is_shown: false,
			gmap: {
				config: { styles:{}, settings:{} },
				plugins: {
					maps: {
						plugin: 'maps',
						ver: '3',
						options: { other_params:'sensor=false'},
						is_loaded: false
					}
				}
			},
			marker: {
				is_created:false
			}


			styles: data.styles || this.defaults('styles'),
			settings: _.isPlainObject(data.settings) ? _.extend(this.defaults('settings'),data.settings) : this.defaults('settings'),
			is_static: ('is_static' in data) ? data.is_static : false,
			marker: _.isPlainObject(data.marker) ? _.extend(this.defaults('marker'),data.marker) : this.defaults('marker'),
			title: data.title || null,
			address: data.address || null,
			contact: data.contact || null,
			type: data.type || 'roadmap',
			latlong: _.isPlainObject(data.latlong) ? data.latlong : {lat:0,long:0},
			map_icon: data.map_icon || null,

		};
	}
	// @config - name of the gmap config
	defaults(config){
		var get_config = function(config){
			var data = null;
			switch(config){
				case 'styles':
					data = [
						{featureType:'landscape',stylers:[{gamma:.8},{visibility:'simplified'},{color:'#938080'},{saturation:-100},{lightness:51}]},
						{featureType:'road.local',stylers:[{saturation:-100}, {lightness:-13}, {visibility:'on'}]},
						{featureType:'road.highway',stylers:[{gamma:1.39}, {saturation:3}, {lightness:-10}, {visibility:'on'}]},
						{featureType:'road.arterial',stylers:[{gamma:.86}, {lightness:14}, {visibility:'on'}, {saturation:-25}]},
						{featureType:'water',stylers:[{lightness:-11}, {saturation:-35}]},
						{featureType:'poi',stylers:[{visibility:'on'}, {saturation:-100}, {lightness:-24}, {gamma:.88}]},
						{featureType:'poi'}
					];
					break;
				case 'settings':
					data = {
						zoom:16,
						scrollwheel:true,
						scaleControl:false,
						disableDefaultUI:false,
						panControl:true,
						zoomControl:true,
						mapTypeControl:true,
						scaleControl:true,
						streetViewControl:true,
						overviewMapControl:true,
						draggable:true,
						disableDoubleClickZoom:true,
						scrollwheel:true
					};
					break;
				case 'marker':
					data = {
						elm:ART.DIV({id:'gmap-marker-'+this.values.id,'class':'gmap-marker'}),
						content:ART.DIV({'class':'gmap-content'}),
						img:ART.IMG(),
						header:ART.H2({'class':'gmap-marker-header'}),
						body:ART.DIV({'class':'gmap-marker-body'}),
						shadow:ART.DIV({'class':'gmap-shadow'}),
						is_special_marker:false, //whether the marker should be a default one or custom
						contact:{ //contact info to show when @is_special_marker is set to TRUE
							img:(('base_path' in MAIN.values) ?  MAIN.values.base_path : '/')+'images/icons/gmap-marker-340x160.jpg' //340x160
						}
					};
					break;
			}
			return data;
		}.bind(this);

		return get_config(config);
	} //defaults

	clean(){
		ART.RE(this.values.elm);
		return this;
	}

	//private
	//executes a stack of functions (FIFO style)
	fns(type){ // @type - onEnable | onLoad | onView
		if (type && this.values.fns[type].length){
			for (var i=0,fn; fn=this.values.fns[type][i]; i++){
				fn(this);
			}
		}
		return this;
	}

	//private - shows an error
	error(error){
		ERRORS.show(error||'unknown error has occurred.');
	}

	//private - required fields that need to be set prior to loading the gmap
	requiredToLoad(){
		var allow = true;
		var msgs = [];

		if (!this.values.target)
			msgs.push('@target must be specified');
		if (!this.values.address.length)
			msgs.push('@address must be specified');

		if (msgs.length){
			allow = false;
			this.error(msgs.join('\n\n'));
		}
		return allow;
	}

	//loads the google maps, if there are changes to the settings, we can always re-load it again
	show(){
		if (this.requiredToLoad()){
			this.loadPlugin('maps',function(){
				//map types
				var gtypes = { roadmap:'ROADMAP', satellite:'SATELLITE', hybrid:'HYBRID', terrain:'TERRAIN' };
				//options
				var options = this.values.gmap.config.settings;
				options.mapTypeId = google.maps.MapTypeId[gtypes[this.values.type]];
				options.styles = this.values.gmap.config.styles;
				options.center = new google.maps.LatLng(this.values.latlong.lat,this.values.latlong.long); //set center
				var map = new google.maps.Map(this.values.target,options);
				var geocoder = new google.maps.Geocoder();
				geocoder.geocode({address:this.values.address},function(results,status){
					if (status==google.maps.GeocoderStatus.OK){
						var loc = results[0].geometry.location;
						if (this.values.marker.is_special_marker)
							var coords = new google.maps.LatLng(loc.lat()-0.0007,loc.lng()+0.0035); //lat - up/down, lng - left/right ... from the center
						else
							var coords = new google.maps.LatLng(loc.lat(),loc.lng());
						map.setCenter(coords);
						var data = {
							map:map,
							//position:map.getCenter(),
							position:loc,
							title:this.values.title,
							disableAutoPan:true
						};
						//check if there is a map icon
						if (this.values.map_icon)
							data.icon = this.values.map_icon;
						else { //default map icon
							data.icon = (('base_path' in MAIN.values) ?  MAIN.values.base_path : '/') +this.values.map_icon_default;
							//custom marker
							(this.values.marker.is_special_marker) && (data.position = new google.maps.LatLng(loc.lat()+0.000005,loc.lng()+0.00001));
						}
						var marker = new google.maps.Marker(data);
						var content = this.markerRender();
						var info_window = new google.maps.InfoWindow({
							content:content,
							maxWidth:340
						});
						if (!this.values.marker.is_special_marker)
							google.maps.event.addListener(marker,'click',function(event){ info_window.open(map,marker); this.fns('on_marker_show'); }.bind(this));
						else
							marker.setMap(map);
						google.maps.event.addListener(marker,'click',function(event){ console.log(event); }.bind(this));
					}
				}.bind(this));
				this.values.is_shown = true;
				this.fns('onShow');
			}.bind(this));
		}
		return this;
	}

	hide(){

		this.fns('onHide');
		return this;
	}

	/* MARKER FUNCTIONS */

	//private - formats the content for proper display
	markerFormatContent(content,type,_class){
		var html = null;
		if (content && type){
			switch(type){
				case 'phone': html = '<span class="phone">'+ART.format.phone(content)+'</span>'; break;
				case 'fax': html = '<span class="fax">'+ART.format.phone(content)+'</span>'; break;
				case 'email':
					var email = content.split("").reverse().join("");
					html = '<span class="email"><a class="bg-none text-reverse" href="#" onclick="COMMON.email(\''+email+'\',\'Please get in touch\');return false;">'+email+'</a></span>';
				break;
				case 'address':
					var address = content.replace(/(,){1}/,'</span><span class="addr">'); //replace the 1st comma
					html = '<span class="addr">'+address+'</span>';
				break;
				case 'sn': html = '<span><a href="'+content+'" class="sn zocial '+_class+' blue" target="_blank"><i></i>'+ART.format.capitalize(_class,'all')+'</a></span>'; break; //capitalizing with js due to some bug with @font-face and 'content' attribute
				case 'directions': html = '<span><a href="http://maps.google.com/maps?q='+ART.format.urlEncode(content)+'" class="sn iconsweets marker blue" target="_blank"><i></i>Get Directions</a></span>'; break;
			}
		}
		return html;
	}

	//private - creates the marker html
	markerCreate(){
		if (!this.values.marker.is_created){
			ART.ACN(this.values.target,
				ART.ACN(this.values.marker.elm,
					ART.ACN(this.values.marker.content,
						this.values.marker.img,
						this.values.marker.header,
						this.values.marker.body
					),
					this.values.marker.shadow
				)
			);
			this.values.marker.is_created = true;
		}
		return this;
	}

	//private - generates the html to display inside the special marker
	//since the map is static, we are displaying additional information such as 'get directions' link
	markerGetContent(){
		var html = '';
		html += '<table class="gmap-marker-content">';
			html += '<tr>';
				html += '<td>';
					html += '<ul class="address">';
						html += '<li>';
							html += this.markerFormatContent(this.values.address,'address');
							('email' in this.values.marker.contact) && (html += this.markerFormatContent(this.values.marker.contact.email,'email'));
						html += '</li>';
					html += '</ul>';
				html += '</td>';
				html += '<td>';
					html += '<ul class="address">';
						html += '<li>';
							('phone' in this.values.marker.contact) && (html += this.markerFormatContent(this.values.marker.contact.phone,'phone'));
							//('fax' in this.values.marker.contact) && (html += this.markerFormatContent(this.values.marker.contact.fax,'fax'));
							if (('socialnetworks' in this.values.marker.contact) && this.values.marker.contact.socialnetworks.length){
								for (var i=0; i<2; i++){
									var sn = this.values.marker.contact.socialnetworks[i];
									html += this.markerFormatContent(sn.url,'sn',sn['class']); //cannot have it as 'sn.class' b/c of IE11
								}
							}
							html += this.markerFormatContent(this.values.address,'directions');
						html += '</li>';
					html += '</ul>';
				html += '</td>';
			html += '</tr>';
		html += '</table>';
		return html;
	}

	//private - get the content for the marker info window
	markerRender(){
		var marker = null
		if (this.values.marker.is_special_marker){
			(!this.values.marker.is_created) && this.markerCreate();
			//set content
			this.values.marker.header.html(this.values.title);
			this.values.marker.body.html(this.markerGetContent());
			marker = this.values.marker.elm;
		}
		else
			marker = (this.values.title.length ? this.values.title+'<br>' : '')+this.values.address;
		return marker;
	}

	//loads the gmap plugin, then call 'callback'
	//e.q. this.loadPlugin('year_view');
	loadPlugin(plugin,callback){
		var _plugin = this.getPlugin(plugin);

		//must deffer the callback to inject the initialization of the xcal plugin
		var _callback = function(){
			(_plugin && !_plugin.is_loaded) && (_plugin.is_loaded = true);
			_.isFunction(callback) && callback.call(this); //only now call the real callback
		}.bind(this);

		if (_plugin && !_plugin.is_loaded){
			google.load(_plugin.plugin,_plugin.ver,_.extend(_plugin.options,{callback:_callback}));
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
		return _.isString(plugin) ? this.values.gmap.plugins[plugin] : plugin;
	}

	//private - returns true|false whether a plugin is loaded
	isPluginLoaded(plugin){
		var _plugin = this.getPlugin(plugin);
		return (_plugin) ? _plugin.is_loaded : false;
	}

	set(data){
		if (data){
			for (var k in data){
				switch(k){
					case 'target': this.values.target = (data[k] instanceof BOX) ? data[k].values.elm : data[k]; break;
					case 'styles': _.isArray(data[k]) && (this.values.gmap.config.styles = data[k]); break;
					case 'settings': _.isPlainObject(data[k]) && _.extend(this.values.gmap.config.settings,data[k]); break;
					case 'type': this.values.type = data[k]; break;
					case 'marker':
						if (_.isPlainObject(data[k])){
							_.extend(this.values.marker,data[k]); //update all values of the marker
							var contact = this.defaults('marker').contact; //get default settings for contact
							//we need to make sure all default contact values have been specified, or we put the default values back in
							for (var k in contact){
								(!(k in this.values.marker.contact)) && (this.values.marker.contact[k] = contact[k]);
							}
							//update img src
							this.values.marker.img.src = this.values.marker.contact.img;

							//if not default marker, make the map static so that the special marker can be shown
							if (this.values.marker.is_special_marker)
								this.set({is_static:true});
							else
								this.set({is_static:false});
						}
					break;
					case 'is_static': //makes the map static (no scrolling, no dnd, etc...)
						this.values.is_static = !!(data[k]);
						var settings = { panControl:true, zoomControl:true, mapTypeControl:true, scaleControl:true, streetViewControl:true, overviewMapControl:true, draggable:true, disableDoubleClickZoom:true, scrollwheel:true };
						if (this.values.is_static){
							for (var k in settings){
								settings[k] = false;
							}
						}
						this.set({settings:settings});
					break;
					case 'onShow': case 'onHide': case 'on_marker_show':
						if (data[k] && _.isFunction(data[k])){
							var is_unique = true;
							for (var i=0, fn; fn=this.values.fns[k][i]; i++){
								if (data[k]===fn){
									is_unique = false;
									break;
								}
							}
							(is_unique) && this.values.fns[k].push(data[k]);
						}
					break;
					default: this.values[k] = data[k]; break;
				} //switch
			} //for
		}
		return this;
	} //set
};