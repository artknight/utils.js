if (!UTILS) var UTILS = {};

UTILS.values = {
	object:'utils',
	version:'1.0.4',
	numbers: '1234567890',
	letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
	special: ' .,-!@#$%&()?/":;\'',
	url: '?/-_.#,%&()+=!@*$:;',
	transition_event_start: 'webkitTransitionStart otransitionstart oTransitionStart msTransitionStart transitionstart',
	transition_event_end: 'webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend',

	regex: {
		text: /^([a-zA-Z]+)$/,
		email: /^([a-z0-9_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$/,
		url: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
		hex: /^#?([a-f0-9]{6}|[a-f0-9]{3})$/, //#ffffff or #fff
		ip: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
		pwd: /^((?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,16})$/ //6-16 characters, one lower case, one upper case, one digit
	},
	browser: null
};

UTILS.isRetina = function(){
	return (window.devicePixelRatio > 1 || (window.matchMedia && window.matchMedia("(-webkit-min-device-pixel-ratio: 1.5),(-moz-min-device-pixel-ratio: 1.5),(min-device-pixel-ratio: 1.5)").matches));
};

UTILS.isMobile = function(){
	return !!UTILS.values.browser.satisfies({
		mobile: {
			safari: '>=9',
			'android browser': '>3.10'
		}});
};

UTILS.isValidCreditCard = function(str){
	var number = str.replace(/\s+/g,'');

	//convert to array and reverse the number
	number = number.split('').reverse().join('');

	//loop through the number one digit at a time, double the value of every second digit starting from the right, and concatenate the new values with the unaffected digits
	var digits = '';
	for (var i = 0; i<number.length; i++){
		digits += '' + ((i%2) ? number.charAt(i) * 2 : number.charAt(i));
	}

	//add all of the single digits together
	var sum = 0;
	for (var i = 0; i < digits.length; i++){
		sum += (digits.charAt(i) * 1);
	}

	// valid card numbers will be transformed into a multiple of 10
	return (sum % 10) ? false : true;
};

UTILS.isValidEmail = function(str) {
	return !!str.match(UTILS.values.regex.email);
};

UTILS.isValidPhone = function(str){
	return (str.replace(/[^0-9]/g,'').length==10) ? true : false;
};

UTILS.isValidPassword = function(str){
	return !!str.match(UTILS.values.regex.pwd);
};
//e.q. UTILS.isValidDate('02/29/2011');
UTILS.isValidDate = function(str,format='MM/DD/YYYY'){
	return moment(str,format).isValid();
};

UTILS.format = {

	//formats the phone number to (555) 555-5555 x11111
	phone: function(phone,mask='(000) 000-0000 S00000'){
		return UTILS.format.mask(phone,mask);
	},

	//ex. 1234567890 -> 123-456-7890
	mask: function(str,mask){
		if (mask){
			try {
				str = new StringMask(mask).apply(str);
			}
			catch(e){}
		}
		return _.trim(str);
	},

	//'1234567.89' will become '1,234,567.89'
	commafy: function(str){
		return str.replace(
			/^(-?\d+)(\d{3}(\.\d+)?)$/,
			function (_,a,b){
				return UTILS.format.commafy(a)+','+b;
			}
		);
	},

	toBoolean: function(val){
		return /y|yes|true|on|1/i.test(val);
	},

	//if the string is too long, shorten and add (...) to the end
	/*
		@str - string to shorten
		@limit - number of characters allowed
		@ending - what to include inside the parantesis
		UTILS.format.shorten('blabla',3,'...'); --> bla(...)
	*/
	shorten: function(str,limit,ending){
		if (str.length>limit)
			return str.substring(0,limit) + (ending || '...');
		else
			return str;
	},

	/*
		Converts the first letter in each word of a string to Uppercase
		@scope: one			first character of the first word
		@scope: all			first character of every word
	*/
	capitalize: function(str,scope){
		var scope = scope || 'all';
		if (scope=='one')
			return str.toLowerCase().replace(/\b[a-z]/, function(match){ return match.toUpperCase(); });
		else
			return str.toLowerCase().replace(/\b[a-z]/g, function(match){ return match.toUpperCase(); });
	},

	/*
	html: HTML code that needs to be cleaned
	tags_to_ignore: list of tags to ignore, assumes that each tag has a closing tag
*/
	filterOutHTML: function(html,tags_to_ignore){
		var _html = html;
		var tags_to_ignore = tags_to_ignore || 'b,p,i,u,strike,br';
		var _tags_to_ignore = tags_to_ignore.split(',');
		//encoding all ignored tags
		for (i=0; i<_tags_to_ignore.length; i++){
			_html = _html.replace(new RegExp('<'+_tags_to_ignore[i]+'*?>','gi'),'['+_tags_to_ignore[i]+']'); //from <b> becomes [b]
			_html = _html.replace(new RegExp('<\/'+_tags_to_ignore[i]+'*?>','gi'),'[/'+_tags_to_ignore[i]+']'); //from </b> becomes [/b]
		}
		//remove all HTML tags
		_html = _html.replace(/<(.|\n)*?>/gi,'');
		//decoding back all ignored tags
		for (i=0; i<_tags_to_ignore.length; i++){
			_html = _html.replace(new RegExp('\\['+_tags_to_ignore[i]+'*?\\]','gi'),'<'+_tags_to_ignore[i]+'>');
			_html = _html.replace(new RegExp('\\[/'+_tags_to_ignore[i]+'*?\\]','gi'),'</'+_tags_to_ignore[i]+'>');
		}
		return _html;
	},

	urlEncode: function(str){
		return encodeURIComponent(str.toString());
	},
	urlDecode: function(str){
		return decodeURIComponent(str.toString());
	},
	htmlEncode: function(str){
		return he.encode(str.toString());
	},
	htmlDecode: function(str){
		return he.decode(str.toString());
	},
	lzEncode: function(str){
		return LZString.compressToBase64(str);
	},
	lzDecode: function(str){
		return LZString.decompressFromBase64(str);
	},
	idify: function(item_id){
		return item_id ? ~~parseFloat(item_id) : 0;
	},
	toRegex: function(str){
		var regex = null;

		if (/^\/(.)+\/([gim]+)?$/.test(str)){
			var flags = str.replace(/.*\/([gimy]*)$/, '$1'),
				pattern = str.replace(new RegExp('^/(.*?)/'+flags+'$'),'$1');

			regex = new RegExp(pattern, flags);
		}

		return regex;
	}
}; //format

UTILS.inputMask = {
	phone: function(input){
		var $input = $(input);

		var mask = new IMask($input[0], {
			mask: [
				{ mask:'+0 000-000-0000', startsWith:'1', lazy:false, country:'United States' },
				{ mask:'+00 {0} 000-00-0000', startsWith:'49', lazy:false, country:'Germany' },
				{ mask:'000-000-0000', startsWith:'', country: 'United States' }
			],
			dispatch: function (appended, dynamic_mask) {
				var number = (dynamic_mask.value + appended).replace(/\D/g,'');

				return dynamic_mask.compiledMasks.find(function (m) {
					return number.indexOf(m.startsWith) === 0;
				});
			}
		});

		$input.data('imask',mask);

		return mask;
	}
};

UTILS.isValidRegex = function(str){
	return /^\/(.)+\/([gim]+)?$/.test(str);
};

UTILS.getCharKey = function(event){
	if (!event) return 0;
	return event.charCode ? event.charCode : (
		event.keyCode ? event.keyCode : (
			event.which ? event.which : 0
		)
	);
};

//generates random uuid number
UTILS.uuid = function(){
	var s4 = function(){
		return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
	};
	return (s4()+'-'+s4());
};

UTILS.asc = function(_char){
	return _char.charCodeAt(0);
};
UTILS.chr = function(_charcode){
	return String.fromCharCode(_charcode);
};

UTILS.dim = {
	values:{
		$elm: null //holds the global blur object
	},
	show: function(callback,options){
		var defaults = {
			target:$('body'),
			color:'black',
			opac:0.3,
			resize:true,
			onShow:callback||null
		};
		var options = _.extend(defaults,options||{});
		UTILS.dim.values.$elm = new UTILS.Blur(options);
		$('body').addClass('overflow global-dimmer');
		UTILS.dim.values.$elm.show();
	},
	hide: function(){
		UTILS.dim.values.$elm.hide();
		UTILS.dim.values.elm = null;
		$('body').removeClass('overflow global-dimmer');
	}
}; //dim



/*
	FILE
*/
UTILS.file = {
	//get file extension
	ext: function(filename){
		return (/[.]/.exec(filename)) ? /[^.]+$/.exec(filename) : [];
	},

	/* check for file extensions when uploading a file */
	check: function(file,type){
		var type = type || 'img';
		var exts = {
			img: ['jpg','png','bmp','gif','tiff'],
			doc: ['doc','rtf','txt','xls','zip'],
			vid: ['mpeg','mpg','wmv','avi','rm','mp4','mov','fla','swf','flv','f4v'],
			font: ['ttf','otf']
		};
		return _.isIn(exts[type],file.fileExtension().join().toLowerCase()); //join() is required because an array is retured
	}
}; //file

UTILS.fn = {
	bind: function(fn,scope){
		fn.targetScope = scope;
		var args = arguments.length > 2 ? _.forceArray(arguments).slice(2) : null;

		var getRealScope = function(func,args){
			args = _.createArray(args);
			var scope = func.targetScope || window;
			return function(){
				try {
					var _args = _.forceArray(arguments).concat(args);
					return func.apply(scope, _args);
				}
				catch(e) {}
			};
		};

		return getRealScope(fn,args);
	},

	bindMethods: function(scope){
		for (var k in scope){
			var func = scope[k];
			if (typeof(func)=='function'){
				scope[k] = UTILS.fn.bind(func,scope);
			}
		}
	},

	interval: function(fn,interval){
		var args = slice.call(arguments, 2);
		return setTimeout(function(){ return fn.apply(null, args); }, interval);
	},

	clear: function(timer){
		clearTimeout(timer);
		clearInterval(timer);
		return null;
	}
}; //fn

UTILS.isDefined = function(obj){
	return (!_.isUndefined(obj) && !_.isNull(obj));
};

UTILS.getURLParams = function(){
	return Qs.parse(window.location.search, { ignoreQueryPrefix:true });
};

UTILS.addParamToURL = function(url='',params=[]){
	for (let param of params){
		url += (url.split('?')[1] ? '&':'?') + param;
	}
	return url;
};

UTILS.getIframe = function(iframe){
	var $iframe = $(iframe);

	return {
		window: ($iframe.length) ? ($iframe[0].contentWindow ? $iframe[0].contentWindow : $iframe[0].contentDocument.defaultView) : null,
		document: ($iframe.length) ? ($iframe[0].contentDocument || $iframe[0].contentWindow.document) : null
	};
};

UTILS.getIframeWindowObj = function(iframe){
	let iframe_window = null,
		$iframe = UTILS.getIframe(iframe);

	if ($iframe.length)
		iframe_window = $iframe[0].contentWindow ? $iframe[0].contentWindow : $iframe[0].contentDocument.defaultView;

	return iframe_window;
};

UTILS.getIframeDocObj = function(iframe){
	let iframe_document = null,
		$iframe = UTILS.getIframe(iframe);

	if ($iframe.length)
		iframe_document = $iframe[0].contentDocument || $iframe[0].contentWindow.document;

	return iframe_document;
}

UTILS.createPromise = function(){
	var _resolve,
		_reject,
		promise = new Promise(function(resolve,reject){
			_resolve = resolve;
			_reject = reject;
		});

	promise.resolve = _resolve;
	promise.reject = _reject;

	return promise;
};

UTILS.print = function(url_or_elm=null){
	if (!url_or_elm)
		window.print();
	else {
		let $iframe = $('<iframe name="print-wrapper" style="position:absolute; top:-10000000px;"></iframe>'),
			url = /^http|\//i.test(url_or_elm) ? url_or_elm : 'javascript:false;'; //rudimentary check for url string

		let _print = () => {
			if (window.frames['print-wrapper'].document.body.innerHTML.length){
				window.frames['print-wrapper'].focus();
				window.frames['print-wrapper'].print();

				//hack to make sure the print works
				setTimeout(() => { $iframe.remove(); }, 100);
			}
			else
				setTimeout(_print, 500);
		};

		let _onIframeLoaded = () => {
			if (/^javascript/.test(url)){
				let iframe_doc_obj = UTILS.getIframeDocObj($iframe),
					html = $(url_or_elm).html();

				iframe_doc_obj.open();
				iframe_doc_obj.write(`<html><head><title>print content</title></head><body>${html}</body></html>`);
				iframe_doc_obj.close();
			}

			_print();
		};

		$iframe
			.on('load',_onIframeLoaded)
			.prop('src',url)
			.appendTo('body');
	}
	
	return false;
};

UTILS.cookie = {
	create: function(name,value,days){
		if (days){
			var date = new Date();
			date.setTime(date.getTime()+(days*24*60*60*1000));
			var expires = "; expires="+date.toGMTString();
		}
		else
			var expires = "";
		document.cookie = name+"="+value+expires+"; path=/";
	},

	read: function(name){
		var nameEQ = name + "=";
		var ca = document.cookie.split(';');
		for(var i=0;i < ca.length;i++){
			var c = ca[i];
			while (c.charAt(0)==' ')
				c = c.substring(1,c.length);
			if (c.indexOf(nameEQ) == 0)
				return c.substring(nameEQ.length,c.length);
		}
		return null;
	},

	erase: function(name){
		UTILS.cookie.create(name,"",-1);
	}
}; //cookie

//attempt to create a custom console.log method
UTILS.log = function(){
	var is_logging = (typeof APP.showLog!=='undefined' && APP.showLog()) || false;

	if (is_logging){
		var now = new Date(),
			timestamp = now.getHours()+":"+now.getMinutes()+":"+now.getSeconds(),
			args = [].slice.call(arguments);

		if (args.length){
			_log.history = _log.history || [];   //store logs to an array for reference
			_log.history.push(args);

			if (this.console){
				console.log(timestamp.toString(),args.shift().toString(),args);

				if (arguments[0].stack)
					console.error(arguments[0].stack);
			}
		}
	}
};

UTILS.fetch = function(url='',opts={}){
	const options = {
		url: url,
		headers: {'X-Requested-With':'XMLHttpRequest'},
		method: ('method' in opts) ? opts.method.toUpperCase() : 'GET'
	};

	options[/^GET/i.test(options.method)?'params':'data'] = ('data' in opts) ? opts.data : {};

	if ('method' in opts){
		if (/^POST$/i.test(opts.method)){
			options.method = 'POST';
			options.headers['content-type'] = ('content_type' in opts ? opts.content_type : 'application/x-www-form-urlencoded;charset=UTF-8');
			options.data = Qs.stringify(options.data,{ encodeValuesOnly:true });
		}
	}
	
	return axios(options).then(response => response.data);
};

/* EXTENDING LODASH.JS */
_.mixin({
	/* objects */

	isWindow: function(obj){
		return obj!=null && obj===obj.window;
	},

	/* arrays */

	//_.createArray('1,2,3') --> ['1,2,3']
	createArray: function(){
		return _.flatten(_.toArray(arguments));
	},
	forceArray: function(arr1){
		if (_.isArray(arr1))
			return arr1;
		for (var arr2=[],i=0; i<arr1.length; i++){
			arr2.push(arr1[i]);
		}
		return arr2;
	},
	//a better version of the native join array method
	joinArray: function(list,delim){
		try{
			return list.join(delim);
		}
		catch(e){
			var r = list[0] || '';
			_.each(list, function(elm){ r += delim + elm; }, 1);
			return r + '';
		}
	},
	/*
		checks whether an elm is found in the array
		@greedy - if true, performs a greedy comparison (instead of '==' it uses '===') --> defaults to 'false'
	 */
	isIn: function(arr,elm,greedy){
		if (!!greedy)
			return _.indexOf(arr,elm)!=-1 ? true : false;
		else {
			for (var i=0; i<arr.length; i++){
				if (elm==arr[i])
					return true;
			}
			return false;
		}
	},
	compare: function(arr1,arr2){
		return !_.difference(arr1,arr2).length;
	},
	reGroup: function(arr,delim){
		var groups = {};

		return _.reduce(arr,function (result, item){
			var key = (delim) ? item.split(delim)[0] : item[0], //split on delim or first char
				group = groups[key];

			if (!group)
				result.push(group = groups[key] = []);

			group.push(item);

			return result;
		},[]);
	}
});

/* EXTENDING FN JQUERY */
$.extend($.fn,{
	/* VALIDATION */

	// $('#input').validateCreditCard()
	isValidCreditCard: function(){
		return UTILS.isValidCreditCard($(this).val());
	},

	//email
	isValidEmail: function() {
		return UTILS.isValidEmail($(this).val());
	},

	//phone
	isValidPhone: function(){
		return UTILS.isValidPhone($(this).val());
	},

	//password
	isValidPassword: function(){
		return UTILS.isValidPassword($(this).val());
	},

	//e.q. $('#input').isValidDate('02/29/2011');
	isValidDate: function(format='MM/DD/YYYY'){
		return UTILS.isValidDate($(this).val(),format);
	},

	/* FORMAT INPUT */

	//format the numbers into (123) 456-7890
	setPhone: function(){
		return this.each(function(){
			var $input = $(this);

			if ($input.is(':input'))
				$input.val(UTILS.format.phone($input.val()));
			else
				$input.text(UTILS.format.phone($input.text()));
		});
	},

	//$('#phone').setMask('(000) 000-0000'); ( 1234567890 --> (123) 456-7890 )
	setMask: function(mask){
		return this.each(function(){
			var $input = $(this);

			if ($input.is(':input'))
				$input.val(UTILS.format.mask($input.val(),mask));
			else
				$input.text(UTILS.format.mask($input.text(),mask));
		});
	},

	//$('#phone').enableInputMask('phone');
	enableInputMask: function(type='phone'){
		return this.each(function(){
			UTILS.inputMask[type]($(this));
		});
	},

	//allow tabbing inside textarea (not to jump to the next input field)
	//ex. $(textarea).allowTabbing();
	allowTabbing: function(){
		var keysAllowed = {TAB:9};

		return this.each(function(){
			var $input = $(this);
			$input.on('keydown',function(event){
				var charKey = UTILS.events.getCharKey(event);
				if (!_.isIn(_.values(keysAllowed),charKey)){
					event.preventDefault();
					var myValue = "\t";
					var startPos = this.selectionStart;
					var endPos = this.selectionEnd;
					var scrollTop = this.scrollTop;
					this.value = this.value.substring(0, startPos) + myValue + this.value.substring(endPos,this.value.length);
					this.focus();
					this.selectionStart = startPos + myValue.length;
					this.selectionEnd = startPos + myValue.length;
					this.scrollTop = scrollTop;
				}
			});
		});
	},

	/*
		Converts the first letter in each word of a string to Uppercase
		@scope: one			first character of the first word
		@scope: all			first character of every word
	*/
	capitalize: function(scope){
		return this.each(function(){
			var $input = $(this);
			$input.on('keyup',function(event){
				$input.val(UTILS.format.capitalize($input.val()),scope);
			});
		});
	},

	//$("textarea").limitByCount({ limit:100 }); --> NOTE: word count is not the same as character count.
	limitByCount: function(options){
		// setting the defaults
		var defaults = {
			limit:100,
			counterDiv:null, //specifies the div where to show counter
			splitBy: 'word' //can be either 'word' or 'char'
		};
		var options = $.extend(defaults, options),
			splitters = { word:' ',char:''},
			splitter = splitters[options.splitBy];

		// and the plugin begins
		return this.each(function() {
			var $textarea = $(this),
				text, wordcount, limited;

			//lets insert a counter block if not specified
			if (!options.counterDiv){
				options.counterDiv = $('<p class="help-block text-right margin-t0 margin-b6"></p>');
				$textarea.after(options.counterDiv);
			}

			(options.counterDiv) && $(options.counterDiv).html('Max. '+options.limit+' '+options.splitBy+'s');

			// function to check word count in field
			var checkWords = function(){
				text = $textarea.val();
				wordcount = (!text.length) ? 0 : $.trim(text).split(splitter).length;
				if (wordcount >= options.limit){
					(options.counterDiv) && $(options.counterDiv).html('0 '+options.splitBy+'s left');
					limited = $.trim(text).split(splitter, options.limit);
					limited = limited.join(splitter);
					$textarea.val(limited);
				}
				else
					(options.counterDiv) && $(options.counterDiv).html((options.limit - wordcount)+' '+options.splitBy+'s left');
			};

			// if field is not empty, count words
			($textarea.val().length) && checkWords();

			$textarea.keyup(function(event){ event.preventDefault(); checkWords(); });
		});
	},

	//centers the element on the page
	//offset: {x:0,y:0}
	setCenter: function(offset,parent){
		return this.each(function(){
			var $elm = $(this);
			var $parent = _.isObject(parent) ? $(parent) : null;
			var offset = (offset && _.isPlainObject(offset)) ? offset : {x:0,y:0};

			//if box inside scrollable, we do not need to set anything
			if ($elm.parent().hasClass('box-scrollable'))
				return;

			(!$elm.attr('class').match(/pos-fixed|pos-absolute/g)) && $elm.addClass('pos-absolute'); //add class if not found
			var data = {
				left:($parent!=null) ? ($parent.outerWidth()/2) : (($(window).width()+$(window).scrollLeft())-$(window).width()/2),
				top:($parent!=null) ? ($parent.outerHeight()/2) : (($(window).height()+$(window).scrollTop())-$(window).height()/2)
			};
			//if position is 'fixed' then we must only consider the width & height of the window, no scrolling
			if ($elm.hasClass('pos-fixed')){
				data.left = $(window).width()/2;
				data.top = $(window).height()/2;
			}
			//getting coords in regards to the elm
			data.left -= ($elm.outerWidth()/2)+offset.x;
			data.top -= ($elm.outerHeight()/2)+offset.y;
			$elm.css(data);
		});
	},
	//ignore children from .text()
	ignore: function(sel){
		return this.clone().find(sel).remove().end();
	},
	//gets the next/previous node (might not have the same parent)
	nextNodeByClass: function(className){
		var $node = this;
		if (className){
			className = '.'+className.replace(/\./g,''); //making sure the slass has a 'dot' in front
			var $all = $(className);
			$node = $all.eq($all.index($node)+1);
		}
		return $node;
	},
	prevNodeByClass: function(className){
		var $node = this;
		if (className){
			className = '.'+className.replace(/\./g,''); //making sure the class has a 'dot' in front
			var $all = $(className),
				index = Math.abs($all.index($node))-1;
			$node = (index>=0) ? $all.eq(index) : $([]);
		}
		return $node;
	},
	putCursorAtEnd: function(custom_focus_event='focus'){
		return this.each(function(){
			let $field = $(this);

			if (/true/i.test($field.prop('contenteditable'))){
				let range,
					selection;

				if (document.createRange){
					range = document.createRange();
					range.selectNodeContents(this);
					range.collapse(false);

					if (range.startOffset && range.endOffset){
						selection = window.getSelection();
						selection.removeAllRanges();
						selection.addRange(range);
					}
				}
			}
			else
				$field.on(custom_focus_event,function(event){
					setTimeout(function(){ this.selectionStart = this.selectionEnd = 10000; }.bind(this), 0); 
				});

			$field.focus();
		});
	}
});

/* EXTENDING EXPR JQUERY */
$.extend($.expr[':'],{
	regex: function(elem, index, match) {
		var matchParams = match[3].split(','),
			validLabels = /^(data|css):/,
			attr = {
				method: matchParams[0].match(validLabels) ?
					matchParams[0].split(':')[0] : 'attr',
				property: matchParams.shift().replace(validLabels,'')
			},
			regexFlags = 'ig',
			regex = new RegExp(matchParams.join('').replace(/^\s+|\s+$/g,''), regexFlags);
		return regex.test(jQuery(elem)[attr.method](attr.property));
	},
	width: function(a,i,m) {
		if(!m[3]||!(/^(<|>)d+$/).test(m[3])) {return false;}
		return m[3].substr(0,1) === '>' ?
			$(a).width() > m[3].substr(1) : $(a).width() < m[3].substr(1);
	},
	// New method, "data"
	data: function(a,i,m) {
		var e = $(a).get(0), keyVal;

		// m[3] refers to value inside parenthesis (if existing) e.g. :data(___)
		if (!m[3]){
			// Loop through properties of element object, find any jquery references:
			for (var x in e) {
				if ((/jQueryd+/).test(x))
					return true;
			}
		}
		else {
			// Split into array (name,value):
			keyVal = m[3].split('=');

			// If a value is specified:
			if (keyVal[1]){
				// Test for regex syntax and test against it:
				if(/^.+([mig]+)?$/.test(keyVal[1])) {
					return (new RegExp(
							keyVal[1].substr(1,keyVal[1].lastIndexOf('/')-1),
							keyVal[1].substr(keyVal[1].lastIndexOf('/')+1))
					).test($(a).data(keyVal[0]));
				}
				else // Test key against value:
					return $(a).data(keyVal[0]) == keyVal[1];
			}
			else {
				// Test if element has data property:
				if ($(a).data(keyVal[0]))
					return true;
				else {
					// If it doesn't remove data (this is to account for what seems
					// to be a bug in jQuery):
					$(a).removeData(keyVal[0]);
					return false;
				}
			}
		}
		// Strict compliance:
		return false;
	}
});

//css-grid support
$.cssNumber.gridRowStart = $.cssNumber.gridRowEnd = $.cssNumber.gridColumnStart = $.cssNumber.gridColumnEnd = true;

//array object
(!Array.prototype.first) && (Array.prototype.first = function(num_of_elms){ return (typeof num_of_elms==='number') ? _.dropRight(this,this.length-num_of_elms) : _.first(this); });
(!Array.prototype.last) && (Array.prototype.last = function(num_of_elms){ return (typeof num_of_elms==='number') ? _.drop(this,this.length-num_of_elms) : _.last(this); });
(!Array.prototype.min) && (Array.prototype.min = function(){ return _.min(this); });
(!Array.prototype.max) && (Array.prototype.max = function(){ return _.max(this); });
(!Array.prototype.index) && (Array.prototype.index = function(elm){ return _.indexOf(this,elm); });
(!Array.prototype.flatten) && (Array.prototype.flatten = function(){ return _.flatten(this); });
(!Array.prototype.diff) && (Array.prototype.diff = function(array){ return _.difference(this,array); });
(!Array.prototype.isIn) && (Array.prototype.isIn = function(elm){ return _.isIn(this,elm); });
(!Array.prototype.intersect) && (Array.prototype.intersect = function(arr){ return _.intersection(this,arr); });
(!Array.prototype.compare) && (Array.prototype.compare = function(arr){ return _.compare(this,arr); });
(!Array.prototype.prepend) && (Array.prototype.prepend = function(elm){ return this.unshift(elm); });
(!Array.prototype.reGroup) && (Array.prototype.reGroup = function(delim){ return _.reGroup(this,delim); });

//functions
(!Function.prototype.delay) && (Function.prototype.delay = function(interval,args){ return _.delay(this,interval,args); });
(!Function.prototype.interval) && (Function.prototype.interval = function(interval,args){ return UTILS.fn.interval(this,interval,args); });
(!Function.prototype.bind) && (Function.prototype.bind = function(scope,args){ return UTILS.fn.bind(this,scope,args); }); //adds bind to prototype if not natively present (older browsers)
(!jQuery.fetch) && (jQuery.fetch = UTILS.fetch);

//strings
(!String.prototype.urlEncode) && (String.prototype.urlEncode = function(){ return UTILS.format.urlEncode(this); });
(!String.prototype.urlDecode) && (String.prototype.urlDecode = function(){ return UTILS.format.urlDecode(this); });
(!String.prototype.htmlEncode) && (String.prototype.htmlEncode = function(){ return UTILS.format.htmlEncode(this); });
(!String.prototype.htmlDecode) && (String.prototype.htmlDecode = function(){ return UTILS.format.htmlDecode(this); });
(!String.prototype.sha1Encode) && (String.prototype.sha1Encode = function(){ return UTILS.Encryption.sha1(this); });
(!String.prototype.base64Encode) && (String.prototype.base64Encode = function(){ return UTILS.Encryption.base64.encode(this); });
(!String.prototype.base64Decode) && (String.prototype.base64Decode = function(){ return UTILS.Encryption.base64.decode(this); });
(!String.prototype.lzEncode) && (String.prototype.lzEncode = function(){ return UTILS.format.lzEncode(this); });
(!String.prototype.lzDecode) && (String.prototype.lzDecode = function(){ return UTILS.format.lzDecode(this); });
(!String.prototype.fileExtension) && (String.prototype.fileExtension = function(){ return UTILS.file.ext(this); });
(!String.prototype.capitalize) && (String.prototype.capitalize = function(scope){ return UTILS.format.capitalize(this,scope); });
(!String.prototype.idify) && (String.prototype.idify = Number.prototype.idify = function(){ return UTILS.format.idify(this); });
(!String.prototype.shorten) && (String.prototype.shorten = function(limit,ending){ return UTILS.format.shorten(this,limit,ending); });
(!String.prototype.toRegex) && (String.prototype.toRegex = function(){ return UTILS.format.toRegex(this); });
(!String.prototype.isValidRegex) && (String.prototype.isValidRegex = function(){ return UTILS.isValidRegex(this); });

//fix parseInt
(function(){ var old_parseInt = parseInt; parseInt = function(number,radix){ return old_parseInt(number,radix || 10); }; }());

window.toBoolean = UTILS.format.toBoolean;
window._log = UTILS.log;

//export node module.
if (typeof module!=='undefined' && module.hasOwnProperty('exports')){
	module.exports = {
		Array: Array,
		String: String,
		Function: Function,
		parseInt: parseInt,
		UTILS: UTILS,
		toBoolean: UTILS.format.toBoolean,
		_log: UTILS.log
	};
}