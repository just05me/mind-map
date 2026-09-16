import { SCHEMA_SCENE } from '../content/demo-scenes'
import { DemoFrame } from './DemoFrame'
import { SceneCanvas } from './SceneCanvas'
import { SceneViewport } from './SceneViewport'
import { sceneSteps } from './scene-types'
import { useScenePlayer } from './use-scene-player'

export function SchemaDemo() {
  return (
    <DemoFrame title="Оплата заказа" view="map" dock={false}>
      {(active) => <SchemaScene active={active} />}
    </DemoFrame>
  )
}

function SchemaScene({ active }: { active: boolean }) {
  const step = useScenePlayer({ steps: sceneSteps(SCHEMA_SCENE), stepMs: 480, holdMs: 3600, active })
  return (
    <SceneViewport width={SCHEMA_SCENE.width} height={SCHEMA_SCENE.height}>
      <SceneCanvas scene={SCHEMA_SCENE} step={step} />
    </SceneViewport>
  )
}
