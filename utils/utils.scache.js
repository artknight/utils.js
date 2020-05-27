if (!UTILS) var UTILS = {};

UTILS.SCache = class {
	constructor(data={}){
		this.values = {};
		this.values = this._extend(this.getDefaults(), data);

		this.log(this.getObjectName() + ' --> instantiated');

		('cache_version' in data) && this.setCacheVersion(data.cache_version);
		('overlay' in data) && this.setOverlayOptions(data.overlay);
		('scripts' in data) && this.addScripts(data.scripts);

		return this.createOnAllScriptsLoadedPromise();
	}
	getDefaults(){
		return {
			object: 'utils.scache',
			version:'0.6.0',
			id: 0, //holds the project id
			name: '', //holds the name
			fns: {},
			LAB: $LAB,
			loaded_scripts: [], //holds the scripts that have already been loaded
			overlay: {
				hide: true //hides the overlay when all scripts finish loading
			},
			all_scripts_loaded_promise: null, //holds the promise to resolve when all scripts are loaded
			show_log: (typeof APP.showLog==='function') ? APP.showLog() : null, //holds whether the env is dev
			show_timer: (typeof APP.showTimer==='function') ? APP.showTimer() : false,
			cache_version: 1
		};
	}
	getObjectName(){
		return this.values.object+' v'+this.values.version;
	}
	getObjectVersion(){
		return this.values.version;
	}
	log(...args){
		(this.values.show_log) && console.log(args);
		return this;
	}
	_extend(scope1,scope2){
		const keys = Object.keys(scope2);

		for (var i=0,key; key=keys[i]; i++){
			scope1[key] = scope2[key];
		}
		return scope1;
	}
	getCacheVersion(){
		return this.values.cache_version;
	}
	getLSCacheVersion(){ 
		return localStorage.getItem('scache_version');
	}
	setLSCacheVersion(cache_version){
		localStorage.setItem('scache_version',cache_version);
		return this;
	}
	setCacheVersion(cache_version){
		this.values.cache_version = cache_version;

		//lets try to clear the local storage
		this.resetStorage();

		return this;
	}
	resetStorage(){
		let ls_cache_version = this.getLSCacheVersion(),
			cache_version = this.getCacheVersion();
		
		if (ls_cache_version!=cache_version){
			this.log(this.getObjectName() + ' --> clearing local cache');
			localStorage.clear();
			this.setLSCacheVersion(cache_version);
		}

		return this;
	}
	createOnAllScriptsLoadedPromise(){
		var _resolve,
			_reject,
			promise = new Promise(function(resolve,reject){
				_resolve = resolve;
				_reject = reject;
			});

		promise.resolve = _resolve;
		promise.reject = _reject;
		promise.scache = this;

		this.values.all_scripts_loaded_promise = promise;

		return promise;
	}
	getOnAllScriptsLoadedPromise(){
		return this.values.all_scripts_loaded_promise;
	}
	getOverlayOptions(){
		return this.values.overlay;
	}
	setOverlayOptions(options){
		this.values.overlay = this._extend(this.values.overlay, options);
		return this;
	}
	hideOverlay(force_hide){
		var options = this.getOverlayOptions();

		if (options.hide || force_hide){
			var overlay = document.getElementById('body-overlay'),
				overlay_msg = document.getElementById('body-overlay-msg');

			if (overlay || overlay_msg){
				try {
					overlay.parentNode.removeChild(overlay);
					overlay_msg.parentNode.removeChild(overlay_msg);
				}
				catch(e){}
			}
		}

		return this;
	}
	showOverlay(){
		var overlay = document.getElementById('body-overlay'),
			overlay_msg = document.getElementById('body-overlay-msg');

		//lets check if those already exist
		if (!overlay && !overlay_msg){
			overlay = document.createElement('div');
			overlay_msg = document.createElement('div');

			var spinner = document.createElement('div'),
				msg = document.createElement('div');

			msg.setAttribute('class','msg');

			overlay.id = 'body-overlay';
			overlay.setAttribute('class','body-overlay');

			overlay_msg.id = 'body-overlay-msg';
			overlay_msg.setAttribute('class','body-overlay-msg');

			spinner.setAttribute('class','sp sp-circle');

			msg.innerHTML = 'Loading resources, please wait...';

			overlay_msg.appendChild(spinner);
			overlay_msg.appendChild(msg);

			var body = document.querySelector('body');

			if (body){
				body.appendChild(overlay);
				body.appendChild(overlay_msg);
			}
		}

		return this;
	}
	addToCache(script){
		const _onSuccess = function(response){
			this.log(this.getObjectName() + ' --> added to cache',script.script_url);

			try {
				localStorage.setItem(script.base_url, JSON.stringify({
					content: this.compress(response),
					url: script.script_url,
					id: script.id
				}));
			}
			catch(e){
				this.log(this.getObjectName() + ' --> error or local storage limit reached',e);
			}
		}.bind(this);

		var script_url = this._getFilteredUrl(script.script_url);

		//if external URL we need to get the content regardless of CORS
		if (/^http/i.test(script_url))
			script_url = 'https://cors-anywhere.herokuapp.com/'+script_url;

		if (!/\^nocache=/i.test(script.script_url)){
			axios.get(script_url, { headers:{'X-Requested-With':'XMLHttpRequest'} })
				.then(response => response.data)
				.then(_onSuccess)
				.catch(); 
		}

		(this.values.show_timer) && console.timeEnd(script.timer_id); //stopping timer
		script.promise.resolve();
		
		return this;
	}

	_getFilteredUrl(script_url){
		//lets remove '^type,^nocache'
		return script_url
			.replace(/(\?|&)\^type=(js|css)/g,'$1')
			.replace(/(\?|&)\^nocache=(true|false)/g,'$1')
			.replace(/(&&)+/g,'&')
			.replace(/(\?&)+/g,'?')
			.replace(/(\?|&)+$/g,'');
	}

	getBaseUrl(script_url){
		return script_url.split('?')[0];
	}

	isJS(script_url){
		return /\.js/i.test(script_url);
	}

	addToPage(script){
		var $head = document.querySelector('head'),
			$title = document.querySelector('title'),
			$insert_before_elm = script.is_js ? $head.firstChild : $title; //the order matters in CSS, so we have to add elements DESC

		this.log(this.getObjectName() + ' --> added to HEAD',this._getFilteredUrl(script.script_url));

		$head.insertBefore(script.$script,$insert_before_elm);

		return this;
	}
	loadFromCache(script){
		this.log(this.getObjectName() + ' --> loading script from cache',script.ls_item.url);

		//need to make sure we do not add more than one script
		if (!document.getElementById(script.id)){
			script.$script = this.getScriptElm(script);
			script.$script.appendChild(document.createTextNode( this.decompress(script.ls_item.content) ));

			//adding source map
			script.$script.appendChild(document.createTextNode(this.getSourceUrlMapName(script)));

			this.addToPage(script);
		}

		(this.values.show_timer) && console.timeEnd(script.timer_id); //stopping timer
		script.promise.resolve();

		return this;
	}

	loadJS(script){
		script.$script = this.getScriptElm(script);

		var script_url = this._getFilteredUrl(script.script_url);

		//script.$script.onload = this.addToCache.bind(this,script);
		//script.$script.setAttribute('src', script.script_url);
		//this.addToPage(script);

		this.values.LAB = this.values.LAB.script({ src:script_url, id:script.id }).wait(this.addToCache.bind(this,script));

		return this;
	}

	loadCSS(script){
		script.$script = document.createElement('link');
		script.$script.setAttribute('rel', 'stylesheet');
		script.$script.setAttribute('type', 'text/css');
		script.$script.setAttribute('href', script.script_url);
		script.$script.setAttribute('id', script.id);
		script.$script.setAttribute('media', 'print');
		script.$script.onload = () => {
			script.$script.setAttribute('media', 'all');
			this.addToCache(script);
		}

		this.addToPage(script);

		return this;
	}

	getScriptElm(script){
		var $script = document.createElement( script.is_js ? 'script' : 'style' );

		$script.setAttribute('type', script.is_js ? 'text/javascript' : 'text/css');
		$script.setAttribute('id',script.id);

		return $script;
	}

	compress(content){
		return content; //LZString.compressToBase64(content);
	}

	decompress(content){
		return content; //LZString.decompressFromBase64(content);
	}

	createPromise(){
		let _resolve,
			_reject,
			promise = new Promise(function(resolve,reject){
				_resolve = resolve;
				_reject = reject;
			});

		promise.resolve = _resolve;
		promise.reject = _reject;

		return promise;
	}

	//this method is merely to provide a way to debug files inserted as a script tag
	getSourceUrlMapName(script){
		var script_id = script.ls_item.id,
			ext = script.is_js ? '.js' : '.css',
			wrapper = script.is_js ? '//{url}' : '/*{url}*/',
			url = '# sourceURL='+(/\.(js|css)$/i.test(script_id) ? script_id : script_id+''+ext),
			source_map = wrapper.replace(/\{url\}/g,url);

		return source_map;
	}
	_onAllScriptsLoaded(){
		this.log(this.getObjectName() + ' --> all scripts loaded');
		this.hideOverlay();
		this.getOnAllScriptsLoadedPromise().resolve();
	}
	_onScriptsLoadError(response){
		this.log(this.getObjectName() + ' --> scripts failed to load',response);
		this.hideOverlay();
		this.getOnAllScriptsLoadedPromise().reject(response);
	}
	createScriptId(script){
		return script.base_url.split('/').slice(-1)[0];
	}
	loadScript(script){
		this.values.loaded_scripts.push(script);

		if (!script.ls_item){
			script.id = this.createScriptId(script); //creates a random id
			this[ script.is_js ? 'loadJS' : 'loadCSS' ](script);
		}
		else {
			script.ls_item = JSON.parse(script.ls_item);
			script.id = script.ls_item.id;
			this.loadFromCache(script);
		}

		return this;
	}
	addScripts(script_urls=[]){
		var object_name = this.getObjectName(),
			promises = [];

		//lets process the scripts
		for (var i=0,script_url; script_url=script_urls[i]; i++){
			var base_url = this.getBaseUrl(script_url),
				script = {
					id: null,
					timer_id: object_name+' --> '+base_url+' ('+(((1+Math.random())*0x10000)|0).toString(16)+')',
					script_url: script_url,
					base_url: base_url,
					ls_item: localStorage.getItem(base_url),
					is_js: this.isJS(base_url),
					promise: null
				};

			//lets check if '^type=js' exists to override the default type
			if (/\^type=js/i.test(script_url))
				script.is_js = true;

			//lets check if the script already exists
			if (!this.values.loaded_scripts.find(s => s.base_url.includes(script.base_url))){
				script.promise = this.createPromise();

				//start timer
				(this.values.show_timer) && console.time(script.timer_id);

				promises.push(script.promise);

				this.loadScript(script);
			}
			else
				this.log(this.getObjectName() + ' --> dupplicate script found',script.script_url);
		}

		if (promises.length){
			this.showOverlay();
			Promise.all(promises).then(this._onAllScriptsLoaded.bind(this),this._onScriptsLoadError.bind(this));
		}
		else
			this._onAllScriptsLoaded();

		return this;
	}
};