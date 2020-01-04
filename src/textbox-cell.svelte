<script>
  import { afterUpdate, beforeUpdate, createEventDispatcher } from "svelte";
  import debounce from "debounce";
  const INPUT_DEBOUNCE_INTERVAL = 400;
  const dispatch = createEventDispatcher();
  export let textbox = null;
  export let column;
  export let rowNumber;
  export let row;
  let prevColumn;
  let prevRow;
  // [svelte-upgrade warning]
  // beforeUpdate and afterUpdate handlers behave
  // differently to their v2 counterparts
  beforeUpdate(() => {
    if (prevColumn !== column || prevRow !== row) {
      const updateTextbox = () => {
        if (textbox) textbox.value = row.data[column.dataName];
      };
      if (textbox) {
        updateTextbox();
      } else {
        setTimeout(updateTextbox, 0);
      }
      prevColumn = column;
    }
  });
  // [svelte-upgrade warning]
  // beforeUpdate and afterUpdate handlers behave
  // differently to their v2 counterparts
  afterUpdate(() => {
    /* Since data-grid isn't using a keyed each block to display the rows, we need to update
      the focus as the grid scrolls. When this cell component receives a new row, check if the column's active row
      is this row, and focus or blur if necessary */
    if (prevRow !== row) {
      if (column.activeRow && column.activeRow === rowNumber && textbox) {
        textbox.focus();
      } else if (textbox === document.activeElement) {
        textbox.blur();
      }
      prevRow = row;
    }
  });
  // [svelte-upgrade suggestion]
  // review these functions and remove unnecessary 'export' keywords
  export function onFocus(event) {
    column.activeRow = rowNumber;
  }
  export function onBlur(event) {
    // if blur event was user-initiated and not initiated by the blur call above,
    // remove the activeRow property
    if (event.sourceCapabilities) {
      delete column.activeRow;
    }
  }
  export function onInput(event) {
    const value = textbox.value;
    setTimeout(() => {
      dispatch("valueupdate", {
        row,
        column,
        value,
        rowNumber
      });
    }, 0);
  }
</script>

<style>
  .textbox-cell {
    position: relative;
    width: 100%;
    height: 100%;
    background: white;
    z-index: 3;
  }
  input {
    height: 100%;
    width: 100%;
    border: 0;
    margin: 0;
    padding: 0 5px;
    box-sizing: border-box;
  }
  input:active,
  input:focus {
    border: 1px solid lime;
  }
</style>

<div class="textbox-cell">
  <input
    type="text"
    on:input={onInput}
    on:focus={onFocus}
    on:blur={onBlur}
    bind:this={textbox} />
</div>
