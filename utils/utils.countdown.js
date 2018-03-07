/*
    == COUNTDOWN ==

    == dependencies ==
    moment.js
    moment-duration-format.js

	ex. var Countdown = new COUNTDOWN({ target:$('#results') });

	== definitions ==
	@target - (required) DOM elm where the countdown will be inserted --> defaults to 'body'
	@duration - (required) duration in sec of the countdown
	@granularity - (optional) interval in msec by which the countdown will update the target --> defaults to 1000
	@color - (optional) color of the countdown --> defaults to 'black'
	@format - (optional) format of the display of the time --> defaults to 'h [h] m [m] s [s]'
	@onTick - (optional) stack of functions to execute when the countdown is running (REPEAT EXECUTION) --> defaults to 'null'
	@onStop - (optional) stack of functions to execute when the countdown is complete (REPEAT EXECUTION) --> defaults to 'null'
	@color - (optional) color of the background & text --> defaults to 'black'

*/
const COUNTDOWN =  class extends UTILS.Base {
	constructor(data){
		super(data);
		_log(this.getObjectName()+' --> instantiated!',this.getId(),this);

		if (_.isPlainObject(data)){
			('onTick' in data) && this.addCallback('onTick',data.onTick);
			('onStart' in data) && this.addCallback('onStart',data.onStart);
			('onStop' in data) && this.addCallback('onStop',data.onStop);
			('duration' in data) && this.setDuration(data.duration);
			('granularity' in data) && this.setGranularity(data.granularity);
			('color' in data) && this.setColor(data.color);
			('format' in data) && this.setFormat(data.format);
		}

		//setting default color
		if (!this.getColor())
			this.setColor('black');

		return this;
	}
	getDefaults(){
		return {
			object:'utils.countdown',
			version:'0.0.2',
			$elm: null, //holds the timer wrapper
			divs: {}, //holds all the divs of the main elm
			is_shown: false, //holds whether the countdown is shown
			is_running: false, //holds whether the countdown is running
			colors: [ //holds color combinations
				{ name:'standalone', css:'timer-countdown-standalone' },
				{ name:'white', css:'timer-countdown-white' },
				{ name:'gray', css:'timer-countdown-gray' },
				{ name:'red', css:'timer-countdown-red' },
				{ name:'black', css:'timer-countdown-black' },
				{ name:'green', css:'timer-countdown-green' }
			],
			color:null, //holds the color of the countdown
			duration: 0, //holds the duration of the countdown
			granularity: 1000,
			format:'h [h] m [m] s [s]', //based on moment.duration()
			timer: null //holds the timer
		};
	}
	clean(){
		this.values.$elm.remove();
		return this;
	}
	start(){
		if (!this.isRunning()){
			this.values.is_running = true;
			this.fns('onStart');
			var start = moment(), //now
				duration = this.getDuration(),
				remaining = duration,
				granularity = this.getGranularity(),
				format = this.getFormat(),
				time = '';

			var _runningTimer = function(){
				remaining = duration - moment().diff(start,'seconds');

				if (remaining>0)
					this.values.timer = setTimeout(_runningTimer, granularity);
				else {
					remaining = 0;
					this.stop();
				}

				time = moment.duration(remaining, 'seconds').format(format);
				this.updateTimer(time);
				this.fns('onTick',{ time:time });
			}.bind(this);

			_runningTimer();
		}
		return this;
	}
	stop(){
		this.resetTimer();
		this.fns('onStop');
		return this;
	}
	resetTimer(){
		this.values.is_running = false;
		clearTimeout(this.values.timer);
		return this;
	}
	reStart(){
		if (this.isRunning())
			this.resetTimer();

		this.start();
		return this;
	}
	isRunning(){
		return this.values.is_running;
	}
	_create(){
		if (!this.values.$elm)
			this.values.$elm = $('<span class="timer-countdown"></span>');

		return this.values.$elm;
	}
	getTimer(){
		return this.values.$elm;
	}
	updateTimer(time){
		this.values.$elm.text(time);
	}
	setTarget(target){
		super.setTarget(target);
		this.values.$target.append(this._create());
		return this;
	}
	getFormat(){
		return this.values.format;
	}
	setFormat(format){
		this.values.format = format;
		return this;
	}
	getDuration(){
		return this.values.duration;
	}
	setDuration(duration){
		this.values.duration = duration;
		this.reStart();
		return this;
	}
	getGranularity(){
		return this.values.granularity;
	}
	setGranularity(granularity){
		this.values.granularity = granularity;
		return this;
	}
	getColor(){
		return this.values.color;
	}
	setColor(color){
		var $timer = this.getTimer();
		this.values.color = _.find(this.values.colors,{ name:color });
		//removing all existing classes
		var classes = $timer.attr('class').match(/(?:^|)timer-countdown-(\w+)(?!\w)/g) || []; //match all classes starting with 'timer-countdown-...'

		if (classes.length)
			$timer.removeClass(_.joinArray(classes,' '));

		//adding new class
		$timer.addClass(this.values.color.css);
		return this;
	}

};
