if (!UTILS) var UTILS = {};

UTILS.values = {
	object:'utils',
	version:'1.1.0',
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

//the transition event listener must be attached only after the $elm is added to the DOM otherwise the css properties are not available
UTILS.attachTransitionEvent = (elm,css_prop) => {
	let $elm = $(elm),
		event_regex = UTILS.format.toRegex(`/^${css_prop}/`),
		orig_value = $elm.css(css_prop);

	//lets record original css value before any transitions take place
	//it will be used as a point of reference to know the state of the transition
	$elm
		.attr('data-orig-trans-value',orig_value)
		.on(UTILS.values.transition_event_end,event => {
			//lets filter for the specified transition only
			if (event_regex.test(event.originalEvent.propertyName)){
				let event_state = $elm.css(css_prop)!==orig_value ? 'midway' : 'completed';

				$elm.trigger(event_state,{ event:event.originalEvent });
			}
		});
};

UTILS.isRetina = function(){
	return (window.devicePixelRatio > 1 || (window.matchMedia && window.matchMedia("(-webkit-min-device-pixel-ratio: 1.5),(-moz-min-device-pixel-ratio: 1.5),(min-device-pixel-ratio: 1.5)").matches));
};

UTILS.isMobile = () => {
	let check = false;
	(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
	return check;
};

UTILS.isMobileAndTablet = () => {
	let check = false;
	(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
	return check;
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
	},
	getInitialsFromName: function(name=''){
		return (name.match(/\b\w{1,1}(?=\w*$)|\b\w/g) || [])
			.map((letter) => letter.toUpperCase())
			.join('');
	}
}; //format

UTILS.inputMask = {
	phone: function(input){
		var $input = $(input);

		var mask = new IMask($input[0], {
			mask: [
				//{ mask:'+0 000-000-0000', startsWith:'1', lazy:false, country:'United States' },
				{ mask:'+00 {0} 000-00-0000', startsWith:'49', lazy:false, country:'Germany' },
				{ mask:'000-000-0000', startsWith:'', lazy:true, country: 'United States' }
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
UTILS.uuid = function(separator='-'){
	let _getRandonNumbers = () => (((1+Math.random())*0x10000)|0).toString(16).substring(1);
	return `${_getRandonNumbers()}${separator}${_getRandonNumbers()}`;
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

UTILS.print = (url_or_elm=null) => {
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

UTILS.imagePreview = ($img=$('.app-thumbnail'),attr='href') => {
	//distance from the cursor
	let $image = $($img),
		offset = { x:10, y:30 },
		image_dims = { width:500, height:500 },
		$preview = $('<p class="app-thumbnail-preview"><img alt="Image preview"></p>');

	//display the preview within browser bounderies
	let _getPosition = ($thumb,$preview,event) => {
		var pos = { top:event.pageY-offset.x, left:event.pageX+offset.y },
			page = { w:$(window).width(), h:$(window).height() },
			preview = { w:$preview.outerWidth(), h:$preview.outerHeight() },
			thumb = { w:$thumb.width(), h:$thumb.height() },
			$img = $preview.find('img');

		if (pos.left+preview.w > page.w)
			pos.left -= (preview.w+thumb.w+offset.x);
		if (pos.top+preview.h > page.h)
			pos.top = page.h-preview.h-10;

		//lets try adjust the width/height of the image
		(page.w<image_dims.width) && ($img.width(page.w-40));
		(page.h<image_dims.height) && ($img.height(page.h-40));

		if ($(window).width()<768 && pos.left<0)
			pos.left = event.pageX+offset.y;

		return pos;
	};

	$image
		.hover(
			function(event){
				this._title = this.title;
				this.title = '';
				var content = (this._title != '') ? '<br/>' + this._title : '';
				$preview.find('img').attr('src',$(this).attr(attr)).html(content);
				$('body').append($preview);
				$preview.css(_getPosition($(this).find('img'),$preview,event)).velocity('fadeIn',{ duration:200 });
			},
			function(){
				this.title = this._title;
				$preview.remove();
			}
		)
		.on('mousemove',function(event){ $preview.css(_getPosition($(this).find('img'),$preview,event)); });
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
		headers: _.extend({'X-Requested-With':'XMLHttpRequest'},opts.headers||{}),
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

	return axios(options).then(response => typeof response.data === 'string' ? JSON.parse(response.data) : response.data);
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
	},
	attachTransitionEvent: function(css_prop){
		return this.each(function(){
			UTILS.attachTransitionEvent($(this),css_prop);
		});
	},
	imagePreview: function(attr='data-src'){
		return this.each(function(){ UTILS.imagePreview(this,attr); });
	},

	//$('.app-menu-quickview-control').removeClassRegex(/^hint/);
	removeClassRegex: function(regex){
		return $(this).removeClass(function(index, classes){
			return classes.split(/\s+/).filter(function(c){
				return regex.test(c);
			}).join(' ');
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

//events
(!Event.prototype.getCharKey) && (Event.prototype.getCharKey = function(){ return UTILS.getCharKey(this); });

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
