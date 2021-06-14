/* == UTILS.Spinner == */
UTILS.Spinner =  class extends UTILS.Base {
	constructor(data={}){
		super(data);

		this.create();

		('msg' in data) && this.setMessage(data.msg);
		('color' in data) && this.setColor(data.color);
		('type' in data) && this.setType(data.type);
		('shadow' in data) && this.setShadow(data.shadow);
		('standalone' in data) && this.setStandalone(data.standalone);
		('blur' in data) && this.setBlur(data.blur);
		('onCreate' in data) && this.addCallback('onCreate',data.onCreate);
		('onBeforeShow' in data) && this.addCallback('onBeforeShow',data.onBeforeShow);
		('onShow' in data) && this.addCallback('onShow',data.onShow);
		('onHide' in data) && this.addCallback('onHide',data.onHide);

		return this;
	}
	getDefaults(){
		return {
			object:'utils.spinner',
			version:'2.1.6',
			opts: {},
			divs: {}, //holds all the divs of the main elm
			is_shown: false, //holds whether the spinner is shown
			types: ['tiny','small','medium','large','x2','x3'],
			type: 'small',
			center: false, //holds if the spinner is centered
			blur: false, //holds if the content covered by the spinner is blurred
			shadow: false, //holds if the spinner has a shadow
			standalone: false, //holds if the spinner is standalone
			color: 'black',
			msg: '', //holds the spinner message
			$icon_success: $('<i class="mdi mdi-check spinner-mode-icon success"></i>'),
			$icon_error: $('<i class="mdi mdi-alert spinner-mode-icon error"></i>')
		};
	}
	clean(){
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
		let blur_instance = null,
			color = this.getColor();

		//this must happen here instead of the "set" function to avoid having "this.values.$target" being null and therefore being set to $('body');
		if (this.values.blur && this.values.$target.length){
			blur_instance = this.values.$target.data('utils.blur');

			if (!(blur_instance instanceof UTILS.Blur)){
				var blur_options = {
					target: this.values.$target,
					color: 'white'
				};

				if (typeof this.values.blur==='object')
					_.assign(blur_options,this.values.blur);

				blur_instance = new UTILS.Blur(blur_options);
			}

			blur_instance.set({ resize:this.values.$target.is('body') }).show();
		}

		//lets set the color
		this.values.$elm.addClass(color);

		if (!this.values.center && this.values.$target.hasClass('box'))
			this.values.$target.find('.box-mainbody').append(this.values.$elm);
		else
			this.values.$target.append(this.values.$elm);

		if (this.values.center)
			this.setCenter();

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
	setCenter(){
		let $target = (this.values.$target[0]===$('#container')[0] || this.values.$target.is('body')) ? null : this.values.$target;

		//lets check if the target has a position set
		if ($target && $target.length && !/^(fixed|absolute|relative)$/i.test($target.css('position')))
			$target.addClass('pos-relative');

		//lets add class to center the spinner
		this.values.$elm.addClass('spinner-centered');

		return this;
	}
	//private function
	create(){
		this.values.$elm = $('<div class="spinner"></div>');
		this.values.divs.$icon = $('<div class="spinner-icon circle"></div>');
		this.values.divs.$msg = $('<div class="spinner-msg"></div>');
		this.values.$elm.append(this.values.divs.$icon,this.values.divs.$msg);
		this.fns('onCreate');

		return this;
	}
	setTarget(target){
		super.setTarget(target);

		if (target instanceof UTILS.Box)
			this.values.$target = target.getBox();

		return this;
	}
	removeMode(){
		this.values.$elm.removeClass('spinner-mode success error');
		return this;
	}
	setMode(mode,message){
		this.removeMode();

		switch(mode){
			case 'success':
				this.values.$elm.addClass('spinner-mode success');
			break;
			case 'error':
				this.values.$elm.addClass('spinner-mode error');
			break;
		}

		//if message, lets set it
		if (message)
			this.setMessage(message);

		return this;
	}
	getColor(){
		return this.values.color;
	}
	setColor(color){
		this.values.color = color;
		return this;
	}
	getType(){
		return this.values.type;
	}
	setType(type){
		this.values.type = type;

		//removing all possible type classes and add the new class
		this.values.$elm
			.removeClass(this.values.types.join(' '))
			.addClass(type);

		return this;
	}
	isShadow(){
		return this.values.$elm.hasClass('boxshadow');
	}
	setShadow(state){
		this.values.shadow = !!state;
		this.values.$elm[state?'addClass':'removeClass']('boxshadow');

		return this;
	}
	isStandalone(){
		return this.values.standalone;
	}
	setStandalone(state){
		this.values.standalone = !!state;

		if (state){
			this.values.$elm.addClass('pos-fixed');
			this.values.center = true;
			this.setColor('standalone');
		}
		else
			this.values.$elm.removeClass('pos-fixed');

		return this;
	}
	isBlur(){
		return this.values.blur;
	}
	setBlur(blur){
		this.values.blur = typeof blur==='object' ? _.extend(this.values.blur,blur) : !!(blur);

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
	getSpinner(){
		return this.values.$elm;
	}

	//__deprecated
	set(data){
		if (data){
			for (var k in data){
				switch(true){
					case /^target$/.test(k): this.setTarget(data[k]); break;
					case /^type$/.test(k): this.setType(data[k]); break;
					case /^msg$/.test(k): this.setMessage(data[k]); break;
					case /^color$/.test(k): this.setColor(data[k]); break;
					case /^shadow$/.test(k): this.setShadow(data[k]); break;
					case /^standalone$/.test(k): this.setStandalone(data[k]); break;
					case /^blur$/.test(k): this.setBlur(data[k]); break;
				}
			}
		}
		return this;
	}
};
