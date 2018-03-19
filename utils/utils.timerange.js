/*
    == UTILS.Timerange ==

    == dependencies ==
    moment.js

	ex. var Timerange = new UTILS.Timerange({ target:$('#time-range-field') });

	== definitions ==
	@target - (required) DOM elm where the time picker will be inserted --> defaults to 'body'
	@range - (optional) start & end time of the slider --> defaults to { start:540 (9am), end:1020 (5pm) }
	@options - (optional) jquery-ui slider options --> defaults to { range: true, min:0, max:1440, step:15 }

*/
UTILS.Timerange =  class extends UTILS.Base {
	init(data){
		this.parent(data);
		_log(this.getObjectName()+' --> instantiated!',this.getId(),this);

		if (!('target' in data))
			throw new Error('@target must be specified upon initialization!');

		if (_.isPlainObject(data)){
			('options' in data) && this.setOptions(data.options);
			('range' in data) && this.setRange(data.range);
			('date_editable' in data) && this.setDateEditableState(data.date_editable);
			('date_format' in data) && this.setDateFormat(data.date_format);
			('allow_past_dates' in data) && this.setAllowPassedDates(data.allow_past_dates);
			('date' in data) && this.setDate(data.date);
			('onShow' in data) && this.addCallback('onShow',data.onShow);
			('onHide' in data) && this.addCallback('onHide',data.onHide);
			('onStart' in data) && this.addCallback('onStart',data.onStart);
			('onStop' in data) && this.addCallback('onStop',data.onStop);
			('onSlide' in data) && this.addCallback('onSlide',data.onSlide);
		}

		this._initSlider();

		return this;
	}
	getDefaults(){
		return {
			object:'utils.timerange',
			version:'0.0.7',
			$wrapper: null, //holds the timer wrapper
			is_shown: false, //holds whether the timerange is shown
			date: moment(), //holds the date
			is_date_editable: true, //holds whether the date is editable
			date_format: 'MM/DD/YYYY', //holds the date format
			allow_past_dates: false,
			EditableDate: null, //holds the editable date object
			range: {
				start:540, //9am
				end:1020 //5pm
			},
			settings: { //holds the jquery-ui slider options
				range: true,
				min: 0,
				max: 1440, //mins in 24 hrs
				step: 15
			}
		};
	}
	clean(){
		this.values.$wrapper.remove();
		return this;
	}
	_create(){
		if (!this.values.$wrapper){
			this.values.$wrapper = $('<div class="app-timerange hide">'+
				'<div class="slider-header">'+
				'<div class="slider-header-date">Date: <span></span></div>'+
				'<div class="slider-header-timerange">Time: <span class="slider-start"></span> - <span class="slider-end"></span></div>'+
				'</div>'+
				'<div class="slider-range"></div>'+
				'</div>');

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
	getWrapper(){
		return this.values.$wrapper;
	}
	// @lever is the slider nob location --> start | end
	_formatDisplayTime(total_mins){
		var hrs = Math.floor(total_mins/60),
			mins = total_mins - (hrs*60);

		if (hrs.length===1)
			hrs = '0' + hrs;

		if (mins.length===1)
			mins = '0' + mins;

		if (mins==0)
			mins = '00';

		if (hrs>=12){
			if (hrs==12)
				mins += ' PM';
			else if (hrs==24){
				hrs = 11;
				mins = '59 PM';
			}
			else {
				hrs = hrs - 12;
				mins += ' PM';
			}
		}
		else
			mins += ' AM';

		if (hrs==0)
			hrs = 12;

		return hrs+':'+mins;
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
					date_options: {
						format: date_format,
						startDate: allow_passed_dates ? 0 : '+0d' //starts today
					},
					value: date.format(date_format),
					onAfterSave: function(Editable){
						this.setDate(Editable.getValue());
						this._fns('onStop');
					}.bind(this)
				};
				EditableDate = new APP.Editable(editable_options).enable();
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
		this.parent(target);
		this.values.$target.append(this._create());
		return this;
	}
	_initSlider(){
		var $wrapper = this.getWrapper(),
			range = this.getTimeRange(),
			$slider = $wrapper.find('.slider-range');

		//lets update the final options
		this.setOptions({
			slide: this._onSlide,
			start: this._onStart,
			stop: this._onStop,
			values:[range.start,range.end],
			tickInterval: 60,
			tickLabels: function(interval){
				var hrs = Math.floor(interval/60),
					a = 'PM'

				if (hrs>=12){
					if (hrs===24)
						hrs = 12;
					else
						hrs -= 12;
				}
				else
					a = 'AM';

				if (hrs===0)
					hrs = 12;

				return hrs+' '+a;
			}
		});

		//lets init the slider
		$slider.labeledslider(this.getOptions());

		return this;
	}
	getOptions(){
		return this.values.settings;
	}
	setOptions(options){
		if (_.isPlainObject(options))
			_.extend(this.values.settings,options);

		return this.values.settings;
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
		return _.assign({},this.values.range,{ date:this.getDate() });
	}
	getFormattedDateTimeRange(){
		var formatted_range = this.getFormattedTimeRange(),
			date = this.getDate(),
			date_format = this.getDateFormat();

		return _.assign({}, formatted_range, { date:date.format(date_format)});
	}
	_getHoursMinsFromTotalMins(total_mins){
		return {
			hrs: Math.floor(total_mins/60),
			mins: total_mins % 60
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
	//if the minutes are not matching the interval, we need to round them to the nearest interval
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
		this._fns('onShow');
		this.values.is_shown = true;

		return this;
	}
	hide(){
		var $wrapper = this.getWrapper();
		this._fns('onHide');
		$wrapper.addClass('hide');
		this.values.is_shown = false;

		return this;
	}
	_onSlide(event,ui){
		var mins1 = ui.values[0], //total mins out of 24 hrs
			mins2 = ui.values[1];

		//lets update the range
		this.setRange({ start:mins1, end:mins2 });
		//lets update the display
		this.updateTimeDisplay();
		this._fns('onSlide');
	}
	_onStart(event,ui){

		this._fns('onStart');
	}
	_onStop(event,ui){

		this._fns('onStop');
	}
};

// Export node module.
if ( typeof module !== 'undefined' && module.hasOwnProperty('exports') ){
	module.exports = UTILS.Timerange;
}