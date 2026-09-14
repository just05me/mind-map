export const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

export const MOD_KEY = IS_MAC ? '⌘' : 'Ctrl+'

export function isModifier(event: KeyboardEvent): boolean {
  return IS_MAC ? event.metaKey : event.ctrlKey
}

export function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable)
  )
}

export const SHORTCUT_GROUPS: { title: string; items: [string, string][] }[] = [
  {
    title: 'Инструменты',
    items: [
      ['V', 'Выбор'],
      ['H или зажать пробел', 'Рука — двигать холст'],
      ['N', 'Узел'],
      ['S', 'Стикер'],
      ['T', 'Текст'],
      ['F', 'Рамка'],
      ['L', 'Связь'],
    ],
  },
  {
    title: 'Правка',
    items: [
      ['Delete / Backspace', 'Удалить выделенное'],
      [`${MOD_KEY}Z`, 'Отменить'],
      [`${MOD_KEY}⇧Z`, 'Повторить'],
      [`${MOD_KEY}D`, 'Дублировать'],
      [`${MOD_KEY}C / ${MOD_KEY}V`, 'Копировать / вставить'],
      [`${MOD_KEY}A`, 'Выделить всё'],
      ['Enter', 'Переименовать выделенный'],
      ['Esc', 'Снять выделение'],
    ],
  },
  {
    title: 'Вид',
    items: [
      [`${MOD_KEY}\\`, 'Скрыть / показать панели'],
      ['[ / ]', 'Левая / правая панель'],
      ['⇧1', 'Показать всё'],
      ['Колесо / тачпад', 'Прокрутка холста'],
      [`${MOD_KEY} + колесо, щипок`, 'Масштаб'],
      ['Правая кнопка', 'Меню действий'],
      ['?', 'Эта шпаргалка'],
    ],
  },
]
