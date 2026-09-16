import { motion, useReducedMotion } from 'motion/react'
import { IMPORT_JSON_LINES, IMPORT_SCENE } from '../content/import-scene'
import { Icon } from '../ui/Icon'
import { DemoFrame } from './DemoFrame'
import { SceneCanvas } from './SceneCanvas'
import { SceneViewport } from './SceneViewport'
import { useScenePlayer } from './use-scene-player'

/** JSON is typed line by line on the left; the layout grows on the right as lines land. */
export function ImportJsonDemo() {
  return (
    <DemoFrame
      title="Импорт макета"
      dock={false}
      toolbar={
        <span className="flex items-center gap-1.5 text-muted">
          <Icon name="upload" size={13} />
          Импортировать макет
        </span>
      }
    >
      {(active) => <ImportScene active={active} />}
    </DemoFrame>
  )
}

function ImportScene({ active }: { active: boolean }) {
  const reduced = Boolean(useReducedMotion())
  const total = IMPORT_JSON_LINES.length
  const step = useScenePlayer({ steps: total, stepMs: 300, holdMs: 4000, active })
  const typed = Math.max(0, step)

  return (
    <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <pre className="code-block m-0 min-h-[220px] overflow-x-auto px-4 py-3 !text-[11.5px]" aria-label="JSON-макет">
        {IMPORT_JSON_LINES.slice(0, typed).map((line, index) => (
          <motion.div
            key={index}
            initial={reduced ? false : { opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.18 }}
            className="whitespace-pre"
          >
            {highlight(line)}
            {index === typed - 1 && typed < total ? <Caret /> : null}
          </motion.div>
        ))}
        {typed === 0 ? <Caret /> : null}
      </pre>
      <SceneViewport width={IMPORT_SCENE.width} height={IMPORT_SCENE.height} className="border-t border-line md:border-l md:border-t-0">
        <SceneCanvas scene={IMPORT_SCENE} step={step} />
      </SceneViewport>
    </div>
  )
}

function Caret() {
  return (
    <motion.span
      className="ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-[3px] bg-accent"
      animate={{ opacity: [1, 0, 1] }}
      transition={{ duration: 1, repeat: Infinity }}
      aria-hidden
    />
  )
}

/** Tiny tokenizer: keys, strings, numbers, punctuation. */
function highlight(line: string) {
  const tokens = line.match(/"[^"]*"\s*:|"[^"]*"|-?\d+(?:\.\d+)?|[{}[\],:]|\s+|[^\s"{}[\],:]+/g) ?? [line]
  return tokens.map((token, index) => {
    if (/^"[^"]*"\s*:$/.test(token)) {
      return (
        <span key={index}>
          <span className="text-sky-300">{token.slice(0, token.lastIndexOf('"') + 1)}</span>
          <span className="text-white/60">{token.slice(token.lastIndexOf('"') + 1)}</span>
        </span>
      )
    }
    if (token.startsWith('"')) return <span key={index} className="text-amber-200">{token}</span>
    if (/^-?\d/.test(token)) return <span key={index} className="text-emerald-300">{token}</span>
    if (/^[{}[\],:]$/.test(token)) return <span key={index} className="text-white/60">{token}</span>
    return <span key={index}>{token}</span>
  })
}
