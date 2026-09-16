export type TechBadge = {
  name: string
  role: string
  color: string
  href: string
}

export const TECH: TechBadge[] = [
  { name: 'React 19', role: 'интерфейс', color: '#61dafb', href: 'https://react.dev/' },
  { name: 'TypeScript', role: 'строгие типы', color: '#3178c6', href: 'https://www.typescriptlang.org/' },
  { name: 'Vite 7', role: 'сборка', color: '#646cff', href: 'https://vite.dev/' },
  { name: 'Tailwind 4', role: 'стили', color: '#38bdf8', href: 'https://tailwindcss.com/' },
  { name: 'Motion', role: 'анимации', color: '#fff312', href: 'https://motion.dev/' },
  { name: 'XYFlow', role: 'холст', color: '#ff0072', href: 'https://reactflow.dev/' },
  { name: 'Dagre', role: 'автораскладка', color: '#8e8e93', href: 'https://github.com/dagrejs/dagre' },
  { name: 'Hono', role: 'API на Node', color: '#e36002', href: 'https://hono.dev/' },
  { name: 'Prisma', role: 'ORM', color: '#5a67d8', href: 'https://www.prisma.io/' },
  { name: 'PostgreSQL', role: 'данные', color: '#4169e1', href: 'https://www.postgresql.org/' },
  { name: 'Docker', role: 'запуск', color: '#2496ed', href: 'https://docs.docker.com/compose/' },
]

export type FlowStep = {
  title: string
  note: string
}

/** The data path from README «Как это устроено». */
export const FLOW: FlowStep[] = [
  { title: 'UI', note: 'canvas · board · ui' },
  { title: 'useApp / dispatch', note: 'действия вместо мутаций' },
  { title: 'reducer', note: 'правила графа, undo и redo' },
  { title: 'Project + /api/projects', note: 'стор и Hono API' },
  { title: 'PostgreSQL', note: 'Prisma, ваши данные' },
]

export const LOCAL_RUN = `cp .env.example .env
docker compose up db -d
npm install
npx prisma migrate deploy
npm run dev`

export const DOCKER_RUN = `# .env: SESSION_SECRET (32+ символов), POSTGRES_PASSWORD, CORS_ORIGIN
docker compose up --build -d
curl http://localhost:3000/api/health   # { "ok": true, "db": "up" }`

export const CLONE = `git clone https://github.com/just05me/mind-map.git
cd mind-map`
