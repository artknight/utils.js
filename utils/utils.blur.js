/*
	== UTILS.Blur ==

	ex. var blur1 = new UTILS.Blur({target:$('#results')});
		blur1.show();

	== definitions ==
	@target - (optional) DOM elm to blurred out --> defaults to 'body'
	@color - (optional) specifies the color of the blur --> defaults to 'white'
	@opac - (optional) opacity of the blur --> defaults to '0.7'
	@resize - (optional) specifies whether the blur should be resized according to target size - only applicable if target is 'body' --> defaults to 'false'
	@onShow - (optional) stack of functions to execute when blur is shown (REPEAT EXECUTION) --> defaults to 'null'
	@onHide - (optional) stack of functions to execute when blur is hidden (REPEAT EXECUTION) --> defaults to 'null'

	== dependencies ==
	jquery.js
*/
UTILS.Blur = class extends UTILS.Base {
	constructor(data={}){
		super(data);
		_log(this.getObjectName()+' --> instantiated!',this.getId(),this);

		if (_.isPlainObject(data)){
			('onShow' in data) && this.addCallback('onShow',data.onShow);
			('onHide' in data) && this.addCallback('onHide',data.onHide);
		}

		this.set({
			target: data.target || null,
			color: data.color || 'white',
			opac: data.opac || null,
			resize: !!data.resize
		});
		return this;
	}
	getDefaults(){
		return {
			object:'utils.blur',
			version:'2.0.5',
			$elm: $('<div class="blur"></div>'),
			is_shown: false,
			colors: { //holds color combinations
				'white':{bg:'#fff',opac:0.7},
				'black':{bg:'#000',opac:0.3}
			},
			resize: false
		};
	}
	clean(){
		this.values.$elm.remove();

		if (this.values.resize)
			$(window).on('resize.utils.blur',this.onresize.bind(this));

		this.fns('onHide');
		this.values.is_shown = false;
		return this;
	}
	show(){
		var _blur = this.values.$target.find('.blur').get(0);
		if (_blur)
			_blur.remove(); //if exists, remove previous blur DOM elm

		this.values.$target.append(this.values.$elm);
		this.fns('onShow');
		this.values.is_shown = true;
		return this;
	}
	hide(){
		this.clean();
		return this;
	}
	getZindex(){
		return parseInt(this.values.$elm.css('zIndex'));
	}
	//private
	onresize(){
		this.values.$elm.css({
			width:$(window).width(),
			height:$(window).height()
		});
	}
	setTarget(target){
		if (target){
			super.setTarget(target);

			if (target instanceof UTILS.Box)
				this.values.$target = target.getBox();

			//if target box, then set z-index to 20005
			if (this.values.$target.hasClass('box'))
				this.values.$elm.css({'zIndex':parseInt(this.values.$target.css('zIndex'))+20 || 20005});

			//if blur is on the body, need to make set position to 'fixed'
			if (this.values.$target.is('body'))
				this.values.$elm.addClass('pos-fixed');

			//little trick to contain the blur's position:fixed within the parent elm
			this.values.$target.addClass('blur-target');
		}
		
		return this;
	}
	set(data){
		if (data){
			for (var k in data){
				switch(true){
					case /^target$/.test(k): this.setTarget(data[k]); break;
					case /color$/.test(k):
						this.values.color = data[k];
						var settings = this.values.colors[this.values.color];
						this.values.$elm.css({ background:settings.bg, opacity:settings.opac });
					break;
					case /^opac$/.test(k):
						this.values.opac = data[k];
						if (!_.isNumber(this.values.opac))
							this.values.opac = this.values.colors[this.values.color].opac;
						else if (this.values.opac>1)
							this.values.opac = this.values.opac/100;
						this.values.$elm.css({opacity:this.values.opac});
					break;
					case /^resize$/.test(k):
						if (data[k] && !this.values.resize){
							if (this.values.$target.is('body')){
								$(window).on('resize.utils.blur',this.onresize.bind(this)); //stretch box on-browser-resize
								this.values.$elm.addClass('pos-fixed');
								this.values.resize = true;
							}
						}
						else if (!data[k] && this.values.resize){
							$(window).off('resize.utils.blur');
							this.values.$elm.removeClass('pos-fixed');
							this.values.resize = false;
						}
					break;
					case /^onShow|onHide$/.test(k):
						this.addCallback(k,data[k]);
					break;
					default: this.values[k] = data[k]; break;
				} //switch
			} //for
		}
		return this;
	}
};