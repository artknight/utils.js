/*
    == UTILS.Editable ==

	== dependencies ==
	jquery.js
	bootstrap.js
	selectize.js
	bootstrap-datepicker.js

	** example **
	var editable = new UTILS.Editable({
		target: $('#button'),
		type: 'select',
		items: [
			{ label:'Javascript',value:'JS' },
			{ label:'Python',value:'PY' }
		],
		field: 'language'
	});

	== definitions ==
		@target - (required) DOM elm where the dropdown will be shown

	** local
		@items - (required) items that will be the options of the dropdown
		@params - (optional) parameters to be passed in the ajax call onSave
		@type - (optional)
				- type of the input field to show --> defaults to 'input' ( avail. options input|textarea|select|date )
				- sometimes type can consist of a subtype --> 'select-selectize' or 'checkbox-switch' to provide a deeper configuration

		@options - (optional) used in date and checkbox to provide additional configuration options
		@css - (optional) extra css classes to be added to the input field --> defaults to ''
		@container - (optional) DOM elm where the popover will be inserted --> defaults to 'body'
		@direction - (optional) direction of the popover --> defaults to 'bottom'
		@tabbing - (optional) state to allow tabbing in inline configuration --> defaults to 'false'
		@field - (optional) name of the field containing the updated value
		@filterValueForEditing - (optional) method to format value before displaying it for editing --> $10.00 should be displayed as 10.00
		@filterValueForDisplay - (optional) method to format value before updating the original parent value --> 10.00 should be displayed as $10.00
*/
UTILS.Editable = class extends UTILS.Base {
	constructor(data={}){
		super(data);

		if ('type' in data ){
			//if date, lets set some default settings
			if (/^date/i.test(data.type)){
				this.values.options = {
					container: this.getContainer(),
					orientation: 'bottom',
					autoclose: false,
					format: 'MM/DD/YYYY',
					startDate: moment().add(1, 'day').toDate(),
					todayHighlight: true
				};
			}
			else if (/^textarea\-wysiwyg/i.test(data.type)){
				this.values.options = {
					toolbar: [
						['style', ['bold', 'italic', 'underline', 'strikethrough','color','clear']],
						['para', ['ul', 'ol']],
						['insert', ['picture', 'link', 'table', 'hr']],
						//['misc', ['undo', 'redo']],
						//['view', ['fullscreen', 'codeview']],
						['code', ['gxcode']],
						['misc2', ['print']]
					]
				};
			}
			else if (/^select\-multiselect/i.test(data.type)){
				this.values.options = {
					search_url: null //lookup url
				};
			}
		}

		 this._onSave = _.debounce(this.__onSave__.bind(this),500);

		('params' in data) && this.setParams(data.params);
		('field' in data) && this.setFieldName(data.field);
		('type' in data) && this.setType(data.type);
		('options' in data) && this.setOptions(data.options);
		('css' in data) && this.setCss(data.css);
		('filterMethodForEditingValue' in data) && this.setFilterMethodForEditingValue(data.filterMethodForEditingValue);
		('filterMethodForDisplayValue' in data) && this.setFilterMethodForDisplayValue(data.filterMethodForDisplayValue);
		('tabbing' in data) && this.setInlineTabbing(data.tabbing);
		('lazyload' in data) && this.setLazyLoadState(data.lazyload);
		('contenteditable' in data) && this.setContentEditableState(data.contenteditable);
		('toggle' in data) && this.setToggleAction(data.toggle);
		('items' in data) && this.setItems(data.items);
		('container' in data) && this.setContainer(data.container);
		('onShow' in data) && this.addCallback('onShow', data.onShow);
		('onHide' in data) && this.addCallback('onHide', data.onHide);
		('onCancel' in data) && this.addCallback('onCancel',data.onCancel);
		('onBeforeSave' in data) && this.addCallback('onBeforeSave',data.onBeforeSave);
		('onAfterSave' in data) && this.addCallback('onAfterSave',data.onAfterSave);
		('onSaveError' in data) && this.addCallback('onSaveError',data.onSaveError);
		('onActionTriggered' in data) && this.addCallback('onActionTriggered',data.onActionTriggered);
		('onAfterActionTriggered' in data) && this.addCallback('onAfterActionTriggered', data.onAfterActionTriggered);
		('onNoChange' in data) && this.addCallback('onNoChange',data.onNoChange);
		('onInputCreate' in data) && this.addCallback('onInputCreate', data.onInputCreate);
		('value' in data) && this.setValue(data.value);
		('placeholder' in data) && this.setPlaceholder(data.placeholder); //lets put it at the end to avoid race conditions

		return this;
	}
	getDefaults(){
		return {
			object: 'utils.editable',
			version: '0.6.6',
			direction: 'top',
			type: { base:'input', option:null }, //holds the type of the editable input field
			css: '', //holds the css classes to be added to the input field
			params: null, //holds the extra params to be passed in ajax calls
			$cell: null, //holds the input cell
			$input: null, //holds the input field ( except for date fields )
			$container: $('body'), //holds DOM where popover will be appended to
			value: null, //holds the new value
			DatePicker: null, //holds the date picker object
			Selectize: null, //holds the selectize object
			options: {}, //holds options
			field_name: '@field', //holds the field name to be passed to the server
			placeholder: '--', //holds the placeholder value when there is no value to be displayed
			is_lazyload: false, //holds whether the element is lazy-loaded ( true --> the trigger event was extrapolated and there is no need to add another one )
			toggle_action: 'click', //toggle action to show/hide the popover
			Spinner: new UTILS.Spinner({ type:'medium', center:true, color:'black', blur:true }), //holds the spinner
			is_inline_tabbing: false, //holds whether tabbing should be allowed for inline editing
			items: [], //holds the items
			is_enabled: false, //holds the enable/disable state of the popover
			is_shown: false, //holds the display state
			display_filtermethod: null,
			edit_filtermethod: null,
			is_contenteditable: false, //holds whether we want the content to be edited within the target element
			_is_cell_created: null
		}
	}
	getCss(){
		return this.values.css;
	}
	setCss(css){
		this.values.css = css||'';
	}
	//sometimes we need to set it to NULL to make sure no ajax call happens
	setAjaxData(ajax){
		if (_.isPlainObject(ajax))
			super.setAjaxData(ajax);
		else
			this.values.ajax = (ajax===null) ? {} : ajax;
		return this;
	}
	getContainer(){
		return this.values.$container;
	}
	setContainer(container){
		this.values.$container = $(container);
		return this;
	}
	isLazyLoad(){
		return this.values.is_lazyload;
	}
	setLazyLoadState(state){
		this.values.is_lazyload = !!(state);
		return this;
	}
	isContentEditable(){
		return this.values.is_contenteditable;
	}
	setContentEditableState(state){
		//only applies to input or textarea fields
		if (this.isTypeInput() || this.isTypeTextarea())
			this.values.is_contenteditable = !!(state);

		return this;
	}
	getPlaceholder(value){
		return _.isFunction(this.values.placeholder) ? this.values.placeholder(value,this) : this.values.placeholder;
	}
	setPlaceholder(placeholder){
		if (placeholder)
			this.values.placeholder = placeholder;

		return this;
	}
	getItems(){
		return _.clone(this.values.items);
	}
	_createOption(item,css){
		let option;

		if (_.isString(item))
			option = { label:item, value:item, css:'' };
		else if (_.isPlainObject(item)){
			option = {
				label: item.label || '',
				value: item.value || '',
				css: item.css || ''
			};
		}

		//lets add external css if passed in
		if (css)
			option.css += ' '+css;

		return option;
	}
	setItems(items){
		//lets check if all elms are strings or objects
		if (_.every(items, elm => typeof elm==='string') || _.every(items, elm => _.isPlainObject(elm)))
			this.values.items = _.map(items,this._createOption.bind(this));

		return this;
	}
	//formats the input field value ( on edit )
	_filterValueForEditing(value){
		var _value = value;

		if (typeof this.values.edit_filtermethod==='function')
			_value = this.values.edit_filtermethod(value,this);

		if (this.values.placeholder===_value)
			_value = '';

		return _value;
	}
	//formats the display value of target ( after edit )
	_filterValueForDisplay(value){
		var type = this.getType(),
			is_multiselect = this.isMultiSelect(),
			items = this.getItems(),
			_value = value;

		//filter method
		if (typeof this.values.display_filtermethod==='function')
			_value = this.values.display_filtermethod(value,this);
		//multiselect
		else if (is_multiselect){
			_value = _.map(value, selected_value => {
				let found = _.find(items, item => (item.value==selected_value));

				return (found) ? found.label : selected_value;
			}).join(', ');
		}
		//select or radio
		else if (/^(select|radio)$/.test(type.base)){
			var item = _.find(items, item => (item.value==value)); //using '==' to compare strings and integers alike

			if (item)
				_value = item.label;
		}

		if (!_value.length)
			_value = this.values.placeholder;

		return _value;
	}
	_onActionTriggered(){
		this.values._is_cell_created.then(() => {
			let $target = this.getTarget(),
				$cell = this.getCell(),
				is_type_date = this.isTypeDate(),
				is_type_checkbox = this.isTypeCheckbox(),
				is_type_radio = this.isTypeRadio(),
				is_type_dropdown = this.isTypeDropDown(),
				is_selectize = this.isSelectize(),
				is_multiselect = this.isMultiSelect(),
				is_wysiwyg = this.isWysiwyg(),
				is_type_textarea = this.isTypeTextarea(),
				is_contenteditable = this.isContentEditable(),
				$input = this.getInputField(),
				$next_editable = $target.nextNodeByClass('editable-target'),
				value = this.getValue(),
				items = this.getItems(),
				options = this.getOptions(),
				is_processing = false,
				keys = { ENTER:13, ESCAPE:27, TAB:9 },
				active_keys = [keys.ESCAPE];

			//we need ENTER key to be used within textarea
			if (!is_type_textarea && !is_multiselect)
				active_keys.push(keys.ENTER);

			var _triggerNextEditable = () => {
				$next_editable.trigger(this.getToggleAction());
			};

			this.fns('onActionTriggered');

			if (!is_type_date && !is_type_checkbox){
				//content editables
				if (is_contenteditable){
					let prev_value = $input.text();

					//lets set the prev value & contenteditable attr
					$input
						.data('prev-value',prev_value)
						.prop('contenteditable',true)
						.text(this._filterValueForEditing(prev_value))
						.putCursorAtEnd();
				}

				$input.on('keydown.utils.editable', event => {
					let $field = $(event.currentTarget),
						value = $field[is_contenteditable ? 'text' : 'val']();

					if (active_keys.isIn(UTILS.getCharKey(event))){ //enter & escape
						event.preventDefault();
						this._onSave(value);
						is_processing = true;
					}
					else if ([keys.TAB].isIn(UTILS.getCharKey(event)) && this.isInlineTabbing()){ //tab
						event.preventDefault();
						is_processing = true;

						if ($next_editable.length)
							this._onSave(value).then(_triggerNextEditable);
						else
							this._onSave(value);
					}
				});

				//for dropdowns we need to update the options when activated rather than at creation
				//otherwise new options do not appear when clicked second time
				if (is_type_dropdown){
					if (items.length)
						$input.empty().append(_.map(items, item => $('<option value="'+item.value+'">'+item.label+'</option>')));
				}

				//for radios we need to set it differently
				if (is_type_radio)
					$input.val([value]);
				else if (!is_contenteditable) //no need to set it for content editables
					$input.val(value);

				//lets check for selectize
				if (is_selectize || is_multiselect){
					let _onItemSelected = item => {
						let value = _.clone(this.getValue()),
							is_multiselect = this.isMultiSelect();

						if (is_multiselect)
							value.push(item);

						this.setValue(value);
					};

					let _onItemRemoved = item_value => {
						let value = _.clone(this.getValue()),
							is_multiselect = this.isMultiSelect();

						if (is_multiselect)
							_.remove(value, item => item==item_value);

						this.setValue(value);
					};

					let _normalizeItemsForSelectize = items => {
						return _.map(items, item => {
							return {
								text: item.label,
								value: item.value
							}
						});
					};

					let _onItemSearch = (query='') => {
						return new Promise((resolve,reject) => {
							let $cell = this.getCell(),
								spinner = this.getSpinner(),
								options = this.getOptions(),
								ajax_options = {
									method: 'GET',
									data: ('onBeforeSearch' in options) ? options.onBeforeSearch.call(this,query.urlEncode()) : { q:query.urlEncode() }
								},
								onAfterSearch = response => {
									spinner.hide();

									if (_.isString(response))
										response = JSON.parse(response);

									if (!UTILS.Errors.isError(response)){ //success
										let items = ('onAfterSearch' in options) ? options.onAfterSearch.call(null,response) : response;

										//now we need to replenish the options
										let new_items = _.uniqBy([...this.getItems(),...items],'value');
										this.setItems(new_items);

										//lets check if the formatting is on par with selectize
										if (!_.every(items, item => ('text' in item) && ('value' in item)))
											items = _normalizeItemsForSelectize(items);

										resolve(items);
									}
									else
										reject();
								},
								onError = error => {
									spinner.hide();

									if (error instanceof Error)
										UTILS.Errors.show(error.message);

									reject();
								};

							if ('method' in options)
								ajax_options.data.method = options.method;

							if ('content_type' in options){
								ajax_options.content_type = options.content_type;

								if (/\/json$/.test(options.content_type))
									ajax_options.data = JSON.stringify(ajax_options.data);
							}

							spinner.setTarget($cell).show();
							$.fetch(options.search_url, ajax_options).then(onAfterSearch).catch(onError);
						});
					};

					let selectize_options = {
						create: false,
						selectOnTab: this.isInlineTabbing(),
						onFocus: () => {
							is_processing = false;
							this.removeErrorTooltip();
						},
						onBlur: () => {
							var value = this.getSelectize().getValue();

							if (!is_processing){
								this._onSave(value);
								is_processing = true;
							}
						}
					};

					if (is_selectize){
						_.extend(selectize_options, {
							onChange: () => {
								let value = this.getSelectize().getValue();

								if (value.length){
									this._onSave(value);
									is_processing = true;
								}
							}
						});
					}
					else if (is_multiselect){
						_.extend(selectize_options, {
							delimiters: ',',
							plugins: ['remove_button'],

						});

						//catching enter key to make sure no page refresh
						this.getCell().on('keypress.utils.editable', event => {
							if ([keys.ENTER].isIn(UTILS.getCharKey(event))) //enter
								event.preventDefault();
						});
					}

					//lets set the search url if privided
					if (options.search_url){
						_.extend(selectize_options, {
							maxItems: ('limit' in options) ? options.limit : (is_multiselect ? null : 1),
							onItemRemove: _onItemRemoved,
							onItemAdd: _onItemSelected,
							render: {
								item: (item, escape) => {
									return '<div><span class="editable-text">'+escape(item.text)+'</span></div>';
								},
								option: (item, escape) => {
									return '<div class="padding-t5 padding-b5"><span class="editable-text">'+escape(item.text)+'</span></div>';
								}
							},
							load: (query, selectize_callback) => {
								if (query.length < 2)
									return selectize_callback();

								_onItemSearch(query).then(items => selectize_callback.call(null,items));
							}
						});
					}

					_.extend(selectize_options, options);

					$input
						.data('prev-value',value)
						.selectize(selectize_options);

					//lets store the selectize object
					this.values.Selectize = $input[0].selectize;
				}
				else if (is_wysiwyg){
					var self = this; //workaround to make sure the controls reference the utils.editable

					$input.summernote(_.extend({},options,{
						followingToolbar: false,//lets disable summernote native 'followScroll' method
						callbacks: {
							onInit: function(divs){
								//lets add the save/close controls
								var summernote = $(this).data('summernote'),
									$editor = divs.editor,
									$controls = $(`
									<div class="textarea-wysiwyg-controls">
									 	<a href="#" class="badge badge-primary control-item control-save"><i class="mdi mdi-check"></i></a>
									 	<a href="#" class="badge badge-primary control-item control-cancel"><i class="mdi mdi-close"></i></a>
									</div>
								`);

								//lets add events
								$controls.find('.control-save').on('click',event => {
									event.preventDefault();

									var value = summernote.code();

									if (value.length && !is_processing){
										self._onSave(value);
										is_processing = true;
									}
								});

								$controls.find('.control-cancel').on('click',event => {
									event.preventDefault();
									self._onBeforeHide()._hide();
									is_processing = false;
								});

								$editor.append($controls);
							},
							onFocus: () => {
								is_processing = false;
								this.removeErrorTooltip();
							}
						}
					}));
				}
				else {
					if (!is_type_radio){
						$input.on('focus.utils.editable', event => {
							event.preventDefault();
							is_processing = false;

							this.removeErrorTooltip();
						});
					}

					if (!this.isInlineTabbing() && !is_contenteditable){
						$input.on('change.utils.editable', event => {
							event.preventDefault();
							event.stopPropagation();

							if (!is_processing){
								this._onSave($input.val());
								is_processing = true;
							}
						});
					}

					//for radios the blur events override the change events and cause weirdness, so we need to check for that differently
					if (is_type_radio){
						$(document).on('click.utils.editable',event => {
							if (!/(^|\s)(editable-target|custom-control-label|popup-editable-field)(\s|$)/.test($(event.target).attr("class"))){
								this._onBeforeHide();
								this._hide();
							}
						});
					}
					else {
						$input.on('blur.utils.editable', event => {
							event.preventDefault();
							event.stopPropagation();

							if (!is_processing){
								let value = $input[is_contenteditable ? 'text' : 'val']();

								this._onSave(value);
								is_processing = true;
								this.removeErrorTooltip();
							}
						});
					}
				}

				if (!is_contenteditable){
					$target.addClass('is-edited').after($cell.css({ position:'absolute' }));

					//lets make sure the parent has the relative class
					let $target_parent = $target.parent();

					if (!$target_parent.attr('class').match(/pos-fixed|pos-absolute|pos-relative/g) && !/absolute|relative|fixed/i.test($target_parent.css('position')))
						$target_parent.addClass('pos-relative'); //add class if not found

					//lets position the editable field correctly
					let pos = $target.position();

					if (/flex/i.test($target_parent.css('display')))
						pos.left += parseInt($target.css('margin-left'));

					$cell.css({
						top: pos.top + $target.height(),
						left: pos.left,
						minWidth: 250
					});
				}

				this._show();

				//need to focus on the field so that the onblur kicks in
				if (is_selectize || is_multiselect)
					$input[0].selectize.focus();
				else if (is_wysiwyg)
					$input.summernote('focus');
				else if (is_type_radio)
					$input.filter(':checked').focus();
				else
					$input.focus();
			}

			this.fns('onAfterActionTriggered');
		});
	}
	removeErrorTooltip(){
		let $input = this.getInputField(),
			Hint = $input.data('utils.hint');

		if (Hint)
			Hint.clean();

		return this;
	}
	enable(){
		_log(this.getObjectName()+' --> editable enabled');

		if (!this.values.is_enabled){
			var $target = this.getTarget(),
				is_type_checkbox = this.isTypeCheckbox(),
				$cell = this.getCell(),
				is_cell_created = $cell && $cell.length;

			if (is_cell_created){
				if (is_type_checkbox)
					this.getInputField().prop('disabled',false);
				else if ($target.hasClass('readonly'))
					$target.removeClass('readonly');

			}
			//no cell created so need to run this process the first time
			else {
				var toggle_action = this.getToggleAction(),
					is_lazyload = this.isLazyLoad();

				this.values._is_cell_created = this._createCell()
					.then(() => {
						if (!is_type_checkbox){
							if (!is_lazyload){
								$target.on(toggle_action, event => {
									event.preventDefault();

									if (!/true/i.test($target.prop('contenteditable')))
										this._onActionTriggered();
								});
							}
						}
					});
			}

			this.values.is_enabled = true;
		}

		return this;
	}
	disable(){
		_log(this.getObjectName()+' --> editable disabled');

		if (this.values.is_enabled){
			var $target = this.getTarget(),
				is_type_checkbox = this.isTypeCheckbox();

			if (is_type_checkbox)
				this.getInputField().prop('disabled',true);
			else
				$target.addClass('readonly');

			this.values.is_enabled = false;
		}
		return this;
	}
	getToggleAction(){
		return this.values.toggle_action;
	}
	setToggleAction(toggle_action){
		if (toggle_action)
			this.values.toggle_action = /\.utils\.editable$/.test(toggle_action) ? toggle_action : toggle_action+'.utils.editable';

		return this;
	}
	getSpinner(){
		return this.values.Spinner;
	}
	setFilterMethodForEditingValue(method){
		(typeof method==='function') && (this.values.edit_filtermethod = method);
		return this;
	}
	setFilterMethodForDisplayValue(method){
		(typeof method==='function') && (this.values.display_filtermethod = method);
		return this;
	}
	getFieldName(){
		return this.values.field_name; //field name to be passed in the ajax call
	}
	setFieldName(field_name){
		(field_name) && (this.values.field_name = field_name);
		return this;
	}
	isInlineTabbing(){
		return this.values.is_inline_tabbing; //field name to be passed in the ajax call
	}
	setInlineTabbing(state){
		this.values.is_inline_tabbing = !!(state);
		return this;
	}
	getDateFormat(){
		return this.values.date_format;
	}
	setDateFormat(date_format){
		(date_format) && (this.values.date_format = date_format);
		return this;
	}
	setTarget(target){
		super.setTarget(target);
		this.getTarget().addClass('editable-target');

		if (!this.getTarget().html().length)
			this._setDisplayValue(this.values.placeholder);

		return this;
	}
	getType(){
		return this.values.type;
	}
	setType(type){
		if (type){
			this.values.type = {
				base: type.split('-')[0],
				option: type.split('-')[1]
			};

			if (this.values.type.option && /^wysiwyg/i.test(this.values.type.option))
				this.getTarget().addClass('editable-wysiwyg');
		}
		return this;
	}
	isTypeDate(){
		return /^date$/i.test(this.getType().base);
	}
	isTypeCheckbox(){
		return /^checkbox/i.test(this.getType().base);
	}
	isTypeRadio(){
		return /^radio/i.test(this.getType().base);
	}
	isTypeInput(){
		return /^input/i.test(this.getType().base);
	}
	isTypeDropDown(){
		return /^select/i.test(this.getType().base);
	}
	isTypeTextarea(){
		return /^textarea/i.test(this.getType().base);
	}
	isSelectize(){
		return /^selectize/i.test(this.getType().option);
	}
	isMultiSelect(){
		return /^multiselect/i.test(this.getType().option);
	}
	isWysiwyg(){
		return /^wysiwyg/i.test(this.getType().option);
	}
	getValue(){
		return this.values.value;
	}
	setValue(value){
		this.values.value = value;

		//accounting for lazyload
		if (this.isLazyLoad()){
			var $target = this.getTarget(),
				target_options = $target.data('editable-options');

			if (_.isPlainObject(target_options))
				$target.data('editable-options', _.extend(target_options,{ value:value }));
		}

		this._setDisplayValue(value);

		return this;
	}
	_setDisplayValue(value){
		var $target = this.getTarget(),
			is_type_checkbox = this.isTypeCheckbox(),
			_value = (is_type_checkbox) ? value : this._filterValueForDisplay(value);

		if (!is_type_checkbox)
			$target.html(_value);

		return this;
	}
	getDisplayValue(){
		var $target = this.getTarget(),
			is_type_checkbox = this.isTypeCheckbox(),
			is_contenteditable = this.isContentEditable();

		return is_type_checkbox ? this.getValue() : (is_contenteditable ? $target.data('prev-value') : $target.text());
	}
	getParams(){
		return this.values.params;
	}
	setParams(params={}){
		this.values.params = params;
		return this;
	}
	_onCancel(){
		_log(this.getObjectName()+' --> action cancelled');
		this._hide();
		this.fns('onCancel');
	}
	getInputField(){
		return this.isContentEditable() ? this.getTarget() : this.values.$input;
	}
	setInputField(input){
		this.values.$input = $(input);
		return this;
	}
	getCell(){
		return this.values.$cell;
	}
	getOptions(){
		return this.values.options;
	}
	setOptions(options){
		_.extend(this.values.options,options);
		return this;
	}
	_createCell(){
		return new Promise((resolve,reject) => {
			var type = this.getType(),
				methods = {
					'input':'_createInput',
					'textarea':'_createTextarea',
					'select':'_createDropdown',
					'date':'_createDate',
					'checkbox':'_createCheckbox',
					'radio':'_createRadio'
				};

			//lets create the cell
			if (type.base in methods){
				this[methods[type.base]]()
					.then($cell => {
						this.values.$cell = $cell;
						this.fns('onInputCreate');
						_log(this.getObjectName()+' --> '+JSON.stringify(type)+' cell created');
						resolve();
					})
					.catch(error => {
						throw new Error(error);
						reject();
					});
			}
			else {
				throw new Error('incorrect @type specified!');
				reject();
			}
		});
	}
	_show(){
		if (!this.values.is_shown){
			this.fns('onShow');
			this.values.is_shown = true;
		}
		return this;
	}
	_hide(){
		if (this.values.is_shown){
			this.fns('onHide');
			this.values.is_shown = false;
		}
		return this;
	}
	_createInput(){
		return new Promise((resolve,reject) => {
			var display_value = this.getDisplayValue(),
				css = this.getCss(),
				$wrapper = $('<form class="form-inline editable-form" data-form-type="input"><div class="form-group ' + css + '"><label class="sr-only">Enter Text</label></div></form>'),
				$input = $('<input type="text" class="form-control popup-editable-field" value="' + this._filterValueForEditing(display_value) + '">');

			//adding onFocus event listener to make sure when focused the cursor is at the end of text
			$input.putCursorAtEnd('focus.utils.editable');

			this.setInputField($input);
			$wrapper.find('.form-group').append($input);

			resolve($wrapper);
		});
	}
	_createTextarea(){
		return new Promise((resolve,reject) => {
			var display_value = this.getDisplayValue(),
				css = this.getCss(),
				$wrapper = $('<form class="form-inline editable-form" data-form-type="textarea"><div class="form-group '+css+'"><label class="sr-only">Enter Text</label></div></form>'),
				$textarea = $('<textarea class="form-control popup-editable-field" rows="3">'+this._filterValueForEditing(display_value)+'</textarea>');

			this.setInputField($textarea);
			$wrapper.find('.form-group').append($textarea);

			resolve($wrapper);
		});
	}
	_createDropdown(){
		return new Promise((resolve,reject) => {
			var is_multiselect = this.isMultiSelect(),
				value = this.getValue(),
				css = this.getCss(),
				$wrapper = $('<form class="form-inline editable-form" data-form-type="dropdown"><div class="form-group ' + css + '"><label class="sr-only">Select One</label></div></form>'),
				$dropdown = $('<select class="form-control popup-editable-field custom-select" '+(is_multiselect ? 'multiple="multiple"' : '')+'></select>');

			this.setInputField($dropdown);
			$wrapper.find('.form-group').append($dropdown);

			resolve($wrapper);
		});
	}
	_createDate(){
		return new Promise((resolve,reject) => {
			var $target = this.getTarget(),
				display_value = this.getDisplayValue(),
				css = this.getCss(),
				options = this.getOptions();

			$target.data('date',display_value);

			$target.datepicker(options);

			this.values.DatePicker = $target.data('datepicker');

			if (display_value!==this.getPlaceholder())
				$target.datepicker('setDate',moment(display_value,options.format).toDate());

			//adding event listeners here to avoid getting triggered by setDate above
			$target
				.on('changeDate', event => {
					this._onSave(moment(event.date).format(options.format));
				})
				.on('show', event => {
					$target.data('datepicker').picker.addClass(css); //adding custom class
					this._show();
				});

			resolve(this.values.DatePicker.picker);
		});
	}
	_createCheckbox(){
		return new Promise((resolve,reject) => {
			var $target = this.getTarget(),
				id = UTILS.uuid(),
				control_class = /switch/i.test(this.getType().option) ? 'custom-toggle my-2' : 'custom-checkbox mb-3',
				display_value = this.getDisplayValue(),
				css = this.getCss(),
				options = this.getOptions(),
				$wrapper = $('<form class="form-inline editable-form" data-form-type="checkbox"><div class="form-group '+css+'"><div class="custom-control '+control_class+'"><label class="custom-control-label" for="'+id+'">'+('desc' in options ? options.desc : '')+'</label></div></div></form>'),
				$input = $('<input type="checkbox" id="'+id+'" class="custom-control-input popup-editable-field" value="'+display_value+'">');

			$input.prop('checked',/^(true|yes|ok)$/i.test(display_value));

			this.setInputField($input);

			$wrapper.find('.custom-control').prepend($input);

			$input.on('change.utils.editable',function(event){
				event.preventDefault();
				this._onSave($input.prop('checked'));
			}.bind(this));

			$target.html($wrapper);

			resolve($wrapper);
		});
	}
	_createRadio(){
		return new Promise((resolve,reject) => {
			var value = this.getValue(),
				name = UTILS.uuid(),
				css = this.getCss(),
				$wrapper = $('<form class="form-inline editable-form radio-type'+css+'" data-form-type="radio"></form>');

			//lets populate
			$wrapper.append(_.map(this.getItems(), function(item){
				var id = UTILS.uuid(),
					$input = `<div class="form-group row">
								<div class="custom-control custom-radio mb-1">
									<input type="radio" id="${id}" name="${name}" class="custom-control-input popup-editable-field" value="${item.value}">
									<label class="custom-control-label" for="${id}">${item.label}</label>
								</div>
							</div>`;

				return $input;
			}.bind(this)));

			var $inputs = $wrapper.find('.custom-control-input[type="radio"]');

			this.setInputField($inputs);

			if (value && value.length)
				$inputs.filter('[value="'+value+'"]').prop('checked',true);

			resolve($wrapper);
		});
	}
	_onBeforeHide(){
		var $input = this.getInputField(),
			is_type_checkbox = this.isTypeCheckbox(),
			is_type_radio = this.isTypeRadio(),
			is_contenteditable = this.isContentEditable();

		if (!is_type_checkbox){
			if ($input){
				if (this.isSelectize() || this.isMultiSelect())
					$input[0].selectize.destroy();
				else if (this.isWysiwyg())
					$input.summernote('destroy');
				else
					$input.off('keydown.utils.editable change.utils.editable blur.utils.editable focus.utils.editable');

				if (is_type_radio)
					$(document).off('click.utils.editable');
			}

			this.getCell().remove();
		}
		
		this.getTarget().removeClass('is-edited').prop('contenteditable',false);
		this.getSpinner().hide();
		return this;
	}
	getDatePicker(){
		return this.values.DatePicker;
	}
	getSelectize(){
		return this.values.Selectize;
	}
	//save values
	__onSave__(value){
		return new Promise((resolve,reject) => {
			let is_type_date = this.isTypeDate(),
				is_type_checkbox = this.isTypeCheckbox(),
				is_multiselect = this.isMultiSelect(),
				$target = this.getTarget(),
				$cell = this.getCell(),
				$editable = null,
				spinner = this.getSpinner(),
				ajax_settings = this.getAjaxData(),
				params = this.getParams(),
				field_name = this.getFieldName(),
				is_contenteditable = this.isContentEditable(),
				DatePicker = this.getDatePicker();

			if (is_type_date)
				$editable = DatePicker.picker;
			else if (is_type_checkbox)
				$editable = $target.find('.custom-control');
			else
				$editable = $cell;

			//spinner
			spinner.setTarget($editable);

			let _updateContentEditable = () => {
				$target
					.prop('contenteditable',false)
					.text(this._filterValueForDisplay(value));
			};

			let _isMultiSelectValueChanged = () => {
				let curr_values = _.map(value, item => parseInt(item)),
					prev_values = _.map(this.getInputField().data('prev-value'), item => parseInt(item));

				return JSON.stringify(curr_values.sort())!==JSON.stringify(prev_values.sort());
			};

			//lets check if the value has changed
			if ((is_multiselect && _isMultiSelectValueChanged()) || (!is_multiselect && this.getDisplayValue()!=this._filterValueForDisplay(value))){
				_log(this.getObjectName()+' --> value changed, saving...');

				let _onError = error => {
					spinner.hide();

					if (error instanceof Error)
						UTILS.Errors.show(error.message);

					if (is_contenteditable)
						_updateContentEditable();

					this._onBeforeHide();
					this._hide();

					if (is_type_date)
						DatePicker.hide();

					this.fns('onSaveError', error);

					reject();
				};

				let _onSuccess = response => {
					spinner.hide();

					if (_.isString(response))
						response = JSON.parse(response);

					//lets check for errors
					if ('errors' in response && response.errors.length){
						response.direction = 'top'; //injecting direction of the error msg

						_.each(response.errors, error => {
							//lets check if in case of an error a field was set
							if ('fields' in error && !error.fields.length)
								error.fields.push($target);
						});

					}

					if (!UTILS.Errors.isError(response)){ //success
						this.setValue(value);
						this._onBeforeHide();
						$target.velocity('callout.flash');
						this._hide();

						if (is_type_date)
							DatePicker.hide();

						this.fns('onAfterSave', response);

						resolve();
					}
				};

				this.fns('onBeforeSave', value);
				spinner.show();

				var _getFormatedParams = () => {
					let data = {};

					if (params)
						data = _.assign({}, (_.isFunction(params) ? params.call(null, value, this) : {...params, [field_name]: value}));
					else
						data[field_name] = is_type_checkbox ? !!(value) : value

					return data;
				};

				//if checkbox lets move the spinner right over the control
				if (is_type_checkbox)
					spinner.getSpinner().css({ left:15 });

				if ('url' in ajax_settings && ajax_settings.url.length){
					let url = ajax_settings.url,
						options = {
							method: 'POST',
							data: _getFormatedParams()
						};

					if ('method' in ajax_settings)
						options.data.method = ajax_settings.method;

					if ('content_type' in ajax_settings){
						options.content_type = ajax_settings.content_type;

						if (/\/json$/.test(ajax_settings.content_type))
							options.data = JSON.stringify(options.data);
					}

					$.fetch(url, options).then(_onSuccess).catch(_onError);
				}
				else
					_onSuccess({errors: [], ..._getFormatedParams()});
			}
			else {
				_log(this.getObjectName()+' --> same value, no action taken');

				if (is_contenteditable)
					_updateContentEditable();

				this._onBeforeHide();
				this._hide();
				this.fns('onNoChange');
				resolve();
			}
		});
	}
};