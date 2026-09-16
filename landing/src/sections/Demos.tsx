import type { ReactNode } from 'react'
import { AutoLayoutDemo } from '../demos/AutoLayoutDemo'
import { ImportJsonDemo } from '../demos/ImportJsonDemo'
import { SchemaDemo } from '../demos/SchemaDemo'
import { StatusBoardDemo } from '../demos/StatusBoardDemo'
import { ViewSwitchDemo } from '../demos/ViewSwitchDemo'
import { Reveal, Section, SectionHeading } from '../ui/Section'

type DemoEntry = {
  id: string
  eyebrow: string
  title: string
  text: string
  demo: ReactNode
}

const DEMOS: DemoEntry[] = [
  {
    id: 'demo-schema',
    eyebrow: 'Схема',
    title: 'Архитектура собирается из узлов и подписанных связей',
    text: 'Человек, вход, модуль в рамке «Бэкенд», хранилище, внешний сервис и вебхук. У каждого узла — свой силуэт, у каждой стрелки — подпись. Статусы видны прямо на карте.',
    demo: <SchemaDemo />,
  },
  {
    id: 'demo-board',
    eyebrow: 'Статусы',
    title: 'Те же узлы — карточками по колонкам',
    text: 'Вид «Статусы» показывает граф как доску: задумано, в работе, готово, сломано. Перетащите карточку — статус изменится и на схеме.',
    demo: <StatusBoardDemo />,
  },
  {
    id: 'demo-switch',
    eyebrow: 'Схема ↔ Статусы',
    title: 'Один граф, два вида',
    text: 'Переключите вкладку сами: элементы не копируются, а перелетают из позиций на холсте в колонки и обратно. Это главная идея продукта — карта и трекер живут в одних данных.',
    demo: <ViewSwitchDemo />,
  },
  {
    id: 'demo-import',
    eyebrow: 'Импорт из JSON · Промпт для ИИ',
    title: 'Схему можно не рисовать руками',
    text: 'Кнопка «Промпт для ИИ» копирует спецификацию формата mind-map.layout.v1. Вставьте её в ChatGPT или Claude, опишите систему — и импортируйте ответ. Координаты считаются от центра доски, вложенные узлы — от центра рамки.',
    demo: <ImportJsonDemo />,
  },
  {
    id: 'demo-layout',
    eyebrow: 'Автораскладка',
    title: 'Порядок одним пунктом меню',
    text: '«Упорядочить → слева направо» раскладывает узлы по рангам через Dagre. Есть варианты сверху вниз и «показать всё».',
    demo: <AutoLayoutDemo />,
  },
]

export function Demos() {
  return (
    <Section id="demos" className="bg-ink/[0.025] dark:bg-white/[0.02]">
      <SectionHeading
        eyebrow="Примеры работы"
        title="Посмотрите, как это двигается"
        lead="Живые сцены на тех же узлах, что и в приложении. Запускаются, когда попадают на экран, и уважают настройку «уменьшить движение»."
      />
      <div className="mt-14 flex flex-col gap-16 md:gap-20">
        {DEMOS.map((entry, index) => (
          <Reveal key={entry.id}>
            <article
              id={entry.id}
              className={`grid items-center gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10 ${
                index % 2 === 1 ? 'lg:[&>div:first-child]:order-2' : ''
              }`}
            >
              <div>
                <div className="mb-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-accent">{entry.eyebrow}</div>
                <h3 className="display text-[24px] font-semibold md:text-[28px]">{entry.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-muted">{entry.text}</p>
              </div>
              <div className="min-w-0">{entry.demo}</div>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
