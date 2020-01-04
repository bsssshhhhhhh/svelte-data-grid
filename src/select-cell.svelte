<div class="select-cell">
  {#if column.options instanceof Array}
    <select on:change="onChange(event)" ref:select>
      {#each column.options as option}
        <option value={option.value} selected={option.value === row.data[column.dataName]}>{getOptionDisplay(option.display)}</option>
      {/each}
    </select>
  {/if}
</div>

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

<script>
export default {
  helpers: {
    getOptionDisplay(display) {
      if (display instanceof Function) {
        return display();
      }

      return display;
    }
  },
  methods: {
    onChange(event) {
      const { row, column, rowNumber } = this.get();

      // delay this until after the ui updates on the screen
      setTimeout(() => {
        this.fire('valueupdate', {
          row,
          column,
          value: this.refs.select.value,
          rowNumber
        });
      }, 0);
      
    }
  }
};
</script>
