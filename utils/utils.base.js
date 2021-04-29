if (!UTILS) var UTILS = {};

UTILS.Base = class {
	constructor(data={}){
		this.values = {
			object: 'utils.base',
			version: '0.2.2',
			id: UTILS.uuid(), //id of the class
			$target: $('body'), //holds the target elm
			ajax:{ url:'', method:'', type:'POST', params:{} },
			scripts: [], //holds the scripts needed to load
			fns: {}, //holds the callback stack
			custom_methods_override: {}, //holds overrides of the native methods with custom methods
			options: {} //holds the options
		};

		//lets update the default values
		let _defaults = _.cloneDeep(this.getDefaults()),
			_data = _.cloneDeep(data);

		if ('options' in _defaults){
			const _options = Object.entries(_defaults.options);

			for (const [option, option_value] of _options) {
				this.values.options[option] = option_value;
			}

			delete _defaults.options;
			
			//since we already set the default options we can delegate setting (e.q. setOptions()) of the options to the extender module
			if ('options' in _data)
				delete _data.options;
		}

		_.extend(this.values,_defaults,_data);

		//lets check for custom method overrides
		if ('custom_methods_override' in _data){
			this.values.custom_methods_override = {}; //lets clear it
			this.setCustomMethodsOverride(_data.custom_methods_override);
		}

		//analizing data
		('target' in _data) && this.setTarget(_data.target);
		('ajax' in _data) && this.setAjaxData(_data.ajax);
		('scripts' in _data) && this.setScripts(_data.scripts);
		('id' in _data) && this.setId(_data.id);

		return this;
	}
	getObjectName(){
		return this.values.object+' v'+this.values.version;
	}
	getObjectVersion(){
		return this.values.version;
	}
	/*
		private - executes a stack of functions (FIFO style)
		ex.	@type - onChange
	 */
	fns(type,options={}){
		if (type && type in this.values.fns){
			_.each(this.values.fns[type],function(callback){
				try {
					callback(this,options);
				}
				catch(e){ _log(e); }
			}.bind(this));

			//lets trigger a traditional event
			var event = `${this.getObjectName()}.${type.toLowerCase()}`.replace(/\./g,'-'),
				$target = this.getTarget();

			if ($target instanceof UTILS.Box)
				$target = $target.getBox();

			$target.trigger(event,options);
		}
	}
	addCallback(type,callback){
		if (_.isFunction(callback)){
			if (!_.includes(_.keys(this.values.fns),type))
				this.values.fns[type] = [];

			(!_.includes(this.values.fns[type],callback)) && this.values.fns[type].push(callback);
		}
		return this;
	}
	//use this with extreme caution as it will replace the native methods with custom ones
	setCustomMethodsOverride(overrides){
		if (!_.isArray(overrides))
			overrides = [overrides];

		_.each(overrides, override => {
			if (typeof override.method==='function'){
				this[override.name] = override.method;
				this.values.custom_methods_override[override.name] = override;
			}

		});

		return this;
	}
	getId(){
		return this.values.id;
	}
	setId(id){
		this.values.id = id;
		return this;
	}
	getTarget(){
		return this.values.$target;
	}
	setTarget(target){
		let object_name = this.getObjectName()
			.split(' v')[0] //just need the object w/out version
			.replace(/\[(.*)$/,''); //lets add 'this' to target ( remove any [...] brackets )

		this.values.$target = (target instanceof UTILS.Box) ? target.getMainbody() : $(target);

		this.values.$target.data(object_name,this);

		return this;
	}
	getAjaxData(){
		return this.values.ajax;
	}
	setAjaxData(ajax){
		if (_.isPlainObject(ajax)){
			('url' in ajax) && (this.values.ajax.url = ajax.url);
			('method' in ajax)  && (this.values.ajax.method = ajax.method);
			('type' in ajax)  && (this.values.ajax.type = ajax.type);
			('params' in ajax)  && (this.values.ajax.params = ajax.params);
			('content_type' in ajax)  && (this.values.ajax.content_type = ajax.content_type);
		}
		return this;
	}
};

