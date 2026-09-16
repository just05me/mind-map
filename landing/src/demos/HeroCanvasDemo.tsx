import { HERO_CURSOR_PATH, HERO_SCENE } from '../content/hero-scene'
import { DemoCursor } from './DemoCursor'
import { DemoFrame } from './DemoFrame'
import { SceneCanvas } from './SceneCanvas'
import { SceneViewport } from './SceneViewport'
import { sceneSteps } from './scene-types'
import { useScenePlayer } from './use-scene-player'

export function HeroCanvasDemo() {
  return (
    <DemoFrame title="Чат с ИИ" view="map">
      {(active) => <HeroScene active={active} />}
    </DemoFrame>
  )
}

function HeroScene({ active }: { active: boolean }) {
  const step = useScenePlayer({ steps: sceneSteps(HERO_SCENE), stepMs: 430, holdMs: 4200, active })
  return (
    <SceneViewport width={HERO_SCENE.width} height={HERO_SCENE.height}>
      <SceneCanvas scene={HERO_SCENE} step={step} />
      <DemoCursor points={HERO_CURSOR_PATH} duration={11} />
    </SceneViewport>
  )
}
