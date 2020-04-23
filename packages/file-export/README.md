## Export Service (text file) 
#### @slickgrid-universal/file-export

Simple Export to File Service that allows to export as CSV or Text, user can also choose which separator to use (comma, colon, semicolon, ...). 

There are a couple of reasons to use this package (instead of the `excel-export`)
- if you want to export to a text file with any type of separator (tab, colon, semicolon, comma)
- if you have a very large dataset, this export consumes a lot less memory compare to the `excel-export`

### Dependencies
This package requires [text-encoding-utf-8](https://www.npmjs.com/package/text-encoding-utf-8) which is use to ensure proper UTF-8 encoding, even emoji will be exported without issues.

### Installation
Follow the instruction provided in the main [README](https://github.com/ghiscoding/slickgrid-universal#installation), you can see a demo by looking at the [GitHub Demo](https://ghiscoding.github.io/slickgrid-universal) page and click on "Export to CSV" from the Grid Menu (aka hamburger menu).
