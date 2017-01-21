# PostCSS Subtle [![Build Status][ci-img]][ci]

[PostCSS] plugin to automatically download and unzip images from subtlepatterns.com..

[PostCSS]: https://github.com/postcss/postcss
[ci-img]:  https://travis-ci.org/andylbrummer/postcss-subtle.svg
[ci]:      https://travis-ci.org/andylbrummer/postcss-subtle

```css
.foo {
    background: subtle('seigaiha');
}
```
Downloads the file at https://subtlepatterns.com/patterns/seigaiha.zip and extrcts the first image file in the zip to your local asset path, and returns the following reference in your css.

```css
.foo {
  background: url('{server_path}/seigaiha.png');
}
```

When picking out the name of the zip file, the easiest way I've found is to hover over the download link because the name of the zip file on the site doesn't always match the name of the pattern displayed on the site.

## Usage

### Plugin options

#### `localPath`
Type: `string`
Default: ''

Defines the local path where the downloaded image file is extracted to. This path is relative to the location the postCSS task is executing. 

#### `serverPath`
Type: `string`
Default: ''

Defines the base path used for image file references in the css. It should refer to the url corresponding to the localPath, or where those files will be moved to by later processing steps.

```js
var subtle = require('postcss-subtle').default;
postcss([ subtle({ localPath: 'assets/images', serverPath: '../images' }) ])
```

See [PostCSS] docs for examples for your environment.
