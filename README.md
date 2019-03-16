[![npm](https://img.shields.io/npm/v/svelte-data-grid.svg?style=flat-square)](https://npmjs.org/package/svelte-data-grid)
# Svelte Data Grid

## [Demo](https://bsssshhhhhhh.github.io/svelte-data-grid-demo/)


Svelte Data Grid is a svelte v2 component for displaying any amount of data.

## Features:
 - Excellent scrolling performance
 - ARIA attributes set on elements
 - Lightweight even when displaying a huge dataset due to implementation of a "virtual list" mechanism
 - Column headers remain fixed at the top of the grid
 - Custom components can be specified to control how individual table cells or column headers are displayed
 - Columns can be resized and reordered

## Current Limitations:
 - Every row must have the same height and text cannot break onto the next line

## Usage:

If using from inside a svelte component: 
```
<DataGrid rows={myRows} allowColumnReordering={false} columns={myColumnDefinitions} on:columnOrderUpdated="saveNewColumnOrder()">
```

If using from outside svelte:
```
const grid = new DataGrid({
  target: document.querySelector('#my-grid-wrapper'),
  data: {
    rows: [ ... ],
    columns: [ ... ],
    allowResizeFromTableCells: true
  }
});

grid.on('columnOrderUpdated', () => {
  const { columns } = grid.get();
  // save new column  order
});
```
To learn more about using DataGrid outside of svelte, read [svelte's guide](https://svelte.technology/guide#component-api) on how to interact with a svelte component. It is possible to integrate into any framework.

DataGrid requires 2 properties to be passed in order to display data: `rows` and `columns`.

`columns` is an array of objects containing at least 3 properties: `display`, `dataName`, and `width`. A svelte component can be specified in `headerComponent` and `cellComponent` if any custom cell behavior is required.

```
[
  {
    display: 'Fruit Name',  // What will be displayed as the column header
    dataName: 'fruitName',  // The key of a row to get the column's data from
    width: 300,             // Width, in pixels, of column
    disallowResize: true    // Optional - disables resizing this column
  },
  {
    display: 'Color',
    dataName: 'fruitColor',
    width: 600,
    myExtraData: 12345
  }
]
```


`rows` is an array of objects containing the data for each table row. 

```
[
  {
    fruitName: 'Apple',
    fruitColor: 'Red'
  },
  {
    fruitName: 'Blueberry',
    fruitColor: 'Blue'
  },
  {
    fruitName: 'Tomato',
    fruitColor: 'Red'
  }
]

```

## Custom Cell Components

Need to customize how your data is displayed or build more complex functionality into your grid? Specify `cellComponent` in your definition in the `columns` property.

Components will be passed the following properties: 
- `rowNumber` - The index of the row within `rows`
- `row` - The entire row object from `rows`
- `column` - The entire column object from `columns`


MyCustomCell.html
```
<div style="color: {colors[row.data[column.dataName]] || 'black'};">
  {row.data[column.dataName]}
</div>

<script>
export default {
  data() {
    return {
      colors: {
        Red: '#FF0000',
        Blue: '#0000FF'
      }
    };
  }
};
</script>
```

Import the component
```
import MyCustomCell from './MyCustomCell.html';
```

`columns` option:
```
[
  {
    display: 'Fruit Color'
    dataName: 'fruitColor',
    width: 300,
    cellComponent: MyCustomCell
  }
]
```

## Custom Header Components
Header components can also be specified in `columns` entries as the `headerComponent` property. Header components are only passed `column`, the column object from `columns`.

## Options:

Svelte Data Grid provides a few options for controlling the grid and its interactions:

- `rowHeight` - The row height in pixels *(Default: 24)*
- `allowResizeFromTableCells` - Allow user to click and drag the right border of a table cell to resize the column *(Default: false)*
- `allowResizeFromTableHeaders` - Allow user to click and drag the right border of a column header to resize the column *(Default: true)*
- `allowColumnReordering` - Allow user to drag a column header to move that column to a new position *(Default: true)*
- `allowColumnAffix` - Allow user to drag the double line to affix columns to the left side of the grid. See section below for caveats *(Default: true if the browser is chrome, false otherwise)*
- `__extraRows` - If it is desired that the virtual list include more DOM rows than are visible, the number of extra rows can be specified in `__extraRows` *(Default: 0)*
- `__columnHeaderResizeCaptureWidth` The width of the element, in pixels, placed at the right border of a column that triggers that column's resize. *(Default: 20)*


## Events:
 - `columnOrderUpdated` - Fired when the user has dragged a column to a new position. The updated column order can be accessed from `component.get().columns`
 - `columnWidthUpdated` - Fired when a user has resized a column. The updated column width can be accessed from `event.width` and the column index can be accessed from `event.idx`

## Column Affixing

This feature works well on Chrome because Chrome's scroll events are not fired asynchronously from the scroll action. Firefox, Edge, and IE all fire scroll events *after* the overflow container has scroll on screen. This causes a jittery effect that we cannot easily work around while providing a cross-browser solution. 

To fix the jitteriness on Firefox, a setting in about:config can be changed to turn off APZ. Set `layers.async-pan-zoom.enabled` to `false`. Obviously this is not a solution we can reasonably ask users to try, so I'm looking for other solutions.

## Bugs? Suggestions?
Feedback is always appreciated. Feel free to open a GitHub issue if DataGrid doesn't work the way you expect or want it to.