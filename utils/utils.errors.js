UTILS.Errors = {
	values:{
		version: '0.0.2',
		space:{}, //will be populated from DB
		effects: { //effects to apply to base elm before showing the errors
			shake: 'callout.shake',
			bounce: 'callout.bounce',
			flash: 'callout.flash',
			pulse: 'callout.pulse',
			tada: 'callout.tada'
		}
	},

	setSpace: function(errors={}){
		_.extend(UTILS.Errors.values.space,errors);
	},

	setEffects: function(effects={}){
		_.extend(UTILS.Errors.values.effects,effects);
	},

	/*
		must be JSON --> e.q. {errors:[{error:"invalidUsername",fields:["username"]}], direction:'right'}
		@direction - the direction the error message will be shown at
	 */

	showTooltips: function(data){
		var direction = ('direction' in data) ? data.direction : 'right';
		_.each(data.errors,function(error){
			//sometimes we want to show the error message inside a different container
			if ('container' in data){
				var html = '<div class="alert alert-danger" role="alert"><i class="mdi mdi-alert mdi-24px margin-r10"></i>'+this.getMessage(error.error)+'</div>';

				if (data.container instanceof UTILS.Box)
					data.container.set({ html:html });
				else
					$(data.container).html(html);
			}
			else if ('opts' in data){
				new APP.Alert(_.extend({
					type: 'error',
					html: _.map(data.errors, error => `<p>${UTILS.Errors.getMessage(error.error)}</p>`),
					delay: 3000,
					is_header: true
				}, data.opts)).show();
			}
			else if ('fields' in error && error.fields.length){
				_.each(error.fields,function(field){
					let $input = field instanceof jQuery ? field : (/^(\.|#)/.test(field) ? $(field) : $('#'+field));

					if ($input.length){
						//lets check if perhaps the $input is 'selectized' --> if yes, we need to re-set the visible field
						if ($input.hasClass('selectized'))
							$input = $input.nextNodeByClass('selectize-input')
						//lets check if the field is editable
						else if (Editable = $input.data('utils.editable'))
							$input = Editable.isContentEditable() ? Editable.getTarget() : Editable.getInputField();
						else
							$input.select();

						if (('type' in data) && data.type=='simple'){
							$input.velocity('callout.pulse',{
								begin: function(){
									$input.addClass('error-field');
									_.delay(function(){ $input.removeClass('error-field') },5000);
								}
							});
						}
						else
							TOOLTIP.hint({ target:$input, type:'error', msg:UTILS.Errors.getMessage(error.error), duration:5000, direction:direction });
					}
				});
			}
			else
				UTILS.Errors.show(error.error);

			//run callback if available
			if ('callback' in data && _.isFunction(data.callback))
				data.callback(data);

			is_error = true;
		}.bind(this));
	},
	/*
		@data.fx = { base: [elm to apply the effect to], effect:'shake' }
		@silent - whether or not display the error or to suppress it --> defaults to 'false'
		@type - simple | full --> defaults to 'full'
	*/
	isError: function(data={},silent=false,opts=null){
		let is_error = false,
			_data = _.isString(data) ? { errors:[{ error:data, fields:[] }] } : data;

		//lets add the opts
		if (opts)
			data.opts = opts;

		if ('errors' in _data && _data.errors.length){

			let _onComplete = () => {
				if (!silent)
					UTILS.Errors.showTooltips(_data);
			};

			if ('fx' in _data && _data.fx){
				effect = UTILS.Errors.values.effects[_data.fx.effect];

				if (effect)
					$(_data.fx.base).velocity(effect,{ complete:_onComplete });
			}
			else
				_onComplete();

			is_error = true;
		}

		return is_error;
	},

	//pass @error to get the full message
	// ex. var message = UTILS.Errors.getMesssage('invalidUsername');
	getMessage: function(error){
		return (error in UTILS.Errors.values.space) ? UTILS.Errors.values.space[error] : error.replace(/\\n/g,'<br>');
	},

	renderErrorsInPage: response => {
		return $(`<span class="errors-in-page-wrapper">${_.map(response.errors, error => `<p class="errors-in-page-error">${UTILS.Errors.getMessage(error.error)}</p>`)}</span>`);
	},

	show: function(error, callback, opts={}){
		let message = UTILS.Errors.getMessage(error);

		if (message.length){
			let options = _.extend({
				type: 'error',
				html: message.replace(/\\n/g,'<br>'),
				onClose: callback
			}, opts);

			new APP.Alert(options).show();
		}
	}

};

if (APP.values.errors)
	UTILS.Errors.setSpace(APP.values.errors);