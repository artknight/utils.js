/*
    == UTILS.Timerange ==

    == dependencies ==
    moment.js

	ex. var timerange = new UTILS.Timerange({ target:$('#time-range-field') });

	== definitions ==
	@target - (required) DOM elm where the time picker will be inserted --> defaults to 'body'
	@range - (optional) start & end time of the slider --> defaults to { start:540 (9am), end:1020 (5pm) }
	@options - (optional) jquery-ui slider options --> defaults to { range: true, min:0, max:1440, step:15 }

*/
UTILS.Timerange =  class extends UTILS.Base {
	constructor(data={}){
		super(data);

		_log(this.getObjectName()+' --> instantiated!',this.getId(),this);

		if (!('target' in data))
			throw new Error('@target must be specified upon initialization!');

		('options' in data) && this.setOptions(data.options);
		('range' in data) && this.setRange(data.range);
		('date' in data) && this.setDate(data.date);
		('onShow' in data) && this.addCallback('onShow',data.onShow);
		('onHide' in data) && this.addCallback('onHide',data.onHide);
		('onStart' in data) && this.addCallback('onStart',data.onStart);
		('onStop' in data) && this.addCallback('onStop',data.onStop);
		('onSlide' in data) && this.addCallback('onSlide',data.onSlide);

		this._initSlider();

		return this;
	}
	getDefaults(){
		return {
			object: 'utils.timerange',
			version: '1.0.2',
			$wrapper: null, //holds the timer wrapper
			is_shown: false, //holds whether the timerange is shown
			date: moment(), //holds the date
			is_date_editable: true, //holds whether the date is editable
			time_format: 'h:mm A', //holds the time format
			time_label_format: 'h A', //holds the time format
			date_format: 'MM/DD/YYYY', //holds the date format
			allow_past_dates: false,
			EditableDate: null, //holds the editable date object
			//start values
			range: {
				start: 540, //9am
				end: 960 //4pm
			},
			//noUISlider options
			settings: {
				range: {
					min: 0,
					max: 1440, //mins in 24 hrs
				},
				tooltips: [true, true],
				connect: true,
				step: 15,
				format: {
					to: this._formatDisplayTime.bind(this),
					from: function (val){
						return val;
					}
				},
				pips: {
					mode: 'steps',
					stepped: true,
					density: 4,
					format: {
						to: function(total_mins) {
							var range = this._getHoursMinsFromTotalMins(total_mins),
								time_label_format = this.getTimeLabelFormat()

							return moment(range.hrs+':'+range.mins, 'HH:mm').format(time_label_format);
						}.bind(this),
						from: function(val) {
							return val;
						}
					},
					filter: function(value, type){
						if (value % 60===0) //every hour
							return (Math.floor(value/60) % 2===1) ? 2 : 1
						else
							return 0;
					}
				}
			}
		};
	}
	clean(){
		this.values.$wrapper.remove();
		return this;
	}
	_create(){
		if (!this.values.$wrapper){
			this.values.$wrapper = $(`
				<div class="app-timerange hide">
					<div class="slider-header">
						<div class="slider-header-date">Date: <span></span></div>
						<div class="slider-header-timerange">Time: <span class="slider-start"></span> - <span class="slider-end"></span></div>
					</div>
					<div class="slider-range"></div>
				</div>
			`);

			this.values.$wrapper.data('$timerange',this);
		}

		return this.values.$wrapper;
	}
	enable(){
		var $wrapper = this.getWrapper(),
			$slider = $wrapper.find('.slider-range'),
			EditableDate = this._getEditableDate();

		//lets enable the slider
		$slider.labeledslider('enable');

		//lets enable editable date
		if (EditableDate)
			EditableDate.enable();

		return this;
	}
	disable(){
		var $wrapper = this.getWrapper(),
			$slider = $wrapper.find('.slider-range'),
			EditableDate = this._getEditableDate();

		//lets disable the slider
		$slider.labeledslider('disable');

		//lets disable editable date
		if (EditableDate)
			EditableDate.disable();

		return this;
	}
	isShown(){
		return this.values.is_shown;
	}
	isDateEditable(){
		return this.values.is_date_editable;
	}
	setDateEditableState(state){
		this.values.is_date_editable = !!state;
		return this;
	}
	getDate(){
		return this.values.date;
	}
	setDate(date){
		var date_format = this.getDateFormat();

		if (_.isString(date))
			this.values.date = moment(date,date_format);
		else if (moment.isMoment(date))
			this.values.date = date;
		else
			this.values.date = moment();

		//lets update the display
		this.updateDateDisplay();

		return this;
	}
	isAllowPassedDates(){
		return this.values.allow_past_dates;
	}
	setAllowPassedDates(state){
		this.values.allow_past_dates = !!state;
		return this;
	}
	getDateFormat(){
		return this.values.date_format;
	}
	setDateFormat(format){
		this.values.date_format = format;
		return this;
	}
	getTimeFormat(){
		return this.values.time_format;
	}
	setTimeFormat(format){
		this.values.time_format = format;
		return this;
	}
	getTimeLabelFormat(){
		return this.values.time_label_format;
	}
	setTimeLabelFormat(format){
		this.values.time_label_format = format;
		return this;
	}
	getWrapper(){
		return this.values.$wrapper;
	}
	_formatDisplayTime(total_mins){
		var range = this._getHoursMinsFromTotalMins(total_mins),
			time_format = this.getTimeFormat();

		return moment(range.hrs+':'+range.mins, 'HH:mm').format(time_format);
	}
	_getEditableDate(){
		return this.values.EditableDate;
	}
	_setEditableDate(EditableDate){
		this.values.EditableDate = EditableDate;
		return this;
	}
	updateDateDisplay(){
		var date = this.getDate(),
			date_format = this.getDateFormat(),
			is_date_editable = this.isDateEditable(),
			allow_passed_dates = this.isAllowPassedDates(),
			$wrapper = this.getWrapper(),
			$slider_date = $wrapper.find('.slider-header-date span');

		if (is_date_editable){
			var EditableDate = this._getEditableDate();

			if (!EditableDate){
				var editable_options = {
					target: $slider_date,
					type: 'date',
					options: {
						format: date_format,
						startDate: allow_passed_dates ? 0 : '+0d' //starts today
					},
					value: date.format(date_format),
					onAfterSave: function(Editable){
						this.setDate(Editable.getValue());
						this.fns('onStop');
					}.bind(this)
				};
				EditableDate = new UTILS.Editable(editable_options).enable();
				this._setEditableDate(EditableDate);
			}
		}
		else
			$slider_date.html(date.format(date_format));

		return this;
	}
	updateTimeDisplay(){
		var range = this.getTimeRange(),
			$wrapper = this.getWrapper(),
			$start = $wrapper.find('.slider-start'),
			$end = $wrapper.find('.slider-end');

		$start.html(this._formatDisplayTime(range.start));
		$end.html(this._formatDisplayTime(range.end));

		return this;
	}
	setTarget(target){
		super.setTarget(target);
		this.values.$target.append(this._create());
		return this;
	}
	_initSlider(){
		var $wrapper = this.getWrapper(),
			$slider = $wrapper.find('.slider-range'),
			$inputs = $slider.find('.custom-slider-input'),
			range = this.getTimeRange(),
			options = this.getOptions();

		//updating start/end
		_.extend(options, {
			start: [range.start,range.end]
		});

		//lets destroy an existing one if exists
		try { $slider[0].noUiSlider.destroy(); } catch(e){}

		//lets update the options
		this.setOptions(options);

		noUiSlider.create($slider[0],options);
		
		$slider[0].noUiSlider.on('update', this._onSlide.bind(this));
		$slider[0].noUiSlider.on('start', this._onStart.bind(this));
		$slider[0].noUiSlider.on('end', this._onStop.bind(this));
		
		return this;
	}
	getOptions(){
		return this.values.settings;
	}
	setOptions(options={}){
		//certain options need to be put in their designated places
		if ('min' in options){
			this.values.settings.range.min = options.min;
			delete options.min;
		}

		if ('max' in options){
			this.values.settings.range.max = options.max;
			delete options.max;
		}

		if ('date_editable' in options){
			this.setDateEditableState(options.date_editable);
			delete options.date_editable;
		}

		if ('time_format' in options){
			this.setTimeFormat(options.time_format);
			delete options.time_format;
		}

		if ('time_label_format' in options){
			this.setTimeLabelFormat(options.time_label_format);
			delete options.time_label_format;
		}

		if ('date_format' in options){
			this.setDateFormat(options.date_format);
			delete options.date_format;
		}

		if ('allow_past_dates' in options){
			this.setAllowPassedDates(options.allow_past_dates);
			delete options.allow_past_dates;
		}

		_.extend(this.values.settings,options);

		return this;
	}
	getTimeRange(){
		return this.values.range;
	}
	getFormattedTimeRange(){
		var range = this.getTimeRange();

		return {
			start: this._formatDisplayTime(range.start),
			end: this._formatDisplayTime(range.end)
		};
	}
	getDateTimeRange(){
		return _.extend({},this.values.range,{ date:this.getDate() });
	}
	getFormattedDateTimeRange(){
		var formatted_range = this.getFormattedTimeRange(),
			date = this.getDate(),
			date_format = this.getDateFormat();

		return _.extend({}, formatted_range, { date:date.format(date_format)});
	}
	_getHoursMinsFromTotalMins(total_mins){
		return {
			hrs: Math.floor(total_mins/60),
			mins: Math.floor(total_mins) % 60
		};
	}
	getDateTimeRangeAsMoment(){
		var range = this.getTimeRange(),
			range_start = this._getHoursMinsFromTotalMins(range.start),
			range_end = this._getHoursMinsFromTotalMins(range.end),
			date = this.getDate();

		return {
			start: date.clone().hours(range_start.hrs).minutes(range_start.mins).seconds(0),
			end: date.clone().hours(range_end.hrs).minutes(range_end.mins).seconds(0)
		};
	}
	//if the minutes are not matching the interval, we need to round them up to the nearest interval
	_normalizeMinutes(mins){
		var options = this.getOptions();

		if (mins){
			mins = options.step * Math.ceil(mins/options.step); //lets round to nearest interval

			if (mins > options.max)
				mins = options.max;
		}

		return mins;
	}
	setRange(range){
		if (_.isPlainObject(range)){
			if ('start' in range)
				range.start = this._normalizeMinutes(range.start);

			if ('end' in range)
				range.end = this._normalizeMinutes(range.end);

			_.extend(this.values.range,range);
		}

		return this;
	}
	show(){
		var $wrapper = this.getWrapper();
		this.updateTimeDisplay();
		$wrapper.removeClass('hide');
		this.fns('onShow');
		this.values.is_shown = true;

		return this;
	}
	hide(){
		var $wrapper = this.getWrapper();
		this.fns('onHide');
		$wrapper.addClass('hide');
		this.values.is_shown = false;

		return this;
	}
	_onSlide(values,handle,raw_values){
		var start_mins = Math.floor(raw_values[0]),
			end_mins = Math.floor(raw_values[1]);

		//lets update the range
		this.setRange({ start:start_mins, end:end_mins });

		//lets update the display
		this.updateTimeDisplay();

		this.fns('onSlide');
	}
	_onStart(event,ui){

		this.fns('onStart');
	}
	_onStop(event,ui){
		var $time_range = this.getWrapper().find('.slider-header-timerange');
		$time_range.velocity('callout.flash');
		this.fns('onStop');
	}
};

// Export node module.
if ( typeof module !== 'undefined' && module.hasOwnProperty('exports') ){
	module.exports = UTILS.Timerange;
}