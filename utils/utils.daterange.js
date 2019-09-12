/*
    == UTILS.Daterange ==

	Originally inspired by jquery.daterangepicker.js by Chunlong Liu ( www.jszen.com ), MIT License

	Unfortunately the date range picker did not have all the features needed for the project, hence utils.daterange.js was born

	ex. var timerange = new UTILS.Daterange({ target:$('#time-range-field') });
*/
UTILS.Daterange =  class extends UTILS.Base {
	constructor(data={}){
		super(data);

		_log(this.getObjectName()+' --> instantiated!');

		if (!('target' in data))
			throw new Error('@target must be specified upon initialization!');

		('range' in data) && this.setDateRange(data.range);
		('start' in data) && this.setStart(data.start);
		('end' in data) && this.setEnd(data.end);
		('container' in data) && this.setContainer(data.container);
		('value' in data) && this.setInitialTargetValue(data.value);
		('onShow' in data) && this.addCallback('onShow',data.onShow);
		('onShown' in data) && this.addCallback('onShown',data.onShown);
		('onHide' in data) && this.addCallback('onHide',data.onHide);
		('onHidden' in data) && this.addCallback('onHidden',data.onHidden);
		('onStartSelected' in data) && this.addCallback('onStartSelected',data.onStartSelected);
		('onEndSelected' in data) && this.addCallback('onEndSelected',data.onEndSelected);
		('onApply' in data) && this.addCallback('onApply',data.onApply);
		('onDateChanged' in data) && this.addCallback('onDateChanged',data.onDateChanged);
		
		this._init();

		//need to adjust auto_close value as it might have been overwritten by _init()
		if ('auto_close' in data)
			this.values.auto_close = data.auto_close;

		return this;
	}
	getDefaults(){
		return {
			object: 'utils.daterange',
			version: '0.0.4',
			date_format: 'MM/DD/YYYY',
			$elm: null, //holds the date range element
			auto_close: false,
			separator: ' - ',
			language: 'en',
			start_of_week: 'sunday', // or monday (isoWeek)
			start_date: false,
			end_date: false,
			time: {
				enabled: false
			},
			min_days: 0,
			max_days: 0,
			min_months: 0, //only works in min_view_mode: 'months'
			max_months: 0,
			min_years: 0, //only works in min_view_mode: 'years'
			max_years: 0,
			show_shortcuts: false,
			shortcuts: [],
			$container: $('body'),
			single_date: false,
			look_behind: false,
			batch_mode: false,
			duration: 200,
			sticky: false,
			day_div_attributes: [],
			day_td_attributes: [],
			select_forward: false,
			select_backward: false,
			single_month: $(window).width() < 480,
			show_topbar: false,
			swap_time: false,
			show_week_numbers: false,
			min_view_mode: 'days', //can be months|years
			view: {
				month1: 'days', //can be months|years
				month2: 'days'
			},
			start: false,
			end: false,
			start_week: false,
			is_activated: false,
			show_tooltip: true,
			is_editable_usage: false //only true if used by UTILS.Editable
		};
	}
	_init(){
		//if it is a touch device, hide hovering tooltip
		if (this.isMobile())
			this.values.show_tooltip = false;

		if (this.values.single_month)
			this.values.sticky = false;

		if (!this.isShowTopbar())
			this.values.auto_close = true;

		//lets create the DOM
		this._create().then($elm => {
			let date_format = this.getDateFormat(),
				$target = this.getTarget();

			this.enableControls();

			if (this.values.start_date && typeof this.values.start_date == 'string')
				this.values.start_date = moment(this.values.start_date, date_format).toDate();

			if (this.values.end_date && typeof this.values.end_date == 'string')
				this.values.end_date = moment(this.values.end_date, date_format).toDate();

			this.calcPosition();

			var default_date = this.getDefaultDate();

			this.resetMonthsView(default_date);

			if (this.values.time.enabled){
				if ((this.values.start_date && this.values.end_date) || (this.getStart() && this.getEnd())){
					this.showTime(moment(this.getStart() || this.values.start_date).toDate(), 'time1');
					this.showTime(moment(this.getEnd() || this.values.end_date).toDate(), 'time2');
				}
				else {
					var defaultEndTime = this.values.defaultEndTime ? this.values.defaultEndTime : default_date;
					this.showTime(default_date, 'time1');
					this.showTime(defaultEndTime, 'time2');
				}
			}

			if (this.values.single_month)
				$elm.addClass('single-month');
			else
				$elm.addClass('two-months');

			setTimeout(() => {
				this.updateCalendarWidth();
				this.setActivated(true);
			}, 0);

			$elm.on('click',event => event.stopPropagation());

			//if user click other place of the webpage, close date range picker window
			$(document).on('click.utils.daterange', this.outsideClickClose.bind(this));

			$elm.find('.next').on('click',this.goNext.bind(this));
			$elm.find('.prev').on('click',this.goPrev.bind(this));

			$elm.find('.caption-title').on('click',event => {
				var $table = $(event.currentTarget).closest('table'),
					month = $table.hasClass('month2') ? 'month2' : 'month1',
					curr_date = this.values[month];

				if (/^days$/i.test(this.values.view[month]))
					this.values.view[month] = 'months';
				else if (/^months$/i.test(this.values.view[month]))
					this.values.view[month] = 'years';

				//lets update the header
				$table.attr('data-view',this.values.view[month]);

				this.renderCalendar(curr_date,month);
			});

			$elm.find('.month-wrapper table').on('click','.cell',this.onDateChanged.bind(this));

			$elm.find('.month-wrapper table').on('mouseenter','.cell',this.onCellHover.bind(this));

			$elm.find('.month-wrapper table').on('mouseleave','.cell',event => {
				$elm.find('.date-range-length-tip').remove();

				if (this.isSingleDate())
					this.clearOnCellHover();
			});

			$elm.find('.month-wrapper table').on('click','.week-number',this.weekNumberClicked.bind(this));

			$elm.attr('unselectable', 'on')
				.css('user-select', 'none')
				.on('selectstart', event => {
					event.preventDefault();
					return false;
				});

			$elm.find('.apply-btn').on('click',event => {
				this.hide();
				this.triggerApply();
			});

			$elm.find('.shortcuts').on('click','.shortcut', event => {
				event.preventDefault();

				let $shortcut = $(event.currentTarget),
					shortcut = $shortcut.data('shortcut'),
					range = ('method' in shortcut) ? { ...shortcut.method(this) } : { start:null, end:null },
					is_autoclose = this.isAutoClose();

				if (this.isDate(range.start) && this.isDate(range.end)){
					this.setDateRange(range.start, range.end);
					this.validateSelection();
				}
				//this happens when the user clicked on the custom shortcut that did not produce a date object
				else if (this.values.show_shortcuts && (!this.isDate(range.start) || !this.isDate(range.end))){
					$elm.find('.cell.checked').removeClass('checked');

					if ('start' in range && 'end' in range)
						this.triggerApply(range);
					else {
						if (!_.isString(range))
							range = _.toArray(range).join('');

						this.setTargetValue(range);
					}

					this.setStart(null);
					this.setEnd(null);
					this.validateSelection();
					this.updateSelectionInHeader(true);
					this.showSelectedDates();

					this.fns('onEndSelected');

					if (is_autoclose)
						this.hide();
				}
				else if (this.isDate(range.start)){
					this.renderCalendar(range.start, 'month1');
					this.renderCalendar(this.nextMonth(range.start), 'month2');
					this.showDivider();
				}
			});

			$elm.find('.time1 input[type=range]').on('input change touchmove', event => {
				var target = event.currentTarget,
					hour = target.name == 'hour' ? $(target).val().replace(/^(\d{1})$/, '0$1') : undefined,
					min = target.name == 'minute' ? $(target).val().replace(/^(\d{1})$/, '0$1') : undefined;

				this.setTime('time1', hour, min);
			});

			$elm.find('.time2 input[type=range]').on('input change touchmove', event => {
				var target = event.currentTarget,
					hour = target.name == 'hour' ? $(target).val().replace(/^(\d{1})$/, '0$1') : undefined,
					min = target.name == 'minute' ? $(target).val().replace(/^(\d{1})$/, '0$1') : undefined;

				this.setTime('time2', hour, min);
			});

			if ($target.data('utils.daterange-opened'))
				this.hide();
			else
				$target.data('utils.daterange-opened', true);
		});

		return this;
	}
	//checks if mobile device
	isMobile(){
		return !!('ontouchstart' in window || navigator.msMaxTouchPoints);
	}
	isActivated(){
		return this.values.is_activated;
	}
	setActivated(state){
		this.values.is_activated = !!(state);
		return this;
	}
	enable(){
		return this.enableControls();
	}
	disable(){
		return this.disableControls();
	}
	getStartOfWeek(){
		return this.values.start_of_week;
	}
	enableControls(){
		let $target = this.getTarget(),
			$elm = this.getElm();

		$target
			.addClass('utils-daterange')
			.off('.utils.daterange')
			.on('click.utils.daterange', event => {
				var is_open = $elm.is(':visible');

				if (!is_open)
					this.show(this.values.duration);
			})
			.on('change.utils.daterange', this.checkAndSetDefaultValue.bind(this))
			.on('keyup.utils.daterange', event => {
				try {
					clearTimeout(this.values.dom_change_timer);
				}
				catch (e){}

				this.values.dom_change_timer = setTimeout(this.checkAndSetDefaultValue.bind(this), 2000);
			});

		$(window).on('resize.utils.daterange', this.calcPosition.bind(this));
		return this;
	}
	disableControls(){
		let $target = this.getTarget(),
			$elm = this.getElm();

		$target
			.removeClass('utils-daterange')
			.off('.utils.daterange')
			.removeData('dateRangePicker')
			.removeData('utils.daterange-opened');

		$elm.remove();
		
		$(window).off('resize.utils.daterange', this.calcPosition.bind(this));
		$(document).off('click.utils.daterange', this.outsideClickClose.bind(this));
		return this;
	}
	clean(){
		this.disableControls();
		this.values.$elm.remove();
		return this;
	}
	isShowTopbar(){
		return this.values.show_topbar;
	}
	_create(){
		return new Promise((resolve,reject) => {
			if (this.values.$elm)
				resolve(this.values.$elm)
			else {
				var $container = this.getContainer(),
					is_show_topbar = this.isShowTopbar(),
					is_autoclose = this.isAutoClose(),
					is_single_date = this.isSingleDate(),
					wrapper_class = [];

				if (this.values.extra_class)
					wrapper_class.push(this.values.extra_class);

				if (is_single_date)
					wrapper_class.push('single-date');

				if (!this.values.show_shortcuts)
					wrapper_class.push('no-shortcuts');

				if (!is_show_topbar)
					wrapper_class.push('no-topbar');

				if (this.values.custom_topbar)
					wrapper_class.push('custom-topbar');

				this.values.$elm = $(`<div class="date-picker-wrapper date-picker-wrapper-orient-left date-picker-wrapper-orient-bottom ${wrapper_class.join(' ')}" data-min-view-mode="${this.values.min_view_mode}"></div>`).hide();

				let $topbar = null;

				if (is_show_topbar){
					$topbar = $('<div class="drp_top-bar"></div>');

					if (this.values.custom_topbar){
						if (typeof this.values.custom_topbar==='function')
							this.values.custom_topbar = this.values.custom_topbar();

						$topbar.append('<div class="custom-top">'+this.values.custom_topbar+'</div>');
					}
					else {
						let $normal_top = $('<div class="normal-top"><span class="selection-top">'+this.translate('selected')+' </span><b class="start-day">...</b></div>');

						if (!is_single_date)
							$normal_top.append('<span class="separator-day">'+this.values.separator+'</span> <b class="end-day">...</b> <i class="selected-days">(<span class="selected-days-num">3</span> '+this.translate('days')+')</i>');

						$topbar.append($normal_top);
					}

					$topbar.append('<button class="apply-btn btn btn-primary btn-sm disabled '+(is_autoclose ? 'hide' :'')+'">'+this.translate('apply')+'</button>');
				}

				let _colspan = this.values.show_week_numbers ? 6 : 5,
					$month_wrapper = $(`<div class="month-wrapper ${is_single_date ? 'is-single-date' : ''}" data-sticky="${this.values.sticky ? 'yes' : 'no'}"></div>`),
					$month1 = $(`<table class="month1" cellspacing="0" border="0" cellpadding="0" data-view="${this.values.min_view_mode}">
									<thead>
										<tr class="caption">
											<th><span class="prev"></span></th>
											<th colspan="${_colspan}" class="month-name"><span class="caption-title"></span></th>
											<th><span class="next"></span></th>
										</tr>
										<tr class="week-name">${this.getWeekHead()}</tr>
									</thead>
									<tbody></tbody>
								</table>`),
					$month2 = null;

				if (this.hasMonth2()){
					$month2 = $(`<div class="gap">${this.getGapHTML()}</div>
									<table class="month2" cellspacing="0" border="0" cellpadding="0" data-view="${this.values.min_view_mode}">
										<thead>
											<tr class="caption">
												<th><span class="prev"></span></th>
												<th colspan="${_colspan}" class="month-name"><span class="caption-title"></span></th>
												<th><span class="next"></span></th>
											</tr>
											<tr class="week-name">${this.getWeekHead()}</tr>
										</thead>
										<tbody></tbody>
									</table>`);
				}

				$month_wrapper.append([$month1,$month2]);

				let $time = $(`<div class="time ${!this.values.time.enabled ? 'hide' : ''}"><div class="time1"></div></div>`);

				if (!is_single_date)
					$time.append('<div class="time2"></div>');

				let $footer = $('<div class="footer"></div>');

				if (this.values.show_shortcuts){
					let $shortcuts = $('<div class="shortcuts"><b>'+this.translate('shortcuts')+'</b></div>'),
						shortcuts = [];

					_.each(this.values.shortcuts, shortcut => {
						var $shortcut = $('<a class="shortcut" href="#">'+shortcut.name+'</a>').data('shortcut',shortcut);

						if ('css' in shortcut)
							$shortcut.addClass(shortcut.css);

						shortcuts.push($shortcut);
					});

					$footer.append($shortcuts.append(shortcuts));
				}

				this.values.$elm.append([$topbar,$month_wrapper,$time,$footer]);

				this.values.$elm.data('$daterange',this);

				$container.append(this.values.$elm);

				resolve(this.values.$elm);
			}
		});
	}
	getDateFormat(){
		return this.values.date_format;
	}
	setDateFormat(format){
		this.values.date_format = format;
		return this;
	}
	setStart(date){
		if (this.isDate(date)){
			if (_.isString(date))
				date = moment(date, this.getDateFormat()).valueOf();
			else
				date = moment(date).valueOf();
		}

		this.values.start = date;

		return this;
	}
	setEnd(date){
		if (this.isDate(date)){
			if (_.isString(date))
				date = moment(date, this.getDateFormat()).valueOf();
			else
				date = moment(date).valueOf();
		}

		this.values.end = date;

		return this;
	}
	getStart(){
		return this.values.start;
	}
	getEnd(){
		return this.values.end;
	}
	getContainer(){
		return this.values.$container;
	}
	setContainer(container){
		this.values.$container = (container instanceof UTILS.Box) ? container.getMainbody() : $(container);
		return this;
	}
	getTargetValue(){
		var $target = this.getTarget(),
			_value = $target.is(':input') ? $target.val() : $target.text();

		return _value;
	}
	setTargetValue(value){
		let $target = this.getTarget(),
			method = $target.is(':input') ? 'val' : 'text',
			old_value = $target[method]();

		if (!$target.attr('readonly') && !$target.is(':disabled') && value!=old_value)
			$target[method](value);

		return this;
	}
	hoveringTooltip(days){
		return days > 1 ? days + ' ' + this.translate(this.values.min_view_mode) : '';
	}
	getWeekNumber(date){ //date will be the first day of a week
		return moment(date).format('w');
	}
	isOwnDatePickerClicked(event, target){
		return (target.contains(event.target) || event.target == target || (target.childNodes != undefined && $.inArray(event.target, target.childNodes) >= 0));
	}

	goNext(event){
		let { $cell, $table, month, view } = this.getEventData(event),
			curr_date = this.values[month],
			is_single_date = this.isSingleDate();

		switch(view){
			case 'days':
				if (!this.values.sticky){
					curr_date = this.nextMonth(curr_date);

					if (!this.values.single_month && !is_single_date && !/month2/.test(month) && this.compareMonth(curr_date, this.values.month2) >= 0 || this.isDateOutOfBounds(curr_date))
						return;

					this.renderCalendar(curr_date, month);
				}
				else {
					let date1 = this.nextMonth(this.values.month1),
						date2 = this.nextMonth(this.values.month2);

					//lets check if the second date is greater than first by more than one month
					if (moment(this.values.month2).diff(moment(this.values.month1,'month'))>1){
						if (/month1/.test(month))
							date2 = this.nextMonth(date1);
						else
							date1 = this.prevMonth(date2);
					}

					if (this.isDateOutOfBounds(date2) || !is_single_date && this.compareMonth(date1, date2) >= 0)
						return;

					this.renderCalendar(date1, 'month1');
					this.renderCalendar(date2, 'month2');

					this.showSelectedDates();
				}
				break;
			case 'months':
				if (!this.values.sticky){
					curr_date = this.nextYear(curr_date);

					if (!this.values.single_month && !is_single_date && !/month2/.test(month) && this.compareYear(curr_date, this.values.month2) >= 0 || this.isDateOutOfBounds(curr_date))
						return;

					this.renderCalendar(curr_date, month);

					this.showDivider();
				}
				else {
					let date1 = this.nextYear(this.values.month1),
						date2 = this.nextYear(this.values.month2);

					//lets check if the second date is greater than first by more than one year
					if (moment(this.values.month2).diff(moment(this.values.month1,'year'))>1){
						if (/month1/.test(month))
							date2 = this.nextYear(date1);
						else
							date1 = this.prevYear(date2);
					}

					if (this.isDateOutOfBounds(date2) || !is_single_date && this.compareYear(date1, date2) >= 0)
						return;

					this.renderCalendar(date1, 'month1');
					this.renderCalendar(date2, 'month2');

					this.showSelectedDates();
				}
				break;
			case 'years':
				if (!this.values.sticky){
					curr_date = this.nextDecade(curr_date);

					if (/month2/.test(month) && this.compareDecade(curr_date, this.values.month1) <= 0 || this.isDateOutOfBounds(curr_date))
						return;

					this.renderCalendar(curr_date, month);
				}
				else {
					let date1 = this.nextDecade(this.values.month1),
						date2 = this.nextDecade(this.values.month2);

					//lets check if the second date is greater than first by more than one year
					if (moment(this.values.month2).diff(moment(this.values.month1,'year'))>10){
						if (/month1/.test(month))
							date2 = this.nextDecade(date1);
						else
							date1 = this.prevDecade(date2);
					}

					if (this.isDateOutOfBounds(date1) || !is_single_date && this.compareYear(date2, date1)<=0)
						return;

					this.renderCalendar(date2, 'month2');
					this.renderCalendar(date1, 'month1');

					this.showSelectedDates();
				}
				break;
		}

		this.showDivider();

		return this;
	}

	goPrev(event){
		let { $cell, $table, month, view } = this.getEventData(event),
			curr_date = this.values[month],
			is_single_date = this.isSingleDate();

		switch(view){
			case 'days':
				if (!this.values.sticky){
					curr_date = this.prevMonth(curr_date);

					if (/month2/.test(month) && this.compareMonth(curr_date, this.values.month1) <= 0 || this.isDateOutOfBounds(curr_date))
						return;

					this.renderCalendar(curr_date, month);
				}
				else {
					let date1 = this.prevMonth(this.values.month1),
						date2 = this.prevMonth(this.values.month2);

					//lets check if the second date is greater than first by more than one month
					if (moment(this.values.month2).diff(moment(this.values.month1,'month'))>1){
						if (/month1/.test(month))
							date2 = this.nextMonth(date1);
						else
							date1 = this.prevMonth(date2);
					}

					if (this.isDateOutOfBounds(date1) || !is_single_date && this.compareMonth(date2, date1) <= 0)
						return;

					this.renderCalendar(date2, 'month2');
					this.renderCalendar(date1, 'month1');

					this.showSelectedDates();
				}
				break;
			case 'months':
				if (!this.values.sticky){
					curr_date = this.prevYear(curr_date);

					if (/month2/.test(month) && this.compareYear(curr_date, this.values.month1) <= 0 || this.isDateOutOfBounds(curr_date))
						return;

					this.renderCalendar(curr_date, month);
				}
				else {
					let date1 = this.prevYear(this.values.month1),
						date2 = this.prevYear(this.values.month2);

					//lets check if the second date is greater than first by more than one year
					if (moment(this.values.month2).diff(moment(this.values.month1,'year'))>1){
						if (/month1/.test(month))
							date2 = this.nextYear(date1);
						else
							date1 = this.prevYear(date2);
					}

					if (this.isDateOutOfBounds(date1) || !is_single_date && this.compareYear(date2, date1)<=0)
						return;

					this.renderCalendar(date2, 'month2');
					this.renderCalendar(date1, 'month1');

					this.showSelectedDates();
				}
				break;
			case 'years':
				if (!this.values.sticky){
					curr_date = this.prevDecade(curr_date);

					if (/month2/.test(month) && this.compareDecade(curr_date, this.values.month1) <= 0 || this.isDateOutOfBounds(curr_date))
						return;

					this.renderCalendar(curr_date, month);
				}
				else {
					let date1 = this.prevDecade(this.values.month1),
						date2 = this.prevDecade(this.values.month2);

					//lets check if the second date is greater than first by more than one year
					if (moment(this.values.month2).diff(moment(this.values.month1,'year'))>10){
						if (/month1/.test(month))
							date2 = this.nextDecade(date1);
						else
							date1 = this.prevDecade(date2);
					}

					if (this.isDateOutOfBounds(date1) || !is_single_date && this.compareYear(date2, date1)<=0)
						return;

					this.renderCalendar(date2, 'month2');
					this.renderCalendar(date1, 'month1');

					this.showSelectedDates();
				}
				break;
		}

		this.showDivider();

		return this;
	}

	calcPosition(){
		var $elm = this.getElm(),
			$target = this.getTarget(),
			$container = this.getContainer(),
			offset = $target.offset();

		if ($container.css('position')==='relative'){
			var container_offset = $container.offset(),
				leftIndent = Math.max(0, offset.left + $elm.outerWidth() - $('body').width() + 16);

			$elm.css({
				top: offset.top - container_offset.top + $target.outerHeight() + 4,
				left: offset.left - container_offset.left - leftIndent
			});
		}
		else {
			if (offset.left < 460){ //left to right
				$elm.css({
					top: offset.top + $target.outerHeight() + parseInt($('body').css('border-top') || 0, 10),
					left: offset.left
				});
			}
			else {
				$elm.css({
					top: offset.top + $target.outerHeight() + parseInt($('body').css('border-top') || 0, 10),
					left: offset.left + $target.width() - $elm.width() - 16
				});
			}
		}

		return this;
	}

	getElm(){
		return this.values.$elm;
	}

	show(){
		let $target = this.getTarget(),
			$elm = this.getElm();

		this.redrawDatePicker();
		this.checkAndSetDefaultValue();

		this.fns('onShow');

		$elm.fadeIn(300, () => {
			this.fns('onShown');
		});

		this.showDivider();
		this.updateCalendarWidth();
		this.calcPosition();

		return this;
	}

	hide(){
		var $elm = this.getElm(),
			$target = this.getTarget();

		this.fns('onHide');

		$elm.fadeOut(this.values.duration, () => {
			this.fns('onHidden');
			$target.data('utils.daterange-opened', false)
		});

		return this;
	}
	setInitialTargetValue(value){
		let dates = value ? value.split(this.values.separator) : '',
			date_format = this.getDateFormat(),
			is_single_date = this.isSingleDate(),
			dates_as_string = '';

		if (dates && ((dates.length===1 && is_single_date) || dates.length>=2)){
			if (date_format.match(/Do/)){
				date_format = date_format.replace(/Do/, 'D');
				dates[0] = dates[0].replace(/(\d+)(th|nd|st)/, '$1');

				if (dates.length>= 2)
					dates[1] = dates[1].replace(/(\d+)(th|nd|st)/, '$1');
			}

			if (dates.length>=2)
				dates_as_string = this.getDateString(new Date(this.getValidValue(dates[0], date_format, moment.locale(this.values.language)))) + this.values.separator +this.getDateString(new Date(this.getValidValue(dates[1], date_format, moment.locale(this.values.language))));
			else if (dates.length===1 && is_single_date)
				dates_as_string = this.getDateString(new Date(this.getValidValue(dates[0], date_format, moment.locale(this.values.language))));

			this.setTargetValue(dates_as_string);
		}

		return this;
	}
	checkAndSetDefaultValue(){
		let target_value = this.getTargetValue(),
			defaults = target_value ? target_value.split(this.values.separator) : '',
			date_format = this.getDateFormat(),
			is_single_date = this.isSingleDate();

		if (defaults && ((defaults.length == 1 && is_single_date) || defaults.length >= 2)){
			if (date_format.match(/Do/)){
				date_format = date_format.replace(/Do/, 'D');
				defaults[0] = defaults[0].replace(/(\d+)(th|nd|st)/, '$1');

				if (defaults.length >= 2)
					defaults[1] = defaults[1].replace(/(\d+)(th|nd|st)/, '$1');
			}

			//set is_activated  to avoid triggerring datepicker-change event
			this.setActivated(false);

			if (defaults.length>=2)
				this.setDateRange(this.getValidValue(defaults[0], date_format, moment.locale(this.values.language)), this.getValidValue(defaults[1], date_format, moment.locale(this.values.language)));
			else if (defaults.length===1 && is_single_date)
				this.setSingleDate(this.getValidValue(defaults[0], date_format, moment.locale(this.values.language)));

			this.setActivated(true);
		}

		return this;
	}

	getValidValue(date, format, locale){
		if (moment(date, format, locale).isValid())
			return moment(date, format, locale).toDate();
		else
			return moment().toDate();
	}

	updateCalendarWidth(){
		var $elm = this.getElm(),
			gapMargin = $elm.find('.gap').css('margin-left');

		if (gapMargin)
			gapMargin = parseInt(gapMargin);

		var w1 = $elm.find('.month1').width();
		var w2 = $elm.find('.gap').width() + (gapMargin ? gapMargin * 2 : 0);
		var w3 = $elm.find('.month2').width();
		$elm.find('.month-wrapper').width(w1 + w2 + w3);

		return this;
	}

	renderTime(name, date){
		let $elm = this.getElm();

		$elm.find('.' + name + ' input[type=range].hour-range').val(moment(date).hours());
		$elm.find('.' + name + ' input[type=range].minute-range').val(moment(date).minutes());

		this.setTime(name, moment(date).format('HH'), moment(date).format('mm'));

		return this;
	}

	changeTime(name, date){
		this.values[name] = parseInt(
			moment(parseInt(date))
				.startOf('day')
				.add(moment(this.values[name + 'Time']).format('HH'), 'h')
				.add(moment(this.values[name + 'Time']).format('mm'), 'm').valueOf()
		);

		return this;
	}

	swapTime(){
		this.renderTime('time1', this.getStart());
		this.renderTime('time2', this.getEnd());

		return this;
	}

	setTime(name, hour, minute){
		let $elm = this.getElm(),
			start = this.getStart();

		hour && ($elm.find('.' + name + ' .hour-val').text(hour));
		minute && ($elm.find('.' + name + ' .minute-val').text(minute));

		switch (name){
			case 'time1':
				if (start)
					_setRange('start', moment(start));

				_setRange('startTime', moment(this.values.startTime || moment().valueOf()));
				break;
			case 'time2':
				if (this.values.end)
					_setRange('end', moment(this.values.end));

				_setRange('endTime', moment(this.values.endTime || moment().valueOf()));
				break;
		}

		var _setRange = (name, timePoint) => {
			var h = timePoint.format('HH'),
				m = timePoint.format('mm');

			this.values[name] = timePoint
				.startOf('day')
				.add(hour || h, 'h')
				.add(minute || m, 'm')
				.valueOf();
		};

		this.validateSelection();
		this.updateSelectionInHeader();
		this.showSelectedDates();

		return this;
	}

	clearSelection(){
		let $elm = this.getElm();

		this.setStart(null);
		this.setEnd(null);

		$elm.find('.checked').removeClass('checked');
		$elm.find('.last-date-selected').removeClass('last-date-selected');
		$elm.find('.first-date-selected').removeClass('first-date-selected');
		this.setTargetValue('');

		this.validateSelection();
		this.updateSelectionInHeader();
		this.showSelectedDates();

		return this;
	}

	handleStart(time){
		let is_isoweek = this.isIsoWeek(),
			r = time;

		if (this.values.batch_mode==='week-range'){
			if (is_isoweek)
				r = moment(parseInt(time)).startOf('isoweek').valueOf();
			else
				r = moment(parseInt(time)).startOf('week').valueOf();
		}
		else if (this.values.batch_mode==='month-range')
			r = moment(parseInt(time)).startOf('month').valueOf();

		return r;
	}

	handleEnd(time){
		let is_isoweek = this.isIsoWeek(),
			r = time;

		if (this.values.batch_mode==='week-range'){
			if (is_isoweek)
				r = moment(parseInt(time)).endOf('isoweek').valueOf();
			else
				r = moment(parseInt(time)).endOf('week').valueOf();
		}
		else if (this.values.batch_mode==='month-range')
			r = moment(parseInt(time)).endOf('month').valueOf();

		return r;
	}

	isEditableUsage(){
		return this.values.is_editable_usage;
	}

	getCurrentView(month){
		return this.values.view[month];
	}

	setCurrentView(month,view){
		this.values.view[month] = view;
		return this;
	}

	onDateChanged(event){
		let $target = this.getTarget(),
			{ $cell, $table, month, view } = this.getEventData(event),
			time = moment(parseInt($cell.attr('data-value'))),
			is_autoclose = this.isAutoClose(),
			is_isoweek = this.isIsoWeek(),
			is_editable_usage = this.isEditableUsage(),
			is_single_date = this.isSingleDate(),
			start = this.getStart(),
			end = this.getEnd();

		if ($cell.hasClass('invalid'))
			return;

		$cell.addClass('checked');

		this.clearOnCellHover();

		if (is_single_date){
			start = time.valueOf();
			end = null;
		}

		switch(true){
			case /days/.test(view):
				if (this.values.batch_mode==='week'){
					if (is_isoweek){
						start = time.startOf('isoweek').valueOf();
						end = time.endOf('isoweek').valueOf();
					}
					else {
						end = time.endOf('week').valueOf();
						start = time.startOf('week').valueOf();
					}
				}
				else if (this.values.batch_mode==='workweek'){
					start = time.day(1).valueOf();
					end = time.day(5).valueOf();
				}
				else if (this.values.batch_mode==='weekend'){
					start = time.day(6).valueOf();
					end = time.day(7).valueOf();
				}
				else if (this.values.batch_mode==='month'){
					start = time.startOf('month').valueOf();
					end = time.endOf('month').valueOf();
				}
				else if ((start && end) || (!start && !end)){
					start = this.handleStart(time.valueOf());
					end = null;
				}
				else if (start){
					end = this.handleEnd(time.valueOf());

					if (this.values.time.enabled)
						this.changeTime('end', end);
				}

				//Update time in case it is enabled and timestamps are available
				if (this.values.time.enabled){
					if (start)
						this.changeTime('start', start);

					if (end)
						this.changeTime('end', end);
				}

				//In case the start is after the end, swap the timestamps
				if (!is_single_date && start && end && start > end){
					var tmp = end;
					end = this.handleEnd(start);
					start = this.handleStart(tmp);

					if (this.values.time.enabled && this.values.swap_time)
						this.swapTime();
				}

			break;
			case /^months$|^years$/.test(view):
				var opposite_month = /month1/.test(month) ? 'month2' : 'month1',
					start_date = this.values.start_date ? this._getMomentDate(this.values.start_date) : false,
					end_date = this.values.end_date ? this._getMomentDate(this.values.end_date) : false,
					unit = view;

				if (/^months$/.test(view))
					this.setCurrentView(month,/^months$/i.test(this.values.min_view_mode) ? 'months' : 'days');
				else
					this.setCurrentView(month,/^years$/i.test(this.values.min_view_mode) ? 'years' : 'months');

				if (/^months$|^years$/i.test(this.values.min_view_mode)){
					time.startOf(unit);

					if (view===this.values.min_view_mode){
						if ((start && end) || (!start && !end)){
							start = time.valueOf();
							end = false;
						}
						else if (start)
							end = time.valueOf();

						//if start is after the end
						if (!is_single_date && start && end && start > end){
							var tmp = end;
							end = start;
							start = tmp;
						}
					}
				}

				if (start_date && time.isSameOrBefore(start_date))
					time = start_date.add(month === 'month2' ? 1 : 0, unit);

				if (end_date && time.isSameOrAfter(end_date))
					time = end_date.add(!this.values.single_month && month === 'month1' ? -1 : 0, unit);

				this.renderCalendar(time.toDate(), month);

				if (/month1/.test(month)){
					if (this.values.sticky || time.isSameOrAfter(this.values[opposite_month], unit)){
						var _unit = /^months$|^years$/.test(this.values.min_view_mode) ? 'years' : 'months',
							_count = /days|months/.test(this.values.min_view_mode) ? 1 : 10;

						this.renderCalendar(time.add(_count, _unit), opposite_month);
					}
				}
				else {
					if (this.values.sticky || time.isSameOrBefore(this.values[opposite_month], unit)){
						var _unit = /^months$|^years$/.test(this.values.min_view_mode) ? 'years' : 'months',
							_count = /days|months/.test(this.values.min_view_mode) ? -1 : -10;

						this.renderCalendar(time.add(_count, _unit), opposite_month);
					}
				}
			break;
		}

		this.setStart(start);
		this.setEnd(end);

		if (start && !end){
			this.fns('onStartSelected',{ start:new Date(start) });

			this.onCellHover(event);
		}
		else if (start && end)
			this.fns('onEndSelected',{ start:new Date(start), end:new Date(end) });

		this.showDivider();
		this.updateSelectableRange(month);
		this.validateSelection();
		this.updateSelectionInHeader();
		this.showSelectedDates();

		//lets update the header
		$table.attr('data-view',this.values.view[month]);

		if (start && end && (is_editable_usage || is_autoclose || /^months$|^years$/i.test(this.values.min_view_mode)))
			this.triggerApply();

		if (/days/.test(view) && /^days$/i.test(this.values.min_view_mode) || /months/.test(view) && /^months$/i.test(this.values.min_view_mode) || /years/.test(view) && /^years$/i.test(this.values.min_view_mode))
			this.autoClose();
	}

	isDate(date){
		return date && moment(new Date(date)).isValid();
	}

	//@data - when using custom shortcuts we could have a different set of values to be applied
	triggerApply(data={}){
		let is_single_date = this.isSingleDate(),
			start = ('start' in data) ? data.start : this.getStart(),
			end = ('end' in data) ? data.end : this.getEnd(),
			range = '',
			options = {};

		if (is_single_date){
			range = (this.isDate(start) ? this.getDateString(new Date(start)) : start);

			options = {
				date: new Date(start),
				range: range
			};
		}
		else {
			//sometimes when custom shortcuts are used we might end up with a string that is not a date object so we still need to pass it back
			range = (this.isDate(start) ? this.getDateString(new Date(start)) : start) +
					this.values.separator +
					(this.isDate(end) ? this.getDateString(new Date(end)) : end);

			options = {
				start: this.isDate(start) ? new Date(start) : start,
				end: this.isDate(end) ? new Date(end) : end,
				range: range
			};
		}

		this.setTargetValue(range);

		this.fns('onApply',options);

		return this;
	}

	//isoWeek means it starts on monday
	isIsoWeek(){
		return /monday/i.test(this.getStartOfWeek());
	}

	isSingleDate(){
		return this.values.single_date;
	}

	weekNumberClicked(event){
		var { $cell, $table, month, view } = this.getEventData(event),
			$elm = this.getElm(),
			is_isoweek = this.isIsoWeek(),
			thisTime = parseInt($cell.attr('data-start-time'), 10),
			date1,
			date2;

		if (!this.values.start_week){
			this.values.start_week = thisTime;
			$cell.addClass('week-number-selected');
			date1 = new Date(thisTime);
			this.setStart(moment(date1).day(is_isoweek ? 1 : 0).valueOf());
			this.setEnd(moment(date1).day(is_isoweek ? 7 : 6).valueOf());
		}
		else {
			$elm.find('.week-number-selected').removeClass('week-number-selected');
			date1 = new Date(thisTime < this.values.start_week ? thisTime : this.values.start_week);
			date2 = new Date(thisTime < this.values.start_week ? this.values.start_week : thisTime);
			this.values.start_week = false;
			this.setStart(moment(date1).day(is_isoweek ? 1 : 0).valueOf());
			this.setEnd(moment(date2).day(is_isoweek ? 7 : 6).valueOf());
		}

		this.updateSelectableRange(month);
		this.validateSelection();
		this.updateSelectionInHeader();
		this.showSelectedDates();
		this.autoClose();
		this.triggerApply();

		return this;
	}

	compareDates(date1, date2){
		if (/^days$/i.test(this.values.min_view_mode))
			return this.compareDay(date1, date2);
		else if (/^months$/i.test(this.values.min_view_mode))
			return this.compareMonth(date1, date2);
		else if (/^years$/i.test(this.values.min_view_mode))
			return this.compareYear(date1, date2);
	}

	isValidTime(time,month){
		var time = parseInt(time),
			view = this.getCurrentView(month),
			is_single_date = this.isSingleDate(),
			start = this.getStart(),
			end = this.getEnd(),
			start_date = this.values.start_date,
			end_date = this.values.end_date;

		//when min_view_mode is days but we are in months view, we need to compare first of the month rather than the raw start_date
		if (/^days$/i.test(this.values.min_view_mode) && /^months|years$/i.test(view)){
			if (start_date)
				start_date = this._getMomentDate(this.values.start_date).startOf('month').toDate();

			if (end_date)
				end_date = moment(this.values.end_date).endOf('month').toDate();
		}

		if ((start_date && this.compareDates(time, start_date) < 0) || (end_date && this.compareDates(time, end_date) > 0))
			return false;

		if (start && !end && !is_single_date){
			let min = this.values.min_days,
				max = this.values.max_days;

			if (/^months$/i.test(this.values.min_view_mode)){
				min = this.values.min_months;
				max = this.values.max_months;
			}
			else if (/^years$/i.test(this.values.min_view_mode)){
				min = this.values.min_years;
				max = this.values.max_years;
			}

			//check max and min setting
			if ((max > 0 && this.countDiff(time, start) > max) || (min > 0 && this.countDiff(time, start) < min))
				return false;

			//check select_forward and select_backward
			if (this.values.select_forward && time < start || this.values.select_backward && time > start)
				return false;

			//check disabled days
			if ('customDateFilter' in this.values.custom_methods_override){
				var valid = true,
					timeTmp = time;

				while (this.countDiff(timeTmp, start) > 1){
					valid = this.customDateFilter(new Date(timeTmp),view);

					if (!valid || Math.abs(moment(timeTmp).diff(moment(start),this.values.min_view_mode))<1)
						break;
					else {
						if (moment(timeTmp).isAfter(moment(start),this.values.min_view_mode))
							timeTmp = moment(timeTmp).add(-1,this.values.min_view_mode).valueOf();

						if (moment(timeTmp).isBefore(moment(start),this.values.min_view_mode))
							timeTmp = moment(timeTmp).add(1,this.values.min_view_mode).valueOf();
					}
				}

				if (!valid)
					return false;
			}
		}
		return true;
	}


	updateSelectableRange(month){
		let $elm = this.getElm(),
			start = this.getStart(),
			end = this.getEnd();

		$elm.find('.cell.invalid.tmp').removeClass('tmp invalid').addClass('valid');

		if (start && !end){
			_.each($elm.find('.cell.valid:not(.other-month)'), cell => {
				var $cell = $(cell),
					time = parseInt($cell.attr('data-value'), 10);

				if (!this.isValidTime(time,month))
					$cell.addClass('invalid tmp').removeClass('valid');
				else
					$cell.addClass('valid tmp').removeClass('invalid');
			});
		}

		return true;
	}

	showTooltip(){
		return this.values.show_tooltip;
	}

	getEventData(event){
		let $cell = $(event.currentTarget),
			$table = $cell.closest('table'),
			month = $table.hasClass('month2') ? 'month2' : 'month1',
			view = this.getCurrentView(month);

		return { $cell, $table, month, view };
	}

	onCellHover(event){
		var $elm = this.getElm(),
			{ $cell, $table, month, view } = this.getEventData(event),
			show_tooltip = this.showTooltip(),
			is_mobile = this.isMobile(),
			is_single_date = this.isSingleDate(),
			hover_time = parseInt($cell.attr('data-value')),
			tooltip = '',
			start = this.getStart(),
			end = this.getEnd();

		if (view===this.values.min_view_mode){
			if ($cell.hasClass('has-tooltip') && $cell.attr('data-tooltip'))
				tooltip = '<span class="tooltip-content">' + $cell.attr('data-tooltip') + '</span>';
			else if (!$cell.hasClass('invalid')){
				if (is_single_date){
					$elm.find('.cell.hovering').removeClass('hovering');
					$cell.addClass('hovering');
				}
				else {
					_.each($elm.find('.cell'), cell => {
						var $cell = $(cell),
							time = parseInt($cell.attr('data-value'));

						if (time == hover_time)
							$cell.addClass('hovering');
						else
							$cell.removeClass('hovering');

						if (start && !this.values.end && ((start < time && hover_time >= time) || (start > time && hover_time <= time)))
							$cell.addClass('hovering');
						else
							$cell.removeClass('hovering');
					});

					if (start && !end){
						var days = this.countDiff(hover_time, start);

						if (show_tooltip){
							if (!is_mobile)
								tooltip = this.hoveringTooltip(days, start, hover_time);
							else if (days > 1)
								tooltip = days + ' ' + this.translate(this.values.min_view_mode)
						}
					}
				}
			}

			if (tooltip){
				var $tip = $('<div class="date-range-length-tip"></div>').html('<span>'+tooltip+'</span>');
				$cell.append($tip);

				var width = $tip.width();

				setTimeout(() => {
					$tip.css({
						visibility: 'visible'
					});
				}, 10);
			}
			else
				$elm.find('.date-range-length-tip').remove();
		}

		return this;
	}

	clearOnCellHover(){
		let $elm = this.getElm();

		$elm.find('.cell.hovering').removeClass('hovering');
		$elm.find('.date-range-length-tip').remove();

		return this;
	}

	isAutoClose(){
		return this.values.auto_close;
	}

	autoClose(){
		let is_activated = this.isActivated(),
			is_autoclose = this.isAutoClose(),
			is_single_date = this.isSingleDate(),
			start = this.getStart(),
			end = this.getEnd();

		if (is_activated && (is_single_date && start || start && end) ){
			if (is_autoclose)
				this.hide();
		}

		return this;
	}

	validateSelection(){
		var $elm = this.getElm(),
			start = moment(this.getStart() || null),
			end = moment(this.getEnd() || null),
			units_apart = (start.isValid() && end.isValid()) ? end.diff(start,this.values.min_view_mode) + 1 : NaN,
			min = this.values.min_days,
			max = this.values.max_days,
			is_single_date = this.isSingleDate();

		if (/^months$/i.test(this.values.min_view_mode)){
			min = this.values.min_months;
			max = this.values.max_months;
		}
		else if (/^years$/i.test(this.values.min_view_mode)){
			min = this.values.min_years;
			max = this.values.max_years;
		}

		if (is_single_date){ //validate if only start is there
			if (start.isValid() && !end.isValid())
				$elm.find('.drp_top-bar').removeClass('error').addClass('normal');
			else
				$elm.find('.drp_top-bar').removeClass('error').removeClass('normal');
		}
		else if (max && units_apart > max){
			this.setStart(null);
			this.setEnd(null);
			$elm.find('.cell').removeClass('checked');
			$elm.find('.drp_top-bar').removeClass('normal').addClass('error').find('.error-top').html(this.translate('less-than').replace('%d', max));
		}
		else if (min && units_apart < min){
			this.setStart(null);
			this.setEnd(null);
			$elm.find('.cell').removeClass('checked');
			$elm.find('.drp_top-bar').removeClass('normal').addClass('error').find('.error-top').html(this.translate('more-than').replace('%d', min));
		}
		else {
			if (start.isValid() || end.isValid())
				$elm.find('.drp_top-bar').removeClass('error').addClass('normal');
			else
				$elm.find('.drp_top-bar').removeClass('error').removeClass('normal');
		}

		if ((is_single_date && this.getStart() && !this.getEnd()) || (!is_single_date && this.getStart() && this.getEnd()))
			$elm.find('.apply-btn').removeClass('disabled');
		else
			$elm.find('.apply-btn').addClass('disabled');

		if (this.values.batch_mode){
			if ((this.getStart() && this.values.start_date && this.compareDates(this.getStart(), this.values.start_date) < 0) || (this.getEnd() && this.values.end_date && this.compareDates(this.getEnd(), this.values.end_date) > 0)){
				this.setStart(null);
				this.setEnd(null);
				$elm.find('.cell').removeClass('checked');
			}
		}

		return this;
	}

	updateSelectionInHeader(force_validate, silent){
		let $elm = this.getElm(),
			start = this.getStart(),
			end = this.getEnd(),
			is_activated = this.isActivated(),
			is_show_topbar = this.isShowTopbar(),
			is_autoclose = this.isAutoClose(),
			is_single_date = this.isSingleDate(),
			range;

		if (is_show_topbar){
			$elm.find('.start-day').html('...');
			$elm.find('.end-day').html('...');
			$elm.find('.selected-days').addClass('hide');

			if (start)
				$elm.find('.start-day').html(this.getDateString(new Date(parseInt(start))));

			if (end)
				$elm.find('.end-day').html(this.getDateString(new Date(parseInt(end))));
		}

		if (start){
			if (is_single_date){
				$elm.find('.apply-btn').removeClass('disabled');
				range = this.getDateString(new Date(start));

				if (is_autoclose)
					this.setTargetValue(range);

				if (is_activated && !silent){
					this.fns('onDateChanged',{
						range: range,
						date1: new Date(start)
					});
				}
			}
			else if (end){
				$elm.find('.selected-days').removeClass('hide').find('.selected-days-num').html(this.countDiff(end, start));
				$elm.find('.apply-btn').removeClass('disabled');
				range = this.getDateString(new Date(start)) + this.values.separator + this.getDateString(new Date(end));

				if (is_autoclose)
					this.setTargetValue(range);

				if (is_activated && !silent){
					this.fns('onDateChanged',{
						range: range,
						date1: new Date(start),
						date2: new Date(end)
					});
				}
			}
		}
		else if (force_validate)
			$elm.find('.apply-btn').removeClass('disabled');
		else
			$elm.find('.apply-btn').addClass('disabled');

		return this;
	}

	countDiff(start, end){
		return Math.abs(moment(start).diff(moment(end), this.values.min_view_mode)) + 1;
	}

	setDateRange(date1, date2, silent){
		let date_format = this.getDateFormat();

		if (typeof date1==='string' && typeof date2==='string'){
			date1 = moment(date1, date_format).toDate();
			date2 = moment(date2, date_format).toDate();
		}

		//swap if start is after end
		if (date1.getTime() > date2.getTime()){
			var tmp = date2;
			date2 = date1;
			date1 = tmp;
			tmp = null;
		}

		var valid = true;

		if ((this.values.start_date && this.compareDates(date1, this.values.start_date) < 0) || (this.values.end_date && this.compareDates(date2, this.values.end_date) > 0))
			valid = false;

		if (!valid){
			this.renderCalendar(this.values.start_date, 'month1');
			this.renderCalendar(this.nextMonth(this.values.start_date), 'month2');
			this.showDivider();
			return;
		}

		this.setStart(date1.getTime());
		this.setEnd(date2.getTime());

		if (this.values.time.enabled){
			this.renderTime('time1', date1);
			this.renderTime('time2', date2);
		}

		if (!this.values.sticky){
			if (/days/.test(this.values.min_view_mode) && this.compareMonth(date1, date2)===0){
				if (this.values.look_behind)
					date1 = this.prevMonth(date2);
				else
					date2 = this.nextMonth(date1);
			}
			else if (/months/.test(this.values.min_view_mode) && this.compareYear(date1, date2)===0){
				if (this.values.look_behind)
					date1 = this.prevYear(date2);
				else
					date2 = this.nextYear(date1);
			}
			else if (/years/.test(this.values.min_view_mode) && this.compareDecade(date1,date2)===0){
				if (this.values.look_behind)
					date1 = this.prevDecade(date2);
				else
					date2 = this.nextDecade(date1);
			}
		}
		else {
			if (/days/.test(this.values.min_view_mode)){
				if (this.compareMonth(date1, date2)===0){
					if (this.values.look_behind)
						date1 = this.prevMonth(date2);
					else
						date2 = this.nextMonth(date1);
				}
				else if (this.values.end_date!==false && this.compareMonth(date2, this.values.end_date)>0){
					date1 = this.prevMonth(date1);
					date2 = this.prevMonth(date2);
				}
			}
			else if (/months/.test(this.values.min_view_mode)){
				if (this.compareYear(date1, date2)===0){
					if (this.values.look_behind)
						date1 = this.prevYear(date2);
					else
						date2 = this.nextYear(date1);
				}
				else if (this.values.end_date!==false && this.compareYear(date2, this.values.end_date)>0){
					date1 = this.prevYear(date1);
					date2 = this.prevYear(date2);
				}
			}
			else if (/years/.test(this.values.min_view_mode)){
				if (this.compareDecade(date1,date2)===0){
					if (this.values.look_behind)
						date1 = this.prevDecade(date2);
					else
						date2 = this.nextDecade(date1);
				}
				else if (this.values.end_date!==false && this.compareDecade(date2, this.values.end_date)>0){
					date1 = this.prevDecade(date1);
					date2 = this.prevDecade(date2);
				}
			}
		}

		this.renderCalendar(date1, 'month1');
		this.renderCalendar(date2, 'month2');
		this.showDivider();
		this.validateSelection();
		this.updateSelectionInHeader(false, silent);
		this.autoClose();

		return this;
	}

	setSingleDate(date){
		let start = this.getStart(),
			end = this.getEnd();

		if (start && this.compareDates(date, start)<0 || end && this.compareDates(date, end)>0)
			this.renderCalendar(start, 'month1');
		else {
			this.setStart(date);
			
			if (this.values.time.enabled)
				this.renderTime('time1', date);

			this.renderCalendar(date, 'month1');

			if (!this.values.single_month)
				this.renderCalendar(this.nextMonth(date), 'month2');

			this.showDivider();
			this.updateSelectionInHeader();
			this.autoClose();

		}

		return this;
	}

	showSelectedDates(){
		let $elm = this.getElm(),
			start = this.getStart(),
			end = this.getEnd();

		if (start || end){
			_.each($elm.find('.cell'), cell => {
				var $cell = $(cell),
					time = parseInt($cell.attr('data-value')),
					_start = start,
					_end = end;

				if (this.values.time.enabled){
					time = moment(time).startOf('day').valueOf();
					_start = moment(_start || moment().valueOf()).startOf('day').valueOf();
					_end = moment(_end || moment().valueOf()).startOf('day').valueOf();
				}

				if ((start && end && _end >= time && _start <= time) || (start && !end && moment(_start).format('YYYY-MM-DD') == moment(time).format('YYYY-MM-DD')))
					$cell.addClass('checked');
				else
					$cell.removeClass('checked');

				//add first-date-selected class name to the first date selected
				if (start && moment(_start).format('YYYY-MM-DD') == moment(time).format('YYYY-MM-DD'))
					$cell.addClass('first-date-selected');
				else
					$cell.removeClass('first-date-selected');

				//add last-date-selected
				if (end && moment(_end).format('YYYY-MM-DD') == moment(time).format('YYYY-MM-DD'))
					$cell.addClass('last-date-selected');
				else
					$cell.removeClass('last-date-selected');
			});

			_.each($elm.find('.week-number'), cell => {
				var $cell = $(cell);

				if ($cell.attr('data-start-time') == this.values.start_week)
					$cell.addClass('week-number-selected');
			});
		}

		return this;
	}

	renderCalendar(date, month){
		var $elm = this.getElm(),
			$caption_title = $elm.find('.'+month+' .caption-title'),
			$body = $elm.find('.'+month+' tbody'),
			date = moment(date).toDate(),
			$body_content = null,
			view = this.getCurrentView(month);

		switch(view){
			case 'days':
				$caption_title.html(this.nameMonth(date.getMonth())+' '+date.getFullYear());
				$body_content = this.createDaysHtml(date,month);
			break;
			case 'months':
				$caption_title.html(date.getFullYear());
				$body_content = this.createMonthsHtml(date,month);
			break;
			case 'years':
				let decade = this.getDecade(date);
				$caption_title.html(decade.first()+'-'+decade.last());
				$body_content = this.createYearsHtml(date,month);
			break;
		}

		$body.html($body_content);

		this.values[month] = date;

		this.updateSelectableRange(month);

		return this;
	}

	//normally a decade is 10yrs, but b/c the calendar shows 12, we make sure we have 12yrs
	getDecade(date){
		var first_year = Math.floor(date.getFullYear() / 10) * 10;
		return [first_year,first_year + 9];
	}

	createMonthsHtml(date,month){
		let html = '',
			i = 0,
			selected_date = /^month1$/i.test(month) ? this.getStart() : this.getEnd(),
			today = moment(),
			view = this.getCurrentView(month);

		while (i < 12){
			let _month = new Date(date.getFullYear(), i).getMonth(),
				month_in_loop = moment(date).month(_month),
				is_today_month = today.isSame(moment(date).month(_month),'month'),
				valid = this.isValidTime(month_in_loop.valueOf(),month);

			if (/^months$/.test(this.values.min_view_mode) && (this.values.start_date && this.compareMonth(month_in_loop.toDate(), this.values.start_date)<0 || this.values.end_date && this.compareMonth(month_in_loop.toDate(), this.values.end_date)>0))
				valid = false;

			if (valid)
				valid = this.customDateFilter(month_in_loop.toDate(),view);

			html += '<div class="cell cell-month '+(is_today_month ? 'cell-current' : '')+' '+(valid ? 'valid' : 'invalid')+'" data-value="'+month_in_loop.valueOf()+'">'+this.nameMonth(_month)+'</div>';
			i++
		}

		return '<tr><td colspan="3"><div class="cell-wrapper">'+html+'</div></td></tr>';
	}

	createYearsHtml(date,month){
		var decade = this.getDecade(date),
			first_year = decade.first(),
			last_year = decade.last(),
			html = '',
			today = moment(),
			view = this.getCurrentView(month);


		for (let i=first_year-1; i<=last_year+1; i++){
			let year = new Date(i , 0).getFullYear(),
				year_in_loop = moment(date).year(year),
				is_today_year = today.isSame(year_in_loop,'year'),
				is_other_decade = i<first_year || i>last_year,
				valid = this.isValidTime(year_in_loop.valueOf(),month);

			if (/^years$/.test(this.values.min_view_mode) && (this.values.start_date && this.compareYear(year_in_loop.toDate(), this.values.start_date)<0 || this.values.end_date && this.compareYear(year_in_loop.toDate(), this.values.end_date)>0))
				valid = false;

			if (valid)
				valid = this.customDateFilter(year_in_loop.toDate(),view);

			html += '<div class="cell cell-year '+(is_today_year ? 'cell-current' : '')+' '+(is_other_decade ? 'other-decade' : '')+' '+(valid ? 'valid' : 'invalid')+'" data-value="'+year_in_loop.valueOf()+'">'+year+'</div>';
		}

		return '<tr><td colspan="3"><div class="cell-wrapper">'+html+'</div></td></tr>';
	}

	showTime(date, name){
		let $elm = this.getElm();

		$elm.find('.' + name).append(this.getTimeHTML());
		this.renderTime(name, date);

		return this;
	}

	nameMonth(m){
		return this.translate('month-name')[m];
	}

	getDateString(d){
		return moment(d).format(this.getDateFormat());
	}

	showDivider(){
		this.showSelectedDates();

		var cal1_date = moment(this.values.month1),
			cal2_date = moment(this.values.month2),
			show_divider = false,
			$elm = this.getElm();

		if (/years/i.test(this.values.min_view_mode) && cal2_date.diff(cal1_date,'years')>12 || /months/i.test(this.values.min_view_mode) && cal2_date.diff(cal1_date,'years')>1 || /days/i.test(this.values.min_view_mode) && cal2_date.diff(cal1_date,'months')>1)
			show_divider = true;

		if (show_divider)
			$elm.addClass('has-gap').removeClass('no-gap').find('.gap').css('visibility', 'visible');
		else
			$elm.removeClass('has-gap').addClass('no-gap').find('.gap').css('visibility', 'hidden');

		var h1 = $elm.find('table.month1').height();
		var h2 = $elm.find('table.month2').height();

		$elm.find('.gap').height(Math.max(h1, h2) + 10);

		return this;
	}

	redrawDatePicker(){
		this.renderCalendar(this.values.month1, 'month1');
		this.renderCalendar(this.values.month2, 'month2');
		return this;
	}

	compareDecade(date1, date2){
		let decade1 = this.getDecade(date1),
			decade2 = this.getDecade(date2),
			start_year1 = decade1.first(),
			start_year2 = decade2.first();

		return 	(start_year1 > start_year2) ? 1 :
				(start_year1 === start_year2) ? 0 :
				-1;
	}

	_getMomentDate(date){
		return typeof date==='string' ? moment(date,this.getDateFormat()) : moment(date);
	}

	compareYear(date1, date2){
		var p = parseInt(this._getMomentDate(date1).format('YYYY')) - parseInt(this._getMomentDate(date2).format('YYYY'));
		if (p > 0) return 1;
		if (p === 0) return 0;
		return -1;
	}

	compareMonth(date1, date2){
		var p = parseInt(this._getMomentDate(date1).format('YYYYMM')) - parseInt(this._getMomentDate(date2).format('YYYYMM'));
		if (p > 0) return 1;
		if (p === 0) return 0;
		return -1;
	}

	compareDay(date1, date2){
		var p = parseInt(this._getMomentDate(date1).format('YYYYMMDD')) - parseInt(this._getMomentDate(date2).format('YYYYMMDD'));
		if (p > 0) return 1;
		if (p === 0) return 0;
		return -1;
	}

	nextMonth(date){
		return moment(date).add(1, 'months').toDate();
	}

	prevMonth(date){
		return moment(date).add(-1, 'months').toDate();
	}

	nextYear(date){
		return moment(date).add(1, 'years').toDate();
	}

	prevYear(date){
		return moment(date).add(-1, 'years').toDate();
	}

	nextDecade(date){
		return moment(date).add(10, 'years').toDate();
	}

	prevDecade(date){
		return moment(date).add(-10, 'years').toDate();
	}

	getTimeHTML(){
		return '<div>' +
			'<span>' + this.translate('Time') + ': <span class="hour-val">00</span>:<span class="minute-val">00</span></span>' +
			'</div>' +
			'<div class="hour">' +
			'<label>' + this.translate('Hour') + ': <input type="range" class="hour-range" name="hour" min="0" max="23"></label>' +
			'</div>' +
			'<div class="minute">' +
			'<label>' + this.translate('Minute') + ': <input type="range" class="minute-range" name="minute" min="0" max="59"></label>' +
			'</div>';
	}

	getWeekHead(){
		let is_isoweek = this.isIsoWeek(),
			prepend = this.values.show_week_numbers ? '<th>' + this.translate('week-number') + '</th>' : '';

		if (is_isoweek){
			return prepend + '<th>' + this.translate('week-1') + '</th>' +
				'<th>' + this.translate('week-2') + '</th>' +
				'<th>' + this.translate('week-3') + '</th>' +
				'<th>' + this.translate('week-4') + '</th>' +
				'<th>' + this.translate('week-5') + '</th>' +
				'<th>' + this.translate('week-6') + '</th>' +
				'<th>' + this.translate('week-7') + '</th>';
		}
		else {
			return prepend + '<th>' + this.translate('week-7') + '</th>' +
				'<th>' + this.translate('week-1') + '</th>' +
				'<th>' + this.translate('week-2') + '</th>' +
				'<th>' + this.translate('week-3') + '</th>' +
				'<th>' + this.translate('week-4') + '</th>' +
				'<th>' + this.translate('week-5') + '</th>' +
				'<th>' + this.translate('week-6') + '</th>';
		}
	}

	isDateOutOfBounds(date){
		let date1 = moment(date),
			is_outside = false;

		if (/years/.test(this.values.min_view_mode)){
			let decade = this.getDecade(date);

			if (this.values.start_date && decade.last() < this.values.start_date.getFullYear() || this.values.end_date && decade.first() > this.values.start_date.getFullYear())
				is_outside = true;
			else
				is_outside = false;
		}
		else {
			let units = /months/.test(this.values.min_view_mode) ? 'year' : 'month';

			if (this.values.start_date && date1.endOf(units).isBefore(this.values.start_date) || this.values.end_date && date1.startOf(units).isAfter(this.values.end_date))
				is_outside = true;
			else
				is_outside = false;
		}

		return is_outside;
	}

	getGapHTML(){
		var html = ['<div class="gap-lines">'];

		for (var i = 0; i < 20; i++){
			html.push('<div class="gap-line">' +
				'<div class="gap-1"></div>' +
				'<div class="gap-2"></div>' +
				'<div class="gap-3"></div>' +
				'</div>');
		}

		html.push('</div>');

		return html.join('');
	}

	hasMonth2(){
		return (!this.values.single_month);
	}

	attributesCallbacks(initialObject, callbacksArray, today){
		var resultObject = _.extend({}, initialObject);

		_.each(callbacksArray, (cbAttr,cbAttrIndex) => {
			var addAttributes = cbAttr(today);

			for (var attr in addAttributes){
				if (resultObject.hasOwnProperty(attr))
					resultObject[attr] += addAttributes[attr];
				else
					resultObject[attr] = addAttributes[attr];
			}
		});

		var attrString = '';

		for (var attr in resultObject){
			if (resultObject.hasOwnProperty(attr))
				attrString += attr + '="' + resultObject[attr] + '" ';
		}

		return attrString;
	}

	createDaysHtml(date,month){
		date.setDate(1);

		var is_isoweek = this.isIsoWeek(),
			days = [],
			now = new Date(),
			day_of_week = date.getDay(),
			today,
			valid,
			view = this.getCurrentView(month);

		if ((day_of_week===0) && is_isoweek)
			day_of_week = 7; //add one week

		if (day_of_week > 0){
			for (var i = day_of_week; i > 0; i--){
				var day = new Date(date.getTime() - 86400000 * i);
				valid = this.isValidTime(day.getTime(),month);

				if (this.values.start_date && this.compareDates(day, this.values.start_date) < 0)
					valid = false;

				if (this.values.end_date && this.compareDates(day, this.values.end_date) > 0)
					valid = false;

				days.push({
					date: day,
					type: 'prev-month',
					day: day.getDate(),
					time: day.getTime(),
					valid: valid
				});
			}
		}

		var curr_month = date.getMonth();

		for (var i = 0; i < 40; i++){
			today = moment(date).add(i, 'days').toDate();
			valid = this.isValidTime(today.getTime(),month);

			if (this.values.start_date && this.compareDates(today, this.values.start_date)<0 || this.values.end_date && this.compareDates(today, this.values.end_date)>0)
				valid = false;

			days.push({
				date: today,
				type: today.getMonth()!=curr_month ? 'next-month' : '',
				day: today.getDate(),
				time: today.getTime(),
				valid: valid
			});
		}

		var html = [];

		for (var week = 0; week < 6; week++){
			if (days[week * 7].type==='next-month')
				break;

			html.push('<tr>');

			for (var day = 0; day < 7; day++){
				var _day = is_isoweek ? day + 1 : day;
				today = days[week * 7 + _day];
				var highlight_today = moment(today.time).format('L') == moment(now).format('L');
				today.extra_class = '';
				today.tooltip = '';

				if (today.valid)
					today.valid = this.customDateFilter(moment(today.time).toDate(),view);

				var today_div_attr = {
					'data-value': today.time,
					'data-tooltip': today.tooltip,
					'class': 'cell cell-day ' + today.type + ' ' + today.extra_class + ' ' + (today.valid ? 'valid' : 'invalid') + ' ' + (highlight_today ? 'real-today' : '')
				};

				if (day === 0 && this.values.show_week_numbers)
					html.push('<td><div class="week-number" data-start-time="' + today.time + '">' + this.getWeekNumber(today.date) + '</div></td>');

				html.push('<td ' + this.attributesCallbacks({}, this.values.day_td_attributes, today) + '><div ' + this.attributesCallbacks(today_div_attr, this.values.day_div_attributes, today) + '>' + this.customDateHtml(today.time) + '</div></td>');
			}

			html.push('</tr>');
		}

		return html.join('');
	}

	//used to display custom html
	customDateHtml(date){
		return moment(date).date(); //day of month
	}

	//used to modify how dates are being rendered.. disabled, etc...
	customDateFilter(date,view){
		return true;
	}

	getLanguages(){
		if (this.values.language == 'auto'){
			var language = navigator.language ? navigator.language : navigator.browserLanguage;

			if (!language)
				return utils_daterange_i18n['default'];

			language = language.toLowerCase();

			if(language in utils_daterange_i18n)
				return utils_daterange_i18n[language];

			return utils_daterange_i18n['default'];
		}
		else if (this.values.language && this.values.language in utils_daterange_i18n)
			return utils_daterange_i18n[this.values.language];
		else
			return utils_daterange_i18n['default'];
	}

	/**
	 * Translate language string, try both the provided translation key, as the lower case version
	 */
	translate(translation_key){
		let languages = this.getLanguages(),
			translation_key_lcase = translation_key.toLowerCase(),
			result = (translation_key in languages) ? languages[translation_key] : (translation_key_lcase in languages) ? languages[translation_key_lcase] : null,
			default_language = utils_daterange_i18n['default'];

		if (result == null)
			result = (translation_key in default_language) ? default_language[translation_key] : (translation_key_lcase in default_language) ? default_language[translation_key_lcase] : '';

		return result;
	}

	getDefaultDate(){
		var default_date = this.values.defaultDate ? this.values.defaultDate : new Date(),
			is_single_date = this.isSingleDate();

		if (this.values.look_behind){
			if (this.values.start_date && this.compareMonth(default_date, this.values.start_date) < 0) default_date = this.nextMonth(this._getMomentDate(this.values.start_date).toDate());
			if (this.values.end_date && this.compareMonth(default_date, this.values.end_date) > 0) default_date = this._getMomentDate(this.values.end_date).toDate();
		}
		else {
			if (this.values.start_date && this.compareMonth(default_date, this.values.start_date) < 0) default_date = this._getMomentDate(this.values.start_date).toDate();
			if (this.values.end_date && this.compareMonth(this.nextMonth(default_date), this.values.end_date) > 0) default_date = this.prevMonth(this._getMomentDate(this.values.end_date).toDate());
		}

		if (is_single_date){
			if (this.values.start_date && this.compareMonth(default_date, this.values.start_date) < 0) default_date = this._getMomentDate(this.values.start_date).toDate();
			if (this.values.end_date && this.compareMonth(default_date, this.values.end_date) > 0) default_date = this._getMomentDate(this.values.end_date).toDate();
		}

		return default_date;
	}

	resetMonthsView(date){
		if (!date)
			date = this.getDefaultDate();

		//setting the calendar views
		this.values.view.month1 = this.values.view.month2 = this.values.min_view_mode;

		if (this.values.look_behind){
			let prev_date = /years/.test(this.values.min_view_mode) ? this.prevDecade(date) :
							/months/.test(this.values.min_view_mode) ? this.prevYear(date) :
							this.prevMonth(date);

			this.renderCalendar(prev_date, 'month1');
			this.renderCalendar(date, 'month2');
		}
		else {
			let next_date = /years/.test(this.values.min_view_mode) ? this.nextDecade(date) :
							/months/.test(this.values.min_view_mode) ? this.nextYear(date) :
							this.nextMonth(date);

			this.renderCalendar(date, 'month1');
			this.renderCalendar(next_date, 'month2');
		}

		if (this.isSingleDate())
			this.renderCalendar(date, 'month1');

		this.showSelectedDates();
		this.showDivider();

		return this;
	}

	outsideClickClose(evt){
		let $elm = this.getElm(),
			$target = this.getTarget();

		if (!this.isOwnDatePickerClicked(evt, $target[0])){
			if ($elm.is(':visible'))
				this.hide();
		}
	}

};

// Export node module.
if ( typeof module !== 'undefined' && module.hasOwnProperty('exports') ){
	module.exports = UTILS.Daterange;
}
