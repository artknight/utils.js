if (!UTILS) var UTILS = {};

UTILS.Base = class {
	constructor(data){
		this.values = {
			object:'utils.base',
			version:'0.1.5',
			id: UTILS.uuid(), //id of the class
			$target: $('body'), //holds the target elm
			ajax:{ url:'', method:'', type:'POST', params:{} },
			scripts: [], //holds the scripts needed to load
			fns: {} //holds the callback stack
		};
		//lets update the default values
		('getDefaults' in this) && (this.values = _.extend(this.values,this.getDefaults()));
		this.values = _.extend(this.values,data);

		//analizing data
		if (_.isPlainObject(data)){
			('target' in data) && this.setTarget(data.target);
			('ajax' in data) && this.setAjaxData(data.ajax);
			('scripts' in data) && this.setScripts(data.scripts);
			('id' in data) && this.setId(data.id);
		}

		//_log(this.getObjectName()+' --> instantiated!',this.getId());
		return this;
	}
	getObjectName(){
		return this.values.object;
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
			var event = `${this.getObjectName()}.${type.toLowerCase()}`.replace(/\./g,'-');
			this.getTarget().trigger(event,options);
		}
	}
	addCallback(type,callback){
		if (_.isFunction(callback)){
			_log(this.getObjectName()+' --> callback added!',this.getId(),callback);
			if (!_.includes(_.keys(this.values.fns),type))
				this.values.fns[type] = [];

			(!_.includes(this.values.fns[type],callback)) && this.values.fns[type].push(callback);
		}
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
		this.values.$target = (target instanceof BOX) ? target.getMainbody() : $(target);

		//lets add 'this' to target
		this.values.$target.data(this.getObjectName(),this);

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
	//get bundle of scripts that must be loaded before the current component can be loaded
	getScripts(){
		return this.values.scripts;
	}
	setScripts(scripts){
		this.values.scripts = scripts;
		return this;
	}
	//loads the bundled scripts
	loadScripts(callback){
		var scripts = this.getScripts(),
			callback = _.isFunction(callback) ? callback.call(this) : new Function;

		if (scripts.length)
			$LAB.script(scripts).wait(callback);
		else
			callback(this);
		return this;
	}
};

