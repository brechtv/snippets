
## Snippets

A light-weight snippets tool built on a Google Spreadsheet. Easily customizable by pointing it to a different spreadsheet.

```html
<link rel="stylesheet" type="text/css" href="snippets.min.css">
<script type="text/javascript" src="snippets.min.js" data-id="[SPREADSHEET-ID]"></script>
```

## How to

+ In a Google Spreadsheet, create four columns, _title_, _content_, _meta_ and _tags_. Then publish the spreasheet to the web and get the ID from the URL (`https://docs.google.com/spreadsheets/d/[THIS BIT HERE]/edit#gid=0`).
+ Now pop the spreadsheet ID in the script tag:
```html
<script type="text/javascript" src="snippets.min.js" data-id="[SPREADSHEET-ID]"></script>
```
+ Each row is a snippet and will be read and rendered. The _meta_ column can be used for source references or footnotes and the _tags_ column is for comma-separated tags.
+ On the page itself, the tags are selectable/filterable.
+ New snippets can be added by setting up a webhook to add rows to the spreadsheet (add `?post=true` to the URL) or just directly on the spreadsheet. The data on the page gets updated instantly upon refresh.


## Demo

[Example here](https://rawgit.com/brechtv/snippets/master/index.html)