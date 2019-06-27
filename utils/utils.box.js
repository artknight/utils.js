/*
	== UTILS.Box ==

	ex.
	var box = new UTILS.Box({
		id:'test-box',
		w:600,
		title:'please note',
		html:'',
		controls:'',
		offset:{left:0,top:0},
		fx:{effect:'slide-down'}
	});
	box.show();

	== definitions ==
	@id - (optional) id of the box --> defaults to 'b-'+UTILS.uuid()
	@w - (optional) width of the box --> defaults to '600'
	@h - (optional) height of the box --> defaults to 'auto'
	@target - (optional) target DOM element where to insert the box into --> defaults to $('body')
	@light - (optional) creates light box without close button and grey border (used to show error msgs) --> defaults to 'false'
	@title - (optional) title of the box --> defaults to ''
	@html - (optional) content of the box --> defaults to ''
	@controls - (optional) control buttons at the bottom of the box --> defaults to ''
	@classname - (optional) adds an extra class to the box (sometimes used to identify the set of boxes) --> defaults to ''
	@buttons - (optional) sets show|hide for certain buttons --> defaults to {close:true,maximize:false}
	@dd - (optional) enable|disable drag n drop --> defaults to 'false'
	@center - (optional) center box --> defaults to 'false'
	@coords - (optional) position box at certain place --> defaults to 'null'
	@offset - (optional) offset box from center when opening --> defaults to '{left:0,top:0}'
	@onCreate - (optional) function to execute when box is first created (ONE-TIME EXECUTION) --> defaults to 'null'
	@onShow - (optional) stack of functions to execute when the box is shown (REPEAT EXECUTION) --> defaults to 'null'
	@onHide - (optional) stack of functions to execute when the box is hidden, NOT closed (REPEAT EXECUTION) --> defaults to 'null'
	@onBlur - (optional) stack of functions to execute when the box is blurred (REPEAT EXECUTION) --> defaults to 'null'
	@onUnblur - (optional) stack of functions to execute when the box is unblurred (REPEAT EXECUTION) --> defaults to 'null'
	@onStart - (optional) stack of functions to execute when the box is shown (or animation starts) for the first time (ONE-TIME EXECUTION) --> defaults to 'null'
	@onBeforeStart - (optional) stack of functions to execute before the 'onStart' runs (ONE-TIME EXECUTION) --> defaults to 'null'
	@onComplete - (optional) stack of functions to execute after the special effects have finished (ONE-TIME EXECUTION) --> defaults to 'null'
	@onClose - (optional) stack of functions to execute after the box closed (ONE-TIME EXECUTION) --> defaults to 'null'
	@onBeforeClose - (optional) stack of functions to execute right before the box is closed (ONE-TIME EXECUTION) --> defaults to 'null'
	@onMaximize - (optional) stack of functions to execute after the box is maximized (REPEAT EXECUTION) --> defaults to 'null'
	@onMinimize - (optional) stack of functions to execute after the box is minimized (REPEAT EXECUTION) --> defaults to 'null'
	@onContentHeightChange - (optional) stack of functions to execute when mainbody height changes (REPEAT EXECUTION) --> defaults to 'null'
	@resizeDims - (optional) make box resize when browser resizes (previously specified dims will be overwritten, format TOPxRIGHTxBOTTOMxLEFT or single number) --> defaults to 'null'
	@fx - (optional) the effect type and base elm to open the box from - (base is needed for some effects only) --> defaults to '{effect:null,base:null}'
	@freeze - (optional) freeze height after render --> defaults to 'false'
	@blur - (optional) set blur effect color and opacity --> defaults to {color:'black',opac:0.3}
	@dimmer - (optional) set the global dimmer --> defaults to 'false'
	@scrollable - (optional) enable content to scroll (up/down scrolling of the page) --> defaults to 'false'

	== dependencies ==
	jquery.js
	jquery-ui.js
	velocity.js
	ResizeSensor.js
*/
UTILS.Box =  class extends UTILS.Base {
	constructor(data={}){
		super(data);
		_log(this.getObjectName()+' --> instantiated!',this.getId(),this);

		('onCreate' in data) && this.addCallback('onCreate',data.onCreate);
		('onShow' in data) && this.addCallback('onShow',data.onShow);
		('onHide' in data) && this.addCallback('onHide',data.onHide);
		('onBlur' in data) && this.addCallback('onBlur',data.onBlur);
		('onUnblur' in data) && this.addCallback('onUnblur',data.onUnblur);
		('onStart' in data) && this.addCallback('onStart',data.onStart);
		('onBeforeStart' in data) && this.addCallback('onBeforeStart',data.onBeforeStart);
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

		var _data = {
			w: data.w || 600,
			h: data.h || 'auto',
			html: data.html || '',
			light: !!data.light,
			title: data.title || '',
			controls: data.controls || '',
			classname: data.classname || '',
			buttons: data.buttons || null,
			dd: !!data.dd,
			coords: data.coords || null,
			center: !!data.center,
			offset: (data.offset && _.isPlainObject(data.offset)) ? data.offset : {left:0,top:0},
			freeze: !!data.freeze,
			blur: data.blur || null,
			dimmer: data.dimmer || false,
			scrollable: data.scrollable || false,
			resizeDims: data.resizeDims || null
		};

		this.create().set(_data).enableResizeSensor();
		return this;
	}
	getDefaults(){
		return {
			object: 'utils.box',
			version: '3.2.8',
			history: {}, //holds the historic box settings (in case of maximize, etc...)
			is_shown: false, //holds whether this box is shown
			//holds the divs of the box
			divs: {
				scrolling_wrapper: null //holds the wrapper inside which the box is placed if scrolling is enabled
			},
			html: '', //holds the content of the mainbody
			num_of_opens: 0, //number of times box is shown (used to limit fx on box.show if after the initial open)
			light: false,
			fx: { effect:null, base:null },
			blur: { color:'black' },
			buttons: { close:true, maximize:false },
			resizeSensor: null //holds the resize sensor class
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
	//private - removes the div
	destroy(){
		this.values.$elm.remove();
	}
	clean(){
		this.values.$elm.off('resize.selfcorrect.utils.box',this.selfCorrect);
		$(window).off('resize.utils.box resize.center.utils.box',this.onResize);
		$(document).off('keyup.escape.utils.box',this._onEscapeKeyPressed);
		this.fns('onBeforeClose');
		this.cleanAfterMaximize();

		if (this.values.fx.effect!=null) //if box was opened with an effect, close it accordingly
			this.fx('close');
		else {
			this.destroy();
			this.fns('onClose');
		}

		return this;
	}
	show(){ //shows the box
		this.values.num_of_opens++; //num of times box is displayed
		(this.values.num_of_opens==1) && this.fns('onBeforeStart');

		var _show = function(){
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
		}.bind(this);

		//if scrollable, enable scrolling
		if (this.values.scrollable)
			this.enableScrolling();

		if (this.values.dimmer){
			var onClose = new Function;

			if (this.isGlobalBox()){
				onClose = (this instanceof APP.Box && APP.stack.getBoxes().length>1) ? new Function : UTILS.dim.hide;
				UTILS.dim.show(null,{onShow:_show});
			}
			else if (this.values.$target instanceof UTILS.Box){
				onClose = this.values.$target.unblur.bind(this.values.$target);
				this.values.$target.blur();
				_show();
				this.getTargetDOM().append(this.values.$elm); //we must re-append the box to make sure its behind the blur
			}
			else { //we are within another DOM elm
				var blur = new UTILS.Blur({
					target: this.values.$target,
					color: (this instanceof APP.Confirm) ? 'black' : 'white',
					onShow: _show
				});
				onClose = blur.hide.bind(blur);
				blur.show();
			}

			this.set({onClose:onClose},true);
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
				this.values.$elm.addClass(_.joinArray(this.values.history.scrollable.classes,' '));

				if (this.values.center)
					this.values.$elm.setCenter(this.values.offset,this.isGlobalBox()?$(window):this.getTargetDOM());
			}
			delete this.values.history.scrollable;
		}
	}
	maximize(){
		switch(this.values.$elm.hasClass('maximized')){
			//expands the box to stretch across the entire window
			case false: //maximize
				if (this.values.resizeDims)
					this.values.history.resizeDims = this.values.resizeDims;
				else
					this.values.history.on_static = {w:this.values.w,h:this.values.h,coords:this.values.$elm.offset()};

				this.set({resizeDims:0}); //note that this adds a 'this.onResize' event to window
				$('body').addClass('overflow'); //remove schrollbars (if any)
				this.values.divs.$maximize.attr({title:'minimize'});
				this.values.$elm.addClass('maximized');
				this.fns('onMaximize');
			break;
			//contracts the box to its original dimensions & coords
			case true: //minimize
				//check if the box had resizeDims previously
				if ('resizeDims' in this.values.history){
					this.set({resizeDims:_.joinArray(this.values.history.resizeDims,'x')}); //must be in 10x10x10x10 format
					delete this.values.history.resizeDims;
				}
				else if ('on_static' in this.values.history) {
					this.set({w:this.values.history.on_static.w,h:this.values.history.on_static.h,coords:this.values.history.on_static.coords});
					delete this.values.history.on_static;
					this.values.resizeDims = null; //reset resizeDims to default
					this.values.divs.$mainbody.height('auto');
					$(window).off('resize.utils.box',this.onResize); //remove this.onResize that was added when the box was maximized
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
		return !!($(this.values.$elm).length); //returns a boolean
	}
	getBox(){
		return this.values.$elm;
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
		var blur_instance = this.values.$elm.data('utils.blur');

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
		var $mainbody = this.getMainbody(),
			$sensor = $mainbody.find('.resize-sensor');

		$mainbody.empty();

		if ($sensor.length)
			$mainbody.append($sensor);

		return this;
	}
	//private
	onResize(){
		var $parent = this.isGlobalBox() ? $(window) : this.getTargetDOM();
		var page = { w: $parent.width(), h: $parent.height() }; //page dimmensions
		//setting box
		var dims = {
			w: page.w-(this.values.resizeDims[1]+this.values.resizeDims[3]),
			h: page.h-(this.values.resizeDims[0]+this.values.resizeDims[2]),
			left: this.values.resizeDims[3],
			top: this.values.resizeDims[0]
		};

		//special condition when this.values.center==true and responsive kicked in
		if (this.values.center && ('responsive' in this.values.history)){
			dims.h = 'auto';
			dims.w -= 20;
			dims.left = (this.isInsideBox()) ? 20 : 'auto';
			this.enableScrolling();
		}

		this.set({w:dims.w,h:dims.h,coords:{left:dims.left,top:dims.top}},true); //resize box
	}

	//private
	onCenter(){
		//if screen < 768 and no resizeDims set, lets
		if ($(window).width()<this.values.max_responsive_width){
			if (!('responsive' in this.values.history)){
				this.values.history.responsive = {
					resizeDims: this.values.resizeDims,
					w: this.values.w,
					h: this.values.h,
					coords: this.values.coords
				};
			}
			this.values.resizeDims = [20,20,20,20];
			this.onResize();
		}
		else {
			var $parent = this.isGlobalBox() ? $(window) : this.getTargetDOM();

			if ('responsive' in this.values.history){
				this.values.resizeDims = this.values.history.responsive.resizeDims;
				this.set({ w:this.values.history.responsive.w, h:this.values.history.responsive.h, coords:this.values.history.responsive.coords });
				delete this.values.history.responsive;
			}

			this.values.$elm.setCenter(this.values.offset,$parent);

			if ($parent.height()<this.values.$elm.outerHeight()){
				this.values.$elm.css({top:0});
				this.enableScrolling();
			}
			else
				this.disableScrolling();
		}
	}

	//private
	// @action - open|close
	fx(action){
		var action = action || 'open';

		//cssFx the box
		var cssFx = function(){
			var effects = {
				'fade-up': 'transition.slideUpIn',
				'fade-down': 'transition.slideDownIn',
				'fade-left': 'transition.slideLeftIn',
				'fade-right': 'transition.slideRightIn',
				'slide-down': 'transition.slideDownBigIn',
				'slide-up': 'transition.slideUpBigIn',
				'slide-left': 'transition.slideLeftBigIn',
				'slide-right': 'transition.slideRightBigIn',
				'shake': 'callout.shake',
				'fade-in': 'transition.fadeIn',
				'fade-out': 'transition.fadeOut',
				'zoom-in': 'transition.shrinkIn',
				'zoom-out': 'transition.shrinkOut',
				'expand-in': 'transition.expandIn',
				'expand-out': 'transition.expandOut',
				'bounce-up': 'transition.bounceUpIn',
				'bounce-down': 'transition.bounceDownIn',
				'bounce-left': 'transition.bounceLeftIn',
				'bounce-right': 'transition.bounceRightIn'
			};
			var box_coords = this.values.$elm.offset();
			switch (action){
				case 'open': //opening the box
					this.values.$elm.velocity(effects[this.values.fx.effect], {
						duration: 500,
						begin: function(elms){
							this.values.$elm.show().css('visibility','visible');
							this.fns('onStart', elms);
						}.bind(this),
						complete: function(elms){
							this.fns('onShow', elms);
							this.fns('onComplete', elms);
						}.bind(this)
					});
					break;
				case 'close': //closing the box
					this.values.$elm.velocity('reverse', {
						complete: function(elms){
							this.destroy();
							this.fns('onClose');
						}.bind(this)
					});
					break;
			}
		}.bind(this); //cssFx

		//expands the box from clicked elm
		var expand = function(){
			switch(action){
				case 'open': //maximizing box
					if (!this.values.fx.base.length)
						UTILS.Errors.show('@base must be specified.');
					else {
						//while box is invisible, lets center it to get all the end-coords
						if (!this.values.coords)
							this.set({ center:true },true);

						//settings the size & coords
						var size = {
							start: { w:this.values.fx.base.outerWidth(), h:this.values.fx.base.outerHeight() },
							end: { w:this.values.$elm.outerWidth(), h:this.values.$elm.outerHeight() }
						};
						var coords = {
							start: this.isGlobalBox() ? this.values.fx.base.offset() : this.values.fx.base.position(),
							end: this.isGlobalBox() ? this.values.$elm.offset() : this.values.$elm.position()
						};
						this.values.$elm.velocity({
							height: [size.end.h,size.start.h],
							width: [size.end.w,size.start.w],
							left: [coords.end.left,coords.start.left],
							top: [coords.end.top,coords.start.top],
							opacity: [1,0.1]
						},
						{
							duration:400,
							begin: function(elm){
								this.values.divs.$outer.hide();
								this.values.$elm.addClass('overflow');
								this.values.$elm.show().css('visibility','visible');
								this.fns('onStart',elm);
							}.bind(this),
							complete: function(elms){
								this.values.$elm.removeClass('overflow');
								this.values.divs.$outer.show();
								//need to remove width & height from the outer layer
								this.values.$elm.css({width:'auto',height:'auto'});
								this.fns('onShow',elms);
								this.fns('onComplete',elms);
							}.bind(this)
						});

					}
				break;
				case 'close': //minimizing box
					this.values.$elm.velocity('reverse', {
						begin: function(elms){
							this.values.divs.$outer.hide();
							this.values.$elm.addClass('overflow');
						}.bind(this),
						complete: function(elms){
							this.destroy();
							this.fns('onClose',elms);
						}.bind(this)
					});
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

	//private
	enableResizeSensor(){
		if (this.isCentered() && !this.values.resizeSensor){
			_log(this.getObjectName()+' --> resize sensor enabled',this.getId());
			this.values.resizeSensor = new ResizeSensor(this.getMainbody(),function(){
				this.fns('onContentHeightChange',{ height:this.getMainbody().height() });
			}.bind(this));
		}
		return this;
	}
	//private
	disableResizeSensor(){
		if (this.values.resizeSensor){
			_log(this.getObjectName()+' --> resize sensor disabled',this.getId());
			this.values.resizeSensor.detach(this.getMainbody());
		}
		return this;
	}

	//private
	//only used to keep the proper dims for box-mainbody & box-controls
	//an event listener was added to window
	selfCorrect(){
		var m = parseInt(this.values.divs.$mainbody.css('marginTop').replace(/\D/g,'')); //box-mainbody margin top e.q. 15px --> 15
		var p = parseInt(this.values.divs.$inner.css('paddingTop').replace(/\D/g,'')); //box-inner padding top
		var h = (this.values.divs.$controls.html().length) ? this.values.divs.$controls.outerHeight() : 0; //box-controls height

		if (this.values.resizeDims!=null)
			this.values.divs.$mainbody.height(this.values.divs.$outer.outerHeight()-h-p-m);
		else
			this.values.divs.$mainbody.height('auto');

		this.values.divs.$controls.width(this.values.divs.$outer.outerWidth()-20);
	}
	//if the this.values.$target happens to be another UTILS.Box, we need to get the parent to append it to
	getTargetDOM(){
		return this.values.$target instanceof UTILS.Box ? this.values.$target.values.$elm : this.values.$target;
	}
	//gets the zindex of the most upper box on the page
	getLastZIndex(){
		return parseInt($('.box').last().css('z-index'))+200 || 20001;
	}
	//private
	create(){
		var zindex = this.getLastZIndex();

		//if box exists, remove it
		if (this.boxExists())
			$('#'+this.values.id).remove();

		//create new box
		this.values.$elm = $('<div id="'+this.values.id+'" class="box '+(this.isGlobalBox()?'pos-fixed':'pos-absolute')+' '+((this.values.light)?' light':'')+'" style="z-index:'+zindex+'">');
		//parts
		this.values.divs.$hd = $('<div id="'+this.values.id+'-box-hd" class="box-hd">');
		this.values.divs.$mainbody = $('<div id="'+this.values.id+'-box-mainbody" class="box-mainbody cfx">');
		this.values.divs.$controls = $('<div id="'+this.values.id+'-box-controls" class="box-controls cfx" style="z-index:'+parseInt(zindex+4)+'">');
		this.values.divs.$inner = $('<div id="'+this.values.id+'-box-inner" class="box-inner">');
		this.values.divs.$outer = $('<div id="'+this.values.id+'-box-outer" class="box-outer">');
		this.values.divs.$buttons = $('<div id="'+this.values.id+'-box-top-buttons" class="box-top-buttons">');
		this.values.divs.$cls = $('<a id="'+this.values.id+'-box-boxcls" href="#" title="close" class="box-top-buttons-close"><i class="mdi mdi-close mdi-fw mdi-24px"></i></a>');
		this.values.divs.$maximize = $('<a id="'+this.values.id+'-box-maximize" href="#" title="maximize" class="box-top-buttons-maximize"><i class="mdi mdi-arrow-expand-all mdi-fw mdi-24px"></i></a>');
		//appending
		this.getTargetDOM().append(
			this.values.$elm.append(
				this.values.divs.$outer.append(
					this.values.divs.$inner.append(
						this.values.divs.$hd,
						this.values.divs.$mainbody
					),
					this.values.divs.$buttons.append(
						this.values.divs.$maximize,
						this.values.divs.$cls
					)
				),
				this.values.divs.$controls
			)
		);
		//buttons
		this.values.divs.$cls.on('click.clean.utils.box',function(event){ event.preventDefault(); event.stopPropagation(); this.fns('onCancel'); this.clean('clean'); }.bind(this)); //close button
		this.values.divs.$maximize.on('click.maximize.utils.box',this.maximize.bind(this)); //maximize button
		this.values.$elm.on('resize.selfcorrect.utils.box',this.selfCorrect.bind(this)); //box-mainbody must always have full height & box-controls must be full width
		
		//onEscape
		$(document).on('keyup.escape.utils.box',this._onEscapeKeyPressed.bind(this));
		//lets store 'this' in box element
		this.values.$elm.data('box',this);

		this.fns('onCreate');

		return this;
	} //create

	//if escape key is pressed, lets close the box
	_onEscapeKeyPressed(event){
		var key = UTILS.getCharKey(event),
			Box = $('.box').last().data('box');

		if (key===27 && Box && Box.getId()===this.getId())
			this.clean();
	}

	//re-render box --> e.q. box.set({w:600, title:'please note',html:'',dd:false,fn:null,center:true});
	//skip: only passed to avoid calling this.selfCorrect() if self recursive
	set(data,skip){
		if (data && _.isPlainObject(data)){
			for (var k in data){
				switch(true){
					case /^target$/.test(k):
						var $target = this.getTarget();
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
						this.values.divs.$outer.height(_.isNumber(this.values.h) ? this.values.h-20 : this.values.h);
					break; //set height minus 20px due to box padding
					case /^title$/.test(k):
						this.values.title = data[k];
						if (this.values.title.length){
							this.values.divs.$mainbody.removeClass('margin-t0');
							this.values.divs.$hd.html('<span>'+this.values.title+'</span>').show();
						}
						else {
							this.values.divs.$mainbody.addClass('margin-t0');
							this.values.divs.$hd.empty().hide();
						}
					break;
					case /^html$/.test(k):
						var $mainbody = this.values.divs.$mainbody;
						this.values.html = data[k];
						$mainbody.velocity('fadeIn',{
							duration: 500,
							begin: function(){
								var $sensor = $mainbody.find('.resize-sensor');
								$mainbody.html(this.values.html);
								($sensor.length) && $mainbody.append($sensor);
							}.bind(this),
							complete: function(){
								this.enableResizeSensor(); //must enable this sensor after content is loaded
								this.fns('onContentUpdate');
							}.bind(this)
						});
					break;
					case /^controls$/.test(k):
						this.values.controls = data[k];
						this.values.divs.$controls.html(this.values.controls);

						if (this.values.divs.$controls.html().length){
							this.values.divs.$controls.addClass('expressed');
							this.values.divs.$mainbody.css({'marginBottom':this.values.divs.$controls.height()});

							//check for close button
							var $close_btn = this.values.divs.$controls.find('.box-controls-close');

							if ($close_btn.length)
								$close_btn.on('click.clean.utils.box',this.clean.bind(this));
						}
						else {
							this.values.divs.$controls.removeClass('expressed');
							this.values.divs.$mainbody.css({'marginBottom':0});
						}
					break;
					case /^classname$/.test(k):
						this.values.classname = data[k];
						this.values.$elm.addClass(this.values.classname);
					break;
					case /^buttons$/.test(k):
						(_.isPlainObject(data[k])) && _.extend(this.values.buttons,data[k]);
						//lets show/hide buttons
						for (var button in this.values.buttons){
							switch(button){
								case 'close':
									(this.values.buttons.close) ? this.values.divs.$cls.removeClass('hide') : this.values.divs.$cls.addClass('hide');
								break;
								case 'maximize':
									(this.values.buttons.maximize) ? this.values.divs.$maximize.removeClass('hide') : this.values.divs.$maximize.addClass('hide');
								break;
							}
						}
					break;
					case /^dd$/.test(k):
						this.values.dd = data[k];
						if (this.values.dd){
							this.values.divs.$hd.addClass('cursor-movable');
							if (this.values.$elm.data('draggable'))
								this.values.$elm.draggable('enable');
							else
								this.values.$elm.draggable({ handle:this.values.divs.$hd.get(0) });
						}
						else {
							this.values.divs.$hd.removeClass('cursor-movable');
							//note: only call this if $elm is indeed udraggable (otherwise it sets position:absolute)
							this.values.$elm.data('draggable') && this.values.$elm.draggable('disable');
						}
					break;
					case /^coords$/.test(k):
						this.values.coords = data[k];
						if (this.values.coords && _.isPlainObject(this.values.coords)){
							(this.values.coords.left!=null) && this.values.$elm.css({left:this.values.coords.left});
							(this.values.coords.top!=null) && this.values.$elm.css({top:this.values.coords.top});
						}
						else
							this.values.coords = null;
					break;
					case /^freeze$/.test(k):
						this.values.freeze = data[k];

						if (this.values.freeze)
							this.set({h:this.values.divs.$outer.outerHeight()+20},'skip');
						else
							this.set({h:'auto'},'skip'); //dynamic box height, depending on content
					break;
					case /^center$/.test(k):
						this.values.center = data[k];
						$(window).off('resize.center.utils.box',this.onCenter); //remove possible event listener

						if (this.values.center){
							$(window).on('resize.center.utils.box',this.onCenter.bind(this));
							this.onCenter();
							this.addCallback('onContentHeightChange',this.onCenter.bind(this));
						}
					break;
					case /^blur$/.test(k): _.isPlainObject(data[k]) && (this.values.blur = _.extend(this.values.blur,data[k])); break;
					case /^dimmer$/.test(k): this.values.dimmer = !!data[k]; break;
					case /^scrollable$/.test(k): this.values.scrollable = !!data[k]; break;
					case /^onClose|onBeforeClose|onComplete|onShow|onStart|onBeforeStart|onHide|onMaximize|onMinimize|onBlur|onUnblur|onContentUpdate|onCancel$/.test(k):
						this.addCallback(k,data[k]);
					break;
					//this.values.resizeDims can be either a single number or 'TOPxRIGHTxBOTTOMxLEFT' separated by 'x'
					case /^resizeDims$/.test(k):
						this.values.resizeDims = data[k];
						$(window).off('resize.utils.box',this.onResize); //remove possible event listener

						if (this.values.resizeDims!=null){
							$(window).on('resize.utils.box',this.onResize.bind(this)); //stretch box on-browser-resize
							if (!_.isNumber(this.values.resizeDims))
								var tmp = this.values.resizeDims.split('x');
							else
								var tmp = [this.values.resizeDims,this.values.resizeDims,this.values.resizeDims,this.values.resizeDims];
							this.values.resizeDims = [];
							for (var i=0; i<tmp.length; i++){
								this.values.resizeDims.push(parseInt(tmp[i]));
							}
							this.onResize();
						}
					break;
				} //switch
			} //end if

			//self correct box dims
			if (!skip)
				this.selfCorrect();
		}
		return this;
	} //set
	getControls(){
		return this.values.divs.$controls;
	}
	getMainbody(){
		return this.values.divs.$mainbody;
	}
	getParentBox(){
		return this.values.$elm.parent().closest('.box');
	}
};