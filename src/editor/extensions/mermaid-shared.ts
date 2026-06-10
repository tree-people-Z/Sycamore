import mermaid from 'mermaid'

let initialized = false

export function initMermaid() {
  if (initialized) return
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'strict',
    fontFamily: 'inherit',
  })
  initialized = true
}

export interface DiagramType {
  type: string
  label: string
  alias: string[]
  content?: string
}

export const DIAGRAM_TYPES: DiagramType[] = [
  { type: 'flowchart', label: '流程图', alias: ['graph', 'flowchart', 'flowchart-v2', 'td', 'graph TD', 'graph BT', 'graph LR', 'graph RL'], content: 'graph TD\n  A[开始] --> B[结束]' },
  { type: 'sequence', label: '时序图', alias: ['sequence', 'sequenceDiagram'], content: 'sequenceDiagram\n  用户->>系统: 发起请求\n  系统-->>用户: 返回结果' },
  { type: 'classDiagram', label: '类图', alias: ['class', 'classDiagram'], content: 'classDiagram\n  class Animal {\n    +name: string\n    +move()\n  }' },
  { type: 'stateDiagram', label: '状态图', alias: ['state', 'stateDiagram', 'stateDiagram-v2'], content: 'stateDiagram-v2\n  [*] --> 待办\n  待办 --> 进行中\n  进行中 --> 已完成' },
  { type: 'er', label: 'E-R 图', alias: ['er', 'erDiagram'], content: 'erDiagram\n  USER ||--o{ ORDER : places\n  ORDER ||--|{ ITEM : contains' },
  { type: 'gantt', label: '甘特图', alias: ['gantt'], content: 'gantt\n  title 项目计划\n  dateFormat YYYY-MM-DD\n  section 阶段1\n  任务1 :a1, 2024-01-01, 30d\n  任务2 :after a1, 20d' },
  { type: 'pie', label: '饼图', alias: ['pie'], content: 'pie title 数据分布\n  "分类A" : 45\n  "分类B" : 30\n  "分类C" : 25' },
  { type: 'journey', label: '旅程图', alias: ['journey'], content: 'journey\n  title 用户体验\n  section 注册\n    打开应用: 5: 用户\n    填写信息: 3: 用户' },
]

export function detectDiagramType(code: string): string {
  const trimmed = code.trim()
  const firstLine = trimmed.split('\n')[0]?.toLowerCase() || ''
  for (const config of DIAGRAM_TYPES) {
    if (config.alias.some(alias => firstLine.startsWith(alias) || firstLine === alias)) {
      return config.type
    }
  }
  return 'flowchart'
}
