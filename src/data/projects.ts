import type { Project } from './types'

export const projects: Project[] = [
  {
    id: 'fairwayplan',
    name: 'FairwayPlan',
    status: 'demo',
    flagship: true,
    oneLiner: 'Plans the perfect multi-day golf trip around New Zealand.',
    description:
      'Weighs course quality, budget, travel time, weather and daylight to build the best possible itinerary. Designed, built and launched solo, from idea to production.',
    stack: ['Next.js', 'FastAPI', 'PostgreSQL', 'Redis', 'HiGHS optimisation', 'Weather APIs', 'DigitalOcean', 'Cloudflare'],
  },
  {
    id: 'beanmarkd',
    name: 'Beanmarkd',
    status: 'demo',
    oneLiner: 'A social app for specialty-coffee lovers, built around freshness.',
    description:
      'Drinkers rate the beans they brew and roasters announce fresh batches. Designed and built solo, and used by real people.',
    stack: ['React', 'Vite', 'TypeScript', 'FastAPI', 'MySQL', 'Docker'],
  },
  {
    id: 'ferry',
    name: 'Ferry',
    status: 'tool',
    oneLiner: 'Realistic, privacy-safe patient data for testing healthcare systems.',
    description:
      'Seeds a referentially intact slice of an EHR into lower environments, mirroring the shape of real records while masking every personal detail. Works with the main healthcare data standards out of the box.',
    url: 'https://lrbachtiar.github.io/ferry/',
    repo: 'https://github.com/lrbachtiar/ferry',
    stack: [],
  },
  {
    id: 'manufacturing-optimiser',
    name: 'Manufacturing optimiser',
    status: 'production',
    anonymised: true,
    oneLiner: 'Matches a meat processor’s production to seasonal demand.',
    description:
      'Respects the real limits of the processor’s plants, does the heavy number-crunching, and uses AI to explain each recommendation in plain language. In daily use by the customer.',
    stack: ['LP optimisation', 'LLM commentary', 'SFTP bulk upload'],
  },
]

export const statusLabel: Record<Project['status'], string> = {
  live: 'Live',
  demo: 'Demo',
  tool: 'Open tool',
  production: 'In production',
}
