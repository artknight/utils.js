UTILS.Scroll = class extends UTILS.Base {
	init(data){
		this.parent(data);
		_log('iscroll --> instantiated!',this.IdToString(),this);
		if (_.isPlainObject(data)){
			('scroll' in data) && this.setScroll(data.scroll);
			('start' in data) && this.setStart(data.start);
			('perpage' in data) && this.setPerPage(data.perpage);
			('bottom_padding' in data) && this.setBottomPadding(data.bottom_padding);
			('params' in data) && this.setParams(data.params);
			('onEnabled' in data) && this.addCallback('onEnabled',data.onEnabled);
			('onShowMoreLink' in data) && this.addCallback('onShowMoreLink',data.onShowMoreLink);
			('onHideMoreLink' in data) && this.addCallback('onHideMoreLink',data.onHideMoreLink);
			('onLoaded' in data) && this.setOnLoadedMethod(data.onLoaded);
			('onLoadedComplete' in data) && this.addCallback('onLoadedComplete',data.onLoadedComplete);
			('onLoadedSuccess' in data) && this.addCallback('onLoadedSuccess',data.onLoadedSuccess);
		}
		return this;
	}
	getDefaults(){
		return {
			version:'0.0.9',
			$scroll: $(window),
			start:0, //holds the current start of the items
			per_page: 50, //holds the per page number of items
			bottom_padding: 100, //holds the distance from bottom to start fetching
			is_enabled: false, //holds the show/hide state of the menu
			is_fetchable: true, //holds whether more results can be loaded
			format:'/{start}/{perpage}', //holds the format to be passed to server
			is_window: false, //holds whether the target object is window object
			$spinner: null, //spinner to show at the bottom of the page while the results are being fetched
			$more: null, //more link to show more results
			is_auto_load: false, //determines whether to auto-load all remaining results or not
			auto_timer: null, //holds the timer for auto load
			onloaded_method: null,  //holds the custom onloaded method
			params: {} //holds the params to be passed with the ajax call
		};
	}
	setTarget(target){
		this.super(target);
		this.createSpinner();
		this.createMoreLink();
		return this;
	}
	getScroll(){
		return this.values.$scroll;
	}
	setScroll(scroll){
		this.values.$scroll = $(scroll);
		this.values.is_window = this.isWindow();
		return this;
	}
	setOnLoadedMethod(method){
		if (_.isFunction(method)){
			_log('iscroll --> onLoaded method added');
			this.values.onloaded_method = method;
		}
		return this;
	}
	isFetchable(){
		return this.values.is_fetchable;
	}
	isEnabled(){
		return this.values.is_enabled;
	}
	isWindow(){
		return $.isWindow(this.getScroll()[0]);
	}
	_observe(event){
		var $scroll = this.getScroll(),
			padding = this.getBottomPadding();

		if (this.isFetchable() && (
				(this.values.is_window && ( $scroll.scrollTop()+$scroll.height() >= $(document).height()-padding )) //window
				|| (!this.values.is_window && ( $scroll.prop('scrollHeight')-$scroll.scrollTop()===$scroll.outerHeight() )) //div
			)
		){
			this.load();
			this.setFetchableState(false);
		}
	}
	enable(){
		if (!this.values.is_enabled){
			_log('iscroll --> enabled', this.getId());
			var $scroll = this.getScroll();
			$scroll.on('scroll',this._observe.bind(this));
			this._fns('onEnabled');
			this.values.is_enabled = true;
		}
		return this;
	}
	disable(){
		if (this.values.is_enabled){
			_log('iscroll --> disabled', this.getId());

			this.getTarget().off('scroll');
			this.values.is_enabled = false;
		}
		return this;
	}
	setFetchableState(state){
		this.values.is_fetchable = !!(state);
		return this;
	}
	getFormat(){
		return this.values.format;
	}
	setFormat(format){
		this.values.format = format;
		return this;
	}
	getBottomPadding(){
		return this.values.bottom_padding;
	}
	setBottomPadding(bottom_padding){
		this.values.bottom_padding = bottom_padding;
		return this;
	}
	getPerPage(){
		return this.values.per_page;
	}
	setPerPage(per_page){
		_log('iscroll --> per page number changed to '+per_page);
		this.values.per_page = per_page;
		return this;
	}
	getStart(){
		return this.values.start;
	}
	setStart(start){
		_log('iscroll --> start number changed to '+start);
		this.values.start = start;
		return this;
	}
	getAjaxData(){
		var ajax = _.clone(this.parent()), //need to clone it so that the original does not get modified
			start = this.getStart(),
			perpage = this.getPerPage(),
			format = this.getFormat(),
			pagination = format.replace(/\{start\}/,start).replace(/\{perpage\}/,perpage);

		//lets check if there is '?' in the url and apply start/perpage before it
		if (/\?/.test(ajax.url)){
			var _url = ajax.url.split('?');
			ajax.url = _url[0]+pagination+'?'+_url[1];
		}
		else
			ajax.url += pagination;

		ajax.params = this.getParams();

		return ajax;
	}
	setAjaxData(ajax){
		//if ajax.url ends with '/', lets remove it
		if ('url' in ajax && /\/$/.test(ajax.url))
			ajax.url = ajax.url.slice(0,-1);

		if ('params' in ajax)
			this.setParams(ajax.params);

		this.parent(ajax);

		return this;
	}
	getParams(){
		return _.extend({},( _.isFunction(this.values.params) ? this.values.params.call(null,this) : this.values.params ));
	}
	setParams(params){
		if (params)
			this.values.params = params;

		return this;
	}
	//create spinner, wrap it with <tr><td> if target is a table
	createSpinner(){
		var $target = this.getTarget(),
			$wrapper = null,
			$spinner = $('<div class="iscroll-spinner" role="spinner"><div class="x-spinner"></div></div>');

		if (this.isTargetTable()){
			$wrapper = $('<tr><td colspan="100"></td></tr>');
			$wrapper.find('td').append($spinner);
		}
		else
			$wrapper = $spinner;
		this.values.$spinner = $wrapper;
		return this;
	}
	getSpinner(){
		return this.values.$spinner;
	}
	showSpinner(){
		this.getTarget().append(this.getSpinner());
		return this;
	}
	hideSpinner(){
		this.getSpinner().remove();
		return this;
	}
	isTargetTable(){
		return /TABLE|TBODY/.test(this.getTarget()[0].tagName);
	}
	//create more link
	createMoreLink(){
		var $target = this.getTarget(),
			$wrapper = null,
			$more = $('<div class="text-center"><a class="iscroll-link show-all" href="#"><i class="fa fa-eye"></i> '+T.getMap('query::show all')+'</a><a class="iscroll-link show-more" href="#"><i class="fa fa-arrow-right"></i> '+T.getMap('query::more')+'</a></div>');

		if (this.isTargetTable()){
			$wrapper = $('<tr><td colspan="100"></td></tr>');
			$wrapper.find('td').append($more);
		}
		else
			$wrapper = $more;
		this.values.$more = $wrapper;
		return this;
	}
	disableMoreLink(){
		this.hideMoreLink();
		this.values.$more = null;
		return this;
	}
	getMoreLink(){
		return this.values.$more;
	}
	isAutoLoad(){
		return this.values.is_auto_load;
	}
	setAutoLoadState(state){
		this.values.is_auto_load = !!(state);
		return this;
	}
	showMoreLink(){
		var $scroll = (this.isWindow()) ? $(document).contents().find('body') : this.getScroll(),
			$more = this.getMoreLink();

		if ($more.length && $scroll.prop('scrollHeight')===$scroll.prop('clientHeight')){
			this.getTarget().append($more);
			$more.find('a.show-all').on('click', function(event){ event.preventDefault(); this.setPerPage(100).setAutoLoadState(true).load(); }.bind(this));
			$more.find('a.show-more').on('click', function(event){ event.preventDefault(); this.load(); }.bind(this));
			this._fns('onShowMoreLink');
		}

		return this;
	}
	hideMoreLink(){
		this.getMoreLink().remove();
		this._fns('onHideMoreLink');
		return this;
	}
	_scrollToBottom(){
		$('html, body').animate({ scrollTop: $(document).height() });
		return this;
	}
	_onLoaded(response){
		this._fns('onLoadedSuccess');
		if (_.isFunction(this.values.onloaded_method))
			this.values.onloaded_method(response,this); //call custom method
		else {
			var $target = this.getTarget();

			var items = JSON.parse(response).data;
			if(!items.length){
				$target.append('<p class="text-center">No results found.</p>');
				this.setFetchableState(false);
				this.setAutoLoadState(false);
			}
			else {
				_.each(items,function(item){
					$target.append('<p class="app-item"><span class="name"><b>'+item.NAME+'</b></span><span class="desc">'+item.LONGDESCR+'</span></p>');
				});
			}
			$total.text('Found '+$target.find('.app-item').length+' results');
		}
		return this;
	}
	_onLoadedSuccess(response){
		this._fns('onLoadedComplete');
		this.hideSpinner();
		this.setFetchableState(true);
		this._onLoaded(response);
		this.showMoreLink();
		this.setStart(this.getStart()+this.getPerPage());

		//lets check if we need to auto-load
		if (this.isAutoLoad())
			this.values.auto_timer = setTimeout(this.load.bind(this),500);
	}
	_onLoadedError(response){
		this._fns('onLoadedComplete');
		showJsError(response.responseJSON.error);
		this.hideSpinner();
		this.showMoreLink();
		this.setFetchableState(false);
		this.setAutoLoadState(false);
	}
	load(){
		if (this.isFetchable()){
			var ajax = this.getAjaxData();
			this.showSpinner();
			this.hideMoreLink();

			if (/GET/i.test(ajax.type))
				$.getJSON(ajax.url).done(this._onLoadedSuccess).fail(this._onLoadedError);
			else if (/POST/i.test(ajax.type))
				$.postJSON('POST',ajax.url,JSON.stringify(ajax.params),this._onLoadedSuccess,this._onLoadedError);
		}
		else {
			clearTimeout(this.values.auto_timer);
			this.hideMoreLink();
		}
		return this;
	}
};

// Export node module.
if ( typeof module !== 'undefined' && module.hasOwnProperty('exports') ){
	module.exports = UTILS.Scroll;
}