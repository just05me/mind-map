import { Demos } from './sections/Demos'
import { Features } from './sections/Features'
import { FinalCta, Footer } from './sections/Footer'
import { Header } from './sections/Header'
import { Hero } from './sections/Hero'
import { HowItWorks } from './sections/HowItWorks'
import { OpenSource } from './sections/OpenSource'
import { SelfHost } from './sections/SelfHost'
import { Usage } from './sections/Usage'
import { useTheme } from './ui/use-theme'

export default function App() {
  const { theme, toggle } = useTheme()

  return (
    <div className="min-h-full bg-bg text-ink">
      <Header theme={theme} onToggleTheme={toggle} />
      <main>
        <Hero />
        <OpenSource />
        <Features />
        <Demos />
        <HowItWorks />
        <SelfHost />
        <Usage />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}
