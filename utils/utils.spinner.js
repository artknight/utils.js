/*
    == SPINNER ==

	ex. var spin1 = new SPINNER({target:$('#results'),type:'small',msg:'loading...'});
		spin1.show();

	== definitions ==
	@target - (optional) DOM elm where the spinner will be inserted --> defaults to 'body'
	@type - (optional) specifies the size & shape of the spinner --> defaults to 'small'
	@msg - (optional) message to show next to the spinner --> if not specified, spinner is shown as a square
	@standalone - (optional) specifies if the spinner is inserted into another object or not --> defaults to 'false'
	@color - (optional) specifies the color of the spinner --> defaults to 'none' (transparent)
	@center - (optional) centers the spinner within the target --> defaults to 'false'
	@shadow - (optional) specifies if the spinner has a shadow --> defaults to 'false'
	@blur - (optional) blurs out the target elm ( it could be true/false or specific BLUR options like color ) --> defaults to 'false'
	@onCreate - (optional) function to execute when box is first created (ONE-TIME EXECUTION) --> defaults to 'null'
	@onShow - (optional) stack of functions to execute when the spinner is shown (REPEAT EXECUTION) --> defaults to 'null'
	@onBeforeShow - (optional) stack of functions to execute right before the spinner is shown (REPEAT EXECUTION) --> defaults to 'null'
	@onHide - (optional) stack of functions to execute when the spinner is hidden (REPEAT EXECUTION) --> defaults to 'null'

	== dependencies ==
	jquery.js
	spin.js  (fgnass.github.com)
*/
const SPINNER =  class extends UTILS.Base {
	constructor(data={}){
		super(data);
		_log(this.getObjectName()+' --> instantiated!',this.getId(),this);

		('onCreate' in data) && this.addCallback('onCreate',data.onCreate);
		('onBeforeShow' in data) && this.addCallback('onBeforeShow',data.onBeforeShow);
		('onShow' in data) && this.addCallback('onShow',data.onShow);
		('onHide' in data) && this.addCallback('onHide',data.onHide);

		this.values.spinner = new Spinner().spin(); //init the native spinner object
		this.values.spinner.opts.className = 'spinner-orig'; //must change the default class name

		this.create().set({
			type: data.type || 'small',
			center: !!data.center,
			msg: data.msg || '',
			color: data.color || 'black',
			standalone: !!data.standalone,
			shadow: !!data.shadow,
			blur: data.blur
		});
		return this;
	}
	getDefaults(){
		return {
			object:'utils.spinner',
			version:'2.1.0',
			opts: {},
			divs: {}, //holds all the divs of the main elm
			is_shown: false, //holds whether the spinner is shown
			types: {
				'tiny': {lines:8,length:2,width:3,speed:1,radius:2,trail:50},
				'small': {lines:9,length:3,width:2,speed:1,radius:3,trail:50},
				'medium': {lines:10,length:6,width:3,speed:1,radius:5,trail:50},
				'large': {lines:10,length:10,width:5,speed:1,radius:9,trail:50},
				'x2': {lines:13,length:17,width:6,speed:1,radius:15,trail:50},
				'x3': {lines:13,length:25,width:10,speed:1,radius:25,trail:50}
			},
			colors: { //holds color combinations
				'standalone':{ bg:'#000',border:'1px solid #fff',spinner:'#fff',msg:'#fff',opac:0.75 },
				'white':{ bg:'transparent',border:'none',spinner:'#fff',msg:'#fff',opac:1 },
				'gray':{ bg:'transparent',border:'none',spinner:'#999',msg:'#444',opac:1 },
				'red':{ bg:'transparent',border:'none',spinner:'#d30000',msg:'#d30000',opac:1 },
				'black':{ bg:'transparent',border:'none',spinner:'#000',msg:'#3a3a3a',opac:1 }, //default
				'green':{ bg:'transparent',border:'none',spinner:'#390',msg:'#390',opac:1 }
			},
			$icon_success: $('<i class="mdi mdi-check spinner-mode-icon success"></i>'),
			$icon_error: $('<i class="mdi mdi-alert spinner-mode-icon error"></i>')
		};
	}
	clean(){
		this.values.spinner.stop();
		this.values.$elm.remove();

		//if blur elm exists, hide it
		if (this.values.blur && this.values.$target.length){
			var blur_instance = this.values.$target.data('utils.blur');

			if (blur_instance)
				blur_instance.hide();
		}

		this.values.is_shown = false;
		return this;
	}
	show(){
		this.fns('onBeforeShow');
		var blur_instance = null;
		this.values.spinner.spin(this.values.divs.$icon.get(0));
		//set the blur effect

		//this must happen here instead of the "set" function to avoid having "this.values.$target" being null and therefore being set to $('body');
		if (this.values.blur && this.values.$target.length){
			blur_instance = this.values.$target.data('utils.blur');

			if (!(blur_instance instanceof BLUR)){
				var blur_options = {
					target: this.values.$target,
					color: 'white'
				};

				if (typeof this.values.blur==='object')
					_.assign(blur_options,this.values.blur);

				blur_instance = new BLUR(blur_options);
			}

			blur_instance.set({resize: this.values.$target.is('body')}).show();
		}

		if (!this.values.center && this.values.$target.hasClass('box'))
			this.values.$target.find('.box-mainbody').append(this.values.$elm);
		else
			this.values.$target.append(this.values.$elm);

		if (this.values.center){
			var target = (this.values.$target[0]===$('#container')[0] || this.values.$target.is('body')) ? null : this.values.$target;
			this.values.$elm.setCenter(null,target);
		}

		//lets check if the prev elm is a blur, and if so we need to adjust the z-index
		if (blur_instance)
			this.values.$elm.css('z-index',blur_instance.getZindex()+1);

		this.fns('onShow');
		this.values.is_shown = true;
		return this;
	}
	hide(){
		this.fns('onHide');
		this.clean();
		return this;
	}
	//private function
	create(){
		this.values.$elm = $('<div class="spinner cfx"></div>');
		this.values.divs.$icon = $('<div class="spinner-icon"></div>');
		this.values.divs.$msg = $('<div class="spinner-msg"></div>');
		this.values.$elm.append(this.values.divs.$icon,this.values.divs.$msg);
		this.fns('onCreate');
		return this;
	}
	setTarget(target){
		this.values.$target = (target instanceof BOX) ? target.values.$elm : $(target);

		//lets add 'this' to target
		this.values.$target.data(this.getObjectName(),this);

		return this;
	}
	removeMode(){
		this.values.divs.$icon.find('.spinner-mode-icon').remove();
		this.values.$elm.removeClass('spinner-mode success error');
		return this;
	}
	setMode(mode,message){
		this.removeMode();

		switch(mode){
			case 'processing':
				this.values.divs.$icon.find('.spinner-orig').show();
			break;
			case 'success':
				this.values.divs.$icon.find('.spinner-orig').hide();
				this.values.$elm.addClass('spinner-mode success');
				this.values.divs.$icon.append(this.values.$icon_success);
			break;
			case 'error':
				this.values.divs.$icon.find('.spinner-orig').hide();
				this.values.$elm.addClass('spinner-mode error');
				this.values.divs.$icon.append(this.values.$icon_error);
			break;
		}

		//if message, lets set it
		(message) && this.setMessage(message);

		return this;
	}
	setCSS(setting,color){
		switch(setting){
			case 'bg': this.values.$elm.css({background:color}); break;
			case 'border': this.values.$elm.css({border:color}); break;
			case 'spinner': this.values.spinner.opts.color = color; break;
			case 'msg': this.values.divs.$msg.css({color:color}); break;
			case 'opac': this.values.$elm.css({opacity:color}); break;
		}
		return this;
	}
	getMessage(){
		return this.values.divs.$msg.find('span').html();
	}
	setMessage(message){
		var $message = this.values.divs.$msg.find('span');
		this.values.msg = message;

		if (message.length){
			if ($message.length)
				$message.html(message);
			else
				this.values.divs.$msg.html('<span>'+this.values.msg+'</span>');
		}
		else if ($message.length)
			$message.remove();

		return this;
	}
	set(data){
		if (data){
			for (var k in data){
				switch(true){
					case /^target$/.test(k): this.setTarget(data[k]); break;
					case /^type$/.test(k):
						this.values.type = data[k];
						this.values.$elm.removeClass(_.keys(this.values.types).join(' ')); //removing all possible type classes
						this.values.$elm.addClass(this.values.type); //adding the new spinner class
						//set the height of the outer box
						var spinner_w = this.values.types[this.values.type].length + this.values.types[this.values.type].width + this.values.types[this.values.type].radius;
						this.values.divs.$icon.css({width:spinner_w*2,height:spinner_w*2});
						//update native spinner options
						this.values.spinner.opts = _.extend(this.values.spinner.opts,this.values.types[this.values.type]); //updating the native spinner settings (spin.js)
						this.values.spinner.opts.left = this.values.spinner.opts.top = spinner_w+'px'; //set left & top to zero to make sure the native spinner is moved into the outer box
					break;
					case /^msg$/.test(k): this.setMessage(data[k]); break;
					case /^color$/.test(k):
						this.values.color = _.isPlainObject(data[k]) ? 'custom' : data[k];
						var settings = (this.values.color=='custom') ? data[k] : this.values.colors[this.values.color];
						for (var j in settings){
							this.setCSS(j,settings[j]);
						}
					break;
					case /^shadow$/.test(k):
						this.values.shadow = data[k];
						(this.values.shadow) ? this.values.$elm.addClass('boxshadow') : this.values.$elm.removeClass('boxshadow');
					break;
					case /^standalone$/.test(k):
						this.values.standalone = data[k];
						if (this.values.standalone){
							this.values.$elm.addClass('pos-fixed');
							this.values.center = true;
							this.set({color:'standalone'});
						}
						else
							this.values.$elm.removeClass('pos-fixed');
					break;
					case /^blur$/.test(k):
						this.values.blur = typeof data[k]==='object' ? _.assign(this.values.blur,data[k]) : !!(data[k]);
					break;
					case /^onShow|onHide$/.test(k):
						this.addCallback(k,data[k]);
					break;
					default: this.values[k] = data[k]; break;
				} //switch
			} //for

			//if spinner has already been spinning, we need to re-enable it
			if (this.values.is_shown)
				this.show();
		}
		return this;
	}
	getSpinner(){
		return this.values.$elm;
	}
};