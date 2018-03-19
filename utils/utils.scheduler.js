/*
    == UTILS.Scheduler ==

	ex. var scheduler = new UTILS.Scheduler({  });
*/

UTILS.Scheduler = class extends UTILS.Base {
	constructor(data){
		super(data);
		_log(this.getObjectName()+' --> instantiated!',this.getId(),this);

		if (_.isPlainObject(data)){
			('type' in data) && this.setType(data.type);
			('options' in data) && this.setOptions(data.options);
			('data' in data) && this.setData(data.data);
			('onShow' in data) && this.addCallback('onShow', data.onShow);
			('onHide' in data) && this.addCallback('onHide', data.onHide);
		}

		return this;
	}
	getDefaults(){
		return {
			object:'utils.scheduler',
			version:'0.0.1',
			$elm: $('<div class="app-scheduler"></div>'), //holds the chart
			title: '', //title of the chart
			is_shown: false, //holds whether the countdown is shown
			data: null,
			ajax: {
				type:'GET',
				url: '/v1/events',
				params:{}
			}
		};
	}
	getType(){
		return this.values.type;
	}
	setType(type){
		this.values.type = type.toUpperCase();

		return this;
	}
};

// Export node module.
if ( typeof module !== 'undefined' && module.hasOwnProperty('exports') ){
	module.exports = UTILS.Scheduler;
}