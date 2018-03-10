if (!UTILS) var UTILS = {};

UTILS.SCache = class {
	constructor(data={}){
		this.values = {};
		this.values = this._extend(this.getDefaults(), data);

		this.log(this.getObjectName() + ' --> instantiated');

		if (typeof data==='object'){
			('onLoaded' in data) && this.addCallback('onLoaded',data.onLoaded);
			('onError' in data) && this.addCallback('onError',data.onError);
			('scripts' in data) && this.addScripts(data.scripts);
		}

		return this;
	}
	getDefaults(){
		return {
			object: 'utils.scache',
			version:'0.5.4',
			id: 0, //holds the project id
			name: '', //holds the name
			fns: {},
			LAB: $LAB,
			loaded_scripts: [], //holds the scripts that have already been loaded
			show_log: (typeof APP.showLog==='function') ? APP.showLog() : null //holds whether the env is dev
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
	fns(type,options){
		if (type && type in this.values.fns){
			this.values.fns[type].forEach(function(callback){
				try {
					callback(this,options||{});
				}
				catch(e){ this.log(e); }
			}.bind(this));
		}
	}
	addCallback(type,callback){
		if (typeof callback==='function'){
			this.log(this.getObjectName()+' --> callback added!',callback);

			if (!Object.keys(this.values.fns).includes(type))
				this.values.fns[type] = [];

			if (!this.values.fns[type].includes(callback))
				this.values.fns[type].push(callback);
		}
		return this;
	}
	hideOverlay(){
		if (this.values.overlay){
			try {
				this.values.overlay.parentNode.removeChild(this.values.overlay);
				this.values.overlay_msg.parentNode.removeChild(this.values.overlay_msg);
				this.values.overlay = this.values.overlay_msg = null;
			}
			catch(e){}
		}

		return this;
	}
	showOverlay(){
		if (!this.values.overlay){
			var overlay = document.createElement('div');
			overlay.setAttribute('style','z-index:1000000; border:none; margin:0px; padding:0px; width:100%; height:100%; top:0px; left:0px; background-color:#ccc; cursor:wait; position:fixed;');
			this.values.overlay = overlay;

			var overlay_msg = document.createElement('div');
			overlay_msg.setAttribute('style','z-index:1000001; padding:10px; position:fixed; top:50%; left:50%; -webkit-transform:translate(-50%,-50%); transform:translate(-50%,-50%); text-align:center; color:rgb(150, 150, 150); border:2px solid rgb(167, 167, 167); border-radius:5px; background-color:#fff; cursor:wait;');
			overlay_msg.appendChild(document.createTextNode('Loading resources, please wait...'));
			this.values.overlay_msg = overlay_msg;

			var body = document.getElementsByTagName('body')[0];

			if (body){
				body.appendChild(this.values.overlay);
				body.appendChild(this.values.overlay_msg);
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

				(this.values.show_log) && console.timeEnd(script.base_url); //stopping timer
				script.promise_tuple.resolve();
			}
			catch(e){
				this.log(this.getObjectName() + ' --> error or local storage limit reached');
			}

		}.bind(this);

		var script_url = this._getFilteredUrl(script.script_url);

		//if external URL we need to get the content regardless of CORS
		if (/^http/i.test(script_url))
			script_url = 'http://cors-anywhere.herokuapp.com/'+script_url;

		if (!/\^nocache=/i.test(script.script_url)){
			fetch(script_url)
				.then((response) => response.text())
				.then(_onSuccess)
				.catch();
		}
		else
			script.promise_tuple.resolve();
		
		return this;
	}

	_getFilteredUrl(script_url){
		//lets remove '^type,^usebase,^nocache'
		return script_url
			.replace(/(\?|&)\^type=(js|css)/g,'$1')
			.replace(/(\?|&)\^usebase=(true|false)/g,'$1')
			.replace(/(\?|&)\^nocache=(true|false)/g,'$1')
			.replace(/(&&)+/g,'&')
			.replace(/(\?&)+/g,'?')
			.replace(/(\?|&)+$/g,'');
	}

	getBaseUrl(script_url){
		return script_url.split('?')[0];
	}

	isJS(script_url){
		return /\.js|^wait/i.test(script_url);
	}

	addToPage(script){
		var $head = document.getElementsByTagName('head')[0],
			$title = document.getElementsByTagName('title')[0],
			$insert_before_elm = script.is_js ? $head.firstChild : $title; //the order matters in CSS, so we have to add elements DESC

		this.log(this.getObjectName() + ' --> added to HEAD',this._getFilteredUrl(script.script_url));

		$head.insertBefore(script.$script,$insert_before_elm);

		return this;
	}
	loadFromCache(script){
		//if cached item url is not the request script url, clear the cache
		if (script.ls_item.url!==script.script_url){
			this.log(this.getObjectName() + ' --> script url changed, removing',script.ls_item.url);

			localStorage.removeItem(script.base_url);

			var existing_script = document.getElementById(script.id);
			if (existing_script)
				existing_script.parentNode.removeChild(existing_script);

			this[ script.is_js ? 'loadJS' : 'loadCSS' ](script);
		}
		else {
			this.log(this.getObjectName() + ' --> loading script from cache',script.ls_item.url);

			script.$script = this.getScriptElm(script);
			script.$script.appendChild(document.createTextNode( this.decompress(script.ls_item.content) ));

			//adding source map
			script.$script.appendChild(document.createTextNode(this.getSourceUrlMapName(script)));

			this.addToPage(script);
			(this.values.show_log) && console.timeEnd(script.base_url); //stopping timer
			script.promise_tuple.resolve();
		}

		return this;
	}

	loadJS(script){
		script.$script = this.getScriptElm(script);

		var script_url = this._getFilteredUrl(script.script_url);

		//script.$script.onload = this.addToCache.bind(this,script);
		//script.$script.setAttribute('src', script.script_url);
		//this.addToPage(script);

		if (/^wait/.test(script.base_url))
			this.values.LAB = this.values.LAB.wait(script.promise_tuple.resolve);
		else
			this.values.LAB = this.values.LAB.script(script_url).wait(this.addToCache.bind(this,script));

		return this;
	}

	loadCSS(script){
		script.$script = document.createElement('link');
		script.$script.setAttribute('rel', 'stylesheet');
		script.$script.setAttribute('type', 'text/css');
		script.$script.setAttribute('href', script.script_url);
		script.$script.setAttribute('id', script.id);

		this.addToPage(script);

		//this is a workaround to get onLoad event since CSS does not have one
		var img = document.createElement('img');
		img.onerror = this.addToCache.bind(this,script);
		img.src = script.script_url;

		return this;
	}

	getScriptElm(script){
		var $script = document.createElement( script.is_js ? 'script' : 'style' );

		$script.setAttribute('type', script.is_js ? 'text/javascript' : 'text/css');
		$script.setAttribute('id',script.id);

		return $script;
	}

	compress(content){
		return lzbase62.compress(content);
	}

	decompress(content){
		return lzbase62.decompress(content);
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
		this.hideOverlay();
		this.fns('onLoaded');
	}
	_onScriptsLoadError(response){
		this.log(this.getObjectName() + ' --> scripts failed to load',response);
		this.hideOverlay();
		this.fns('onError');
	}
	createScriptId(script){
		return /^dev/i.test(APP.values.env) ? script.base_url.split('/').slice(-1)[0] : (((1+Math.random())*0x10000)|0).toString(16).substring(1);
	}
	loadScript(script){
		if (!/^wait/i.test(script.base_url))
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
		var promises = [];

		//lets process the scripts
		for (var i=0,script_url; script_url=script_urls[i]; i++){
			var base_url = this.getBaseUrl(script_url),
				script = {
					id: null,
					script_url: script_url,
					base_url: base_url,
					ls_item: localStorage.getItem(base_url),
					is_js: this.isJS(base_url),
					promise_tuple: { resolve:null, reject:null }
				};

			//lets check if '^type=js' exists to override the default type
			if (/\^type=js/i.test(script_url))
				script.is_js = true;

			//lets check if the script already exists
			if (!this.values.loaded_scripts.find(s => s.base_url.includes(script.base_url))){
				promises.push(new Promise(function(resolve,reject){
					script.promise_tuple = { resolve,reject };
					(this.values.show_log) && console.time(script.base_url); //start timer
					this.loadScript(script);
				}.bind(this)));
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