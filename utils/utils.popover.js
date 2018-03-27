/*
    == UTILS.Popover ==

	== dependencies ==
	jquery.js
	bootstrap.js

	ex. var dropdown = new UTILS.Popover({target:$('#button'),items:[{label:'',value:''},{label:'',value:''}],onSelect:function(){...}});
		dropdown.enable();

	== definitions ==
	@target - (required) DOM elm where the dropdown will be shown
	@items - (required) items that will be the options of the dropdown --> each item should be of following format { label:'some name', value:'some value' -optional- css:'some class' }
	@container - (optional) DOM elm where the popover will be inserted --> defaults to 'body'
	@title - (optional) title of the popover --> defaults to 'Select'
	@direction - (optional) direction of the popover --> defaults to 'bottom'
	@onSelect - (optional) stack of functions to execute when the spinner is shown (REPEAT EXECUTION) --> defaults to 'null'
*/
UTILS.Popover = class extends UTILS.Base {
	constructor(data={}){
		super(data);

		_log(this.getObjectName()+' --> instantiated!',this.getId());

		('title' in data) && this.setTitle(data.title);
		('options' in data) && this.setOptions(data.options);
		('direction' in data) && this.setDirection(data.direction);
		('blur' in data) && this.setBlurState(data.blur);
		('width' in data) && this.setWidth(data.width);
		('hide_on_click' in data) && this.setHideOnClickState(data.hide_on_click);
		('toggle' in data) && this.setToggleAction(data.toggle);
		('template' in data) && this.setTemplate(data.template);
		('container' in data) && this.setContainer(data.container);
		('items' in data) && this.setItems(data.items);
		('css' in data) && this.setTemplateCss(data.css);
		('onSelect' in data) && this.addCallback('onSelect', data.onSelect);
		('onShow' in data) && this.addCallback('onShow', data.onShow);
		('onHide' in data) && this.addCallback('onHide', data.onHide);
		('onCancel' in data) && this.addCallback('onCancel',data.onCancel);

		if (!('container' in data))
			this.setContainer($('body'));

		return this;
	}
	getDefaults(){
		return {
			object:'utils.popover',
			version:'0.1.7',
			items: [], //holds the items
			$content: '', //holds the content of the popover
			title: '', //holds the title
			options: {}, //holds options for the bootstrap popover
			direction: 'bottom', //holds the direction of the popover
			$container: null, //holds DOM where popover will be appended to
			is_enabled: false, //holds the enable/disable state of the popover
			PopoverElm: null, //holds the bootstrap popover instance
			Blur: null, //holds the UTILS.Blur object
			is_blur: false, //holds the whether to show the UTILS.Blur
			hide_on_click: true, //hides popover on outside click
			is_shown: false, //holds the display state
			toggle_action: 'click', //toggle action to show/hide the popover
			width: null, //holds the width of the bootstrap popover
			$template: $('<div class="popover popover-custom" role="tooltip"><div class="arrow"></div><h3 class="popover-header"></h3><div class="popover-body"></div></div>')
		};
	}
	//method to simplify getting the $tip of the bootstrap popover
	getPopoverElmContainer(){
		return this.getPopoverElm().$tip;
	}
	getWidth(){
		return this.values.width;
	}
	setWidth(width=300){
		this.values.width = parseInt(width);
		return this;
	}
	getTemplate(){
		return this.values.$template;
	}
	setTemplate(template){
		this.values.$template = $(template);
		return this;
	}
	setTemplateCss(css){
		(css) && this.getTemplate().addClass(css);
		return this;
	}
	getOptions(){
		return this.values.options;
	}
	setOptions(options){
		_.extend(this.values.options,options);
		return this;
	}
	setTarget(target){
		if (!target)
			this.values.$target = null;
		else
			super.setTarget(target);

		return this;
	}
	enable(){
		if (!this.values.is_enabled){
			_log(this.getObjectName()+' --> enabled', this.getId());

			var $target = this.getTarget(),
				toggle_action = this.getToggleAction(),
				title = this.getTitle(),
				$template = this.getTemplate(),
				width = this.getWidth(),
				options = this.getOptions();

			//need to make sure the target is defined, otherwise throw an error
			if (!$target)
				UTILS.Errors.show('@target must be specified.');
			else {
				if (width)
					$template.css({ width:width, 'max-width':width });

				var	default_options = {
					html: true,
					content: this.getContent.bind(this),
					placement: $(window).width()>768 ? this.getDirection() : 'bottom',
					container: this.getContainer(),
					trigger: (toggle_action=='dblclick') ? 'manual' : toggle_action,
					template: $template.prop('outerHTML')
				};

				if (title.length)
					default_options.title = title;

				//update any extra bootstrap options passed in
				_.extend(default_options,options);

				$target.popover(default_options).on('shown.bs.popover', this._onShow.bind(this)).on('hide.bs.popover', this._onHide.bind(this));

				//if double click, must add double click event listener
				if (toggle_action=='dblclick')
					$target.popover().on('dblclick',function(){ $target.popover('show') });

				//if target is an anchor, need to prevent default
				if ($target.is('a'))
					$target.on(toggle_action,function(event){ event.preventDefault(); });

				//setting the bootstrap popover instance
				this.setPopoverElm($target.data('bs.popover'));
				$target.data('$utils.popover',this); //lets add 'this' to the html element

				if (this.getHideOnClick())
					$(document).on('click', this.hideOnOutsideClick.bind(this));

				this.values.is_enabled = true;
			}
		}
		return this;
	}
	disable(){
		if (this.values.is_enabled){
			_log(this.getObjectName()+' --> disabled', this.getId());
			this.getTarget().popover('destroy');
			$(document).off('click', this.hideOnOutsideClick.bind(this));
			this.values.is_enabled = false;
		}
		return this;
	}
	getToggleAction(){
		return this.values.toggle_action;
	}
	setToggleAction(toggle_action){
		(toggle_action) && (this.values.toggle_action = toggle_action);
		return this;
	}
	setHideOnClickState(state){
		this.values.hide_on_click = toBoolean(state);
	}
	getHideOnClick(){
		return this.values.hide_on_click;
	}
	isBlur(){
		return this.values.is_blur;
	}
	setBlurState(state){
		this.values.is_blur = toBoolean(state);
	}
	getBlur(){
		return this.values.Blur;
	}
	setBlur(){
		if (this.isBlur()){
			if (!this.values.Blur)
				this.values.Blur = new UTILS.Blur({ target:this.getContainer(), color:'white' })
			else
				this.values.Blur.setTarget(this.getContainer());
		}
		return this;
	}
	getPopoverElm(){
		return this.values.PopoverElm;
	}
	setPopoverElm(PopoverElm){
		this.values.PopoverElm = PopoverElm;
		return this;
	}
	_onShow(){
		if (!this.values.is_shown){
			(this.isBlur()) && this.getBlur().show();
			this.fns('onShow');
			this.values.is_shown = true;
		}
		return this;
	}
	_onHide(){
		(this.isBlur()) && this.getBlur().hide();
		this.fns('onHide');
		return this;
	}
	hide(){
		if (this.values.is_shown){
			this._onHide();
			this.getTarget().popover('hide');
			this.values.is_shown = false;
		}
		return this;
	}
	//ignore all inside clicks, otherwise close popover
	hideOnOutsideClick(event){
		_.each($('[data-original-title]'), function(popover){
			var $popover = $(popover);
			if (!$popover.is(event.target) && !$popover.has(event.target).length && !$('.popover').has(event.target).length){
				this.hide();
				this.fns('onCancel');
			}
		}.bind(this));
	}
	getContainer(){
		return this.values.$container;
	}
	setContainer(container){
		this.values.$container = $(container);
		this.setBlur();
		return this;
	}
	getDirection(){
		return this.values.direction;
	}
	setDirection(direction){
		this.values.direction = direction;
		return this;
	}
	getTitle(){
		return this.values.title;
	}
	setTitle(title){
		this.values.title = title;
		return this;
	}
	getItems(){
		return this.values.items;
	}
	setItems(items){
		this.values.items = items;
		this.populate();
		return this;
	}
	getContent(){
		return this.values.$content;
	}
	setContent(content){
		var $target = this.getTarget(),
			PopoverElm = this.getPopoverElm();

		this.values.$content = $(content);
		this.onContentChanged();
		return this;
	}
	onContentChanged(){
		if (this.values.is_shown){
			var $target = this.getTarget(),
				PopoverElm = this.getPopoverElm();

			//$target.data('content',this.getContent());
			PopoverElm.setContent();
			PopoverElm.$tip.addClass(PopoverElm.options.placement); //fixes the placement
			// if popover is visible before content has loaded
			if (PopoverElm.$tip.is(':visible'))
				PopoverElm.show();
		}
	}
	populate(){
		_log(this.getObjectName()+' --> content populated', this.getId());
		var $content = $('<div class="list-group"></div>');
		_.each(this.getItems(), function(item){
			var $item = $('<a class="list-group-item cursor '+('css' in item ? item.css : '')+'">'+item.label+'</a>')
					.data('popover-selected-item', item)
					.on('click', function(event){
						this.fns('onSelect', ( $(event.target).data('popover-selected-item') || $(event.target).parent().data('popover-selected-item') ));
						this.hide();
					}.bind(this));

			$content.append($item);
		}.bind(this));
		this.setContent($content);
		return this;
	}
};