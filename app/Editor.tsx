'use client'
import { useDeferredValue, useEffect, useState } from 'react'
import { Button, Box, Textarea, Stack } from '@ds-pack/daisyui'
import { transform } from './transform'

function Eval({ code, scope }) {
  let [result, setResult] = useState('')
  let [err, setErr] = useState(null)
  let [debug, setDebug] = useState({})

  useEffect(() => {
    let isActive = true
    transform(code, scope.getIdentifiers())
      .then(({ transformed, newIdentifiers }) => {
        if (!isActive) return
        setDebug({ transformed, newIdentifiers })
        scope.addIdentifiers(newIdentifiers)
        setResult(transformed)
      })
      .catch((e) => {
        setDebug({ error: e })
        setErr(e)
      })
    return () => {
      isActive = false
    }
  }, [code])

  if (!result) {
    return <Box>Waiting...</Box>
  }

  console.log(debug)

  if (err) {
    return (
      <>
        <pre>{JSON.stringify(err, null, 2)}</pre>
        <Button variant="error" className="btn-sm" onClick={() => setErr(null)}>
          Retry
        </Button>
      </>
    )
  }

  let res = null
  try {
    res = new Function(result)()
  } catch (err) {
    setErr(err)
  }
  return <pre>{res}</pre>
}

class Scope {
  identifiers = new Set()
  getIdentifiers() {
    return Array.from(this.identifiers)
  }
  addIdentifiers(identifiers) {
    identifiers.forEach((identifier) => this.identifiers.add(identifier))
  }
}

let scope = new Scope()

function Code() {
  let [code, setCode] = useState('')

  let deferredCode = useDeferredValue(code)

  return (
    <>
      <Textarea onChange={setCode} value={code} />
      <Eval code={deferredCode} scope={scope} />
    </>
  )
}

export default function Editor() {
  let [blocks, setBlocks] = useState([])

  return (
    <Stack gap="4">
      {blocks.map((block, i) => (
        <Box key={block.id}>{block.type === 'code' && <Code />}</Box>
      ))}
      <Button
        onClick={() =>
          setBlocks([
            ...blocks,
            {
              id: blocks.length,
              type: 'code',
            },
          ])
        }
      >
        Add block
      </Button>
    </Stack>
  )
}
