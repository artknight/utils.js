/*
    == UTILS.Autocomplete ==

	Originally inspired by Gregor Martynus (https://github.com/gr2m/contenteditable-autocomplete), MIT License

	ex. var autocomplete = new UTILS.Autocomplete({ target:$('#autocomplete-field') });
*/
UTILS.Autocomplete =  class extends UTILS.Base {
	constructor(data={}){
		super(data);

		_log(this.getObjectName()+' --> instantiated!');

		if (!('target' in data))
			throw new Error('@target must be specified upon initialization!');

		('is_multiple' in data) && this.setMultipleState(data.is_multiple);
		('container' in data) && this.setContainer(data.container);
		('value' in data) && this.setValue(data.value);
		('onInput' in data) && this.addCallback('onInput',data.onInput);
		('onSelected' in data) && this.addCallback('onSelected',data.onSelected);

		this.init();
		
		return this;
	}
	getDefaults(){
		return {
			object: 'utils.autocomplete',
			version: '0.0.1',
			$container: null,
			$suggestions: $('<div class="autocomplete-suggestions"></div>'),
			current_value: null,
			current_values: [],
			current_suggestions: [],
			is_multiple: false,
			items: [],
			regex: {
				escape_letters: /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g,
				trailing_comma: /[,\s]*$/,
				split_words_with_white_space: /\s*,\s*/,
				split_words: /,/
			}
		};
	}
	init(){
		let $target = this.getTarget(),
			$container = this.getContainer();

		if (!$container)
			this.setContainer($target.parent());

		$target.on('focus', this.onFocus.bind(this));
		$target.on('input', this.onInput.bind(this));
		$target.on('keydown', this.onKeydown.bind(this));
		$target.on('blur', this.onBlur.bind(this));
		this.values.$suggestions.on('mousedown touchstart', '> div', this.onSuggestionClick.bind(this));

		setTimeout(() => {
			let cursor_pos = this.getCaretCharacterOffsetWithin($target[0]);
			$target.focus();
			this.setCursorAt(cursor_pos);
		});

		return this;
	}
	getContainer(){
		return this.values.$container;
	}
	setContainer(container){
		this.values.$container = $(container);

		if (!/relative|absolute|fixed/i.test(this.values.$container.css('position')))
			this.values.$container.css({ position:'relative' });

		this.values.$container
			.attr('data-autocomplete','on')
			.append(this.values.$suggestions);

		return this;
	}
	isMultiple(){
		return this.values.is_multiple;
	}
	setMultipleState(state){
		this.values.is_multiple = !!state;
		return this;
	}
	getValue(){
		let $target = this.getTarget();
		return $target.is(':input') ? $target.val() : $target.text();
	}
	setValue(value){
		let $target = this.getTarget();
		$target.is(':input') ? $target.val(value) : $target.html(value);
		return this;
	}
	onFocus(){
		let is_multiple = this.isMultiple();

		this.values.current_value = this.getValue();

		if (is_multiple)
			this.addTrailingComma();
	}
	onInput(event){
		let is_multiple = this.isMultiple(),
			new_value = this.getValue(),
			query;

		if (!new_value.trim()){
			this.values.$suggestions.hide();
			this.values.current_value = new_value;
			return;
		}

		if (this.values.current_value !== new_value){
			this.values.current_value = new_value;

			if (is_multiple)
				query = this.getCurrentQuery();
			else
				query = new_value;

			this.fns('onInput',{ query:query, callback:this.onNewSuggestions.bind(this) });
		}
	}
	onKeydown(event){
		if (!this.values.$suggestions.is(':visible') || !this.values.$suggestions.find('div').length)
			return;

		let is_multiple = this.isMultiple(),
			keys = {
				UP: 38,
				DOWN: 40,
				TAB: 9,
				RETURN: 13,
				ESC: 27,
				COMMA: 188
			};
		
		switch (UTILS.getCharKey(event)){
			case keys.UP:
				event.preventDefault();
				this.highlightPreviousSuggestion();
				return;

			case keys.DOWN:
				event.preventDefault();
				this.highlightNextSuggestion();
				return;

			case is_multiple && keys.COMMA:
			case keys.RETURN:
			case keys.TAB:
				this.selectHighlightedSuggestion();

				this.values.$suggestions.hide();

				// do not cancel event on TAB
				if (event.keyCode === keys.TAB) return;

				event.preventDefault();
				return;

			case keys.ESC:
				this.values.$suggestions.hide();
				return;
		}
	}
	onBlur(event){
		let is_multiple = this.isMultiple();

		this.values.$suggestions.hide();

		if (is_multiple)
			this.removeTrailingComma();
	}
	onSuggestionClick(event){
		event.preventDefault();
		event.stopPropagation();

		this.selectSuggestionByElement($(event.currentTarget));
		this.values.$suggestions.hide();
	}
	onNewSuggestions(suggestions){
		let html = '',
			search = this.values.current_value.replace(this.values.regex.escape_letters, '\\$&'),
			regex = new RegExp('(' + search + ')', 'i');

		this.values.current_values = this.values.current_value
			.trim()
			.split(this.values.regex.split_words_with_white_space);
		
		this.values.current_suggestions = suggestions
			.map(this.normalizeSuggestion.bind(this))
			.filter(this.newSuggestionsOnly.bind(this));

		if (this.values.current_suggestions.length === 0){
			this.values.$suggestions.hide();
			return;
		}

		this.values.current_suggestions.forEach((suggestion, index) => {
			let label = suggestion.label,
				highlight = (index === 0) ? ' class="highlight"' : '';

			if (!label) return;

			label = this.htmlEscape(label);

			//select first result per default
			html += '<div' + highlight + '>';
			html += label.replace(regex, '<strong>$1</strong>');
			html += '</div>';
		});

		this.values.$suggestions.html(html).show();

		return this;
	}
	newSuggestionsOnly(suggestion){
		if (!suggestion) return;
		return this.values.current_values.indexOf(suggestion.value) === -1;
	}
	normalizeSuggestion(suggestion){
		if (!suggestion) return;

		if (typeof suggestion === 'string'){
			return {
				label: suggestion,
				value: suggestion
			};
		}

		return suggestion;
	}
	highlightNextSuggestion(){
		let $highlighted = this.values.$suggestions.find('.highlight'),
			$next = $highlighted.next();

		if (!$next.length) return;

		$highlighted.removeClass('highlight');
		$next.addClass('highlight');

		return this;
	}
	highlightPreviousSuggestion(){
		let $highlighted = this.values.$suggestions.find('.highlight'),
			$prev = $highlighted.prev();

		if (!$prev.length) return;

		$highlighted.removeClass('highlight');
		$prev.addClass('highlight');

		return this;
	}
	selectHighlightedSuggestion(){
		let $highlighted = this.values.$suggestions.find('.highlight');
		this.selectSuggestionByElement($highlighted);
		return this;
	}
	selectSuggestionByElement($element){
		let $target = this.getTarget(),
			is_multiple = this.isMultiple(),
			selected = this.values.current_suggestions[ $element.index() ],
			value = selected.value;

		if (is_multiple)
			this.replaceCurrentWordWith(value);
		else {
			this.setValue(value);
			$target.focus();
			this.setCursorAt(value.length);
		}

		this.fns('onSelected',{ item:selected });

		return this;
	}
	setCursorAt(position){
		let $target = this.getTarget(),
			range = document.createRange(),
			sel = window.getSelection(),
			textNode = $target[0].childNodes.length ? $target[0].childNodes[0] : $target[0];

		position = Math.min(textNode.length, position);
		range.setStart(textNode, position);
		range.collapse(true);
		sel.removeAllRanges();
		sel.addRange(range);
		return this;
	}
	getCurrentQuery(){
		let $target = this.getTarget(),
			cursorAt = this.getCaretCharacterOffsetWithin($target[0]),
			charCount = 0,
			words = this.values.current_value.split(this.values.regex.split_words),
			word;

		for (var i = 0; i < words.length; i++){
			word = words[i];

			// if we are in the current word, we return all characters
			// between the beginning of the current word and the cursor
			// as query
			if (charCount + word.length >= cursorAt){
				return this.values.current_value.substring(charCount, cursorAt).trim();
			}
			charCount += word.length + 1; // add 1 for the ,
		}

		return this;
	}
	replaceCurrentWordWith(newWord){
		let $target = this.getTarget(),
			cursorAt = this.getCaretCharacterOffsetWithin($target[0]),
			charCount = 0,
			words = this.values.current_value.split(this.values.regex.split_words),
			word,
			beforeQuery,
			afterQuery;

		for (var i=0; i<words.length; i++){
			word = words[i];

			//if we are in the current word, we replace all characters
			//between the beginning of the current word and the cursor
			//with the newly selected word and set the cursor to the end
			if (charCount + word.length >= cursorAt){
				beforeQuery = this.values.current_value.substring(0, charCount).trim();
				afterQuery = this.values.current_value.substring(cursorAt);

				this.setValue(this.htmlEscape(beforeQuery + ' ' + newWord) + ',&nbsp' + this.htmlEscape(afterQuery));

				this.setCursorAt((beforeQuery + ' ' + newWord + ', ').length);

				return;
			}

			charCount += word.length + 1; // add 1 for the ,
		}

		return this;
	}
	getCaretCharacterOffsetWithin(element){
		let caretOffset = 0,
			doc = element.ownerDocument || element.document,
			win = doc.defaultView || doc.parentWindow,
			range,
			preCaretRange;

		if (typeof win.getSelection !== 'undefined' && win.getSelection().rangeCount > 0){
			range = win.getSelection().getRangeAt(0);
			preCaretRange = range.cloneRange();
			preCaretRange.selectNodeContents(element);
			preCaretRange.setEnd(range.endContainer, range.endOffset);
			caretOffset = preCaretRange.toString().length;
		}

		return caretOffset;
	}
	addTrailingComma(){
		let $target = this.getTarget(),
			current_value = this.getValue();

		if (current_value)
			this.setValue(current_value.replace(this.values.regex.trailing_comma, ', '));

		return this;
	}
	removeTrailingComma(){
		let $target = this.getTarget(),
			current_value = this.getValue();

		this.setValue(current_value.replace(this.values.regex.trailing_comma, ''));

		return this;
	}
	htmlEscape(string){
		return string
			.replace(/&/g, '&amp')
			.replace(/'/g, '&#39')
			.replace(/"/g, '&quot')
			.replace(/</g, '&lt')
			.replace(/>/g, '&gt');
	}
};