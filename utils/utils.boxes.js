//extends the regular BOX object
APP.BOX = class extends BOX {
	constructor(data){
		if (!('object' in data))
			data.object = 'utils.box[app.box]';

		super(data);

		//lets check for mappers (by now the 'set' method has executed)
		if ('mapper' in data){
			this.values.mapper = APP.members.getMapper(data.mapper);
			var title = '';
			var stacked_boxes = APP.stack.getBoxes();
			for (var i=0,box; box=stacked_boxes[i]; i++){
				var lnk = (i<stacked_boxes.length-1) ? '<span class="label label-primary"><a href="javascript:;" onclick="APP.stack.resetDepth('+(i+1)+');return false;">'+box.values.mapper.single+'</a></span>' : '<span class="label label-default">'+this.values.mapper.single+'</span>';
				title += ((i) ? ' &raquo; ' : '') + lnk;
			}
			this.set({ title:title });
		}

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
};

/*
	== APP.CONFIRM ==
	extends the APP.BOX object
 */
APP.CONFIRM = class extends APP.BOX{
	constructor(data){
		var defaults = {
			w:400, title:'',
			html:'<p>Do you want to proceed?</p>',
			dd:false,
			classname:'box-confirm',
			center:true
		};

		if (!('object' in data))
			data.object = 'utils.box[app.confirm]';

		super(_.extend(defaults,data));

		//lets check for onConfirm (by now the 'set' method has executed)
		if ('onConfirm' in data){
			this.addCallback('onConfirm',data.onConfirm);
			//create buttons
			this.values.divs.$inner_controls = $('<div class="regular text-right">');
			this.values.divs.$confirm = $('<button type="button" class="btn btn-danger">proceed</button>');
			this.values.divs.$cancel = $('<button type="button" class="btn btn-light">cancel</button>');
			this.values.divs.$inner_controls.append(this.values.divs.$cancel,this.values.divs.$confirm);
			this.values.divs.$mainbody.append(this.values.divs.$inner_controls);
			//add onclick events
			this.values.divs.$confirm.on('click.confirm.utils.box',function(event){ event.preventDefault(); event.stopPropagation(); this.clean('confirm').fns('onConfirm'); }.bind(this));

			if ('onCancel' in data){
				this.addCallback('onCancel',data.onCancel);
				this.values.divs.$cancel.on('click.clean.utils.box',function(event){ event.preventDefault(); event.stopPropagation(); this.clean('clean').fns('onCancel'); }.bind(this));
			}
			else
				this.values.divs.$cancel.on('click.clean.utils.box',function(event){ event.preventDefault(); event.stopPropagation(); this.clean(); }.bind(this));
		}

		//lets check for buttons
		if ('customButtons' in data){
			('confirm' in data.customButtons) && this.values.divs.$confirm.html(data.customButtons.confirm);
			('cancel' in data.customButtons) && this.values.divs.$cancel.html(data.customButtons.cancel);
		}

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
	== APP.ALERT ==
	extends the BOX object

	--> used in displaying error messages (center of page) or notifications (right-bottom corner)
 */

//holds all the opened alert boxes
var alert_boxes = { error:[], success:[], info:[], warning:[] };

APP.ALERT = class extends BOX {
	constructor(data){
		if (!('type' in data))
			data.type = 'info';

		if (!('object' in data))
			data.object = 'utils.box[app.alert]';

		var defaults = { w:600, title:'', html:'', dd:false, light:true, buttons:{ close:true, maximize:false } };
		var custom = {
			error: { w:600, classname:'box-red', html:$('<span><i class="mdi mdi-alert mdi-24px"></i></span>'), fx:{effect:'expand-in'} },
			success: { w:400, classname:'box-green', html:$('<span><i class="mdi mdi-check mdi-24px"></i></span>'), fx:{effect:'slide-up'} },
			info: { w:400, classname:'box-blue', html:$('<span><i class="mdi mdi-info mdi-24px"></i></span>'), fx:{effect:'slide-right'} },
			warning: { w:400, classname:'box-yellow', html:$('<span><i class="mdi mdi-exclamation mdi-24px"></i></span>'), fx:{effect:'expand-in'} },
		};

		//lets change the default html for soft error msgs
		if (/error/.test(data.type) && 'classname' in data && /soft/.test(data.classname))
			custom[data.type].html = $('<span><h4><i class="mdi mdi-alert mdi-24px"></i> Oops...</h4></span>');

		//lets add the html
		custom[data.type].html.append(' ').append(data.html||'');

		//update default values with custom overwrites
		var defaults = _.extend(defaults,custom[data.type]);
		delete data.html; //now that data.html has already been updated, we should not overwrite it

		if ('classname' in data){
			defaults.classname += ' '+data.classname;
			delete data.classname;
		}

		super(_.extend(defaults,data));

		//lets update the type
		this.setBoxType(data.type);

		//now that box is created, we can update its coords
		if (/error|warning/.test(data.type)){
			this.getBox().on('click', this.clean.bind(this));
			this.set({center: true});
		}
		else {
			this.set({
				classname:'alert-box',
				onShow: function(box){
					box.clean.bind(box).delay(1000);
				}
			});
		}

		//lets add to the stack
		alert_boxes[data.type].push(this);

		return this;
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
};

//stack of opened BOXes
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

		if (box instanceof BOX && !APP.stack.boxExists(box)){
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