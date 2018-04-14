/*
    == UTILS.Event ==

	ex. var ev = new UTILS.Event({ start:'03/01/2017', rule:'FREQ=YEARLY;INTERVAL=3;BYMONTH=6;COUNT=5;BYMONTHDAY=9' });
*/

UTILS.Event =  class extends UTILS.Base {
	constructor(data={}){
		super(data);
		_log(this.getObjectName()+' --> instantiated!',this.getId(),this);
		
		('popup' in data) && this.setPopupState(data.popup);
		('rule' in data) && this.setRule(data.rule);
		('ajax' in data) && this.setAjaxData(data.ajax);
		('start' in data) && this.setStartDate(data.start);
		('end' in data) && this.setEndDate(data.end);
		('onShow' in data) && this.addCallback('onShow', data.onShow);
		('onHide' in data) && this.addCallback('onHide', data.onHide);
		('onSave' in data) && this.addCallback('onSave', data.onSave);
		('onCancel' in data) && this.addCallback('onCancel', data.onCancel);

		return this;
	}
	getDefaults(){
		return {
			object:'utils.event',
			version:'0.0.3',
			rule: this.getDefaultRule(),
			start_date: moment(),
			end_date: null,
			date_format: 'MM/DD/YYYY',
			is_shown: false,
			is_popup: true,
			ajax: {
				type: 'GET',
				url: '/v1/event/{id}',
				params: {}
			},
			days_of_week: ['Su|Sunday','Mo|Monday','Tu|Tuesday','We|Wednesday','Th|Thursday','Fr|Friday','Sa|Saturday'],
			months: ['Jan|January','Feb|February','Mar|March','Apr|April','May|May','Jun|June','Jul|July','Aug|August','Sep|September','Oct|October','Nov|November','Dec|December'],
			weeks_in_month: ['1|First (1st)','2|Second (2nd)','3|Third (3rd)','4|Fourth (4th)','LAST|Last'],
			frequency: ['Daily|Day(s)','Weekly|Week(s)','Monthly|Month(s)','Yearly|Year(s)'],
			Box: null //holds the UTILS.Box
		};
	}
	getDefaultRule(){
		return {
			freq: 'WEEKLY',
			interval: 1,
			days_of_week: ['WED'],
			count: 1
		};
	}
	getDefaultRuleFormat(freq){
		var rule_format = null,
			rule = this.getRule(),
			freq = freq || ('freq' in rule ? rule.freq : this.getDefaultRule().freq);

		switch(freq){
			case 'DAILY':
				rule_format = {
					freq: 'DAILY',
					interval: null,
					count: null
				};
			break;
			case 'WEEKLY':
				rule_format = {
					freq: 'WEEKLY',
					interval: null,
					days_of_week: [],
					count: null,
					start_of_week: null
				};
			break;
			case 'MONTHLY':
				rule_format = {
					freq: 'MONTHLY',
					interval: null,
					days_of_week: [],
					day_of_month: null,
					week_of_month: null,
					set_pos: null,
					count: null
				};
			break;
			case 'YEARLY':
				rule_format = {
					freq: 'YEARLY',
					interval: null,
					days_of_week: [],
					week_of_month: null,
					month: null,
					set_pos: null,
					count: null
				};
			break;
		}

		//dates to be ignored
		rule_format.exdate = [];

		return rule_format;
	}
	isPopup(){
		return this.values.is_popup;
	}
	setPopupState(state){
		this.values.is_popup = !!(state);

		return this;
	}
	setTarget(target){
		super.setTarget(target);

		//lets add a scheduler class
		this.values.$target.addClass('app-scheduler-event');

		return this;
	}
	getStartDate(){
		return this.values.start_date;
	}
	setStartDate(start){
		var start_date = moment();

		if (_.isNumber(start))
			start_date = moment.unix(start/1000);
		else if (_.isString(start))
			start_date = moment(start,this.getDateFormat());
		else if (moment(start).isValid())
			start_date = moment(start);

		this.values.start_date = start_date;

		return this;
	}
	getEndDate(){
		return this.values.end_date;
	}
	setEndDate(end){
		var end_date = null;

		if (_.isNumber(end))
			end_date = moment.unix(end/1000);
		else if (_.isString(end))
			end_date = moment(end,this.getDateFormat());
		else if (moment(end).isValid())
			end_date = moment(end);

		this.values.end_date = end_date;

		return this;
	}
	getDateFormat(){
		return this.values.date_format;
	}
	setDateFormat(format){
		this.values.date_format = format;

		return this;
	}
	getBox(){
		return (this.values.Box) ? this.values.Box : this.createBox();
	}
	createBox(){
		this.values.Box = new UTILS.Box({
			id: 'event-box',
			w: 700,
			title: 'edit appointment',
			html: '',
			controls: '',
			dimmer: true,
			center: true,
			classname: 'app-scheduler-event',
			offset: { left:0, top:0 },
			fx: { effect:'slide-down' },
			onCancel: this._onCancel.bind(this)
		});

		return this.values.Box;
	}
	getBoxControls(){

		var _clean = function(){
			if (this.isPopup())
				this.getBox().clean();
			else
				this.getTarget().empty();
		}.bind(this);

		var $controls = $(`
				<div class="controls-wrapper cfx">
					<div class="box-controls-controls cfx">
						<button type="button" class="btn btn-primary control-button box-controls-save"><i class="mdi mdi-check"></i> Save</button>
					</div>
					<div class="box-controls-result"></div>
				</div>
			`);

		$controls.find('.box-controls-save').on('click',this._onSave.bind(this));

		if (this.isPopup()){
			$controls.append('<button type="button" class="btn btn-link control-button box-controls-close">Cancel</button>');

			$controls.find('.box-controls-close').on('click',function(){ _clean(); this._onCancel(); }.bind(this));
		}

		return $controls;
	}
	_onSave(event){
		event.preventDefault();
		console.log('app.event --> saved!');

		var rule = this.getRule(),
			_rule = this.getDefaultRuleFormat(rule.freq),
			$wrapper = this.isPopup() ? this.getBox().getMainbody() : this.getTarget();

		//interval
		var interval = $wrapper.find('.event-interval').val();

		if (interval.length)
			_rule.interval = parseInt(interval);

		//lets update the rule
		switch(rule.freq){
			case 'WEEKLY':
				//dow
				var days_of_week = _.map($wrapper.find('.event-dow:checked'),function(dow){ return $(dow).val(); });

				if (days_of_week.length)
					_rule.days_of_week = days_of_week;

				break;
			case 'MONTHLY': case 'YEARLY':
			var repeat_by = $wrapper.find('[name=event-repeat-by]:checked').val();

			if (/dom/.test(repeat_by)){
				var day_of_month = $wrapper.find('.event-repeat-dom-day').val();

				if (day_of_month.length)
					_rule.day_of_month = parseInt(day_of_month);

				if (/YEARLY/i.test(rule.freq)){
					var month = $wrapper.find('.event-repeat-dom-month').val();

					if (month.length)
						_rule.month = parseInt(month);
				}
			}
			else if (/other/.test(repeat_by)){
				var week_of_month = $wrapper.find('.event-repeat-other-wom').val(),
					day_of_week = $wrapper.find('.event-repeat-other-dow').val();


				if (/last/i.test(week_of_month)){
					_rule.set_pos = -1; //lets assume -1 means last day of month
					_rule.days_of_week = [day_of_week.toUpperCase()];
				}
				else {
					var wom_index = _.findIndex(this.values.weeks_in_month, function(wom){
						return wom.match(new RegExp(week_of_month, 'i'));
					});

					_rule.set_pos = wom_index+1;
					_rule.days_of_week = [day_of_week.toUpperCase()];
				}

				if (/YEARLY/i.test(rule.freq)){
					var month = $wrapper.find('.event-repeat-other-month').val();

					if (month.length)
						_rule.month = parseInt(month);
				}
			}
			break;
		}

		//start
		var start_date = $wrapper.find('.event-start-date').val();

		if (start_date.length)
			this.setStartDate(start_date);

		//end
		var end = $wrapper.find('[name=event-end]:checked').val();
		switch(true){
			case /never/.test(end):
				_rule.count = null;
				break;
			case /after/.test(end): //occurence
				var count = $wrapper.find('.event-repeat-occurence').val();

				if (count.length)
					_rule.count = parseInt(count);
				break;
			case /on/.test(end): //by certain date
				var end_date = $wrapper.find('.event-end-date').val();

				if (end_date.length)
					this.setEndDate(end_date);

				break;
		}

		//lets update the rule
		this.setRule(_rule);

		this.fns('onSave');
	}
	_onCancel(){
		console.log('app.event --> cancelled!');

		this.fns('onCancel');
	}
	//renders the box on the screen
	render(){
		var $template = this.getTemplate(),
			$controls = this.getBoxControls();

		if (!this.isPopup())
			this.getTarget().html([$template,$controls]);
		else {
			var box = this.getBox()

			box.set({ html: $template, controls: $controls });

			if (!box.isShown())
				box.show();
		}

		return this;
	}
	getRule(){
		return this.values.rule;
	}
	setRule(_rule){
		var parsed_rule = this._parseRule(_rule),
			rule = this.getDefaultRuleFormat(parsed_rule.freq);

		this.values.rule = _.extend(rule,parsed_rule);

		return this;
	}
	getFrequency(){
		return this.getRule().freq;
	}
	//converts the rule to a string
	stringifyRule(){
		var rule = this.getRule(),
			rule_str = [];

		_.each(rule,function(val,key){
			switch(key){
				case 'days_of_week':
					if (val.length)
						rule_str.push('BYDAY='+val.join());
					break;
				case 'exdate':
					if (val.length)
						rule_str.push('EXDATE='+val.join());
					break;
				case 'freq':
					rule_str.push('FREQ='+val.toUpperCase());
					break;
				case 'interval':
					if (val!==null)
						rule_str.push('INTERVAL='+val);
					break;
				case 'count':
					if (val!==null)
						rule_str.push('COUNT='+val);
					break;
				case 'day_of_month':
					if (val!==null)
						rule_str.push('BYMONTHDAY='+val);
					break;
				case 'month':
					if (val!==null)
						rule_str.push('BYMONTH='+val);
					break;
				case 'set_pos':
					if (val!==null)
						rule_str.push('BYSETPOS='+val);
					break;
				case 'start_of_week':
					if (val!==null)
						rule_str.push('WKST='+val.toUpperCase());
					break;
			}
		});

		return rule_str.join(';');
	}
	//parses rule from string to json
	_parseRule(rule){
		var _rule = {};

		_log('app.scheduler --> parsing rule!',rule);

		if (_.isPlainObject(rule))
			_rule = rule;
		else {
			var rule_segments = rule.split(';');

			//lets parse the rule
			_.each(rule_segments,function(rule_segment){
				var segment = rule_segment.split('=');

				switch(segment[0].toUpperCase()){
					case 'FREQ':
						_rule.freq = segment[1].toUpperCase();
						break;
					case 'INTERVAL':
						_rule.interval = parseInt(segment[1]);
						break;
					case 'COUNT':
						_rule.count = parseInt(segment[1]);
						break;
					case 'UNTIL':
						_rule.until = moment.unix(segment[1]); //must be epoch timestamp
						break;
					case 'BYDAY':
						_rule.days_of_week = _.filter(segment[1].split(','),function(day){ return day.length; });
						break;
					case 'BYMONTHDAY':
						_rule.day_of_month = parseInt(segment[1]);
						break;
					case 'BYMONTH':
						_rule.month = parseInt(segment[1]);
						break;
					case 'BYSETPOS':
						_rule.set_pos = parseInt(segment[1]);
						break;
					case 'WKST':
						_rule.start_of_week = segment[1];
						break;
					case 'EXDATE':
						_rule.exdate = _.map(segment[1].split(','),function(date){
							var m = moment.unix(date/1000);
							return m.isValid() ? m : date;
						});
						break;
				}
			});
		}

		return _rule;
	}
	_onFrequencyChanged(event){
		var freq = $(event.target).val();

		if (freq.length)
			this.setRule({ freq:freq }).render();
	}
	_isNotNull(elm){
		return elm!==null;
	}
	getTemplate(){
		var rule = this.getRule(),
			start_date = this.getStartDate(),
			end_date = this.getEndDate() || start_date,
			$template = $('<form class="form-horizontal"></form>'),
			datepicker_default_options = { autoclose: true, todayHighlight:true, format:'mm/dd/yyyy'},
			dp_options = _.extend(datepicker_default_options, { orientation: 'bottom' });

		//since this.values.frequency has a peculiar format we need a special method to get the value out
		var _getReadableFrequency = function(freq){
			var _freq = _.find(this.values.frequency,function(frequency){ return frequency.match(new RegExp(freq,'i')) });

			return (_freq) ? _freq.split('|')[1] : '';
		}.bind(this);

		//frequency
		var $frequency = $('<div class="form-group app-event-row">'+
			'<label for="event-frequency" class="col-sm-2 control-label">Repeat</label>'+
			'<div class="col-sm-10"><select class="form-control event-frequency">'+_.map(this.values.frequency,function(frequency,i){ var freq = frequency.split('|')[0]; return '<option value="'+freq.toUpperCase()+'">'+freq+'</option>'; }).join('')+'</select></div>'+
			'</div>');
		$template.append($frequency);
		$frequency.find('.event-frequency')
			.on('change',this._onFrequencyChanged.bind(this))
			.val(rule.freq);

		//interval
		var $interval = $('<div class="form-group app-event-row">'+
			'<label for="event-interval" class="col-sm-2 control-label">Every</label>'+
			'<div class="col-sm-3"><input type="text" class="form-control event-interval" placeholder="Interval"></div>'+
			'<div class="col-sm-7"><span class="event-helper-text event-interval-helper">'+_getReadableFrequency(rule.freq)+'</span></div>'+
			'</div>');
		$template.append($interval);

		if ('interval' in rule && this._isNotNull(rule.interval))
			$interval.find('.event-interval').val(rule.interval);

		//repeat
		switch(rule.freq){
			case 'WEEKLY':
				var $repeat = $('<div class="form-group app-event-row">'+
					'<label for="event-dow" class="col-sm-2 control-label">Repeat on</label>'+
					'<div class="col-sm-10">'+_.map(this.values.days_of_week,function(dow){ var day = dow.split('|')[0]; return '<label class="app-event-checkbox"><input type="checkbox" class="event-dow event-day-'+day.toUpperCase()+'" name="event-dow" value="'+day.toUpperCase()+'"> '+day+'</label>'; }).join('')+'</div>'+
					'</div>');
				$template.append($repeat);

				_.each(rule.days_of_week,function(day){
					$repeat.find('.event-day-'+day).prop('checked',true);
				});
				break;
			case 'MONTHLY':
				var $repeat = $('<div class="form-group app-event-row">'+
					'<label for="event-repeat" class="col-sm-2 control-label">Repeat by</label>'+
					'<div class="col-sm-10">'+
					'<div class="row app-event-row">'+
					'<div class="col-sm-2"><label><input type="radio" class="event-repeat-by-dom" name="event-repeat-by" checked="checked" value="dom"> Day</label></div>'+
					'<div class="col-sm-10"><input type="text" class="form-control event-repeat-dom-day" placeholder="Day of month"></div>'+
					'</div>'+
					'<div class="row app-event-row">'+
					'<div class="col-sm-2"><label><input type="radio" class="event-repeat-by-other" name="event-repeat-by" value="other"> The</label></div>'+
					'<div class="col-sm-5"><select class="form-control event-repeat-other-wom">'+_.map(this.values.weeks_in_month,function(wom){ return '<option value="'+wom.split('|')[0]+'">'+wom.split('|')[1]+'</option>'; }).join('')+'</select></div>'+
					'<div class="col-sm-5"><select class="form-control event-repeat-other-dow">'+_.map(this.values.days_of_week,function(dow){ return '<option value="'+dow.split('|')[0].toUpperCase()+'">'+dow.split('|')[1]+'</option>'; }).join('')+'</select></div>'+
					'</div>'+
					'</div>'+
					'</div>');
				$template.append($repeat);

				if ('day_of_month' in rule && this._isNotNull(rule.day_of_month))
					$repeat.find('.event-repeat-dom-day').val(rule.day_of_month);

				if ('set_pos' in rule && this._isNotNull(rule.set_pos)){
					$repeat.find('.event-repeat-other-wom').val( rule.set_pos<0 ? 'LAST' : rule.set_pos );
					$repeat.find('.event-repeat-by-other').prop('checked',true);
				}

				if ('days_of_week' in rule && rule.days_of_week.length)
					$repeat.find('.event-repeat-other-dow').val(rule.days_of_week[0]);
				break;
			case 'YEARLY':
				var $repeat = $('<div class="form-group app-event-row">'+
					'<label for="event-repeat" class="col-sm-2 control-label">Repeat by</label>'+
					'<div class="col-sm-10">'+
					'<div class="row app-event-row">'+
					'<div class="col-sm-2"><label><input type="radio" class="event-repeat-by-dom" name="event-repeat-by" checked="checked" value="dom"> The</label></div>'+
					'<div class="col-sm-3"><select class="form-control event-repeat-dom-month">'+_.map(this.values.months,function(month,i){ return '<option value="'+(i+1)+'">'+month.split('|')[1]+'</option>'; }).join('')+'</select></div>'+
					'<div class="col-sm-3"><input type="text" class="form-control event-repeat-dom-day" placeholder="Day of month"></div>'+
					'<div class="col-sm-4"></div>'+
					'</div>'+
					'<div class="row app-event-row">'+
					'<div class="col-sm-2"><label><input type="radio" class="event-repeat-by-other" name="event-repeat-by" value="other"> The</label></div>'+
					'<div class="col-sm-3"><select class="form-control event-repeat-other-wom">'+_.map(this.values.weeks_in_month,function(week){ return '<option value="'+week.split('|')[0]+'">'+week.split('|')[1]+'</option>'; }).join('')+'</select></div>'+
					'<div class="col-sm-3"><select class="form-control event-repeat-other-dow">'+_.map(this.values.days_of_week,function(dow){ return '<option value="'+dow.split('|')[0].toUpperCase()+'">'+dow.split('|')[1]+'</option>'; }).join('')+'</select></div>'+
					'<div class="col-sm-1"><span class="event-helper-text">Of</span></div>'+
					'<div class="col-sm-3"><select class="form-control event-repeat-other-month">'+_.map(this.values.months,function(month,i){ return '<option value="'+(i+1)+'">'+month.split('|')[1]+'</option>'; }).join('')+'</select></div>'+
					'</div>'+
					'</div>');
				$template.append($repeat);

				if ('month' in rule && this._isNotNull(rule.month)){
					if ('day_of_month' in rule && this._isNotNull(rule.day_of_month))
						$repeat.find('.event-repeat-dom-month').val(rule.month);
					else
						$repeat.find('.event-repeat-other-month').val(rule.month);
				}

				if ('day_of_month' in rule && this._isNotNull(rule.day_of_month))
					$repeat.find('.event-repeat-dom-day').val(rule.day_of_month);

				if ('set_pos' in rule && this._isNotNull(rule.set_pos)){
					$repeat.find('.event-repeat-other-wom').val( rule.set_pos<0 ? 'LAST' : rule.set_pos );
					$repeat.find('.event-repeat-by-other').prop('checked',true);
				}

				if ('days_of_week' in rule && rule.days_of_week.length)
					$repeat.find('.event-repeat-other-dow').val(rule.days_of_week[0]);

				break;
		}

		//start
		var $start = $('<div class="form-group app-event-row">'+
			'<label for="event-start-date" class="col-sm-2 control-label">Starts on</label>'+
			'<div class="col-sm-4">' +
			'<div class="input-group event-start-date-picker date">'+
			'<input type="text" class="form-control event-start-date" placeholder="Interval">'+
			'<div class="input-group-addon"><i class="fa fa-calendar-o"></i></div>'+
			'</div>'+
			'</div>'+
			'<div class="col-sm-6"></div>'+
			'</div>');
		$template.append($start);

		$start.find('.event-start-date').val(start_date.format(this.getDateFormat()));
		$start.find('.date').datepicker(dp_options);

		//end
		var $end = $('<div class="form-group app-event-row">'+
			'<label for="event-end" class="col-sm-2 control-label">Ends</label>'+
			'<div class="col-sm-10">'+
			'<div class="row app-event-row">'+
			'<div class="col-sm-12"><label><input type="radio" class="event-end-never" name="event-end" checked="checked" value="never"> Never</label></div>'+
			'</div>'+
			'<div class="row app-event-row">'+
			'<div class="col-sm-2"><label><input type="radio" class="event-end-after" name="event-end" value="after"> After</label></div>'+
			'<div class="col-sm-3"><input type="text" class="form-control event-repeat-occurence" placeholder="Occurence"></div>'+
			'<div class="col-sm-7"><span class="event-helper-text">Occurence(s)</span></div>'+
			'</div>'+
			'<div class="row app-event-row">'+
			'<div class="col-sm-2"><label><input type="radio" name="event-end" value="on"> On</label></div>'+
			'<div class="col-sm-5">' +
			'<div class="input-group event-end-date-picker date">'+
			'<input type="text" class="form-control event-end-date" placeholder="Interval">'+
			'<div class="input-group-addon"><i class="fa fa-calendar-o"></i></div>'+
			'</div>'+
			'</div>'+
			'<div class="col-sm-5"></div>'+
			'</div>'+
			'</div>'+
			'</div>');
		$template.append($end);

		if ('count' in rule && this._isNotNull(rule.count)){
			$end.find('.event-repeat-occurence').val(rule.count);
			$end.find('.event-end-after').prop('checked',true);
		}

		//end-date is set to start b/c we always use @count
		$end.find('.event-end-date').val(end_date.format(this.getDateFormat()));

		$end.find('.date').datepicker(dp_options);

		return $template;
	}
	show(){
		this.fns('onShow');
		this.render();

		return this;
	}
	hide(){
		var _clean = function(){
			if (this.isPopup()){
				this.getBox().clean();
				this.values.Box = null;
			}
			else
				this.getTarget().empty();

			this.fns('onHide');
		}.bind(this);

		_clean();

		return this;
	}
};

// Export node module.
if ( typeof module !== 'undefined' && module.hasOwnProperty('exports') ){
	module.exports = UTILS.Event;
}