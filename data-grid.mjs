function noop() {}

function assign(tar, src) {
	for (var k in src) tar[k] = src[k];
	return tar;
}

function append(target, node) {
	target.appendChild(node);
}

function insert(target, node, anchor) {
	target.insertBefore(node, anchor);
}

function detachNode(node) {
	node.parentNode.removeChild(node);
}

function destroyEach(iterations, detach) {
	for (var i = 0; i < iterations.length; i += 1) {
		if (iterations[i]) iterations[i].d(detach);
	}
}

function createElement(name) {
	return document.createElement(name);
}

function createText(data) {
	return document.createTextNode(data);
}

function createComment() {
	return document.createComment('');
}

function addListener(node, event, handler, options) {
	node.addEventListener(event, handler, options);
}

function removeListener(node, event, handler, options) {
	node.removeEventListener(event, handler, options);
}

function setAttribute(node, attribute, value) {
	if (value == null) node.removeAttribute(attribute);
	else node.setAttribute(attribute, value);
}

function setData(text, data) {
	text.data = '' + data;
}

function setStyle(node, key, value) {
	node.style.setProperty(key, value);
}

function addResizeListener(element, fn) {
	if (getComputedStyle(element).position === 'static') {
		element.style.position = 'relative';
	}

	const object = document.createElement('object');
	object.setAttribute('style', 'display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; pointer-events: none; z-index: -1;');
	object.type = 'text/html';

	let win;

	object.onload = () => {
		win = object.contentDocument.defaultView;
		win.addEventListener('resize', fn);
	};

	if (/Trident/.test(navigator.userAgent)) {
		element.appendChild(object);
		object.data = 'about:blank';
	} else {
		object.data = 'about:blank';
		element.appendChild(object);
	}

	return {
		cancel: () => {
			win && win.removeEventListener && win.removeEventListener('resize', fn);
			element.removeChild(object);
		}
	};
}

function destroyBlock(block, lookup) {
	block.d(1);
	lookup[block.key] = null;
}

function updateKeyedEach(old_blocks, component, changed, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, intro_method, next, get_context) {
	var o = old_blocks.length;
	var n = list.length;

	var i = o;
	var old_indexes = {};
	while (i--) old_indexes[old_blocks[i].key] = i;

	var new_blocks = [];
	var new_lookup = {};
	var deltas = {};

	var i = n;
	while (i--) {
		var child_ctx = get_context(ctx, list, i);
		var key = get_key(child_ctx);
		var block = lookup[key];

		if (!block) {
			block = create_each_block(component, key, child_ctx);
			block.c();
		} else if (dynamic) {
			block.p(changed, child_ctx);
		}

		new_blocks[i] = new_lookup[key] = block;

		if (key in old_indexes) deltas[key] = Math.abs(i - old_indexes[key]);
	}

	var will_move = {};
	var did_move = {};

	function insert(block) {
		block[intro_method](node, next);
		lookup[block.key] = block;
		next = block.first;
		n--;
	}

	while (o && n) {
		var new_block = new_blocks[n - 1];
		var old_block = old_blocks[o - 1];
		var new_key = new_block.key;
		var old_key = old_block.key;

		if (new_block === old_block) {
			// do nothing
			next = new_block.first;
			o--;
			n--;
		}

		else if (!new_lookup[old_key]) {
			// remove old block
			destroy(old_block, lookup);
			o--;
		}

		else if (!lookup[new_key] || will_move[new_key]) {
			insert(new_block);
		}

		else if (did_move[old_key]) {
			o--;

		} else if (deltas[new_key] > deltas[old_key]) {
			did_move[new_key] = true;
			insert(new_block);

		} else {
			will_move[old_key] = true;
			o--;
		}
	}

	while (o--) {
		var old_block = old_blocks[o];
		if (!new_lookup[old_block.key]) destroy(old_block, lookup);
	}

	while (n) insert(new_blocks[n - 1]);

	return new_blocks;
}

function blankObject() {
	return Object.create(null);
}

function destroy(detach) {
	this.destroy = noop;
	this.fire('destroy');
	this.set = noop;

	this._fragment.d(detach !== false);
	this._fragment = null;
	this._state = {};
}

function _differs(a, b) {
	return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}

function fire(eventName, data) {
	var handlers =
		eventName in this._handlers && this._handlers[eventName].slice();
	if (!handlers) return;

	for (var i = 0; i < handlers.length; i += 1) {
		var handler = handlers[i];

		if (!handler.__calling) {
			try {
				handler.__calling = true;
				handler.call(this, data);
			} finally {
				handler.__calling = false;
			}
		}
	}
}

function flush(component) {
	component._lock = true;
	callAll(component._beforecreate);
	callAll(component._oncreate);
	callAll(component._aftercreate);
	component._lock = false;
}

function get() {
	return this._state;
}

function init(component, options) {
	component._handlers = blankObject();
	component._slots = blankObject();
	component._bind = options._bind;
	component._staged = {};

	component.options = options;
	component.root = options.root || component;
	component.store = options.store || component.root.store;

	if (!options.root) {
		component._beforecreate = [];
		component._oncreate = [];
		component._aftercreate = [];
	}
}

function on(eventName, handler) {
	var handlers = this._handlers[eventName] || (this._handlers[eventName] = []);
	handlers.push(handler);

	return {
		cancel: function() {
			var index = handlers.indexOf(handler);
			if (~index) handlers.splice(index, 1);
		}
	};
}

function set(newState) {
	this._set(assign({}, newState));
	if (this.root._lock) return;
	flush(this.root);
}

function _set(newState) {
	var oldState = this._state,
		changed = {},
		dirty = false;

	newState = assign(this._staged, newState);
	this._staged = {};

	for (var key in newState) {
		if (this._differs(newState[key], oldState[key])) changed[key] = dirty = true;
	}
	if (!dirty) return;

	this._state = assign(assign({}, oldState), newState);
	this._recompute(changed, this._state);
	if (this._bind) this._bind(changed, this._state);

	if (this._fragment) {
		this.fire("state", { changed: changed, current: this._state, previous: oldState });
		this._fragment.p(changed, this._state);
		this.fire("update", { changed: changed, current: this._state, previous: oldState });
	}
}

function _stage(newState) {
	assign(this._staged, newState);
}

function callAll(fns) {
	while (fns && fns.length) fns.shift()();
}

function _mount(target, anchor) {
	this._fragment[this._fragment.i ? 'i' : 'm'](target, anchor || null);
}

var proto = {
	destroy,
	get,
	fire,
	on,
	set,
	_recompute: noop,
	_set,
	_stage,
	_mount,
	_differs
};

/* src\data-grid.html generated by Svelte v2.16.1 */

const MIN_COLUMN_SIZE = 30;

/**
 * Computes the 'left' value for a grid-cell.
 * @param {Number} i The cell index
 * @param {Array} columnWidths The array of column widths in order
 * @returns {Number}
 */
function getCellLeft(i, columnWidths) {
  let left = 0;
  for (let j = 0; j < i; j++) {
    left += columnWidths[j];
  }
  return left;
}

function getClosestIndex(x, columnWidths) {
  let closest = 0;
  for (let i = 0; i < columnWidths.length; i++) {
    const left = getCellLeft(i, columnWidths);
    if (left < x ) {
      closest = i+1;
    }
  }

  return closest;

}

function columnWidths_1({ columns }) {
  return columns.map(x => x.width || MIN_COLUMN_SIZE);
}

function numRows({ rows }) {
  return rows.length;
}

function gridSpaceWidth({ columnWidths }) {
  let sum = 0;
  for (let i = 0; i < columnWidths.length; i++) {
    sum += columnWidths[i];
  }

  return sum;
}

function gridSpaceHeight({ rowHeight, numRows }) {
  return rowHeight * numRows;
}

function numRowsInViewport({ __innerOffsetHeight, rowHeight }) {
  return Math.ceil(__innerOffsetHeight / rowHeight);
}

function visibleRows({ rowHeight, rows, __scrollTop, numRowsInViewport, __extraRows }) {
  const start = Math.max(0, Math.floor((__scrollTop / rowHeight) - (__extraRows / 2)));
  const end = start + numRowsInViewport + __extraRows;

  return rows.slice(start, end).map((x, i) => {
    return {
      i: i + start, // for aria-rowindex
      data: x       // the row data
    };
  });
}

function data() {
  return {
    rows: [],                             // Rows to display
    columns: [],                          // Array of column definitions: { display: '', dataName: ''}, where display is what the display value is and dataName is what the key on the row object is
    rowHeight: 24,                        // Row height in pixels
    allowResizeFromTableCells: false,     // Allow the user to click on table cell borders to resize columns
    allowResizeFromTableHeaders: true,    // Allow the user to clikc on table header borders to resize columns
    allowColumnReordering: true,          // Allow the user to drag column headers to reorder columns

    __extraRows: 0,                       // Number of extra rows to render beyond what is visible in the scrollable area
    __columnHeaderResizeCaptureWidth: 20, // The width of the area on column borders that can be clicked to resize the column

    /**** Do not modify any of the data variables below ****/
    __columnDragging: false,              // DO NOT MODIFY DIRECTLY. Whether a column is being dragged
    __columnIndexBeingDragged: null,      // DO NOT MODIFY DIRECTLY. The column index that is being dragged
    __columnDragOffsetX: 0,               // DO NOT MODIFY DIRECTLY. The X offset of where the user clicked on the column header
    __resizing: false,                    // DO NOT MODIFY DIRECTLY. Whether or not a column is currently being resized
    __columnIndexBeingResized: null,      // DO NOT MODIFY DIRECTLY. The column index being resized
    __columnActionLineLeft: 0,            // DO NOT MODIFY DIRECTLY. The 'left' position of the action line
    __innerOffsetHeight: 0,               // DO NOT MODIFY DIRECTLY. The height of the scrollable area on screen
    __scrollTop: 0,                       // DO NOT MODIFY DIRECTLY. The scrollTop position of the scrollable area
    __scrollLeft: 0,                      // DO NOT MODIFY DIRECTLY The scrollLeft position of the scrollable area
    
  };
}
function getRowTop(i, rowHeight) {
  return i * rowHeight;
}
var methods = {
  onMouseMove(event) {
    this.onColumnDragMouseMove(event);
    this.onColumnResizeMouseMove(event);
  },
  onMouseUp(event) {
    this.onColumnDragEnd(event);
    this.onColumnResizeEnd(event);
  },

  /**
   * Event handler for column dragging
   */
  onColumnDragStart(event, columnIndex) {
    if (event.which !== 1) {
      return;
    }

    const { columnWidths, __scrollLeft, allowColumnReordering } = this.get();
    
    // if the developer has disabled column reordering, don't begin a reorder
    if (!allowColumnReordering) {
      return;
    }

    this.set({
      __columnDragging: true,
      __columnIndexBeingDragged: columnIndex,
      __columnDragOffsetX: event.offsetX,
      __columnActionLineLeft: getCellLeft(columnIndex, columnWidths) - __scrollLeft
    });
  },
  onColumnDragMouseMove(event) {
    const { __columnDragging, __columnDragOffsetX, __scrollLeft, __columnActionLineLeft, columnWidths } = this.get();
    if (!__columnDragging) {
      return;
    }

    // if user is no longer pressing the left mouse button and we are out of sync
    // with __columnDragging because mouseup didn't fire, finish the reorder
    if (event.which !== 1) {
      console.log(event.which);
      this.onColumnDragEnd(event);
      return;
    }


    const { left: wrapperPageX } = this.refs.wrapper.getBoundingClientRect();

    // change the position of the action line to the closest column index under the mouse
    const offsetPoint = event.screenX - wrapperPageX + __scrollLeft - __columnDragOffsetX;
    const idx = getClosestIndex(offsetPoint, columnWidths);
    
    this.set({
      __columnActionLineLeft: getCellLeft(idx, columnWidths) - __scrollLeft
    });
  },

  /**
   * Window mouseup handler for column dragging
   */
  onColumnDragEnd(event) {
    const { __columnIndexBeingDragged, __scrollLeft, columnWidths, columns, __columnDragging, __columnDragOffsetX } = this.get();

    // user might try to be clever and middle-click to scroll horizontally while dragging a column
    // don't stop the drag for middle clicks
    if (event.which !== 1) {
      return;
    }

    // if a column isn't being dragged, don't reorder anything
    if (!__columnDragging) {
      return;
    }

    const { left: wrapperPageX } = this.refs.wrapper.getBoundingClientRect();
    const offsetPoint = event.screenX - wrapperPageX + __scrollLeft - __columnDragOffsetX;

    // move column object to its new position in the array based off the mouse position and scroll position
    const newIdx = getClosestIndex(offsetPoint, columnWidths);
    columns.splice(newIdx > __columnIndexBeingDragged ? newIdx - 1 : newIdx, 0, columns.splice(__columnIndexBeingDragged, 1)[0]);
    
    // delay firing of event so that new column order is accessible when handlers are fired
    setTimeout(() => this.fire('columnOrderUpdated'), 0);

    this.set({
      __columnDragging: false,
      columns,
      __columnDragOffsetX: 0,
      __columnIndexBeingDragged: null
    });
  },

  /**
   * Mousedown handler for column resizing
   */
  onColumnResizeStart(event, columnIndex) {
    // left click only
    if (event.which !== 1) {
      return;
    }
    const { left: wrapperPageX } = this.refs.wrapper.getBoundingClientRect();
    const { __scrollLeft } = this.get();

    this.set({
      __resizing: true,
      __columnActionLineLeft: event.screenX - wrapperPageX - __scrollLeft,
      __columnIndexBeingResized: columnIndex
    });

    event.stopPropagation();
  },

  /**
   * Mousemove handler for column resizing
   */
  onColumnResizeMouseMove(event) {
    const { __resizing, __columnIndexBeingResized, columnWidths, __scrollLeft, __columnActionLineLeft, columns } = this.get();

    // if not currently resizing a column, ignore the event
    if (!__resizing) {
      return;
    }

    const { left: wrapperPageX } = this.refs.wrapper.getBoundingClientRect();

    const resizeLineLeft = event.screenX - wrapperPageX;
    const columnLeft = getCellLeft(__columnIndexBeingResized, columnWidths);
    const resizeLineMinLeft = columnLeft - __scrollLeft + MIN_COLUMN_SIZE;

    columns[__columnIndexBeingResized].width = Math.max((resizeLineLeft + __scrollLeft) - columnLeft, MIN_COLUMN_SIZE);

    const obj = {
      __columnActionLineLeft: Math.max(resizeLineLeft, resizeLineMinLeft),
      columns
    };
    
    // If mouseup was not fired for some reason, abort the resize
    if (event.which !== 1) {        
      obj.__resizing = false;
      obj.__columnIndexBeingResized = null;

      // delay firing the event until the next frame to guarantee that new values will be available in component.get()
      setTimeout(() => this.fire('columnWidthUpdated'), 0);
    }

    this.set(obj);
    
    // if still resizing and the user does not have the left mouse button depressed,
    // the mouseup event didn't fire for some reason, so turn off the resize mode
    
  },

  /**
   * Mouseup handler for column resizing
   */
  onColumnResizeEnd(event) {
    const { __resizing } = this.get();
    if (!__resizing) {
      return;
    }
    
    this.fire('columnWidthUpdated');
    this.set({
      __resizing: false,
      __columnIndexBeingResized: null
    });
  },

  /**
   * Sets updated scroll values when the scrollable area is scrolled
   */
  onScroll(event) {
    const obj = {};
    // get current saved scroll values
    const { __scrollTop, __scrollLeft } = this.get();

    // get new scroll values from the scroll area
    const { scrollTop: newScrollTop, scrollLeft: newScrollLeft } = this.refs.tableSpace;

    /* 
     * To avoid doing unnecessary re-calculation of computed variables, don't set the scroll
     * properties that haven't changed
     */
    if (__scrollTop !== newScrollTop) {
      obj.__scrollTop = newScrollTop;
    }

    if (__scrollLeft !== newScrollLeft) {
      obj.__scrollLeft = newScrollLeft;
    }

    this.set(obj);
  }
};

function dragCopy(node, enabled) {
  let copy = null;
  let dragging = false;
  let offsetX = 0;

  function onWindowMouseMove(event) {
    if (!dragging) {
      return;
    }
    copy.style.left = (event.screenX - offsetX) + 'px';
  }

  function onWindowMouseUp(event) {
    if (!dragging || event.which !== 1) {
      return;
    }

    dragging = false;
    document.body.removeChild(copy);
    copy = null;
  }

  function onNodeMouseDown(event) {
    if (event.which !== 1) {
      return;
    }

    dragging = true;
    if (copy) {
      document.body.removeChild(copy);
    }

    copy = createCopy();
    offsetX = event.offsetX;
    copy.style.top = node.getBoundingClientRect().top + 'px';
    copy.style.left = (event.screenX - offsetX) + 'px';
    document.body.appendChild(copy);
  }

  function createCopy() {
    const copy = document.createElement('div');
    copy.innerHTML = node.innerHTML;
    const { width, height, textAlign, fontWeight } = getComputedStyle(node);
    copy.style.width = width;
    copy.style.height = height;
    copy.style.textAlign = textAlign;
    copy.style.fontWeight = fontWeight;
    copy.style.position = 'absolute';
    copy.style.opacity = '0.5';
    copy.style.pointerEvents = 'none';
    copy.style.overflow = 'hidden';
    copy.style.background = '#dddddd';
    copy.style['z-index'] = '99999';

    return copy;
  }

  function attachEvents() {
    window.addEventListener('mousemove', onWindowMouseMove);
    window.addEventListener('mouseup', onWindowMouseUp);
    node.addEventListener('mousedown', onNodeMouseDown);
  }

  function detachEvents() {
    window.removeEventListener('mousemove', onWindowMouseMove);
    window.removeEventListener('mouseup', onWindowMouseUp);
    node.removeEventListener('mousedown', onNodeMouseDown);
  }
  if (enabled) {
    attachEvents();
  }

  return {
    destroy() {
      detachEvents();
    },
    update(enabled) {
      if (enabled) {
        attachEvents();
      } else {
        detachEvents();
      }
    }
  }
}
function add_css() {
	var style = createElement("style");
	style.id = 'svelte-a99g4w-style';
	style.textContent = ".resizing.svelte-a99g4w .svelte-a99g4w{user-select:none}.resizing.svelte-a99g4w .grid-inner.svelte-a99g4w{overflow-y:hidden}.resizing.svelte-a99g4w .grid-space.svelte-a99g4w{pointer-events:all}.cell-default.svelte-a99g4w{padding:0 5px;overflow:hidden;text-overflow:ellipsis}.data-grid-wrapper.svelte-a99g4w{position:relative;width:100%;height:100%}.column-action-line.svelte-a99g4w{position:absolute;top:0;bottom:17px;z-index:3;width:4px;background:#aaa;cursor:ew-resize}.grid-cell-size-capture.svelte-a99g4w{position:absolute;top:0;bottom:0;z-index:5;background:transparent;cursor:ew-resize}.grid-inner.svelte-a99g4w{overflow:auto}.grid-space.svelte-a99g4w{position:absolute;top:0;left:0;background:transparent;pointer-events:none;z-index:1}.grid-headers.svelte-a99g4w{position:absolute;overflow:hidden;max-width:100%;width:100%;top:0;left:0;border-bottom:2px solid black}.grid-headers.svelte-a99g4w .grid-cell.svelte-a99g4w{text-align:center;font-weight:bold;cursor:pointer}.grid-headers.svelte-a99g4w .grid-cell.svelte-a99g4w:hover{background:#eee}.grid-header-row.svelte-a99g4w{position:absolute;overflow:hidden;top:0}.grid-row.svelte-a99g4w{position:absolute;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.grid-row.svelte-a99g4w:not(:last-child){border-bottom:1px solid #ccc}.grid-cell.svelte-a99g4w{position:absolute;top:0;text-overflow:ellipsis;overflow:hidden}.grid-cell.svelte-a99g4w:not(:last-child){border-right:1px solid #ccc}";
	append(document.head, style);
}

function mousedown_handler_2(event) {
	const { component, ctx } = this._svelte;

	component.onColumnResizeStart(event, ctx.j);
}

function get_each_context(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.column = list[i];
	child_ctx.j = i;
	return child_ctx;
}

function get_each1_context(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.row = list[i];
	child_ctx.i = i;
	return child_ctx;
}

function mousedown_handler_1(event) {
	const { component, ctx } = this._svelte;

	component.onColumnResizeStart(event, ctx.i);
}

function mousedown_handler(event) {
	const { component, ctx } = this._svelte;

	component.onColumnDragStart(event, ctx.i);
}

function get_each0_context(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.column = list[i];
	child_ctx.i = i;
	return child_ctx;
}

function create_main_fragment(component, ctx) {
	var div4, text0, div1, div0, each0_blocks_1 = [], each0_lookup = blankObject(), text1, div3, div2, text2, div3_resize_listener, div4_class_value;

	function onwindowmouseup(event) {
		component.onMouseUp(event);	}
	window.addEventListener("mouseup", onwindowmouseup);

	function onwindowmousemove(event) {
		component.onMouseMove(event);	}
	window.addEventListener("mousemove", onwindowmousemove);

	var if_block = (ctx.__resizing || ctx.__columnDragging) && create_if_block_4(component, ctx);

	var each0_value = ctx.columns;

	const get_key = ctx => ctx.i;

	for (var i_1 = 0; i_1 < each0_value.length; i_1 += 1) {
		let child_ctx = get_each0_context(ctx, each0_value, i_1);
		let key = get_key(child_ctx);
		each0_blocks_1[i_1] = each0_lookup[key] = create_each_block_2(component, key, child_ctx);
	}

	var each1_value = ctx.visibleRows;

	var each1_blocks = [];

	for (var i_1 = 0; i_1 < each1_value.length; i_1 += 1) {
		each1_blocks[i_1] = create_each_block(component, get_each1_context(ctx, each1_value, i_1));
	}

	function div3_resize_handler() {
		component.set({ __innerOffsetHeight: div3.offsetHeight });
	}

	function scroll_handler(event) {
		component.onScroll(event);
	}

	return {
		c() {
			div4 = createElement("div");
			if (if_block) if_block.c();
			text0 = createText("\r\n\r\n  ");
			div1 = createElement("div");
			div0 = createElement("div");

			for (i_1 = 0; i_1 < each0_blocks_1.length; i_1 += 1) each0_blocks_1[i_1].c();

			text1 = createText("\r\n  ");
			div3 = createElement("div");
			div2 = createElement("div");
			text2 = createText("\r\n    \r\n    \r\n    ");

			for (var i_1 = 0; i_1 < each1_blocks.length; i_1 += 1) {
				each1_blocks[i_1].c();
			}
			div0.className = "grid-header-row svelte-a99g4w";
			setStyle(div0, "left", "-" + ctx.__scrollLeft + "px");
			setStyle(div0, "height", "" + ctx.rowHeight + "px");
			setStyle(div0, "width", "" + ctx.gridSpaceWidth + "px");
			setAttribute(div0, "role", "row");
			div1.className = "grid-headers svelte-a99g4w";
			setStyle(div1, "height", "" + ctx.rowHeight + "px");
			setAttribute(div1, "rolw", "rowgroup");
			div2.className = "grid-space svelte-a99g4w";
			setStyle(div2, "width", "" + ctx.gridSpaceWidth + "px");
			setStyle(div2, "height", "" + ctx.gridSpaceHeight + "px");
			component.root._aftercreate.push(div3_resize_handler);
			addListener(div3, "scroll", scroll_handler);
			div3.className = "grid-inner svelte-a99g4w";
			setStyle(div3, "height", "calc(100% )");
			setAttribute(div3, "role", "rowgroup");
			div4.className = div4_class_value = "data-grid-wrapper " + (ctx.__resizing || ctx.__columnDragging ? 'resizing' : '') + " svelte-a99g4w";
			setStyle(div4, "padding-top", "" + ctx.rowHeight + "px");
			setAttribute(div4, "role", "table");
		},

		m(target, anchor) {
			insert(target, div4, anchor);
			if (if_block) if_block.m(div4, null);
			append(div4, text0);
			append(div4, div1);
			append(div1, div0);

			for (i_1 = 0; i_1 < each0_blocks_1.length; i_1 += 1) each0_blocks_1[i_1].m(div0, null);

			append(div4, text1);
			append(div4, div3);
			append(div3, div2);
			append(div3, text2);

			for (var i_1 = 0; i_1 < each1_blocks.length; i_1 += 1) {
				each1_blocks[i_1].m(div3, null);
			}

			div3_resize_listener = addResizeListener(div3, div3_resize_handler);
			component.refs.tableSpace = div3;
			component.refs.wrapper = div4;
		},

		p(changed, ctx) {
			if (ctx.__resizing || ctx.__columnDragging) {
				if (if_block) {
					if_block.p(changed, ctx);
				} else {
					if_block = create_if_block_4(component, ctx);
					if_block.c();
					if_block.m(div4, text0);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}

			const each0_value = ctx.columns;
			each0_blocks_1 = updateKeyedEach(each0_blocks_1, component, changed, get_key, 1, ctx, each0_value, each0_lookup, div0, destroyBlock, create_each_block_2, "m", null, get_each0_context);

			if (changed.__scrollLeft) {
				setStyle(div0, "left", "-" + ctx.__scrollLeft + "px");
			}

			if (changed.rowHeight) {
				setStyle(div0, "height", "" + ctx.rowHeight + "px");
			}

			if (changed.gridSpaceWidth) {
				setStyle(div0, "width", "" + ctx.gridSpaceWidth + "px");
			}

			if (changed.rowHeight) {
				setStyle(div1, "height", "" + ctx.rowHeight + "px");
			}

			if (changed.gridSpaceWidth) {
				setStyle(div2, "width", "" + ctx.gridSpaceWidth + "px");
			}

			if (changed.gridSpaceHeight) {
				setStyle(div2, "height", "" + ctx.gridSpaceHeight + "px");
			}

			if (changed.visibleRows || changed.rowHeight || changed.gridSpaceWidth || changed.columns || changed.allowResizeFromTableCells || changed.columnWidths || changed.Math || changed.__columnHeaderResizeCaptureWidth) {
				each1_value = ctx.visibleRows;

				for (var i_1 = 0; i_1 < each1_value.length; i_1 += 1) {
					const child_ctx = get_each1_context(ctx, each1_value, i_1);

					if (each1_blocks[i_1]) {
						each1_blocks[i_1].p(changed, child_ctx);
					} else {
						each1_blocks[i_1] = create_each_block(component, child_ctx);
						each1_blocks[i_1].c();
						each1_blocks[i_1].m(div3, null);
					}
				}

				for (; i_1 < each1_blocks.length; i_1 += 1) {
					each1_blocks[i_1].d(1);
				}
				each1_blocks.length = each1_value.length;
			}

			if ((changed.__resizing || changed.__columnDragging) && div4_class_value !== (div4_class_value = "data-grid-wrapper " + (ctx.__resizing || ctx.__columnDragging ? 'resizing' : '') + " svelte-a99g4w")) {
				div4.className = div4_class_value;
			}

			if (changed.rowHeight) {
				setStyle(div4, "padding-top", "" + ctx.rowHeight + "px");
			}
		},

		d(detach) {
			window.removeEventListener("mouseup", onwindowmouseup);

			window.removeEventListener("mousemove", onwindowmousemove);

			if (detach) {
				detachNode(div4);
			}

			if (if_block) if_block.d();

			for (i_1 = 0; i_1 < each0_blocks_1.length; i_1 += 1) each0_blocks_1[i_1].d();

			destroyEach(each1_blocks, detach);

			div3_resize_listener.cancel();
			removeListener(div3, "scroll", scroll_handler);
			if (component.refs.tableSpace === div3) component.refs.tableSpace = null;
			if (component.refs.wrapper === div4) component.refs.wrapper = null;
		}
	};
}

// (3:2) {#if __resizing || __columnDragging}
function create_if_block_4(component, ctx) {
	var div;

	return {
		c() {
			div = createElement("div");
			div.className = "column-action-line svelte-a99g4w";
			setStyle(div, "left", "" + (ctx.__columnActionLineLeft - 2) + "px");
		},

		m(target, anchor) {
			insert(target, div, anchor);
		},

		p(changed, ctx) {
			if (changed.__columnActionLineLeft) {
				setStyle(div, "left", "" + (ctx.__columnActionLineLeft - 2) + "px");
			}
		},

		d(detach) {
			if (detach) {
				detachNode(div);
			}
		}
	};
}

// (16:10) {:else}
function create_else_block_1(component, ctx) {
	var div, text_value = ctx.column.display || '', text;

	return {
		c() {
			div = createElement("div");
			text = createText(text_value);
			div.className = "cell-default svelte-a99g4w";
		},

		m(target, anchor) {
			insert(target, div, anchor);
			append(div, text);
		},

		p(changed, ctx) {
			if ((changed.columns) && text_value !== (text_value = ctx.column.display || '')) {
				setData(text, text_value);
			}
		},

		d(detach) {
			if (detach) {
				detachNode(div);
			}
		}
	};
}

// (14:10) {#if column.headerComponent}
function create_if_block_3(component, ctx) {
	var switch_instance_anchor;

	var switch_value = ctx.column.headerComponent;

	function switch_props(ctx) {
		var switch_instance_initial_data = { column: ctx.column };
		return {
			root: component.root,
			store: component.store,
			data: switch_instance_initial_data
		};
	}

	if (switch_value) {
		var switch_instance = new switch_value(switch_props(ctx));
	}

	return {
		c() {
			if (switch_instance) switch_instance._fragment.c();
			switch_instance_anchor = createComment();
		},

		m(target, anchor) {
			if (switch_instance) {
				switch_instance._mount(target, anchor);
			}

			insert(target, switch_instance_anchor, anchor);
		},

		p(changed, ctx) {
			var switch_instance_changes = {};
			if (changed.columns) switch_instance_changes.column = ctx.column;

			if (switch_value !== (switch_value = ctx.column.headerComponent)) {
				if (switch_instance) {
					switch_instance.destroy();
				}

				if (switch_value) {
					switch_instance = new switch_value(switch_props(ctx));
					switch_instance._fragment.c();
					switch_instance._mount(switch_instance_anchor.parentNode, switch_instance_anchor);
				} else {
					switch_instance = null;
				}
			}

			else if (switch_value) {
				switch_instance._set(switch_instance_changes);
			}
		},

		d(detach) {
			if (detach) {
				detachNode(switch_instance_anchor);
			}

			if (switch_instance) switch_instance.destroy(detach);
		}
	};
}

// (22:8) {#if allowResizeFromTableHeaders}
function create_if_block_2(component, ctx) {
	var div;

	return {
		c() {
			div = createElement("div");
			div._svelte = { component, ctx };

			addListener(div, "mousedown", mousedown_handler_1);
			div.className = "grid-cell-size-capture svelte-a99g4w";
			setStyle(div, "left", "" + (getCellLeft(ctx.i+1, ctx.columnWidths) - ctx.Math.floor(ctx.__columnHeaderResizeCaptureWidth / 2)) + "px");
			setStyle(div, "width", "" + ctx.__columnHeaderResizeCaptureWidth + "px");
		},

		m(target, anchor) {
			insert(target, div, anchor);
		},

		p(changed, _ctx) {
			ctx = _ctx;
			div._svelte.ctx = ctx;
			if (changed.columns || changed.columnWidths || changed.Math || changed.__columnHeaderResizeCaptureWidth) {
				setStyle(div, "left", "" + (getCellLeft(ctx.i+1, ctx.columnWidths) - ctx.Math.floor(ctx.__columnHeaderResizeCaptureWidth / 2)) + "px");
			}

			if (changed.__columnHeaderResizeCaptureWidth) {
				setStyle(div, "width", "" + ctx.__columnHeaderResizeCaptureWidth + "px");
			}
		},

		d(detach) {
			if (detach) {
				detachNode(div);
			}

			removeListener(div, "mousedown", mousedown_handler_1);
		}
	};
}

// (12:6) {#each columns as column, i (i)}
function create_each_block_2(component, key_1, ctx) {
	var div, div_title_value, dragCopy_action, text, if_block1_anchor;

	function select_block_type(ctx) {
		if (ctx.column.headerComponent) return create_if_block_3;
		return create_else_block_1;
	}

	var current_block_type = select_block_type(ctx);
	var if_block0 = current_block_type(component, ctx);

	var if_block1 = (ctx.allowResizeFromTableHeaders) && create_if_block_2(component, ctx);

	return {
		key: key_1,

		first: null,

		c() {
			div = createElement("div");
			if_block0.c();
			text = createText("\r\n        ");
			if (if_block1) if_block1.c();
			if_block1_anchor = createComment();
			div._svelte = { component, ctx };

			addListener(div, "mousedown", mousedown_handler);
			div.className = "grid-cell svelte-a99g4w";
			setStyle(div, "left", "" + getCellLeft(ctx.i, ctx.columnWidths) + "px");
			setStyle(div, "width", "" + ctx.columnWidths[ctx.i] + "px");
			setStyle(div, "line-height", "" + ctx.rowHeight + "px");
			div.title = div_title_value = ctx.column.display || '';
			setAttribute(div, "role", "columnheader");
			this.first = div;
		},

		m(target, anchor) {
			insert(target, div, anchor);
			if_block0.m(div, null);
			dragCopy_action = dragCopy.call(component, div, ctx.allowColumnReordering) || {};
			insert(target, text, anchor);
			if (if_block1) if_block1.m(target, anchor);
			insert(target, if_block1_anchor, anchor);
		},

		p(changed, _ctx) {
			ctx = _ctx;
			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
				if_block0.p(changed, ctx);
			} else {
				if_block0.d(1);
				if_block0 = current_block_type(component, ctx);
				if_block0.c();
				if_block0.m(div, null);
			}

			div._svelte.ctx = ctx;
			if (changed.columns || changed.columnWidths) {
				setStyle(div, "left", "" + getCellLeft(ctx.i, ctx.columnWidths) + "px");
			}

			if (changed.columnWidths || changed.columns) {
				setStyle(div, "width", "" + ctx.columnWidths[ctx.i] + "px");
			}

			if (changed.rowHeight) {
				setStyle(div, "line-height", "" + ctx.rowHeight + "px");
			}

			if ((changed.columns) && div_title_value !== (div_title_value = ctx.column.display || '')) {
				div.title = div_title_value;
			}

			if (typeof dragCopy_action.update === 'function' && changed.allowColumnReordering) {
				dragCopy_action.update.call(component, ctx.allowColumnReordering);
			}

			if (ctx.allowResizeFromTableHeaders) {
				if (if_block1) {
					if_block1.p(changed, ctx);
				} else {
					if_block1 = create_if_block_2(component, ctx);
					if_block1.c();
					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}
		},

		d(detach) {
			if (detach) {
				detachNode(div);
			}

			if_block0.d();
			removeListener(div, "mousedown", mousedown_handler);
			if (dragCopy_action && typeof dragCopy_action.destroy === 'function') dragCopy_action.destroy.call(component);
			if (detach) {
				detachNode(text);
			}

			if (if_block1) if_block1.d(detach);
			if (detach) {
				detachNode(if_block1_anchor);
			}
		}
	};
}

// (39:12) {:else}
function create_else_block(component, ctx) {
	var div, text_value = ctx.row.data[ctx.column.dataName] || '', text;

	return {
		c() {
			div = createElement("div");
			text = createText(text_value);
			div.className = "cell-default svelte-a99g4w";
		},

		m(target, anchor) {
			insert(target, div, anchor);
			append(div, text);
		},

		p(changed, ctx) {
			if ((changed.visibleRows || changed.columns) && text_value !== (text_value = ctx.row.data[ctx.column.dataName] || '')) {
				setData(text, text_value);
			}
		},

		d(detach) {
			if (detach) {
				detachNode(div);
			}
		}
	};
}

// (37:12) {#if column.cellComponent}
function create_if_block_1(component, ctx) {
	var switch_instance_anchor;

	var switch_value = ctx.column.cellComponent;

	function switch_props(ctx) {
		var switch_instance_initial_data = {
		 	rowNumber: ctx.row.i,
		 	column: ctx.column,
		 	row: ctx.row
		 };
		return {
			root: component.root,
			store: component.store,
			data: switch_instance_initial_data
		};
	}

	if (switch_value) {
		var switch_instance = new switch_value(switch_props(ctx));
	}

	return {
		c() {
			if (switch_instance) switch_instance._fragment.c();
			switch_instance_anchor = createComment();
		},

		m(target, anchor) {
			if (switch_instance) {
				switch_instance._mount(target, anchor);
			}

			insert(target, switch_instance_anchor, anchor);
		},

		p(changed, ctx) {
			var switch_instance_changes = {};
			if (changed.visibleRows) switch_instance_changes.rowNumber = ctx.row.i;
			if (changed.columns) switch_instance_changes.column = ctx.column;
			if (changed.visibleRows) switch_instance_changes.row = ctx.row;

			if (switch_value !== (switch_value = ctx.column.cellComponent)) {
				if (switch_instance) {
					switch_instance.destroy();
				}

				if (switch_value) {
					switch_instance = new switch_value(switch_props(ctx));
					switch_instance._fragment.c();
					switch_instance._mount(switch_instance_anchor.parentNode, switch_instance_anchor);
				} else {
					switch_instance = null;
				}
			}

			else if (switch_value) {
				switch_instance._set(switch_instance_changes);
			}
		},

		d(detach) {
			if (detach) {
				detachNode(switch_instance_anchor);
			}

			if (switch_instance) switch_instance.destroy(detach);
		}
	};
}

// (46:10) {#if allowResizeFromTableCells}
function create_if_block(component, ctx) {
	var div;

	return {
		c() {
			div = createElement("div");
			div._svelte = { component, ctx };

			addListener(div, "mousedown", mousedown_handler_2);
			div.className = "grid-cell-size-capture svelte-a99g4w";
			setStyle(div, "left", "" + (getCellLeft(ctx.j+1, ctx.columnWidths) - ctx.Math.floor(ctx.__columnHeaderResizeCaptureWidth / 2)) + "px");
			setStyle(div, "width", "" + ctx.__columnHeaderResizeCaptureWidth + "px");
		},

		m(target, anchor) {
			insert(target, div, anchor);
		},

		p(changed, _ctx) {
			ctx = _ctx;
			div._svelte.ctx = ctx;
			if (changed.columnWidths || changed.Math || changed.__columnHeaderResizeCaptureWidth) {
				setStyle(div, "left", "" + (getCellLeft(ctx.j+1, ctx.columnWidths) - ctx.Math.floor(ctx.__columnHeaderResizeCaptureWidth / 2)) + "px");
			}

			if (changed.__columnHeaderResizeCaptureWidth) {
				setStyle(div, "width", "" + ctx.__columnHeaderResizeCaptureWidth + "px");
			}
		},

		d(detach) {
			if (detach) {
				detachNode(div);
			}

			removeListener(div, "mousedown", mousedown_handler_2);
		}
	};
}

// (35:8) {#each columns as column, j}
function create_each_block_1(component, ctx) {
	var div, text, if_block1_anchor;

	function select_block_type_1(ctx) {
		if (ctx.column.cellComponent) return create_if_block_1;
		return create_else_block;
	}

	var current_block_type = select_block_type_1(ctx);
	var if_block0 = current_block_type(component, ctx);

	var if_block1 = (ctx.allowResizeFromTableCells) && create_if_block(component, ctx);

	return {
		c() {
			div = createElement("div");
			if_block0.c();
			text = createText("\r\n          ");
			if (if_block1) if_block1.c();
			if_block1_anchor = createComment();
			div.className = "grid-cell svelte-a99g4w";
			setStyle(div, "left", "" + getCellLeft(ctx.j, ctx.columnWidths) + "px");
			setStyle(div, "height", "" + ctx.rowHeight + "px");
			setStyle(div, "line-height", "" + ctx.rowHeight + "px");
			setStyle(div, "width", "" + ctx.columnWidths[ctx.j] + "px");
			setAttribute(div, "role", "cell");
		},

		m(target, anchor) {
			insert(target, div, anchor);
			if_block0.m(div, null);
			insert(target, text, anchor);
			if (if_block1) if_block1.m(target, anchor);
			insert(target, if_block1_anchor, anchor);
		},

		p(changed, ctx) {
			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block0) {
				if_block0.p(changed, ctx);
			} else {
				if_block0.d(1);
				if_block0 = current_block_type(component, ctx);
				if_block0.c();
				if_block0.m(div, null);
			}

			if (changed.columnWidths) {
				setStyle(div, "left", "" + getCellLeft(ctx.j, ctx.columnWidths) + "px");
			}

			if (changed.rowHeight) {
				setStyle(div, "height", "" + ctx.rowHeight + "px");
				setStyle(div, "line-height", "" + ctx.rowHeight + "px");
			}

			if (changed.columnWidths) {
				setStyle(div, "width", "" + ctx.columnWidths[ctx.j] + "px");
			}

			if (ctx.allowResizeFromTableCells) {
				if (if_block1) {
					if_block1.p(changed, ctx);
				} else {
					if_block1 = create_if_block(component, ctx);
					if_block1.c();
					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}
		},

		d(detach) {
			if (detach) {
				detachNode(div);
			}

			if_block0.d();
			if (detach) {
				detachNode(text);
			}

			if (if_block1) if_block1.d(detach);
			if (detach) {
				detachNode(if_block1_anchor);
			}
		}
	};
}

// (33:4) {#each visibleRows as row, i}
function create_each_block(component, ctx) {
	var div, text, div_aria_rowindex_value;

	var each_value = ctx.columns;

	var each_blocks = [];

	for (var i_2 = 0; i_2 < each_value.length; i_2 += 1) {
		each_blocks[i_2] = create_each_block_1(component, get_each_context(ctx, each_value, i_2));
	}

	return {
		c() {
			div = createElement("div");

			for (var i_2 = 0; i_2 < each_blocks.length; i_2 += 1) {
				each_blocks[i_2].c();
			}

			text = createText("\r\n      ");
			div.className = "grid-row svelte-a99g4w";
			setStyle(div, "top", "" + getRowTop(ctx.row.i, ctx.rowHeight) + "px");
			setStyle(div, "height", "" + ctx.rowHeight + "px");
			setStyle(div, "width", "" + ctx.gridSpaceWidth + "px");
			setAttribute(div, "role", "row");
			setAttribute(div, "aria-rowindex", div_aria_rowindex_value = ctx.row.i);
		},

		m(target, anchor) {
			insert(target, div, anchor);

			for (var i_2 = 0; i_2 < each_blocks.length; i_2 += 1) {
				each_blocks[i_2].m(div, null);
			}

			append(div, text);
		},

		p(changed, ctx) {
			if (changed.allowResizeFromTableCells || changed.columnWidths || changed.Math || changed.__columnHeaderResizeCaptureWidth || changed.rowHeight || changed.columns || changed.visibleRows) {
				each_value = ctx.columns;

				for (var i_2 = 0; i_2 < each_value.length; i_2 += 1) {
					const child_ctx = get_each_context(ctx, each_value, i_2);

					if (each_blocks[i_2]) {
						each_blocks[i_2].p(changed, child_ctx);
					} else {
						each_blocks[i_2] = create_each_block_1(component, child_ctx);
						each_blocks[i_2].c();
						each_blocks[i_2].m(div, text);
					}
				}

				for (; i_2 < each_blocks.length; i_2 += 1) {
					each_blocks[i_2].d(1);
				}
				each_blocks.length = each_value.length;
			}

			if (changed.visibleRows || changed.rowHeight) {
				setStyle(div, "top", "" + getRowTop(ctx.row.i, ctx.rowHeight) + "px");
			}

			if (changed.rowHeight) {
				setStyle(div, "height", "" + ctx.rowHeight + "px");
			}

			if (changed.gridSpaceWidth) {
				setStyle(div, "width", "" + ctx.gridSpaceWidth + "px");
			}

			if ((changed.visibleRows) && div_aria_rowindex_value !== (div_aria_rowindex_value = ctx.row.i)) {
				setAttribute(div, "aria-rowindex", div_aria_rowindex_value);
			}
		},

		d(detach) {
			if (detach) {
				detachNode(div);
			}

			destroyEach(each_blocks, detach);
		}
	};
}

function Data_grid(options) {
	init(this, options);
	this.refs = {};
	this._state = assign(assign({ Math : Math }, data()), options.data);

	this._recompute({ columns: 1, rows: 1, columnWidths: 1, rowHeight: 1, numRows: 1, __innerOffsetHeight: 1, __scrollTop: 1, numRowsInViewport: 1, __extraRows: 1 }, this._state);
	this._intro = true;

	if (!document.getElementById("svelte-a99g4w-style")) add_css();

	this._fragment = create_main_fragment(this, this._state);

	if (options.target) {
		this._fragment.c();
		this._mount(options.target, options.anchor);

		flush(this);
	}
}

assign(Data_grid.prototype, proto);
assign(Data_grid.prototype, methods);

Data_grid.prototype._recompute = function _recompute(changed, state) {
	if (changed.columns) {
		if (this._differs(state.columnWidths, (state.columnWidths = columnWidths_1(state)))) changed.columnWidths = true;
	}

	if (changed.rows) {
		if (this._differs(state.numRows, (state.numRows = numRows(state)))) changed.numRows = true;
	}

	if (changed.columnWidths) {
		if (this._differs(state.gridSpaceWidth, (state.gridSpaceWidth = gridSpaceWidth(state)))) changed.gridSpaceWidth = true;
	}

	if (changed.rowHeight || changed.numRows) {
		if (this._differs(state.gridSpaceHeight, (state.gridSpaceHeight = gridSpaceHeight(state)))) changed.gridSpaceHeight = true;
	}

	if (changed.__innerOffsetHeight || changed.rowHeight) {
		if (this._differs(state.numRowsInViewport, (state.numRowsInViewport = numRowsInViewport(state)))) changed.numRowsInViewport = true;
	}

	if (changed.rowHeight || changed.rows || changed.__scrollTop || changed.numRowsInViewport || changed.__extraRows) {
		if (this._differs(state.visibleRows, (state.visibleRows = visibleRows(state)))) changed.visibleRows = true;
	}
};

export default Data_grid;
