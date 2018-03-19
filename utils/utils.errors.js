UTILS.Errors = {
	values:{
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
			else if ('fields' in error && error.fields.length){
				_.each(error.fields,function(field){
					if (($input = (field instanceof jQuery ? field : $('#'+field))).length){
						//lets check if perhaps the $input is 'selectized' --> if yes, we need to re-set the visible field
						if ($input.hasClass('selectized'))
							$input = $input.nextNodeByClass('selectize-input')
						//lets check if the field is editable
						else if ($input.data('utils.editable'))
							$input = $input.data('utils.editable').getInputField();
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
							TOOLTIP.hint({ target:$input, type:'error', msg:UTILS.Errors.getMessage(error.error), duration:50000, direction:direction });
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
	isError: function(data={},silent=false){
		var is_error = false;
		var data = _.isString(data) ? { errors:[{ error:data, fields:[] }] } : data;

		if ('errors' in data && data.errors.length){

			var _onComplete = function(){
				(!silent) && UTILS.Errors.showTooltips(data);
			};

			if ('fx' in data && data.fx){
				effect = UTILS.Errors.values.effects[data.fx.effect];

				if (effect)
					$(data.fx.base).velocity(effect,{ complete:_onComplete });
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

	show: function(error,callback){
		var message = UTILS.Errors.getMessage(error);

		if (message.length)
			new APP.Alert({ type:'error', html:message.replace(/\\n/g,'<br>'), onClose:callback }).show();
	}

};

if (APP.values.errors)
	UTILS.Errors.setSpace(APP.values.errors);