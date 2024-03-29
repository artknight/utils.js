/*
    == UTILS.Editable ==
*/
UTILS.Editable = class extends UTILS.Base {
	constructor(data={}){
		super(data);

		if ('type' in data ){
			//if date, lets set some default settings
			if (/^date$/i.test(data.type)){
				this.values.options = {
					container: this.getContainer(),
					orientation: 'bottom',
					autoclose: false,
					format: 'MM/DD/YYYY',
					startDate: moment().add(1, 'day').toDate(),
					todayHighlight: true
				};
			}
			else if (/^date\-range$/i.test(data.type)){
				this.values.options = {
					is_editable_usage: true,
					container: this.getContainer(),
					auto_close: false,
					date_format: 'MM/DD/YYYY',
					separator: ' - ',
					start_date: moment().add(1,'day').format('MM/DD/YYYY'),
					show_topbar: false,
					custom_methods_override: [ //disable the save method as we want to take over that process
						{ name:'setTargetValue', method:() => {} }
					]
				};
			}
			else if (/^textarea\-wysiwyg/i.test(data.type)){
				this.values.options = {
					toolbar: [
						'bold','italic','heading','strikethrough','|',
						'quote','unordered-list','ordered-list','table','|',
						'horizontal-rule','|',
						'preview','side-by-side','guide','|',
						'undo','redo'
					],
					minHeight: '100px',
					uploadImage: false,
					autofocus: true,
					autoDownloadFontAwesome: false,
					renderingConfig: {
						codeSyntaxHighlighting: true
					},
					placeholder: 'Start typing...',
					tabSize: 4,
					previewClass: 'utils-editable-editor-preview',
					sideBySideFullscreen: false,
					onToggleFullScreen: is_fullscreen => {
						let __easyMDE = this.getEasyMDE();
						$(__easyMDE.gui.easyMDEContainer).toggleClass('utils-editable-is-fullscreen', is_fullscreen);
						this.fns('onToggleFullScreen', { is_fullscreen });
					},
					onSideBySideToggle: (__editor,preview) => {
						__editor.toggleFullScreen();
					}
				};
			}
			else if (/^select\-multiselect/i.test(data.type)){
				this.values.options = {
					search_url: null //lookup url
				};
			}
		}

		 this._onSave = _.debounce(this.__onSave__.bind(this),500,{ leading:true });

		('params' in data) && this.setParams(data.params);
		('field' in data) && this.setFieldName(data.field);
		('type' in data) && this.setType(data.type);
		('options' in data) && this.setOptions(data.options);
		('css' in data) && this.setCss(data.css);
		('filterMethodForEditingValue' in data) && this.setCustomMethodsOverride([{ name:'filterValueForEditing', method:data.filterMethodForEditingValue }]); //deprecated
		('filterMethodForDisplayValue' in data) && this.setCustomMethodsOverride([{ name:'filterValueForDisplay', method:data.filterMethodForDisplayValue }]); //deprecated
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
		('onEnable' in data) && this.addCallback('onEnable',data.onEnable);
		('onDisable' in data) && this.addCallback('onDisable',data.onDisable);
		('onInputCreate' in data) && this.addCallback('onInputCreate', data.onInputCreate);
		('onToggleFullScreen' in data) && this.addCallback('onToggleFullScreen',data.onToggleFullScreen);
		('value' in data) && this.setValue(this.isTypeInput() && data.value ? `${data.value}` : data.value);
		('placeholder' in data) && this.setPlaceholder(data.placeholder); //lets put it at the end to avoid race conditions
		('min_chars' in data) && this.setMinChars(data.min_chars);

		return this;
	}
	getDefaults(){
		return {
			object: 'utils.editable',
			version: '0.9.4',
			direction: 'top',
			type: { base:'input', option:null }, //holds the type of the editable input field
			css: '', //holds the css classes to be added to the input field
			params: null, //holds the extra params to be passed in ajax calls
			$cell: null, //holds the input cell
			$input: null, //holds the input field ( except for date fields )
			$container: $('body'), //holds DOM where popover will be appended to
			value: null, //holds the new value
			DatePicker: null, //holds the date picker object
			DateRangePicker: null, //holds the date range picker object
			__selectize: null, //holds the selectize object
			__easyMDE: null, //holds the easy mde object
			options: {}, //holds options
			field_name: '@field', //holds the field name to be passed to the server
			placeholder: '--', //holds the placeholder value when there is no value to be displayed
			is_lazyload: false, //holds whether the element is lazy-loaded ( true --> the trigger event was extrapolated and there is no need to add another one )
			toggle_action: 'click', //toggle action to show/hide the popover
			__spinner: new UTILS.Spinner({ type:'medium', center:true, color:'black', blur:true }), //holds the spinner
			is_inline_tabbing: false, //holds whether tabbing should be allowed for inline editing
			items: [], //holds the items
			is_enabled: false, //holds the enable/disable state of the popover
			is_shown: false, //holds the display state
			is_contenteditable: false, //holds whether we want the content to be edited within the target element
			_is_cell_created: null,
			min_chars: 2 //holds the min char length for a query ( applies to autocomplete and selectize )
		}
	}
	getCss(){
		return this.values.css;
	}
	setCss(css){
		this.values.css = css||'';
	}
	getMinChars(){
		return this.values.min_chars;
	}
	setMinChars(length){
		this.values.min_chars = length||2; //default value
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
	filterValueForEditing(value){
		var _value = value;

		if (this.getPlaceholder()===_value)
			_value = '';

		return _value;
	}
	//formats the display value of target ( after edit )
	filterValueForDisplay(value, omit_placeholder=false){
		var type = this.getType(),
			is_multiselect_dropdown = this.isMultiSelect() && this.isTypeDropDown(),
			items = this.getItems(),
			_value = value;

		//multiselect
		if (is_multiselect_dropdown){
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

		if (typeof _value!=='number' && !_value.length && !omit_placeholder)
			_value = this.getPlaceholder();

		return _value;
	}

	_normalizeItemsForDropdown(items){
		let is_selectize = this.isSelectize(),
			is_multiselect_dropdown = this.isMultiSelect() && this.isTypeDropDown();

		if (is_selectize || is_multiselect_dropdown){
			items = _.map(items, item => {
				return {
					text: item.label,
					value: item.value
				}
			});
		}

		return items;
	}

	_onItemSearch(query=''){
		return new Promise((resolve,reject) => {
			let $cell = this.getCell(),
				__spinner = this.getSpinner(),
				options = this.getOptions(),
				ajax_options = {
					method: 'GET',
					data: ('onBeforeSearch' in options) ? options.onBeforeSearch.call(null,query.urlEncode(),this) : { q:query.urlEncode() }
				},
				onAfterSearch = response => {
					__spinner.hide();

					if (_.isString(response))
						response = JSON.parse(response);

					if (!UTILS.Errors.isError(response)){ //success
						let items = ('onAfterSearch' in options) ? options.onAfterSearch.call(null,response,this) : response;

						//now we need to replenish the options
						let new_items = _.uniqBy([...this.getItems(),...items],'value');
						this.setItems(new_items);

						//lets check if the formatting is on par with selectize
						if (!_.every(items, item => ('text' in item) && ('value' in item)))
							items = this._normalizeItemsForDropdown(items);

						resolve(items);
					}
					else
						reject();
				},
				onError = error => {
					__spinner.hide();

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

			__spinner.setTarget($cell).show();
			$.fetch(options.search_url, ajax_options).then(onAfterSearch).catch(onError);
		});
	}

	_onActionTriggered(){
		this.values._is_cell_created.then(() => {
			let $target = this.getTarget(),
				$cell = this.getCell(),
				is_type_input = this.isTypeInput(),
				is_type_date = this.isTypeDate(),
				is_type_checkbox = this.isTypeCheckbox(),
				is_type_radio = this.isTypeRadio(),
				is_type_dropdown = this.isTypeDropDown(),
				is_selectize = this.isSelectize(),
				is_multiselect = this.isMultiSelect(),
				is_multiselect_dropdown = is_multiselect && is_type_dropdown,
				is_wysiwyg = this.isWysiwyg(),
				is_type_textarea = this.isTypeTextarea(),
				is_contenteditable = this.isContentEditable(),
				is_autocomplete = this.isAutoComplete(),
				$input = this.getInputField(),
				$next_editable = $target.nextNodeByClass('editable-target'),
				value = this.getValue(),
				items = this.getItems(),
				options = this.getOptions(),
				is_processing = false,
				keys = { ENTER:13, ESCAPE:27, TAB:9 },
				active_keys = [keys.ESCAPE],
				min_chars = this.getMinChars();

			//we need ENTER key to be used within textarea
			if (!is_type_textarea && !is_multiselect_dropdown)
				active_keys.push(keys.ENTER);

			var _triggerNextEditable = () => {
				$next_editable.trigger(this.getToggleAction());
			};

			this.fns('onActionTriggered');

			if (!is_type_date && !is_type_checkbox){
				//content editables
				if (is_contenteditable){
					let prev_value = $input.html().replace(/(<([^>]+)>)/gi, elm => /\<\/span\>/.test(elm) ? ', ' : '');

					//lets check if the prev_value ( aka current value of the editable element is the same as the placeholder )
					if (prev_value===this.getPlaceholder())
						prev_value = '';

					//lets set the prev value & contenteditable attr
					$input
						.data('prev-value',prev_value)
						.prop('contenteditable',true)
						.text(this.filterValueForEditing(prev_value))
						.putCursorAtEnd();
				}

				if (is_type_input && is_autocomplete){
					let autocomplete_options = {
						target: $input,
						onInput: (Autocomplete,opts) => {
							if (opts.query.length >= min_chars){
								if (options.search_url)
									this._onItemSearch(opts.query).then(opts.callback);
								else {
									let items = _.filter(this.getItems(),item => item.value.toLowerCase().includes(opts.query.toLowerCase()));

									opts.callback(items);
								}
							}
						},
						onSelected: (Autocomplete,opts) => {
							this._onSave(opts.value);
							is_processing = true;
						}
					};

					if (is_multiselect)
						autocomplete_options.multiple = true;

					_.extend(autocomplete_options, options);

					new UTILS.Autocomplete(autocomplete_options);
				}

				$input.on('keydown.utils.editable', event => {
					if (!is_autocomplete){
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
				if (is_selectize || is_multiselect_dropdown){
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

					let is_last_key_tab = false,
						selectize_options = {
							create: false,
							selectOnTab: this.isInlineTabbing(),
							onFocus: event => {
								is_processing = false;
								this.removeErrorTooltip();
							},
							onBlur: event => {
								let value = this.getSelectize().getValue();

								if (!is_processing){
									if (is_last_key_tab && this.isInlineTabbing() && $next_editable.length) //tab
										this._onSave(value).then(_triggerNextEditable);
									else
										this._onSave(value);

									is_processing = true;
								}
							},
							onKeyDown: event => {
								is_last_key_tab = [keys.TAB].isIn(UTILS.getCharKey(event));
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
							load: (query, callback) => {
								if (query.length < min_chars)
									return callback();

								this._onItemSearch(query).then(callback);
							}
						});
					}

					_.extend(selectize_options, options);

					$input.data('prev-value',value)

					this.values.__selectize = new TomSelect($input[0], selectize_options);
				}
				else if (is_wysiwyg){
					let __easyMDE = new EasyMDE(_.extend({}, options, {
						element: $input[0],
						initialValue: value,
						onRendered: __easyMDE => {
							let $statusbar = $(__easyMDE.gui.statusbar), //bottom status bar of the editor
								$controls_wrapper = $(`
									<div class="utils-editable-wysiwyg-controls">
										 <button type="button" class="btn  btn-primary utils-editable-wysiwyg-control utils-editable-wysiwyg-save-control">Save</button>
										 <button type="button" class="btn  btn-link utils-editable-wysiwyg-control utils-editable-wysiwyg-cancel-control">Cancel</button>
									</div>
								`);

							//lets add the save button
							$statusbar
								.addClass('utils-editable-statusbar')
								.append($controls_wrapper);

							//listeners
							$controls_wrapper.on('click','.utils-editable-wysiwyg-control', event => {
								let $control = $(event.currentTarget);

								if ($control.hasClass('utils-editable-wysiwyg-save-control')){
									let value = __easyMDE.value();
									this._onSave(value);
									is_processing = true;
								}
								else if ($control.hasClass('utils-editable-wysiwyg-cancel-control')){
									is_processing = false;
									this._onBeforeHide();
									this._hide();
									this.fns('onNoChange');
								}
							});
						}
					}));

					this.values.__easyMDE = __easyMDE;

					__easyMDE.codemirror.on('focus', () => {
						is_processing = false;
						this.removeErrorTooltip();
					});
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
								let value = is_type_radio ? $input.filter(':checked').val() : $input.val();
								this._onSave(value);
								is_processing = true;
							}
						});
					}

					//for radios the blur events override the change events and cause weirdness, so we need to check for that differently
					if (is_type_radio){
						$(document).on('click.utils.editable',event => {
							if (!/(^|\s)(editable-target|form-check-label|popup-editable-field)(\s|$)/.test($(event.target).attr("class"))){
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

				if (is_wysiwyg){
					$target
						.addClass('is-edited')
						.after($cell);

					$target.parent().addClass('wysiwyg-shown');
				}
				else if (!is_contenteditable){
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
				if (is_selectize || is_multiselect_dropdown)
					this.values.__selectize.focus();
				else if (is_type_radio)
					$input.filter(':checked').focus();
				else if (is_wysiwyg)
					this.values.__easyMDE.codemirror.focus();
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

			//setting spinner target here b/c in certain instances if there exists a global blur then the editable action gets cancelled
			//the spinner removes the global blur
			this.getSpinner().setTarget($cell);

			this.values.is_enabled = true;
			this.fns('onEnable');
		}

		return this;
	}
	disable(){
		if (this.values.is_enabled){
			var $target = this.getTarget(),
				is_type_checkbox = this.isTypeCheckbox();

			if (is_type_checkbox)
				this.getInputField().prop('disabled',true);
			else
				$target.addClass('readonly');

			this.values.is_enabled = false;
			this.fns('onDisable');
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
		return this.values.__spinner;
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
			this.setDisplayValue(this.getPlaceholder());

		return this;
	}
	getType(){
		return this.values.type;
	}
	setType(type){
		if (type){
			let subtypes = type.split('-'),
				base = subtypes.shift(), //getting first elm
				option = subtypes.join('-');

			this.values.type = {
				base: base,
				option: option
			};

			if (this.values.type.option && /^wysiwyg/i.test(this.values.type.option))
				this.getTarget().addClass('editable-wysiwyg');
		}
		return this;
	}
	isTypeDate(){
		return /^date/i.test(this.getType().base);
	}
	isDateRange(){
		return /range/i.test(this.getType().option);
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
		return /selectize/i.test(this.getType().option);
	}
	isEasyMDE(){
		return this.getEasyMDE()!==null;
	}
	isMultiSelect(){
		return /multiselect/i.test(this.getType().option);
	}
	isAutoComplete(){
		return /autocomplete/i.test(this.getType().option);
	}
	isWysiwyg(){
		return /^wysiwyg/i.test(this.getType().option);
	}
	getValue(){
		return _.clone(this.values.value);
	}
	setValue(value){
		return new Promise((resolve,reject) => {
			this.values.value = value;

			//accounting for lazyload
			if (this.isLazyLoad()){
				var $target = this.getTarget(),
					target_options = $target.data('editable-options');

				if (_.isPlainObject(target_options))
					$target.data('editable-options', _.extend(target_options,{ value:value }));
			}

			this.setDisplayValue(value).then(resolve);
		});
	}
	setDisplayValue(value){
		return new Promise((resolve,reject) => {
			var $target = this.getTarget();

			if (!this.isTypeCheckbox())
				$target.html(this.filterValueForDisplay(value));

			resolve();
		});
	}
	getDisplayValue(){
		var $target = this.getTarget(),
			is_type_checkbox = this.isTypeCheckbox(),
			is_contenteditable = this.isContentEditable();

		return is_type_checkbox
			? this.getValue()
			: is_contenteditable ? $target.data('prev-value') || '' : $target.text();
	}
	getParams(){
		return this.values.params;
	}
	setParams(params={}){
		this.values.params = params;
		return this;
	}
	_onCancel(){
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
				$wrapper = $(`<form class="form-inline editable-form" data-form-type="input"><div class="editable-input-wrapper ${css}"><label class="form-label sr-only">Enter Text</label></div></form>`),
				$input = $(`<input type="text" class="form-control popup-editable-field" value="${this.filterValueForEditing(display_value)}">`);

			//adding onFocus event listener to make sure when focused the cursor is at the end of text
			$input.putCursorAtEnd('focus.utils.editable');

			this.setInputField($input);
			$wrapper.find('.editable-input-wrapper').append($input);

			resolve($wrapper);
		});
	}
	_createTextarea(){
		return new Promise((resolve,reject) => {
			var display_value = this.getDisplayValue(),
				css = this.getCss(),
				$wrapper = $(`<form class="form-inline editable-form" data-form-type="textarea"><div class="editable-input-wrapper ${css}"><label class="form-label sr-only">Enter Text</label></div></form>`),
				$textarea = $(`<textarea class="form-control popup-editable-field" rows="3">${this.filterValueForEditing(display_value)}</textarea>`);

			this.setInputField($textarea);
			$wrapper.find('.editable-input-wrapper').append($textarea);

			resolve($wrapper);
		});
	}
	_createDropdown(){
		return new Promise((resolve,reject) => {
			var is_multiselect = this.isMultiSelect(),
				css = this.getCss(),
				$wrapper = $(`<form class="form-inline editable-form" data-form-type="dropdown"><div class="editable-input-wrapper ${css}"><label class="form-label sr-only">Select One</label></div></form>`),
				$dropdown = $(`<select class="form-control popup-editable-field custom-select" ${is_multiselect ? 'multiple="multiple"' : ''}></select>`);

			this.setInputField($dropdown);
			$wrapper.find('.editable-input-wrapper').append($dropdown);

			resolve($wrapper);
		});
	}
	_createDate(){
		return new Promise((resolve,reject) => {
			var $target = this.getTarget(),
				is_date_range = this.isDateRange(),
				display_value = this.getDisplayValue(),
				css = this.getCss(),
				options = this.getOptions(),
				$picker = null;

			$target.data('date',display_value);

			if (is_date_range){
				_.extend(options,{
					target: $target,
					onApply: (DateRangePicker, options) => {
						this._onSave(options.range);
					},
					onShown: (DateRangePicker, options) => {
						DateRangePicker.getElm().addClass(css); //adding custom class
						this._show();
					}
				});

				this.values.DateRangePicker = new UTILS.Daterange(options).enable();

				if (display_value!==this.getPlaceholder()){
					let dates = _.map(display_value.split('-'), date => date.trim());

					this.values.DateRangePicker.setDateRange(...dates);
				}

				$picker = this.values.DateRangePicker.getElm();
			}
			else {
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

				$picker = this.values.DatePicker.picker;
			}

			resolve($picker);
		});
	}
	_createCheckbox(){
		return new Promise((resolve,reject) => {
			var $target = this.getTarget(),
				id = UTILS.uuid(),
				control_class = /switch/i.test(this.getType().option) ? 'form-switch' : '',
				display_value = this.getDisplayValue(),
				css = this.getCss(),
				options = this.getOptions(),
				$wrapper = $(`
					<form class="form-inline editable-form" data-form-type="checkbox">
						<div class="form-check ${control_class} ${css}">
							<input type="checkbox" id="${id}" class="form-check-input popup-editable-field" value="${display_value}">
							<label class="form-check-label" for="${id}"><span class="form-check-label-inner">${'desc' in options ? options.desc : ''}</span></label>
						</div>
					</form>
				`),
				$input = $wrapper.find('input');

			$input.prop('checked',/^(true|yes|ok)$/i.test(display_value));

			if ('tooltip' in options){
				$wrapper.find('.custom-control')
					.attr('data-hint', UTILS.format.stripOutHtml(options.tooltip.text))
					.addClass(`hint hint-${options.tooltip?.direction || 'top'}`);
			}

			this.setInputField($input);

			$wrapper.find('.custom-control').prepend($input);

			$input.on('change.utils.editable',function(event){
				event.preventDefault();
				this._onSave($input.prop('checked'));
			}.bind(this));

			$target
				.html($wrapper)
				.addClass('no-underline');

			resolve($wrapper);
		});
	}
	_createRadio(){
		return new Promise((resolve,reject) => {
			var value = this.getValue(),
				name = UTILS.uuid(),
				css = this.getCss(),
				$wrapper = $('<form class="form-inline editable-form radio-type '+css+'" data-form-type="radio"></form>');

			//lets populate
			$wrapper.append(_.map(this.getItems(), item => {
				var id = UTILS.uuid(),
					$input = `<div class="row">
								<div class="form-check">
									<input type="radio" id="${id}" name="${name}" class="form-check-input popup-editable-field" value="${item.value}">
									<label class="form-check-label" for="${id}">${item.label}</label>
								</div>
							</div>`;

				return $input;
			}));

			var $inputs = $wrapper.find('.form-check-input[type="radio"]');

			this.setInputField($inputs);

			if (value && value.length)
				$inputs.filter('[value="'+value+'"]').prop('checked',true);

			resolve($wrapper);
		});
	}
	_onBeforeHide(){
		var $input = this.getInputField(),
			$target = this.getTarget(),
			is_type_checkbox = this.isTypeCheckbox(),
			is_type_radio = this.isTypeRadio(),
			is_selectize = this.isSelectize(),
			is_multiselect_dropdown = this.isMultiSelect() && this.isTypeDropDown(),
			is_wysiwyg = this.isWysiwyg(),
			is_date_range = this.isDateRange();

		if (!is_type_checkbox && !is_date_range){
			if ($input){
				if (is_selectize || is_multiselect_dropdown)
					this.values.__selectize.destroy();
				else if (is_wysiwyg){
					let __easyMDE = this.getEasyMDE();
					this.fns('onToggleFullScreen', { is_fullscreen:false });
					__easyMDE.toTextArea();
					__easyMDE.cleanup();
					$target.parent().removeClass('wysiwyg-shown');
				}
				else
					$input.off('keydown.utils.editable change.utils.editable blur.utils.editable focus.utils.editable');

				if (is_type_radio)
					$(document).off('click.utils.editable');
			}

			this.getCell().remove();
		}

		$target.removeClass('is-edited').prop('contenteditable',false);

		this.getSpinner().hide();

		return this;
	}
	getDatePicker(){
		return this.values.DatePicker;
	}
	getDateRangePicker(){
		return this.values.DateRangePicker;
	}
	getSelectize(){
		return this.values.__selectize;
	}
	getEasyMDE(){
		return this.values.__easyMDE;
	}
	getMarkdownHtml(value){
		if (this.isWysiwyg())
			return this.getEasyMDE().markdown(value).match(/\<body[^>]*\>([^]*)\<\/body/m)[1]; //grabbing everything within <body></body> tags
		else
			return value;
	}
	//save values
	__onSave__(value){
		return new Promise((resolve,reject) => {
			let is_type_date = this.isTypeDate(),
				is_date_range = this.isDateRange(),
				is_type_checkbox = this.isTypeCheckbox(),
				is_multiselect = this.isMultiSelect(),
				is_autocomplete = this.isAutoComplete(),
				is_wysiwyg = this.isWysiwyg(),
				$target = this.getTarget(),
				$cell = this.getCell(),
				$editable = null,
				__spinner = this.getSpinner(),
				ajax_settings = this.getAjaxData(),
				params = this.getParams(),
				field_name = this.getFieldName(),
				is_contenteditable = this.isContentEditable(),
				DatePicker = this.getDatePicker(),
				DateRangePicker = this.getDateRangePicker();

			//lets parse the value for autocomplete multiselect to make sure there are no redundant spaces and commas
			if (is_multiselect && is_autocomplete)
				value = value.split(/,\s*/g).filter(str => str.replace(/,/g,'').length).join(',');

			if (is_type_date)
				$editable = is_date_range ? DateRangePicker.getElm() : DatePicker.picker;
			else if (is_type_checkbox)
				$editable = $target.find('.custom-control');
			else if (is_autocomplete)
				$editable = $target.parent();
			else
				$editable = $cell;

			//spinner
			__spinner.setTarget($editable);

			let _updateContentEditable = () => {
				$target
					.prop('contenteditable',false)
					.html(this.filterValueForDisplay(value));
			};

			let _isMultiSelectValueChanged = () => {
				let is_dropdown = this.isTypeDropDown(),
					is_changed = false,
					curr_values,
					prev_values;

				if (is_dropdown){ //selectize
					curr_values = _.map(value, item => parseInt(item)),
					prev_values = _.map(this.getInputField().data('prev-value'), item => parseInt(item));
					is_changed = JSON.stringify(curr_values.sort())!==JSON.stringify(prev_values.sort());
				}
				else { //auto-complete
					curr_values = value;
					prev_values = this.getDisplayValue();
					is_changed = curr_values.replace(/[\s,]/g,'')!==prev_values.replace(/[\s,]/g,''); //removing all spaces and commas to compare two strings
				}

				return is_changed;
			};

			//lets check if the value has changed
			if ((is_multiselect && _isMultiSelectValueChanged()) || (!is_multiselect && this.getDisplayValue()!=this.filterValueForDisplay(value,true))){
				_log(this.getObjectName()+' --> value changed, saving...');

				let _onError = error => {
					__spinner.hide();

					if (error instanceof Error)
						UTILS.Errors.show(error.message);

					if (is_contenteditable)
						_updateContentEditable();

					this._onBeforeHide();
					this._hide();

					if (is_type_date){
						if (is_date_range)
							DateRangePicker.hide();
						else
							DatePicker.hide();
					}

					this.fns('onSaveError', error);

					reject();
				};

				let _onSuccess = response => {
					__spinner.hide();

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
						this.setValue(value)
							.then(() => {
								this._onBeforeHide();
								UTILS.animateCss($target,'flash');
								this._hide();

								if (is_type_date){
									if (is_date_range)
										DateRangePicker.hide();
									else
										DatePicker.hide();
								}

								this.fns('onAfterSave', response);

								resolve();
							});
					}
				};

				this.fns('onBeforeSave', value);
				__spinner.show();

				let _getFormatedParams = () => {
					let data = {},
						val = value;

					if (is_wysiwyg){
						val = {
							markdown: val,
							html: this.getMarkdownHtml(val)
						};
					}

					if (params)
						data = _.extend({}, (_.isFunction(params) ? params.call(null, val, this) : {...params, [field_name]: val}));
					else
						data[field_name] = is_type_checkbox ? !!(val) : val

					return data;
				};

				//if checkbox lets move the spinner right over the control
				if (is_type_checkbox)
					__spinner.getSpinner().css({ left:15 });

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
					_onSuccess({ errors:[], ..._getFormatedParams() });
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
