/*
	== UTILS.Box ==
*/
UTILS.Box =  class extends UTILS.Base {
	constructor(data={}){
		super(data);

		('onCreate' in data) && this.addCallback('onCreate',data.onCreate);
		('onShow' in data) && this.addCallback('onShow',data.onShow);
		('onHide' in data) && this.addCallback('onHide',data.onHide);
		('onBlur' in data) && this.addCallback('onBlur',data.onBlur);
		('onUnblur' in data) && this.addCallback('onUnblur',data.onUnblur);
		('onStart' in data) && this.addCallback('onStart',data.onStart);
		('onBeforeStart' in data) && this.addCallback('onBeforeStart',data.onBeforeStart);
		('onBeforeShow' in data) && this.addCallback('onBeforeShow',data.onBeforeShow);
		('onComplete' in data) && this.addCallback('onComplete',data.onComplete);
		('onMaximize' in data) && this.addCallback('onMaximize',data.onMaximize);
		('onMinimize' in data) && this.addCallback('onMinimize',data.onMinimize);
		('onClose' in data) && this.addCallback('onClose',data.onClose);
		('onCancel' in data) && this.addCallback('onCancel',data.onCancel);
		('onBeforeClose' in data) && this.addCallback('onBeforeClose',data.onBeforeClose);
		('onCreate' in data) && this.addCallback('onCreate',data.onCreate);
		('onContentHeightChange' in data) && this.addCallback('onContentHeightChange',data.onContentHeightChange);
		('onContentUpdate' in data) && this.addCallback('onContentUpdate',data.onContentUpdate);

		this.values.max_responsive_width = ('w' in data && data.w>768) ? data.w : 768; //maximum width of window before triggering responsiveness

		//deprecated
		if ('resizeDims' in data)
			data.fixed_dims = data.resizeDims;

		('max_width' in data) && this.setMaxWidthForFixedDims(data.max_width);
		('max_height' in data) && this.setMaxHeightForFixedDims(data.max_height);

		let _data = {
			w: data.w || 600,
			h: data.h || 'auto',
			html: data.html || '',
			light: !!data.light,
			title: data.title || '',
			controls: data.controls || '',
			classname: data.classname || '',
			buttons: data.buttons || null,
			coords: data.coords || null,
			center: !!data.center,
			offset: (data.offset && typeof data.offset==='object') ? data.offset : {left:0,top:0},
			freeze: !!data.freeze,
			blur: data.blur || null,
			dimmer: data.dimmer || false,
			scrollable: data.scrollable || false,
			fixed_dims: (typeof data.fixed_dims==='number' || typeof data.fixed_dims==='string') ? data.fixed_dims : null
		};

		this._create().set(_data);

		//settings that need to be run after the $elm is created
		('allow_close' in data) && this.setAllowCloseState(data.allow_close);

		data.outside_close = 'outside_close' in data ? data.outside_close : true;
		this.setCloseOnOutsideClickState(data.outside_close);

		return this;
	}
	getDefaults(){
		return {
			object: 'utils.box',
			version: '3.5.0',
			history: {}, //holds the historic box settings (in case of maximize, etc...)
			is_shown: false, //holds whether this box is shown
			$elm: null,
			//holds the divs of the box
			divs: {
				scrolling_wrapper: null //holds the wrapper inside which the box is placed if scrolling is enabled
			},
			html: '', //holds the content of the mainbody
			num_of_opens: 0, //number of times box is shown (used to limit fx on box.show if after the initial open)
			light: false,
			fx: { effect:null, base:null },
			blur: { color:'black' },
			__blur: null, //holds the UTILS.Blur instance
			buttons: { close:true, maximize:false },
			is_close_allowed: true, //holds whether the box can be closed
			outside_close: false, //holds whether the box can be closed on outside click
			max_width_for_fixed_dims: null, //holds the max width for fixed dims setup
			max_height_for_fixed_dims: null //holds the max height for fixed dims setup
		};
	}
	setTarget(target){
		if (target){
			super.setTarget(target);

			if (target instanceof UTILS.Box)
				this.values.$target = target;
		}

		return this;
	}

	getBlur(){
		return this.values.__blur;
	}
	setBlur(__blur){
		this.values.__blur = __blur;
		return this;
	}

	//private - removes the div
	destroy(){
		this.values.$elm.remove();
	}
	clean(){
		$(document).off('keyup.escape.utils.box',this._onEscapeKeyPressed);
		this.fns('onBeforeClose');
		this.cleanAfterMaximize();

		this.values.is_shown = false;

		if (this.values.fx.effect!=null) //if box was opened with an effect, close it accordingly
			this.fx('close');
		else {
			this.destroy();
			this.fns('onClose');
		}

		return this;
	}
	show(){ //shows the box
		this.fns('onBeforeShow');

		this.values.num_of_opens++; //num of times box is displayed
		(this.values.num_of_opens==1) && this.fns('onBeforeStart');

		let _show = () => {
			if (this.values.fx.effect!=null && this.values.num_of_opens==1) //only show fx the first time box is opened (skip show/hide)
				this.fx('open');
			else {
				this.values.$elm.show().css('visibility','visible');
				if (this.values.num_of_opens==1){
					this.fns('onStart');
					this.fns('onComplete');
				}
				this.fns('onShow');
			}
			this.values.is_shown = true;
		};

		//if scrollable, enable scrolling
		if (this.values.scrollable)
			this.enableScrolling();

		if (this.values.dimmer){
			let _onClose = ()=>{};

			if (this.values.$target instanceof UTILS.Box){
				_onClose = this.values.$target.unblur.bind(this.values.$target);
				this.values.$target.blur();
				_show();
				this.getTargetDOM().append(this.values.$elm); //we must re-append the box to make sure its behind the blur
			}
			else {
				let $target = this.isGlobalBox() ? $('body') : this.values.$target,
					__blur = new UTILS.Blur({
						target: $target,
						color: 'black',
						onShow: __blur => {
							if (this.isGlobalBox())
								$('body').addClass('overflow global-dimmer');

							_show();
						},
						onHide: __blur => {
							if (this.isGlobalBox())
								$('body').removeClass('overflow global-dimmer');
						}
					});

				this.setBlur(__blur);

				_onClose = this instanceof APP.Box && APP.stack.getBoxes().length>1 ? ()=>{} : __blur.hide.bind(__blur);

				//lets check if close on outside click is enabled
				let outside_click = this.isCloseOnOutsideClick();
				if (outside_click)
					__blur.getBlur().one('click', event => { event.preventDefault(); this.clean(); });

				__blur.show();
			}

			this.set({ onClose:_onClose });
		}
		else
			_show();

		return this;
	}
	hide(){ //hides the box
		this.values.$elm.hide();
		this.fns('onHide'); //run onHide
		this.values.is_shown = false;
		return this;
	}
	isShown(){
		return this.values.is_shown;
	}
	//private - only used to determine if the box is insterted into the body or within another DOM elm
	isGlobalBox(){
		return (!(this.values.$target instanceof UTILS.Box) && this.values.$target.is('body'));
	}
	isInsideBox(){
		return this.getParentBox().length;
	}
	isMaximized(){
		return this.values.$elm.hasClass('maximized');
	}
	//enables content scrolling
	enableScrolling(){
		if (!('scrollable' in this.values.history) && !this.isInsideBox() && !this.isMaximized()){
			this.values.history.scrollable = {
				coords: this.values.coords,
				freeze: this.values.freeze,
				classes: this.values.$elm.attr('class').match(/(?:^|)pos-(\w+)(?!\w)/g) || [] //match all classes starting with 'pos-...'
			};
			//need to position the box at the top/center of the page
			this.set({
				coords: {left:'auto',top:0},
				freeze: false,
				onBeforeClose: this.disableScrolling.bind(this)
			},true);
			//need to wrap the box is box-scrollable layer
			this.values.divs.$scrolling_wrapper = this.values.$elm.wrap($('<div>',{'class':'box-scrollable'})).parent();
			this.values.$elm.removeClass('pos-fixed pos-absolute').addClass('cfx'); //remove 'fixed' and 'absolute'...but add 'cfx'

			if (!this.values.dimmer)
				$('body').addClass('overflow');
		}
	}
	disableScrolling(){
		if ('scrollable' in this.values.history){
			this.set({ coords:this.values.history.scrollable.coords, freeze:this.values.history.scrollable.freeze, scrollable:false },true);

			//removing .box-scrollable
			if (this.values.divs.$scrolling_wrapper && this.values.divs.$scrolling_wrapper.length)
				this.values.divs.$scrolling_wrapper.after(this.values.$elm).remove();

			if (!this.values.dimmer)
				$('body').removeClass('overflow');

			//lets check for the position class
			if (this.values.history.scrollable.classes.length){
				this.values.$elm.removeClass('pos-fixed pos-absolute'); //remove all so that we just have one pos- class... ( the second could have been added by setCenter() )
				this.values.$elm.addClass(UTILS.joinArray(this.values.history.scrollable.classes,' '));

				if (this.values.center)
					this.setCenter();
			}

			delete this.values.history.scrollable;
		}
	}
	maximize(){
		switch(this.values.$elm.hasClass('maximized')){
			//expands the box to stretch across the entire window
			case false: //maximize
				if (this.values.fixed_dims)
					this.values.history.fixed_dims = this.values.fixed_dims;
				else
					this.values.history.on_static = {w:this.values.w,h:this.values.h,coords:this.values.$elm.offset()};

				this.set({fixed_dims:0});
				$('body').addClass('overflow'); //remove schrollbars (if any)
				this.values.divs.$maximize.attr({title:'minimize'});
				this.values.$elm.addClass('maximized');
				this.fns('onMaximize');
			break;
			//contracts the box to its original dimensions & coords
			case true: //minimize
				//check if the box had fixed_dims previously
				if ('fixed_dims' in this.values.history){
					this.set({fixed_dims:UTILS.joinArray(this.values.history.fixed_dims,'x')}); //must be in 10x10x10x10 format
					delete this.values.history.fixed_dims;
				}
				else if ('on_static' in this.values.history) {
					this.set({w:this.values.history.on_static.w,h:this.values.history.on_static.h,coords:this.values.history.on_static.coords});
					delete this.values.history.on_static;
					this.values.fixed_dims = null; //reset fixed_dims to default
				}

				this.cleanAfterMaximize();
				this.values.divs.$maximize.attr({title:'maximize'});
				this.values.$elm.removeClass('maximized');
				this.fns('onMinimize');
			break;
		}
	}
	cleanAfterMaximize(){
		//remove 'overflow' from body only when this is the last maximized box
		if ($('.box.maximized','body').length==1 && !$('body').hasClass('global-dimmer'))
			$('body').removeClass('overflow');
	}
	//checks if the actual DOM elm exists
	boxExists(){
		return !!$(this.values.$elm).length; //returns a boolean
	}
	blur(){ //blurs box content
		var blur_instance = this.values.$elm.data('utils.blur');

		if (!(blur_instance instanceof UTILS.Blur))
			blur_instance = new UTILS.Blur({ target:this.values.$elm });

		blur_instance.set({ color:this.values.blur.color, opac:this.values.blur.opac||null }).show();
		this.fns('onBlur');
		return this;
	}
	unblur(){ //unblurs box content
		let blur_instance = this.values.$elm.data('utils.blur');

		if (blur_instance)
			blur_instance.hide();

		this.fns('onUnblur');
		return this;
	}
	enableControls(){
		this.values.divs.$controls.show();
	}
	disableControls(){
		this.values.divs.$controls.hide();
	}
	empty(){
		let $mainbody = this.getMainbody();

		$mainbody.empty();

		return this;
	}

	setCenter(){
		let $box = this.getBox();

		$box.toggleClass('box-center',this.values.center);

		if (!this.isGlobalBox())
			this.getTargetDOM().toggleClass('box-center-support');

		return this;
	}

	//private
	// @action - open|close
	fx(action){
		var action = action || 'open';

		//cssFx the box
		let cssFx = function(){
			let effects = {
				'fade-down': 'fadeIn',
				'slide-down': 'fadeIn',
				'slide-up': 'fadeIn',
				'slide-right': 'slideInRight',
				'shake': 'shakeX',
				'expand-in': 'zoomIn'
			};

			let box_coords = this.values.$elm.offset();

			switch (action){
				case 'open': //opening the box
					this.values.$elm.show().css('visibility','visible');
					this.fns('onStart', this.values.$elm);
					UTILS.animateCss(this.values.$elm,effects[this.values.fx.effect]).then(elm => {
						this.fns('onShow', elm);
						this.fns('onComplete', elm);
					});
				break;
				case 'close': //closing the box
					this.values.$elm.remove();
					this.destroy();
					this.fns('onClose');
				break;
			}
		}.bind(this); //cssFx

		//expands the box from clicked elm
		let expand = function(){
			switch(action){
				case 'open': //maximizing box
					this.values.$elm.show().css('visibility','visible');
					this.fns('onStart',this.values.$elm);
					this.fns('onShow',this.values.$elm);
					this.fns('onComplete',this.values.$elm);
				break;
				case 'close': //minimizing box
					this.values.$elm.remove();
					this.destroy();
					this.fns('onClose',this.values.$elm);
				break;
			}
		}.bind(this); //expand

		if (this.values.fx.effect=='expand')
			expand();
		else
			cssFx();
	} //fx

	isCentered(){
		return this.values.center;
	}

	//if the this.values.$target happens to be another UTILS.Box, we need to get the parent to append it to
	getTargetDOM(){
		return this.values.$target instanceof UTILS.Box ? this.values.$target.values.$elm : this.values.$target;
	}
	//gets the zindex of the most upper box on the page
	getLastZIndex(){
		return parseInt($('.box').last().css('z-index'))+200 || 20001;
	}
	_onBoxCloseClicked(event){
		event.preventDefault();
		event.stopPropagation();
		this.fns('onCancel');
		this.clean('clean');
	}
	_create(){
		let zindex = this.getLastZIndex(),
			box_id = this.getId(),
			$target = this.getTargetDOM();

		//if box exists, remove it
		if (this.boxExists())
			this.values.$elm.remove();

		let $elm = $(`
			<div id="${box_id}" class="box ${this.isGlobalBox()?'pos-fixed':'pos-absolute'} ${this.values.light?'light':''}" data-box-allow-close="${this.isCloseAllowed()}">
				<div class="box-hd">
					<div class="box-hd-title"></div>
					<div class="box-hd-extra"></div>
					<div class="box-hd-controls">
						<small class="box-timestamp text-muted"></small>
						<a href="#" title="maximize" class="box-hd-header-control box-top-buttons-maximize"><i class="ti ti-arrows-maximize"></i></a>
						<a href="#" title="close" class="box-hd-header-control box-top-buttons-close box-control-clean"><i class="ti ti-x"></i></a>
					</div>
				</div>
				<div class="box-outer">
					<div class="box-inner">
						<div class="box-mainbody"></div>
					</div>
				</div>
				<div class="box-controls"></div>
			</div>
		`);

		//update box
		$elm.css('zIndex',zindex);

		//parts
		this.values.divs.$hd = $elm.find('.box-hd');
		this.values.divs.$title = $elm.find('.box-hd-title');
		this.values.divs.$mainbody = $elm.find('.box-mainbody');
		this.values.divs.$controls = $elm.find('.box-controls');
		this.values.divs.$inner = $elm.find('.box-inner');
		this.values.divs.$outer = $elm.find('.box-outer');
		this.values.divs.$hd_controls = $elm.find('.box-hd-controls');
		this.values.divs.$hd_extra = $elm.find('.box-hd-extra');
		this.values.divs.$cls = $elm.find('.box-top-buttons-close');
		this.values.divs.$maximize = $elm.find('.box-top-buttons-maximize');
		this.values.divs.$timestamp = $elm.find('.box-timestamp');
		this.values.$elm = $elm;

		$target.append(this.values.$elm);

		//on content change
		new MutationObserver(() => {
			this.fns('onContentUpdate');
		}).observe(this.values.divs.$mainbody[0], { childList:true, subtree:true } );

		//lets add the box close event
		this.values.$elm.on('click.clean.utils.box','.box-control-clean',this._onBoxCloseClicked.bind(this));

		this.values.divs.$maximize.on('click.maximize.utils.box',this.maximize.bind(this)); //maximize button

		//onEscape
		$(document).on('keyup.escape.utils.box',this._onEscapeKeyPressed.bind(this));

		//lets store 'this' in data('utils.box')
		this.values.$elm.data(this.getObjectName().split(' v')[0],this);

		this.fns('onCreate');

		return this;
	}

	getMaxWidthForFixedDims(){
		return this.values.max_width_for_fixed_dims;
	}
	setMaxWidthForFixedDims(max_width){
		this.values.max_width_for_fixed_dims = max_width;
		return this;
	}

	getMaxHeightForFixedDims(){
		return this.values.max_height_for_fixed_dims;
	}
	setMaxHeightForFixedDims(max_height){
		this.values.max_height_for_fixed_dims = max_height;
		return this;
	}

	isCloseOnOutsideClick(){
		return this.values.outside_close;
	}
	setCloseOnOutsideClickState(state=false){
		this.values.outside_close = state;
		return this;
	}

	getTimestamp(){
		return this.values.divs.$timestamp.html();
	}

	setTimestamp(time=''){
		this.values.divs.$timestamp.html(time);
		return this;
	}

	//if escape key is pressed, lets close the box
	_onEscapeKeyPressed(event){
		let key = UTILS.getCharKey(event),
			Box = $('.box').last().data('utils.box');

		if (key===27 && Box && Box.getId()===this.getId() && this.isCloseAllowed())
			this.clean();
	}

	isCloseAllowed(){
		return this.values.is_close_allowed;
	}
	setAllowCloseState(state=true){
		this.values.is_close_allowed = state;
		this.values.$elm.attr('data-box-allow-close',state);
		return this;
	}

	//re-render box --> e.q. box.set({w:600, title:'please note',html:'',dd:false,fn:null,center:true});
	set(data={}){
		if (data){
			for (var k in data){
				switch(true){
					case /^target$/.test(k):
						let $target = this.getTarget();

						if ($(data[k]).get(0)!==$target.get(0)){
							this.setTarget(data[k]);
							this.getTargetDOM().append(this.values.$elm); //must move the box in to the new target
						}
					break;
					case /^w$/.test(k):
						this.values.w = data[k];
						this.values.$elm.width(this.values.w);
					break;
					case /^h$/.test(k):
						this.values.h = data[k];

						let extra_h = this.values.divs.$controls.height();

						this.values.divs.$outer.height(typeof this.values.h==='number' ? this.values.h-extra_h : this.values.h);
					break; //set height minus 20px due to box padding
					case /^title$/.test(k):
						this.values.$title = typeof data[k]==='string' ? $(`<span>${data[k]}</span>`) : data[k];

						if (this.values.$title)
							this.values.divs.$title.html(this.values.$title).show();
						else
							this.values.divs.$title.hide();
					break;
					case /^html$/.test(k):
						let $mainbody = this.values.divs.$mainbody;
						this.values.html = data[k];

						$mainbody.html(this.values.html);
					break;
					case /^controls$/.test(k):
						this.values.controls = data[k];
						this.values.divs.$controls.html(this.values.controls);

						if (this.values.divs.$controls.html().length)
							this.values.divs.$controls.addClass('expressed');
						else {
							this.values.divs.$controls.removeClass('expressed');
							this.values.divs.$mainbody.css({'paddingBottom':0});
						}
					break;
					case /^classname$/.test(k):
						this.values.classname = data[k];
						this.values.$elm.addClass(this.values.classname);
					break;
					case /^buttons$/.test(k):
						UTILS.extend(this.values.buttons,data[k]);
						//lets show/hide buttons
						for (var button in this.values.buttons){
							switch(button){
								case 'close': this.setAllowCloseState(this.values.buttons.close); break;
								case 'maximize':
									(this.values.buttons.maximize) ? this.values.divs.$maximize.removeClass('hide') : this.values.divs.$maximize.addClass('hide');
								break;
							}
						}
					break;
					case /^coords$/.test(k):
						this.values.coords = data[k];

						if (this.values.coords)
							this.values.$elm.css(this.values.coords);
						else
							this.values.coords = null;
					break;
					case /^freeze$/.test(k):
						this.values.freeze = data[k];

						if (this.values.freeze)
							this.set({h:this.values.divs.$outer.outerHeight()+20});
						else
							this.set({h:'auto'}); //dynamic box height, depending on content
					break;
					case /^center$/.test(k):
						this.values.center = data[k];
						this.setCenter();
					break;
					case /^blur$/.test(k): UTILS.extend(this.values.blur,data[k]); break;
					case /^dimmer$/.test(k): this.values.dimmer = !!data[k]; break;
					case /^scrollable$/.test(k): this.values.scrollable = !!data[k]; break;
					case /^on[A-Z][a-z].+$/.test(k):
						this.addCallback(k,data[k]);
					break;
					//this.values.fixed_dims can be either a single number or 'TOPxRIGHTxBOTTOMxLEFT' separated by 'x'
					case /^fixed_dims$/.test(k):
						this.values.fixed_dims = data[k];

						if (this.values.fixed_dims!==null){
							let $box = this.getBox(),
								tmp_dims = !typeof this.values.fixed_dims==='number'
									? this.values.fixed_dims.split('x')
									: Array.from({ length:4 },(_,i) => this.values.fixed_dims); //returns [] populated with 4 x fixed_dims

							this.values.fixed_dims = [];

							for (let i=0; i<tmp_dims.length; i++){
								this.values.fixed_dims.push(parseInt(tmp_dims[i]));
							}

							//lets check for max width
							let max_width = this.getMaxWidthForFixedDims(),
								max_height = this.getMaxHeightForFixedDims();

							if (max_width){
								//lets try to get the view port width
								let viewport_width = $(window).width();

								if (viewport_width > max_width){
									let width_on_side = (viewport_width - max_width) / 2;

									this.values.fixed_dims[3] = this.values.fixed_dims[1] = width_on_side;
								}

								//lets add a resize listener to make sure we maintain the width for as long as possible
								$(window).resize(event => {
									let viewport_width = $(window).width();

									if (viewport_width > max_width){
										let width_on_side = viewport_width > max_width ? (viewport_width - max_width) / 2 : this.values.fixed_dims[0];

										this.getBox().css({
											'--box-fixed-dims-right': `${width_on_side}px`,
											'--box-fixed-dims-left': `${width_on_side}px`
										});
									}
								});
							}

							if (max_height){
								//lets try to get the view port width
								let viewport_height = $(window).height();

								if (viewport_height > max_height){
									let height_on_side = (viewport_height - max_height) / 2;

									this.values.fixed_dims[2] = this.values.fixed_dims[0] = height_on_side;
								}

								//lets add a resize listener to make sure we maintain the width for as long as possible
								$(window).resize(event => {
									let viewport_height = $(window).height();

									if (viewport_height > max_height){
										let height_on_side = viewport_height > max_height ? (viewport_height - max_height) / 2 : this.values.fixed_dims[0];

										this.getBox().css({
											'--box-fixed-dims-bottom': `${height_on_side}px`,
											'--box-fixed-dims-top': `${height_on_side}px`
										});
									}
								});
							}

							//lets add a class to box to make sure the $outer height is ignored
							$box
								.toggleClass('box-fixed-dims',!!this.values.fixed_dims)
								.css({
									'--box-fixed-dims-top': `${this.values.fixed_dims[0]}px`,
									'--box-fixed-dims-right': `${this.values.fixed_dims[1]}px`,
									'--box-fixed-dims-bottom': `${this.values.fixed_dims[2]}px`,
									'--box-fixed-dims-left': `${this.values.fixed_dims[3]}px`
								});
						}
					break;
				} //switch
			}
		}
		return this;
	} //set
	getBox(){
		return this.values.$elm;
	}
	getControls(){
		return this.values.divs.$controls;
	}
	getMainbody(){
		return this.values.divs.$mainbody;
	}
	getHeader(){
		return this.values.divs.$hd;
	}
	getHeaderTitle(){
		return this.values.divs.$title;
	}
	getHeaderExtra(){
		return this.values.divs.$hd_extra;
	}
	getHeaderControls(){
		return this.values.divs.$hd_controls;
	}
	getInner(){
		return this.values.divs.$inner;
	}
	getOuter(){
		return this.values.divs.$outer;
	}
	getParentBox(){
		return this.values.$elm.parent().closest('.box');
	}
};
