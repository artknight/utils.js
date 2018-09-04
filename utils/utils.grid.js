/*
	== UTILS.Grid ==

	dependencies
	------------
	gridstack.js

	ex. Grid = new UTILS.Grid({ items:$('.grid-field'), target:$('#form_view'), editable:true }).show()

	@target - (required) DOM elm where to prepend the grid to
	@items - (optional) elements from which the grid will be generated ( must contain 'data-grid' attribute )
	@width - (optional) width of the grid ( column size )
	@onChange - (optional) callback stack to execute when a grid elm changes (resize,move) --> (repeat execution)
	@onShow - (optional) callback stack to execute when the grid is shown --> (repeat execution)
	@onHide - (optional) callback stack to execute when the grid is hidden --> (repeat execution)
	@onCreate - (optional) callback stack to execute when the grid is created --> (one-time execution)
	@onStateChange - (optional) callback stack to execute when the grid'd state changes (editable state) --> (repeat execution)
	@onRenderedGridForPresentation - (optional) callback stack to execute when the grid has been prepared for presentation --> (repeat execution)
	@presentation - (optional) sets presentation mode - if mode enabled cells will be adjusted based on their true content --> defaults to 'false'
	@collape - (optional) sets collapse mode (only works when presentation mode is enabled) - if enabled, empty rows will be hidden and cells will be moved up
*/
UTILS.Grid = class extends UTILS.Base {
	constructor(data={}){
		super(data);

		_log(this.getObjectName()+' --> instantiated!', this.getId(), this);

		('items' in data) && this.setItems(data.items);
		('width' in data) && this.setGridWidth(data.width);
		('onChange' in data) && this.addCallback('onChange', data.onChange);
		('onStateChange' in data) && this.addCallback('onStateChange', data.onStateChange);
		('onShow' in data) && this.addCallback('onShow', data.onShow);
		('onRenderedGridForPresentation' in data) && this.addCallback('onRenderedGridForPresentation', data.onRenderedGridForPresentation);
		('onEnableEditing' in data) && this.addCallback('onEnableEditing', data.onEnableEditing);
		('onDisableEditing' in data) && this.addCallback('onDisableEditing', data.onDisableEditing);
		('presentation' in data && data.presentation) && this.setPresentationMode(data.presentation);
		('collapse' in data && data.collapse) && this.enableCollapse();

		return this;
	}
	getDefaults(){
		return {
			object:'utils.grid',
			version:'1.2.0',
			Grid: null, //holds the original Grid object
			$items: [], //holds the items to be loaded into the grid cells
			$target: $('body'), //DOM where grid will be added --> defaults to 'body'
			grid_width: 12, //grid width --> defaults to 12
			grid_cell_height: 80, //grid cell height in builder mode
			is_presentation: false, //holds the presentation state of the grid
			is_collapse: false, //if collapse is enabled, empty rows will be hidden in presentation layer
			divs: {
				$grid: null, //hilds the grid DOM elm
				cells: [] //holds the cells
			}, //holds the divs of the grid
			default_gridfield_data: { x:0, y:0, width:1, height:1, min_width:1, min_height:1 }
		};
	}
	isCollapsable(){
		return this.values.is_collapse;
	}
	enableCollapse(){
		_log(this.getObjectName()+' --> collapse setting enabled', this.getId());
		this.values.is_collapse = true;
		return this;
	}
	disableCollapse(){
		_log(this.getObjectName()+' --> collapse setting disabled', this.getId());
		this.values.is_collapse = false;
		return this;
	}
	isPresentationMode(){
		return this.values.is_presentation;
	}
	setPresentationMode(state){
		_log(this.getObjectName()+' --> mode changed to '+(state?'presentation':'editable'), this.getId());
		this.values.is_presentation = state;
		return this;
	}
	_getGridCellHeight(){
		return this.values.grid_cell_height;
	}
	_setGridCellHeight(height){
		_log(this.getObjectName()+' --> cell height changed to ' + height, this.getId());
		this.values.grid_cell_height = height;
		return this;
	}
	getGridWidth(){
		return this.values.grid_width;
	}
	setGridWidth(width){
		this.values.grid_width = width;

		var $grid = this.getGrid(),
			gridElm = this.getGridElm(),
			classes = $grid.attr('class').match(/(?:^|)grid-stack-(\w+)(?!\w)/g) || []; //match all classes starting with 'grid-cell...'

		if (classes.length)
			$grid.removeClass(_.joinArray(classes,' '));

		$grid.addClass('grid-stack-'+width).attr('data-gs-width',width);

		//lets set the grid width on the grid elm
		if (gridElm)
			gridElm.setGridWidth(width);

		_log(this.getObjectName()+' --> width changed to ' + width, this.getId());

		return this;
	}
	getGridHeight(){
		var max_height = Math.max.apply(null, _.map(this.getItems(), function(item){
			var data = $(item).data('grid');
			return data.y + data.width;
		}));
		return max_height;
	}
	getItems(){
		return this.values.$items;
	}
	_getNextDefaultFieldValueByType(type,count){
		var default_value = this.values.default_gridfield_data[type];

		if (/x/.test(type))
			default_value = count % 12;
		else if (/y/.test(type))
			default_value = Math.floor(count/12);

		return default_value;
	}
	setItems(items=[]){
		if (!items.length)
			UTILS.Errors.show('@items cannot be empty');
		else {
			var _items = _.map(items,function(item,i){
				var $item;

				//if JSON data
				if (!(item instanceof jQuery)){
					$item = $('<div class="grid-field"></div>');

					//lets check for inner content
					if ('content' in item)
						$item.html(item.content);

					$item.data('grid', {
						x: ('x' in item) ? item.x : this._getNextDefaultFieldValueByType('x'),
						y: ('y' in item) ? item.y : this._getNextDefaultFieldValueByType('y'),
						height: ('height' in item) ? item.height : this._getNextDefaultFieldValueByType('height'),
						width: ('width' in item) ? item.width : this._getNextDefaultFieldValueByType('width'),
						min_width: ('min_width' in item) ? item.min_width : this._getNextDefaultFieldValueByType('min_width'),
						min_height: ('min_height' in item) ? item.min_height : this._getNextDefaultFieldValueByType('min_height')
					});
				}
				else
					$item = $(item);

				//lets make sure .grid-field class is present
				$item.addClass('grid-field');

				return $item;
			}.bind(this));

			this.values.$items = $(_items);

			var $tmp_container = $('<div class="hide"></div>');
			$('body').append($tmp_container);
			$tmp_container.append(items);
			this.addCallback('onShow',function(){ $tmp_container.remove(); });
		}
		
		return this;
	}
	_getCells(){
		return this.values.divs.cells;
	}
	getGrid(){
		return this.values.divs.$grid;
	}
	_getGridElm(){
		return this.values.Grid;
	}
	_setGridElm(Grid){
		this.values.Grid = Grid;
		return this;
	}
	_createCell($item){
		var $cell = null,
			data = $item.data('grid'),
			$cell = $('<div class="grid-stack-item" data-gs-x="'+data.x+'" data-gs-y="'+data.y+'" data-gs-width="'+data.width+'" data-gs-height="'+data.height+'"></div>')
				.append($('<div class="grid-stack-item-content"></div>').append($item));

		//lets see if there are any min width/height restrains
		('min_width' in data) && $cell.attr('data-gs-min-width', data.min_width);
		('min_height' in data) && $cell.attr('data-gs-min-height', data.min_height);
		('max_width' in data) && $cell.attr('data-gs-max-width', data.max_width);
		('max_height' in data) && $cell.attr('data-gs-max-height', data.max_height);

		return $cell;
	}
	_addCellToGrid($cell){
		this.values.divs.cells.push($cell);
		this.getGrid().append($cell);
		return this;
	}
	_loadItemsIntoCells(){
		var items = this.getItems();

		if (items.length){
			_.each(items, function(item){
				var $item = $(item),
					$cell = this._createCell($item);
				this._addCellToGrid($cell);
			}.bind(this));
		}

		return this;
	}
	_createGrid(){
		var items = this.getItems();
		this.values.divs.$grid = $('<div class="grid-stack hide ' + (this.isPresentationMode() ? 'grid-presentation' : '') + '"></div>').data('app-gridstack', this);
		this.getTarget().prepend(this.values.divs.$grid);

		//init grid builder
		if (!this.isPresentationMode()){
			if (items.length)
				this._loadItemsIntoCells();

			this._initGridstack();
		}

		return this.values.divs.$grid;
	}
	_initGridstack(){
		var $grid = this.getGrid();

		//lets initialize the grid
		$grid.gridstack({
			cellHeight: this._getGridCellHeight(),
			verticalMargin: 10,
			alwaysShowResizeHandle: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
			draggable: {
				scroll: true
			},
			resizable: {
				handles: 'e, se, s, sw, w'
			}
		}).on('change', this.onGridChange.bind(this));
		
		this._setGridElm($grid.data('gridstack'));
		this.fns('onCreate');
		return this;
	}
	_unloadGridstack(){
		var $grid = this.getGrid();

		//moving items outside of .grid-stack-content elements
		_.each(this.getItems(),function(item){
			$grid.append( $(item) );
		});

		$grid.data('gridstack',null);
		$grid.find('.grid-stack-item').remove();
		return this;
	}
	_getCellFromItem($item){
		return $item.closest('.grid-stack-item');
	}
	getNextPosition(width,height,min_width,max_height){
		var GridElm = this._getGridElm();

		//lets add a fake widget just to get the proper positioning
		var $widget = GridElm.addWidget( $('<div class="hide"></div>'), 0, 0, width||1, height||1, true, min_width||1, null, max_height||1, null );

		//now lets get the positioning data
		var data = this._getCellPosition($widget);

		//now lets remove the $widget
		GridElm.removeWidget($widget);

		return { x:data.x, y:data.y, width:data.width, height:data.height, min_width:data.minWidth, min_height:data.minHeight  };
	}
	showHiddenItem($item){
		if (!$item.hasClass('grid-field'))
			$item = $item.closest('.grid-field');

		if ($item.length && $item.hasClass('grid-field-hidden')){
			_log(this.getObjectName()+' --> item state changed to show',$item);
			$item.removeClass('grid-field-hidden');

			if (this.isPresentationMode())
				this.reload();
			else {
				this._getCellFromItem($item).show();
				//if collapsable, reload the grid
				(this.isCollapsable()) && this.reload();
			}
		}
		return this;
	}
	hideShownItem($item){
		if (!$item.hasClass('grid-field'))
			$item = $item.closest('.grid-field');

		if ($item.length && !$item.hasClass('grid-field-hidden')){
			_log(this.getObjectName()+' --> item state changed to hide',$item);
			$item.addClass('grid-field-hidden');

			if (this.isPresentationMode())
				this.reload();
			else {
				this._getCellFromItem($item).hide();
				//if collapsable, reload the grid
				(this.isCollapsable()) && this.reload();
			}
		}

		return this;
	}
	getCellContent($cell){
		return $cell.find('.grid-stack-item-content');
	}
	_enableEditing(){
		var GridElm = this._getGridElm();

		if (GridElm){
			GridElm.setStatic(false); //enable dragndrop
			GridElm.cellHeight(this._getGridCellHeight());
		}

		this.getGrid().addClass('editable');
		this.getTarget().addClass('editable'); //lets add .editable to target as well
		this.fns('onEnableEditing');
		return this;
	}
	_disableEditing(){
		var GridElm = this._getGridElm();
		if (GridElm){
			GridElm.setStatic(true); //disable dragndrop
			GridElm.cellHeight(this._getGridCellHeight());
		}
		this.getGrid().removeClass('editable');
		this.getTarget().removeClass('editable');
		this.fns('onDisableEditing');
		return this;
	}
	hide(){
		var $grid = this.getGrid();
		$grid.addClass('hide');
		this.fns('onHide');
		return this;
	}
	//shows the grid
	show(){
		var $grid = this._createGrid();
		$grid.removeClass('hide');

		if (this.isPresentationMode()){
			this._disableEditing();
			this._renderGridForPresentation();
		}
		else
			this._enableEditing();

		this.fns('onShow');

		return this;
	}
	reload(){
		var GridElm = this._getGridElm(),
			$grid = this.getGrid();

		_log(this.getObjectName()+' --> reloading...', this.getId());

		//lets move items temporarily to avoid being removed (otherwise data values will get lost)
		var $tmp_container = $('<div class="hide"></div>');
		$('body').append($tmp_container);

		//moving items outside of .grid-stack-content elements
		_.each(this.getItems(),function(item){
			$tmp_container.append($(item));
		});

		if (GridElm){
			GridElm.removeAll(); //removing all cells from grid
			this.values.divs.cells = [];
		}

		if ($grid)
			$grid.remove(); //removing grid

		this.show();
		$tmp_container.remove();
		return this;
	}
	onGridChange(){
		this._udpateItemsPosition().fns('onChange');
	}
	//updating items with new coordinates
	_udpateItemsPosition(){
		if (!this.isPresentationMode()){
			_.each(this._getCells(), function($cell){
				var $item = $cell.find('.grid-field'),
					item_grid_data = $item.data('grid'),
					data = this._getCellPosition($cell);

				$item.data('grid', _.extend(item_grid_data, { x:data.x, y:data.y, width:data.width, height:data.height }));
			}.bind(this));
		}
		return this;
	}

	//gets cell position as specified by gridstack lib
	_getCellPosition($cell){
		return $cell.data('_gridstack_node');
	}

	getItemsAsJSON(){
		return _.map(this.getItems(),function(field){
			let $field = $(field),
				grid_data = $field.data('grid'),
				origdata = $field.data('origdata') || {};

			return _.extend({},origdata,grid_data);
		});
	}

	//adjust item height and coordinates for presentation
	_renderGridForPresentation(){
		_log(this.getObjectName()+' --> CA --> rendering cells for presentation',this.getId());
		var $grid = this.getGrid(),
			items = this.getItems(),
			is_collapsable = this.isCollapsable();

		//lets unload Gridstack
		this._unloadGridstack();

		//lets set the grid column width
		var max_width = Math.max.apply(null, _.map(items,function(item){ return item.x+item.width; }));

		if (max_width!==12)
			$grid[0].style.gridTemplateColumns = `repeat(${max_width},1fr)`;

		//lets render the fields
		_.each(items,function(item){
			var $item = $(item),
				item_data = $item.data('grid'),
				item_grid_data = {
					col_s: parseInt(item_data.x)+1,
					col_e: parseInt(item_data.x)+parseInt(item_data.width)+1,
					row_s: parseInt(item_data.y)+1,
					row_e: parseInt(item_data.y)+parseInt(item_data.height)+1
				};

			//lets set the styles
			$item[0].style.gridColumn = item_grid_data.col_s +'/'+ item_grid_data.col_e;
			$item[0].style.gridRow = item_grid_data.row_s +'/'+ item_grid_data.row_e;

			$item.data('item-data',item);

			//lets hide all hidden items
			if ($item.hasClass('grid-field-hidden'))
				$item.hide();
		});
		
		this.fns('onRenderedGridForPresentation');
		return this;
	}
};

var GRID = UTILS.Grid;