function noop() {}

function assign(tar, src) {
	for (var k in src) tar[k] = src[k];
	return tar;
}

function assignTrue(tar, src) {
	for (var k in src) tar[k] = 1;
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

function createElement(name) {
	return document.createElement(name);
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

/**
 * Returns a function, that, as long as it continues to be invoked, will not
 * be triggered. The function will be called after it stops being called for
 * N milliseconds. If `immediate` is passed, trigger the function on the
 * leading edge, instead of the trailing. The function also has a property 'clear' 
 * that is a function which will clear the timer to prevent previously scheduled executions. 
 *
 * @source underscore.js
 * @see http://unscriptable.com/2009/03/20/debouncing-javascript-methods/
 * @param {Function} function to wrap
 * @param {Number} timeout in ms (`100`)
 * @param {Boolean} whether to execute at the beginning (`false`)
 * @api public
 */
function debounce(func, wait, immediate){
  var timeout, args, context, timestamp, result;
  if (null == wait) wait = 100;

  function later() {
    var last = Date.now() - timestamp;

    if (last < wait && last >= 0) {
      timeout = setTimeout(later, wait - last);
    } else {
      timeout = null;
      if (!immediate) {
        result = func.apply(context, args);
        context = args = null;
      }
    }
  }
  var debounced = function(){
    context = this;
    args = arguments;
    timestamp = Date.now();
    var callNow = immediate && !timeout;
    if (!timeout) timeout = setTimeout(later, wait);
    if (callNow) {
      result = func.apply(context, args);
      context = args = null;
    }

    return result;
  };

  debounced.clear = function() {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };
  
  debounced.flush = function() {
    if (timeout) {
      result = func.apply(context, args);
      context = args = null;
      
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
}
// Adds compatibility for ES modules
debounce.debounce = debounce;

var debounce_1 = debounce;

/* src\textbox-cell.html generated by Svelte v2.16.1 */

const INPUT_DEBOUNCE_INTERVAL = 400;

var methods = {
  onFocus(event) {
    const { column, rowNumber } = this.get();
    column.activeRow = rowNumber;
  },
  onBlur(event) {
    const { column } = this.get();

    // if blur event was user-initiated and not initiated by the blur call above,
    // remove the activeRow property
    if (event.sourceCapabilities) {
      delete column.activeRow;
    }
  },

  /**
   * Debounce the oninput handler so that there isn't edit history for every keystroke
   */
  onInput: debounce_1(function (event) {
    const value = this.refs.textbox.value;
    const { row, column, rowNumber } = this.get();
    setTimeout(() => {
      this.fire('valueupdate', { 
        row, 
        column, 
        value, 
        rowNumber 
      });
    });
    
  }, INPUT_DEBOUNCE_INTERVAL)
};

function onstate({ changed, current }) {
  if ((changed.column || changed.row)) {
    const updateTextbox = () => {
      this.refs.textbox.value = current.row.data[current.column.dataName];
    };
    if (this.refs.textbox) {
      updateTextbox();
    } else {
      setTimeout(updateTextbox, 0);
    }
    
  }
}
function onupdate({ changed, current }) {
  /* Since data-grid isn't using a keyed each block to display the rows, we need to update
     the focus as the grid scrolls. When this cell component receives a new row, check if the column's active row
     is this row, and focus or blur if necessary */
  if (changed.row) {
    if (current.column.activeRow && current.column.activeRow === current.rowNumber && this.refs.textbox) {
      this.refs.textbox.focus();
    } else if (this.refs.textbox === document.activeElement) {
      this.refs.textbox.blur();
    }
  }
}
function add_css() {
	var style = createElement("style");
	style.id = 'svelte-1dmckr0-style';
	style.textContent = ".textbox-cell.svelte-1dmckr0{position:relative;width:100%;height:100%;z-index:3}input.svelte-1dmckr0{height:100%;width:100%;border:0;margin:0;padding:0 5px;box-sizing:border-box}input.svelte-1dmckr0:active,input.svelte-1dmckr0:focus{border:1px solid lime}";
	append(document.head, style);
}

function create_main_fragment(component, ctx) {
	var div, input;

	function input_handler(event) {
		component.onInput(event);
	}

	function focus_handler(event) {
		component.onFocus(event);
	}

	function blur_handler(event) {
		component.onBlur(event);
	}

	return {
		c() {
			div = createElement("div");
			input = createElement("input");
			addListener(input, "input", input_handler);
			addListener(input, "focus", focus_handler);
			addListener(input, "blur", blur_handler);
			setAttribute(input, "type", "text");
			input.className = "svelte-1dmckr0";
			div.className = "textbox-cell svelte-1dmckr0";
		},

		m(target, anchor) {
			insert(target, div, anchor);
			append(div, input);
			component.refs.textbox = input;
		},

		p: noop,

		d(detach) {
			if (detach) {
				detachNode(div);
			}

			removeListener(input, "input", input_handler);
			removeListener(input, "focus", focus_handler);
			removeListener(input, "blur", blur_handler);
			if (component.refs.textbox === input) component.refs.textbox = null;
		}
	};
}

function Textbox_cell(options) {
	init(this, options);
	this.refs = {};
	this._state = assign({}, options.data);
	this._intro = true;

	this._handlers.state = [onstate];
	this._handlers.update = [onupdate];

	if (!document.getElementById("svelte-1dmckr0-style")) add_css();

	onstate.call(this, { changed: assignTrue({}, this._state), current: this._state });

	this._fragment = create_main_fragment(this, this._state);

	this.root._oncreate.push(() => {
		this.fire("update", { changed: assignTrue({}, this._state), current: this._state });
	});

	if (options.target) {
		this._fragment.c();
		this._mount(options.target, options.anchor);

		flush(this);
	}
}

assign(Textbox_cell.prototype, proto);
assign(Textbox_cell.prototype, methods);

export default Textbox_cell;
