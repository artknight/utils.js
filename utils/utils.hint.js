/*
 	utils.hint.js

	ex. var hint1 = new HINT({target:$('#results'),color:'black',direction:'right',msg:'this is the name field'}).show();

	== definitions ==
	@target - (required) DOM elm to show the hint on
	@msg - (required) message to show in the hint
	@color - (optional) specifies the color of the hint --> defaults to 'black' (possible combinations: red|yellow|green|blue|black)
	@direction - (optional) direction of the tooltip --> defaults to 'right' (possible combinations: left|right|top|bottom)
	@duration - (optional) duration the hint should be displayed for --> defaults to 'onhover' (possible combinations: onhover|always|[numeric value] in ms)
	@onShow - (optional) function to execute when 'onShow' happens --> defaults to null
	@onBlur - (optional) function to execute when 'onBlur' happens --> defaults to null
	@onCreate - (optional) function to execute when 'onCreate' happens --> defaults to null
	@is_error - (optional) marks if the hint is an error --> defaults to false
*/
const HINT = class extends UTILS.Base {
	constructor(data){
		super(data);
		_log(this.getObjectName()+' --> instantiated!',this.getId(),this);

		if (_.isPlainObject(data)){
			('onShow' in data) && this.addCallback('onShow',data.onShow);
			('onHide' in data) && this.addCallback('onHide',data.onHide);
			('onCreate' in data) && this.addCallback('onCreate',data.onCreate);
		}

		this.set({
			msg: data.msg || '',
			color: data.color || 'black',
			direction: data.direction || 'right',
			duration: data.duration || 'onhover',
			is_error: data.is_error || false
		}).fns('onCreate');
		return this;
	}
	getDefaults(){
		return {
			object:'utils.hint',
			version:'1.5.2',
			history: {}, //holds the historic values
			css: {},
			is_error: false,
			msg: '',
			color: 'black',
			direction: 'right',
			duration: 'onhover'
		};
	}
	clean(){
		this.fns('onBlur');
		this.unHighlight();
		var classes = this.values.$target.attr('class').match(/(?:^|)hint-(\w+)(?!\w)/g) || []; //match all classes starting with 'hint-...'

		if (classes.length)
			this.values.$target.removeClass(_.joinArray(classes,' '));

		this.values.$target.removeAttr('data-hint');
		return this;
	}
	show(){
		var _show = function(){
			this.fns('onShow');
			this.highlight();
			this.values.$target.addClass(_.joinArray(_.values(this.values.css),' ')); //adding hint classes

			//if elm is input and not form-control, we need to set the width, otherwise it will shrink
			if (this.isInputOrSelect() && !this.values.$elm.hasClass('form-control') && !this.values.$elm.hasClass('input-field'))
				this.values.$target.width(this.values.$target.width());

			this.values.$target.attr({'data-hint':this.values.msg}); //setting the msg

			if (this.values.duration)
				this.clean.bind(this).delay(this.values.duration);

			//only focus if target is an input field and duration is not specified (meaning it will not self-clean)
			//also, focus() because otherwise the input field is not focused when clicked and therefore the 'onBlur' event is not triggered
			if (this.isInputOrSelect() && this.values.duration==0)
				this.values.$elm.focus();
		}.bind(this);
		//if @is_wrapped exists, that means that the input field has been wrapped for the first time, so we must delay to make sure the DOM tree has time to update
		//otherwise .focus() does not work because the wrapped input field is not yet refreshed within the DOM tree
		if (this.values.is_wrapped){
			delete this.values.is_wrapped;
			_show.delay(200);
		}
		else
			_show();
		return this;
	}
	hide(){
		this.clean();
		return this;
	}
	isInputOrSelect(){
		return (this.values.$elm.is('input') || this.values.$elm.is('select'));
	}
	//private - only is used when the HINT is an error, we hightlight the border red of the input field
	highlight(){
		if (this.values.is_error){
			if (!('highlight' in this.values.history)){
				this.values.history.highlight = {};
				this.values.history.highlight.$elm = this.isInputOrSelect() ? this.values.$elm : this.values.$target;
				this.values.history.highlight.border_color = this.values.history.highlight.$elm.css('background-color');
			}

			this.values.history.highlight.$elm.css('background-color','#ffdddd');
		}
	}
	unHighlight(){
		if ('highlight' in this.values.history)
			this.values.history.highlight.$elm.css('background-color',this.values.history.highlight.border_color);
	}
	//private - called to adjust the direction in case left|right direction is out of bounds
	adjustDirection(){
		//if direction is either 'left' | 'right', check for width
		if (('direction' in this.values.css) && this.values.css.direction.match(/hint-left|hint-right/)){
			//check if target is inside a BOX, make sure that the target has enough space to show the hint
			var $box_mainbody = this.values.$target.parent('div.box-mainbody');

			if ($box_mainbody.length && ($box_mainbody.outerWidth()-this.values.$target.outerWidth()) < Math.min(this.values.msg.length*5.5,250))
				this.values.css.direction = 'hint-top';
		}
	}
	setTarget(target){
		//if elm is an input|select|textarea - check if elm is inside a "shell" or wrap SPAN around it to be used for the hint (:before and :after do not work on form elms)
		if ($(target).is('input') || $(target).is('select')){
			this.values.$elm = $(target); //setting the original target elm
			this.values.css.show_always = 'hint-always'; //show hint always
			var $parent = this.values.$elm.parent('div.form-group,span.tooltip-wrapper,div.input-group');

			//if not found, lets try to get a closest div
			if (!$parent.length)
				$parent = this.values.$elm.parent('div');

			if ($parent.length)
				this.values.$target = $parent;
			else {
				this.values.$elm.wrap('<span class="tooltip-wrapper"></span>');
				this.values.$target = this.values.$elm.parent('span.tooltip-wrapper');

				//if input has 100% width, make wrapper be 100% as well, otherwise it pushes the input field inside
				if (this.values.$elm.hasClass('width-full'))
					this.values.$target.addClass('width-full');

				this.values.is_wrapped = true; //set the flag so that when it is shown for the first time it can be delayed
			}

			this.values.onblur_event = function(){
				if (this.values.duration==0)
					this.clean();
			}.bind(this);

			this.values.$elm.off('blur',this.values.onblur_event).on('blur',this.values.onblur_event);
		}
		else { //for all other 'normal' elms that support :before & :after properties
			if (this.values.$elm && ('onblur_event' in this.values))
				this.values.$elm.off('blur',this.values.onblur_event);

			this.values.$elm = this.values.$target = $(target);

			delete this.values.css.show_always; //delete the 'show_always' key
		}
		return this;
	}
	set(data){
		if (data){
			for (var k in data){
				switch(true){
					case /^target$/.test(k):
						this.setTarget(data[k]);
					break;
					case /^color$/.test(k):
						this.values.css.color = 'hint-'+(data[k] || 'black');
					break;
					case /^direction$/.test(k):
						this.values.css.direction = 'hint-'+(data[k] || 'right');
						this.adjustDirection();
					break;
					case /^duration$/.test(k):
						switch(data[k]){
							case 'always':
								this.values.duration = 0;
								this.values.css.show_always = 'hint-always';
							break;
							case 'onhover':
								this.values.duration = 0;
								delete this.values.css.show_always;
							break;
							default: //a numeric value has been specified (in ms)
								this.values.duration = data[k];
								this.values.css.show_always = 'hint-always';
							break;
						}
					break;
					case /^msg$/.test(k):
						this.values.msg = data[k];
						if (this.values.msg.length>45)
							this.values.css.fixed_width = 'hint-fixed'; //enable fixed width for multi-line support
						else
							delete this.values.css.fixed_width;
						this.adjustDirection();
					break;
					case /^is_error$/.test(k):
						this.values.is_error = data[k];
					break;
					case /^onShow|onBlur|onCreate$/.test(k):
						if (data[k] && _.isFunction(data[k])){
							var is_unique = true;

							for (var i=0, fn; fn=this.values.fns[k][i]; i++){
								if (data[k]===fn){
									is_unique = false;
									break;
								}
							}

							if (is_unique)
								this.values.fns[k].push(data[k]);
						}
					break;
				} //switch
			} //for
		}
		return this;
	}
};


if (!TOOLTIP){
	var TOOLTIP = {
		values: {
			hints:[] //holds all the hints
		},
		getHint: function($target){
			var hint = null;
			for (var i=0,h; h=TOOLTIP.values.hints[i]; i++){
				if (h.values.$elm[0]===$target[0]){
					hint = h;
					break;
				}
			}
			return hint;
		},
		/*
			used to easily show tooltips (without advanced config)
			e.q. onmouseover="TOOLTIP.tooltip({ target:$(target), msg:'some tooltip message' })"
		 */
		tooltip: function(options){
			TOOLTIP.hint(_.extend({
				type:'default',
				duration:'onhover',
				direction:'top'
			},options||{}));
		},
		/*
            @options - { target:$('#elm'), type:'error', msg:'', duration:5000, direction:'right', onBlur:function(){} }
        */
		hint: function(options){
			var colors = {error:'red',info:'blue',warning:'yellow',success:'green','default':'black'};

			if (_.isPlainObject(options) && ('target' in options)){
				var options = {
					target: $(options.target),
					msg: ERRORS.getMessage(options.msg),
					color: colors[options.type] || colors['default'],
					duration: options.duration || 'always',
					direction: options.direction || 'right',
					onShow: options.onShow || null,
					onBlur: options.onBlur || null,
					onCreate: options.onCreate || null,
					is_error: (options.type=='error') //marks if the hint is an error
				};
				var hint = TOOLTIP.getHint(options.target); //get previously stored hint

				if (hint && hint instanceof HINT)
					hint.set(options);
				else {
					hint = new HINT(options);
					TOOLTIP.values.hints.push(hint);
				}

				hint.show();
			}
		}
	};
}