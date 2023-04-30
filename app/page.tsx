import { Box } from '@ds-pack/daisyui'
import Editor from './Editor'

export default function Index() {
  return (
    <Box className="container">
      <Editor />
    </Box>
  )
}

export let revalidate = 0
export let dynamic = 'force-dynamic'
