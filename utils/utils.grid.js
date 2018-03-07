/*
	== GRID ==

	dependencies
	------------
	gridstack.js

	ex. Grid = new GRID({ items:$('.grid-field'), target:$('#form_view'), editable:true }).show()

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
const GRID = class extends UTILS.Base {
	constructor(data){
		super(data);

		_log(this.getObjectName()+' --> instantiated!', this.getId(), this);

		if (_.isPlainObject(data)){
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
		}
		return this;
	}
	getDefaults(){
		return {
			object:'utils.grid',
			version:'1.0.8',
			Grid: null, //holds the original Grid object
			$items: [], //holds the items to be loaded into the grid cells
			$target: $('body'), //DOM where grid will be added --> defaults to 'body'
			grid_width: 12, //grid width --> defaults to 12
			grid_cell_height: 80, //grid cell height in builder mode
			is_editable: true, //holds the editable state of the grid --> defaults to 'true'
			is_presentation: false, //holds the presentation state of the grid
			is_collapse: false, //if collapse is enabled, empty rows will be hidden in presentation layer
			divs: {
				$grid: null, //hilds the grid DOM elm
				cells: [] //holds the cells
			} //holds the divs of the grid
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
		this._adjustGridCellsToWidth();
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
	setItems(items){
		this.values.$items = $(items);
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
	_adjustGridCellsToWidth(){
		_.each(this._getCells(), function($cell){
			this._setCellClass($cell);
		}.bind(this));
		this.updatePlaceholderClass();
		return this;
	}
	_updatePlaceholderClass(){
		var $placeholder = this.getGrid().find('.grid-stack-placeholder');
		this._setCellClass($placeholder);
		return this;
	}
	_getCellClass(){
		var grid_width = this.getGridWidth();
		return 'grid-cell' + (grid_width ? '-' + grid_width : '');
	}
	_setCellClass($cell){
		if ($cell.length){
			var grid_width = this.getGridWidth(),
				classes = $cell.attr('class').match(/(?:^|)grid-cell-(\w+)(?!\w)/g) || []; //match all classes starting with 'grid-cell...'
			(classes.length) && $cell.removeClass(_.joinArray(classes, ' '));
			$cell.addClass('grid-cell-' + grid_width);
		}
		return this;
	}
	_createCell($item){
		var $cell = null,
			cell_class = this._getCellClass(),
			data = $item.data('grid'),
			$cell = $('<div class="grid-stack-item '+cell_class+'" data-gs-x="'+data.x+'" data-gs-y="'+data.y+'" data-gs-width="'+data.width+'" data-gs-height="'+data.height+'"></div>').append( $('<div class="grid-stack-item-content"></div>').append($item) );

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
			(items.length) && this._loadItemsIntoCells();
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
			//float: true,
			draggable: {
				scroll: true
			},
			resizable: {
				handles: 'e, se, s, sw, w'
			}
		}).on('change', this.onGridChange.bind(this));
		this._updatePlaceholderClass();
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
		(!$item.hasClass('grid-field')) && ($item = $item.closest('.grid-field'));
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
		(!$item.hasClass('grid-field')) && ($item = $item.closest('.grid-field'));
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
	setGridState(state){
		this.values.is_editable = state;
		this.fns('onStateChange',{ state:state });
		return this;
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
		($grid) && $grid.remove(); //removing grid
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
	//adjust item height and coordinates for presentation
	_renderGridForPresentation(){
		_log(this.getObjectName()+' --> CA --> rendering cells for presentation',this.getId());
		var $grid = this.getGrid(),
			items = this.getItems(),
			cell_height = this._getGridCellHeight(),
			is_collapsable = this.isCollapsable();

		//lets unload Gridstack
		this._unloadGridstack();

		//adding media query to styles
		$('head').append('<style> @media (min-width: 768px) { .grid-row { height:'+cell_height+'px; } } </style>');

		//normalize items to be used in the algorithm
		var normalized_items = _.map(items,function(item){
			var $item = $(item),
				item_data = $item.data('grid');

			return { x:parseInt(item_data.x)+1, y:parseInt(item_data.y)+1, width:parseInt(item_data.width), height:parseInt(item_data.height), $item:$item };
		});

		//sorting items
		normalized_items = _.sortBy(normalized_items, function(item){ return item.x; });

		var createWrapper = function(item,offset) {
			var $wrapper = $('<div class="grid-item-wrapper"></div>');

			//lets add the data attr
			$wrapper.data('item-data',item);
			$wrapper.attr('data-x',item.x).attr('data-y',item.y).attr('data-width',item.width).attr('data-height',item.height);

			//adding col-span
			$wrapper.addClass('col-sm-'+item.width);

			//calculating offset
			(offset>0) && $wrapper.addClass('col-sm-offset-'+offset);

			//setting min height
			(!is_collapsable) && $wrapper.css('height',item.height*cell_height);

			$wrapper.append(item.$item);
			return $wrapper;
		};

		var createRow = function() {
			var $row = $('<div class="row col-sm-12 grid-row"></div>');
			(!is_collapsable) && $row.css('min-height',cell_height);
			return $row;
		};

		var render = function(){
			var rows = [],
				grouped_items = _.groupBy(normalized_items, function(item){ return item.y; }),
				max_row = _.max(normalized_items, function(item){ return item.y; }).y;

			_.times(max_row, function(n){
				rows.push({ y:n, $row:createRow() });
			});

			_.each(grouped_items, function(items,row){
				var $row = rows[row-1].$row;

				_.each(items, function(item,index,items_in_row){
					var immediate_left_item = items_in_row[index-1];
					var offset = 0;

					if (immediate_left_item)
						offset = item.x - (immediate_left_item.x+immediate_left_item.width);
					else
						offset = item.x-1;

					var $wrapper = createWrapper(item,offset);
					$row.append($wrapper);

					//lets hide all hidden items
					(item.$item.hasClass('grid-field-hidden')) && $wrapper.hide();
				});
			});

			_.each(rows, function(row){
				$grid.append(row.$row);
			});

			//lets adjust row height if content is too tall
			/*_log('this.getObjectName()+' --> CA --> adjusting row height');
			_.each($('.grid-row'), function(row){
				var $row = $(row);
				if ($row.prop('scrollHeight')>$row.height())
					$row.height('auto');
			});*/
		};

		render();

		if (is_collapsable){
			//removing empty rows
			_log(this.getObjectName()+' --> CA --> removing empty rows');
			var empty_rows = _.filter($('.grid-row'),function(row){
				var $row = $(row);
				return $row.is(':empty');
			});
			$(empty_rows).remove();
		}

		this.fns('onRenderedGridForPresentation');
		return this;
	}
};