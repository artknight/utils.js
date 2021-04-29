if (!UTILS) var UTILS = {};

UTILS.SCache = class {
	constructor(data={}){
		!('scache_loaded_scripts' in window) && (window.scache_loaded_scripts = []);

		this.values = {};
		this.values = this._extend(this.getDefaults(), data);

		let all_scripts_loaded_promise = this.createOnAllScriptsLoadedPromise();

		('cache_version' in data) && this.setCacheVersion(data.cache_version);
		('overlay' in data) && this.setOverlayOptions(data.overlay);
		('scripts' in data) && this.addScripts(data.scripts);

		return all_scripts_loaded_promise;
	}
	getDefaults(){
		return {
			object: 'utils.scache', 
			version:'0.6.5',
			id: 0, //holds the project id
			name: '', //holds the name
			fns: {},
			LAB: $LAB,
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
	setCacheVersion(cache_version){
		this.values.cache_version = cache_version;

		return this;
	}
	createOnAllScriptsLoadedPromise(){
		var _resolve,
			_reject,
			promise = new Promise((resolve,reject) => {
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
			try {
				document.querySelectorAll('.body-overlay,.body-overlay-msg').forEach(e => e.parentNode.removeChild(e));
			}
			catch(e){}
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

	addToPage(script){
		var $head = document.querySelector('head'),
			$title = document.querySelector('title'),
			$insert_before_elm = script.is_js ? $head.firstChild : $title; //the order matters in CSS, so we have to add elements DESC

		$head.insertBefore(script.$script,$insert_before_elm);

		return this;
	}

	loadJS(script){
		script.$script = this.getScriptElm(script);

		var script_url = this._getFilteredUrl(script.script_url);

		/*script.$script.onload = script.$script.onreadystatechange = this.addToCache.bind(this,script);
		script.$script.setAttribute('src', script_url);
		this.addToPage(script);*/

		this.values.LAB = this.values.LAB
			.script({ src:script_url, id:script.id })
			.wait(() => {
				(this.values.show_timer) && console.timeEnd(script.timer_id); //stopping timer
				script.promise.resolve();
			});

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
			(this.values.show_timer) && console.timeEnd(script.timer_id); //stopping timer
			script.promise.resolve();
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

	_onAllScriptsLoaded(){
		this.hideOverlay();
		this.getOnAllScriptsLoadedPromise().resolve();
	}
	_onScriptsLoadError(response){
		this.hideOverlay();
		this.getOnAllScriptsLoadedPromise().reject(response);
	}
	createScriptId(script){
		return script.base_url.split('/').slice(-1)[0];
	}
	loadScript(script){
		window.scache_loaded_scripts.push(script);

		script.id = this.createScriptId(script);
		this[ script.is_js ? 'loadJS' : 'loadCSS' ](script);

		return this;
	}
	addScripts(script_urls=[]){
		var object_name = this.getObjectName(),
			promises = [];

		//lets process the scripts
		for (let i=0,script_url; script_url=script_urls[i]; i++){
			let base_url = this.getBaseUrl(script_url),
				script = {
					id: null,
					timer_id: object_name+' --> '+base_url+' ('+(((1+Math.random())*0x10000)|0).toString(16)+')',
					script_url: script_url,
					base_url: base_url,
					is_js: /\.js/i.test(base_url) || /\^type=js/i.test(script_url), //lets check if '^type=js' exists
					promise: null
				};

			//lets check if the script already exists
			if (!window.scache_loaded_scripts.find(s => s.base_url===script.base_url)){
				script.promise = this.createPromise();

				//start timer
				(this.values.show_timer) && console.time(script.timer_id);

				promises.push(script.promise);

				this.loadScript(script);
			}
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