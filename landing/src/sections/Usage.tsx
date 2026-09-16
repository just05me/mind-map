import { HOTKEYS, USAGE_STEPS } from '../content/usage'
import { Icon } from '../ui/Icon'
import { Reveal, Section, SectionHeading } from '../ui/Section'

export function Usage() {
  return (
    <Section id="usage">
      <SectionHeading
        eyebrow="Как пользоваться"
        title="Семь шагов до первой карты"
        lead="Дальше — горячие клавиши и контекстное меню. Полная шпаргалка открывается по «?» или значку клавиатуры в шапке."
      />
      <div className="mt-12 grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        <Reveal>
          <ol className="space-y-3">
            {USAGE_STEPS.map((step, index) => (
              <li key={step.title} className="node-card flex gap-4 rounded-node p-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-[13px] font-semibold text-white">
                  {index + 1}
                </span>
                <div>
                  <div className="text-[15px] font-semibold tracking-[-0.01em]">{step.title}</div>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="chrome-heavy rounded-frame p-5">
            <div className="flex items-center gap-2 text-[14px] font-semibold">
              <Icon name="keyboard" size={16} />
              Горячие клавиши
            </div>
            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-[13px]">
              {HOTKEYS.map((hotkey) => (
                <div key={hotkey.action} className="contents">
                  <dt className="flex items-center gap-1">
                    {hotkey.keys.map((key, index) => (
                      <kbd key={index} className="kbd">
                        {key}
                      </kbd>
                    ))}
                  </dt>
                  <dd className="m-0 self-center text-muted">{hotkey.action}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-[12.5px] text-muted">На Windows и Linux вместо ⌘ — Ctrl.</p>
          </div>
        </Reveal>
      </div>
    </Section>
  )
}
