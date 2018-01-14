# babel-plugin-jsx-to-dom

Normally if you use JSX, you have to use React. **You must** add: `babel-plugin-syntax-jsx` to your project to use this.

This supports namespaces which you can add by specifying the element(s)'s namespaces with a `namespace=""` attribute.

## Installation

```sh
$ npm install babel-plugin-jsx-to-dom
```

## Usage

### Via `.babelrc` (Recommended)

**.babelrc**

```json
{
  "plugins": ["babel-plugin-syntax-jsx", "babel-plugin-jsx-to-dom"]
}
```

### Via CLI

```sh
$ babel --plugins syntax-jsx,include script.js
```

### Via Node API

```javascript
require('babel').transform('code', {
  plugins: ['syntax-jsx', 'jsx-to-dom']
});
```

## Example

input:

```js
let a = <p>hi</p>
```

output:

```js
let a = function() {
  const _elem = document.createElement("p");
  _elem.appendChild(document.createTextNode("hi"));
  return _elem;
}()
```

This also supports more complex senarios:

```js
function makeTemplate(name, opts) {
    return (
        <div {...opts}>{ name }</div>
    );
}
```

output:

```js
function makeTemplate(name, opts) {
    return function() {
        const _elem = document.createElement("div");
        let _attrs = opts;

        for (_attr in _attrs) if (_attrs.hasOwnProperty(_attr))
            _elem.setAttribute(_attr, _attrs[_attr]);

        const _expr = name, _res = (typeof _expr == "string" ? document.createTextNode(_expr) : _expr);

        if (_res instanceof Array) {
            for (let _i = 0; _i < _res.length; _i += 1) _elem.appendChild(
                (typeof _res[_i] == "string" ? document.createTextNode(_res[_i]) : _res[_i])
            );
        } else
            _elem.appendChild(_res);

        return _elem;
    }();
}
```
