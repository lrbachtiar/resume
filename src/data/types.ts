export interface Link {
  label: string
  href: string
}

export interface Profile {
  name: string
  headline: string
  tagline: string
  currentRole: string
  currentCompany: string
  location: string
  workRights: string
  summary: string[]
  email: string
  links: Link[]
}

/** Topics let the course pull relevant highlights without duplicating them. */
export type Topic = 'data' | 'ml' | 'ai' | 'leadership'

export interface Highlight {
  text: string
  topics: Topic[]
}

export interface Role {
  title: string
  start: string
  end: string
  highlights: Highlight[]
}

export interface Experience {
  id: string
  company: string
  location: string
  blurb?: string
  roles: Role[]
  /** Shown in compact form only, e.g. "Earlier career". */
  earlier?: boolean
}

export type ProjectStatus = 'live' | 'demo' | 'tool' | 'production'

export interface Project {
  id: string
  name: string
  status: ProjectStatus
  oneLiner: string
  description: string
  url?: string
  repo?: string
  stack: string[]
  flagship?: boolean
  /** Confidential customer work: describe the problem, never the customer. */
  anonymised?: boolean
}

export interface SkillGroup {
  label: string
  items: string[]
}

export interface Qualification {
  title: string
  institution: string
  location: string
  start?: string
  end: string
  notes: string[]
}
