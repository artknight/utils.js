/*
    == UTILS.Chart ==

    == dependencies ==
    jquery.js
    lodash.js

	ex. var chart = new UTILS.Chart({ target:$('#results') });
*/

//this keeps track of all chart types already loaded on the page. Google throws a fit when we try to load the same package multiple times ( multiple charts of same type on the same page )
if (typeof all_chart_packages==='undefined')
	var all_chart_packages = [];

UTILS.Chart = class extends UTILS.Base {
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
			object:'utils.chart',
			version:'0.0.4',
			$elm: $('<div class="google-chart"></div>'), //holds the chart
			type: 'bar', //holds the type of the editable input field
			title: '', //title of the chart
			is_shown: false, //holds whether the countdown is shown
			is_3D: false, //holds whether the chart is 3D ( only applies to pie & donut )
			Chart: null, //holds the google chart object
			data: null,
			ajax: {
				type:'GET',
				url: '/v1/chart/BidStatus/{type}',
				params:{}
			},
			mappings: { //google chart mappings
				area: {
					method:'AreaChart',
					package:['corechart'],
					options:{
						width:300,
						height:125,
						colors: ['#666666','#b90500','#b90500','#c01d19','#c73632','#ce504c','#d56966','#dc827f','#e39b99','#eab4b2','#f1cdcc','#f8e6e5']
					}
				},
				pie: {
					method:'PieChart',
					package:['corechart'],
					options:{
						width:300,
						height:125,
						slices:{}
					}
				},
				line: {
					method:'LineChart',
					package:['line','corechart'],
					options:{
						width:300,
						height:125,
						colors: []
					}
				},
				gauge: {
					method:'Gauge',
					package:['gauge'],
					options:{
						width:300,
						height:125
					}
				},
				bar: {
					method:'BarChart',
					package:['corechart'],
					options:{
						width:300,
						height:125,
						colors: [],
						//chartArea: {width: '50%'},
						hAxis: {
							minValue: 0
						},
						vAxis: {
							title: ''
						}
					}
				},
				column: {
					method:'ColumnChart',
					package:['corechart'],
					options:{
						width:300,
						height:125,
						colors: []
					}
				},
				donut: {
					method:'PieChart',
					package:['corechart'],
					options:{
						width:300,
						height:125,
						pieHole:0.5,
						slices:{}
					}
				}
			}
		};
	}
	getColors(){
		var slice_charts = ['donut','pie'],
			colors = ['#b10c00','#3f403f','#3f5765','#bdd4de','#efefef','#ce504c','#d56966','#dc827f','#e39b99','#eab4b2','#f1cdcc','#f8e6e5'];

		if (!_.isIn(slice_charts,this.getType()))
			return { colors:colors };
		else {
			/*
				{ slices: {
				 	0: { color:'' },
				 	1: { color:'' }
				} }
			*/
			var _colors = {};
			_.each(colors,function(color,i){
				_colors[i] = { color:color };
			});
			return { slices:_colors };
		}
	}
	clean(){
		this.values.$elm.remove();
		return this;
	}
	getType(){
		return this.values.type;
	}
	setType(type){
		//lets check if it has 3D
		if (/^pie3D$/i.test(type)){
			this.values.type = 'pie';
			this.set3D(true);
		}
		else
			this.values.type = type;

		return this;
	}
	getTitle(){
		return this.values.title;
	}
	is3D(){
		return this.values.is_3D;
	}
	set3D(state){
		this.values.is_3D = !!(state);
		return this;
	}
	setTitle(title){
		this.values.title = title;
		return this;
	}
	setTarget(target){
		super.setTarget(target);
		this.values.$target.data('$chart',this);
		return this;
	}
	getPackagesToLoad(){
		var packages = this.getMapping().package,
			packages_not_loaded = [];

		_.each(packages,function(_package){
			//if package has not yet been loaded, we need to load it
			if (!this.isPackageLoaded(_package)){
				all_chart_packages.push(_package);
				packages_not_loaded.push(_package);
			}

		}.bind(this));

		return packages_not_loaded;
	}
	isPackageLoaded(_package){
		return _.isIn(all_chart_packages,_package);
	}
	getData(){
		return new Promise(function(resolve,reject){
			var $target = this.getTarget(),
				spinner = new UTILS.Spinner({ target:$target, type:'small' }),
				ajax_settings = this.getAjaxData();

			var _onError = function(response){
				spinner.hide();
				reject(Error('app.chart --> network error'));
			};

			var _onSuccess = function(response){
				spinner.hide();
				resolve(response); //response is an array already
			};

			var data = {
				url: ajax_settings.url.replace(/\{type\}/,this.getType()),
				type: ajax_settings.type,
				data: {}
			};

			spinner.show();
			$.ajax(data).done(_onSuccess).fail(_onError);
		}.bind(this));
	}
	getOptions(){
		return this.getMapping().options;
	}
	setOptions(options){
		if ((_.isPlainObject(options))){
			//lets check if is3D exists and set it separately
			if ('is3D' in options){
				this.set3D(options.is3D);
				delete options.is3D;
			}

			//updating the default options
			_.extend(this.getOptions(),options);
		}

		return this;
	}
	getChartElm(){
		return this.values.$elm;
	}
	getChart(){
		return this.values.Chart;
	}
	setChart(Chart){
		this.values.Chart = Chart;
		return this;
	}
	show(){
		if (!this.isShown()){
			this.values.is_shown = true;
			this._fns('onShow');
			this._drawChart();
		}
		return this;
	}
	hide(){
		this.values.is_shown = false;
		this._fns('onHide');
		return this;
	}
	isShown(){
		return this.values.is_shown;
	}
	getMapping(){
		return this.values.mappings[ this.getType() ];
	}
	_drawChart(){
		var $chart = this.getChartElm(),
			mapping = this.getMapping(),
			title = this.getTitle(),
			options = this.getOptions(),
			is_3D = this.is3D(),
			packages_to_load = this.getPackagesToLoad(),
			load_timeout = null, //holds the timeout obj that might be set due to google libs not loading properly on the initial try
			load_timeout_count = 0,
			data_formatted = null;

		//if title exists, lets add that to the default options
		if (title.length)
			_.extend(options,{ title:title });

		if (is_3D)
			_.extend(options,{ is3D:is_3D });

		//updating the colors
		_.extend(options,this.getColors());

		this.getData().then(function(chart_data){

			var _loadVisualizationLib = function(){
				return new Promise(function(resolve,reject){
					try {
						var Chart = new google.visualization[ mapping.method ]($chart[0]),
							data = new google.visualization.arrayToDataTable(chart_data);

						console.log('app.chart --> loaded google lib',mapping.method);
						clearTimeout(load_timeout);
						resolve({Chart:Chart,data:data});
					}
					catch(e){
						if (load_timeout_count<5){
							load_timeout_count++;
							console.log('app.chart --> running timeout ('+load_timeout_count+' times)',mapping.method);
							load_timeout = setTimeout(_draw,500);
						}
						else
							reject();
					}
				});
			};

			var _draw = function(){
				//since some of the google libs might not load properly at first time, we need to create a promise
				_loadVisualizationLib().then(function(response){
					this.setChart(response.Chart);
					response.Chart.draw(response.data, options);
				}.bind(this),function(){
					console.log('app.chart --> could not load',mapping.method);
				});

			}.bind(this);

			//lets append the chart wrapper to target
			this.getTarget().append($chart);

			if (packages_to_load.length)
				google.charts.load('current', {'packages':[ packages_to_load.join() ]});

			google.charts.setOnLoadCallback(_draw);
		}.bind(this));
	}
};

// Export node module.
if ( typeof module !== 'undefined' && module.hasOwnProperty('exports') ){
	module.exports = UTILS.Chart;
}