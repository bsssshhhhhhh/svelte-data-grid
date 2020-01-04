<script>
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();
  export let select = null;
  export let column;
  export let row;
  export let rowNumber;
  function getOptionDisplay(display) {
    if (display instanceof Function) {
      return display();
    }
    return display;
  }
  // [svelte-upgrade suggestion]
  // review these functions and remove unnecessary 'export' keywords
  export function onChange(event) {
    // delay this until after the ui updates on the screen
    setTimeout(() => {
      dispatch("valueupdate", {
        row,
        column,
        value: select.value,
        rowNumber
      });
    }, 0);
  }
</script>

<style>
  .select-cell {
    background: white;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  select {
    border: none;
  }
  select {
    width: 100%;
    height: 100%;
    padding: 0 5px;
  }
</style>

<div class="select-cell">
  {#if column.options instanceof Array}
    <select on:change={onChange} bind:this={select}>
      {#each column.options as option}
        <option
          value={option.value}
          selected={option.value === row.data[column.dataName]}>
          {getOptionDisplay(option.display)}
        </option>
      {/each}
    </select>
  {/if}
</div>
