//extends the regular UTILS.Box object
APP.Box = class extends UTILS.Box {
	constructor(data){
		if (!('object' in data))
			data.object = 'utils.box[app.box]';

		if (!('version' in data))
			data.version = '0.0.4';

		super(data);

		return this;
	}
	create(){
		super.create();
		APP.stack.addBox(this);
		return this;
	}
	fns(type){
		if (type){
			if (/^onBeforeStart$/i.test(type))
				APP.stack.blurLastBox(this);

			if (/^onClose$/i.test(type)){
				APP.stack.unblurLastBox(this);
				APP.stack.removeBox(this);
			}
		}
		super.fns(type);
	}
	_onEscapeKeyPressed(event){
		let key = UTILS.getCharKey(event),
			__box = $('.box').last().data(this.values.object);

		if (key===27 && __box && __box.getId()===this.getId() && this.isCloseAllowed())
			this.clean();
	}
};

/*
	== APP.Confirm ==
	extends the APP.Box object
 */
APP.Confirm = class extends APP.Box {
	constructor(data){
		let defaults = {
			version: '0.0.5',
			w: 400,
			title: '',
			html: '<p>Do you want to proceed?</p>',
			dd: false,
			classname: 'box-confirm',
			center: true
		};

		if (!('object' in data))
			data.object = 'utils.box[app.confirm]';

		super(_.extend(defaults,data));

		//content
		let $controls = $(`
			<div class="box-confirm-inner-controls">
			   <button type="button" class="btn btn-light btn-sm box-confirm-inner-control" data-control="cancel">cancel</button>
			   <button type="button" class="btn btn-danger btn-sm box-confirm-inner-control" data-control="confirm">proceed</button>
			</div>
		`);

		//lets check for custom buttons
		if ('customButtons' in data){
			let $confirm = $controls.find('[data-control="confirm"]'),
				$cancel = $controls.find('[data-control="cancel"]')

			if ('confirm' in data.customButtons){
				let $custom_confirm = $(data.customButtons.confirm);

				$confirm.replaceWith($custom_confirm);

				$custom_confirm
					.attr('data-control','confirm')
					.addClass('btn btn-sm box-confirm-inner-control');
			}
			else
				$confirm.remove();

			if ('cancel' in data.customButtons){
				let $custom_cancel = $(data.customButtons.cancel);

				$cancel.replaceWith($custom_cancel);

				$custom_cancel
					.attr('data-control','cancel')
					.addClass('btn btn-sm box-confirm-inner-control');
			}
			else
				$cancel.remove();
		}

		this.values.divs.$mainbody.append($controls);

		$controls.on('click','.box-confirm-inner-control', event => {
			event.preventDefault();
			event.stopImmediatePropagation();

			let $control = $(event.currentTarget);

			if (/^cancel$/i.test($control.attr('data-control')))
				_onCancelClicked();
			else if (/^confirm$/i.test($control.attr('data-control')))
				_onConfirmClicked();
		});

		let _onCancelClicked = () => {
			if ('onCancel' in data){
				this.addCallback('onCancel',data.onCancel);
				this.clean('clean').fns('onCancel');
			}
			else
				this.clean();
		};

		let _onConfirmClicked = () => {
			if ('onConfirm' in data){
				this.addCallback('onConfirm',data.onConfirm);

				if ('onBeforeConfirm' in data)
					this.addCallback('onBeforeConfirm',data.onBeforeConfirm);

				this.fns('onBeforeConfirm');
				this.clean('confirm').fns('onConfirm');
			}
		};

		return this;
	}
	clean(action){
		super.clean();

		//@action is passed only if the "confirm" button is clicked ( all other times we need to trigger "onCancel" )
		if (!action || (action && !/clean|confirm/.test(action)))
			this.fns('onCancel');

		return this;
	}
};

/*
	== APP.Alert ==
	extends the UTILS.Box object

	--> used in displaying error messages (center of page) or notifications (right-bottom corner)
 */

//holds all the opened alert boxes
var alert_boxes = { error:[], success:[], info:[], warning:[] };

APP.Alert = class extends UTILS.Box {
	constructor(data){
		if (!('type' in data))
			data.type = 'info';

		if (!('object' in data))
			data.object = 'utils.box[app.alert]';

		var defaults = {
			version: '0.0.9',
			w: 600,
			title: '',
			html: '',
			dd: false,
			light: true,
			buttons: { close:true, maximize:false },
			delay: 1000
		};

		var custom = {
			error: { w:600, classname:'box-red alert-box', html:$('<span class="alert-box-content"><i class="mdi mdi-alert-circle-outline mdi-24px"></i></span>'), fx:{effect:'expand-in'} },
			success: { w:400, classname:'box-green alert-box', html:$('<span class="alert-box-content"><i class="mdi mdi-check mdi-24px"></i></span>'), fx:{effect:'slide-up'} },
			info: { w:400, classname:'box-blue alert-box', html:$('<span class="alert-box-content"><i class="mdi mdi-information-outline mdi-24px"></i></span>'), fx:{effect:'slide-right'} },
			warning: { w:400, classname:'box-yellow alert-box', html:$('<span class="alert-box-content"><i class="mdi mdi-alert-outline mdi-24px"></i></span>'), fx:{effect:'expand-in'} },
		};

		//lets change the default html for soft error msgs
		if (/error/.test(data.type) && 'classname' in data && /soft/.test(data.classname))
			custom[data.type].html = $('<span class="alert-box-content"><h4><i class="mdi mdi-alert-outline mdi-24px"></i><span>Oops...</span></h4></span>');

		//lets add the html
		if (typeof data.html!=='object')
			data.html = `<span>${data.html||''}</span>`;

		custom[data.type].html.append($(data.html));

		//update default values with custom overwrites
		_.extend(defaults,custom[data.type]);
		delete data.html; //now that data.html has already been updated, we should not overwrite it

		if ('classname' in data){
			defaults.classname += ' '+data.classname;
			delete data.classname;
		}

		//lets check for is_header
		if ('is_header' in data){
			defaults.classname += ' alert-is-header-box';
			custom[data.type].fx.effect = 'slide-down';
		}

		super(_.extend(defaults,data));

		//lets update the type
		this.setBoxType(data.type);

		//now that box is created, we can update its coords
		if (/error|warning/.test(data.type) && !('is_header' in data)){
			this.getBox().on('click', this.clean.bind(this));
			this.set({center: true});
		}
		else {
			this.set({
				classname:'alert-box',
				onShow: box => {
					let delay = this.getDelay(),
						is_stop_delay = false; //would be set to true if mouse is hovering over the box

					if (delay){
						let _runDelayedClose = () => {
							_.delay(() => {
								if (!is_stop_delay)
									box.clean();
							},delay);
						};

						this.getBox()
							.on('mouseenter',event => {
								is_stop_delay = true;
							})
							.on('mouseleave',event => {
								is_stop_delay = false;
								_runDelayedClose();
							});

						_runDelayedClose();
					}
				}
			});
		}

		//lets add to the stack
		alert_boxes[data.type].push(this);

		return this;
	}
	getDelay(){
		return this.values.delay;
	}
	isSmallViewPort(){
		return !!($(window).width() < (this.values.$elm.outerWidth()+10));
	}
	getBoxType(){
		return this.values.type;
	}
	setBoxType(type){
		this.values.type = type;
		return this;
	}
	adjustCoords(){
		var $last_box = $('.alert-box:not(.box-red)').last(), //lets stack the boxes one on top of the other
			is_small_viewport = this.isSmallViewPort(); //check if viewport is smaller than box

		//if viewport width is smaller than box, reduce box's width
		if (is_small_viewport)
			this.set({ w:$(window).width()-20 });

		var coords = {
			left: is_small_viewport ? 10 : $(window).width()-this.values.$elm.outerWidth()-10,
			top: $(window).height()-this.values.$elm.outerHeight()-10
		};

		if ($last_box.length && $last_box[0]!==this.values.$elm[0])
			coords.top = $last_box.position().top-this.values.$elm.outerHeight()-5;

		this.set({ coords:coords });

		return this;
	}
	show(){
		var existing_boxes = alert_boxes[ this.getBoxType() ],
			current_box = existing_boxes.pop(),
			box_type = this.getBoxType();

		//lets remove all existing boxes (of the same type) except for the last one
		if (existing_boxes.length){
			_.each(existing_boxes,function(box){
				box.values.$elm.remove();
				box.clean();
			});
		}
		alert_boxes[ this.getBoxType() ] = [];

		//if not error or warning, lets re-adjust the coordinates
		if (!/error|warning/i.test(box_type))
			this.adjustCoords();

		super.show();

		return this;
	}
	_onEscapeKeyPressed(event){
		let key = UTILS.getCharKey(event),
			__box = $('.box').last().data(this.values.object);

		if (key===27 && __box && __box.getId()===this.getId() && this.isCloseAllowed())
			this.clean();
	}
};

//stack of opened Boxes
APP.stack = {
	values: {
		boxes: [] //holds the open boxes
	},
	//cleans all the boxes up until dashboard
	resetDepth: function(depth){
		var depth = depth || 0;

		if (APP.stack.values.boxes.length){
			while (APP.stack.values.boxes.length-depth){
				APP.stack.values.boxes.pop().clean();
			}
		}
	},
	getBoxes: function(){
		return APP.stack.values.boxes;
	},
	addBox: function(box){
		var is_added = false;

		if (box instanceof UTILS.Box && !APP.stack.boxExists(box)){
			APP.stack.values.boxes.push(box);
			is_added = true;
		}

		return is_added;
	},
	boxExists: function(box){
		var is_found = false;

		for (var i=0,b; b=APP.stack.values.boxes[i]; i++){
			if (b===box){
				is_found = true;
				break;
			}
		}

		return is_found;
	},
	removeBox: function(box){
		var is_removed = false;

		for (var i=0,b; b=APP.stack.values.boxes[i]; i++){
			if (b===box){
				APP.stack.values.boxes.splice(i,1); //remove box
				is_removed = true;
				break;
			}
		}

		return is_removed;
	},
	//blur last opened box, or first box directly below the box passed in
	blurLastBox: function(box){
		const last_box = APP.stack.getLastBox(box);

		if (last_box)
			last_box.blur();
		else
			box.set({dimmer:true});
	},
	//unblur last opened box, or first box directly below the box passed in
	unblurLastBox: function(box){
		const last_box = APP.stack.getLastBox(box);

		if (last_box)
			last_box.unblur();
	},
	//get last opened box, or first box directly below the box passed in
	getLastBox: function(box){
		var last_box = APP.stack.values.boxes.last();

		if (box===last_box){
			var is_found = false;

			for (var i=APP.stack.values.boxes.length,b; b=APP.stack.values.boxes[i-1]; i--){ //loop backwards
				if (b!==box){
					last_box = b;
					is_found = true;
					break;
				}
			}

			if (!is_found)
				last_box = null;
		}
		return last_box;
	}
};
