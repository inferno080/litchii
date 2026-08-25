declare module '@calumk/editorjs-codecup' {
  import type { ToolConstructable } from '@editorjs/editorjs'

  const CodeCup: ToolConstructable
  export default CodeCup
}

declare module '@editorjs/link' {
  import type { ToolConstructable } from '@editorjs/editorjs'

  const LinkTool: ToolConstructable
  export default LinkTool
}

declare module '@editorjs/checklist' {
  import type { ToolConstructable } from '@editorjs/editorjs'

  const Checklist: ToolConstructable
  export default Checklist
}

declare module '@editorjs/marker' {
  import type { InlineToolConstructable } from '@editorjs/editorjs'

  const Marker: InlineToolConstructable
  export default Marker
}