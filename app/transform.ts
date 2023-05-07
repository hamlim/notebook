'use server'
import { transform as babelTransform, registerPlugin } from '@babel/standalone'
import { cache } from 'react'

function referenceToGlobalIdentifier(referenceName: string): string {
  return `__scope__${referenceName}`
}

let getBabel = cache(async (ids) => {
  function identPlugin({ types: t }) {
    return {
      visitor: {
        Identifier(path) {
          let foundID = ids.find((id) => id === path.node.name)
          if (foundID) {
            if (
              foundID &&
              path.parent.type !== 'VariableDeclarator' &&
              path.parent.type !== 'MemberExpression'
            ) {
              path.replaceWith(
                t.memberExpression(
                  t.identifier('globalThis'),
                  t.identifier(referenceToGlobalIdentifier(foundID)),
                ),
              )
            }
          } else {
            // add global scope identifier assignment following the variable declaration
            if (path.parent.type === 'VariableDeclarator') {
              let identifier = path.node.name
              let globalIdentifier = referenceToGlobalIdentifier(identifier)
              path.parentPath.insertAfter(
                t.expressionStatement(
                  t.assignmentExpression(
                    '=',
                    t.memberExpression(
                      t.identifier('globalThis'),
                      t.identifier(globalIdentifier),
                    ),
                    t.identifier(identifier),
                  ),
                ),
              )
            }
          }
        },
      },
    }
  }
  registerPlugin('identPlugin', identPlugin)

  function doBabel(code: string): string {
    return babelTransform(code, {
      presets: ['env'],
      plugins: ['identPlugin'],
      parserOpts: {
        allowReturnOutsideFunction: true,
      },
    }).code
  }

  return doBabel
})

export async function transform(
  code: string,
  previousIdentifiers: Array<string>,
): Promise<{ transformed: string; newIdentifiers: Array<string> }> {
  let lines = code.split('\n')
  if (!lines.at(-1).includes('return')) {
    lines[lines.length - 1] = `return ${lines.at(-1)}`
  }

  let babel = await getBabel(previousIdentifiers)

  let transformed = babel(`${lines.join('\n')}`)

  return {
    transformed,
    newIdentifiers: ['yo'],
  }
}
