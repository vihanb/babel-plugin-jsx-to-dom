export default function (babel) {
  const { types: t } = babel;
  
  const document = t.identifier('document');
  const createElement = t.identifier('createElement');
  const createTextNode = t.identifier('createTextNode');
  const appendChild = t.identifier('appendChild');
  const setAttribute = t.identifier('setAttribute');
  const hasOwnProperty = t.identifier('hasOwnProperty');
  const string = t.stringLiteral('string');
  const length = t.identifier('length');
  const ArrayClass = t.identifier('Array');
  const StringClass = t.identifier('String');
  const NodeClass = t.identifier('Node');
  const zero = t.numericLiteral(0);
  const one = t.numericLiteral(1);
  
  function unwrapLiteral(node) {
    return t.conditionalExpression(
      t.binaryExpression(
        'instanceof',
        node,
        NodeClass
      ),
      node,
      text(node)
    )
  }
  
  function text(string) {
    return t.callExpression(
      t.memberExpression(document, createTextNode),
      [string]
    );
  }
  
  function append(node, child, returnPartial) {
    let call = t.callExpression(
      t.memberExpression(
        node,
        appendChild
      ),
      [ child ]
    );
    if (returnPartial) return call;
    return t.expressionStatement(call)
  }
  
  function declare(name, value) {
    return t.variableDeclaration("let", [t.variableDeclarator(
      name, value
    )]);
  }
  
  function setAttr(elem, name, value) {
    return t.expressionStatement(
      t.callExpression(
        t.memberExpression(elem, setAttribute),
        [name, value]
      )
    )
  }
  
  function generateHTMLNode(path, jsx) {
    if (t.isJSXElement(jsx)) {
      const name = path.scope.generateUidIdentifier("elem");
      const decl = t.variableDeclaration(
        "const", [
          t.variableDeclarator(
            name,
            t.callExpression(
              t.memberExpression(document, createElement),
              [t.stringLiteral(jsx.openingElement.name.name)]
            )
          )
        ]
      );
      
      let elems = [decl];
      for (let i = 0; i < jsx.openingElement.attributes.length; i++) {
        let attribute = jsx.openingElement.attributes[i];
        if (t.isJSXSpreadAttribute(attribute)) {
          const arg = path.scope.generateUidIdentifier("attrs");
          const iter = path.scope.generateUidIdentifier("attr");
          elems.push(declare(arg, attribute.argument));
          elems.push(
            t.forInStatement(
              iter, arg,
              t.ifStatement(
                t.callExpression(
                  t.memberExpression(arg, hasOwnProperty),
                  [ iter ]
                ),
                setAttr(
                  name,
                  iter,
                  t.memberExpression(arg, iter, true)
                )
              )
            )
          );
        } else {
          let value = attribute.value;
          if (t.isJSXExpressionContainer(value)) value = value.expression;
          elems.push(
            setAttr(name, t.stringLiteral(attribute.name.name), value)
          )
        };
      }
      
      for (let i = 0; i < jsx.children.length; i++) {
        let child = generateHTMLNode(path, jsx.children[i]);
        elems.push(...child.elems);
        if (child.maybeMultiple) {
          const counter = path.scope.generateUidIdentifier('i');
          const ref = path.scope.generateUidIdentifier('ref');
          elems.push(t.ifStatement(
            t.binaryExpression(
              'instanceof',
              child.id,
              ArrayClass
            ),
            t.blockStatement([
              t.forStatement(
                declare(counter, zero),
                t.binaryExpression("<", counter, t.memberExpression(child.id, length)),
                t.assignmentExpression('+=', counter, one),
                append(name, unwrapLiteral(t.memberExpression(child.id, counter, true)))
              )
            ]),
            append(name, child.id)
          ));
        } else {
          elems.push(append(name, child.id));
        }
      }
      
      return { id: name, elems: elems };
    } else if (t.isJSXText(jsx)) {
      return { id: text(t.stringLiteral(jsx.value)), elems: [] };
    } else if (t.isJSXExpressionContainer(jsx)) {
      const name = path.scope.generateUidIdentifier("expr");
      const res = path.scope.generateUidIdentifier("res");
      return {
        id: res,
        elems: [
          t.variableDeclaration("const", [
            t.variableDeclarator(
              name,
              jsx.expression
            ),
            t.variableDeclarator(
              res,
              unwrapLiteral(name)
            )
          ]),
        ],
        maybeMultiple: true
      };
    } else {
      return { id: null, elems: [jsx] };
    }
  }
  
  return {
    name: "ast-transform", // not required
    visitor: {
      JSXElement(path) {
        let result = generateHTMLNode(path, path.node);
        path.replaceWithMultiple(result.elems.concat(t.expressionStatement(result.id)));
      }
    }
  };
}


