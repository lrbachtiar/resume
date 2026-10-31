import type { Experience, Highlight, Topic } from './types'

const h = (text: string, ...topics: Topic[]): Highlight => ({ text, topics })

export const experience: Experience[] = [
  {
    id: 'everag',
    company: 'Ever.Ag Data Labs',
    location: 'Auckland, New Zealand',
    blurb: 'The AI division of Ever.Ag, solving global food supply chain problems.',
    roles: [
      {
        title: 'Data Engineering Manager · Lead, Asia-Pacific Data & AI Engineering',
        start: 'Mar 2026',
        end: 'Present',
        highlights: [
          h('Lead the APAC data engineering team across New Zealand, Australia and the Philippines, accountable for NZ and AU customer delivery and growing the team.', 'leadership'),
          h('Established and own the AI-assisted development capability, compressing design-to-deployment from weeks to days across projects.', 'ai', 'leadership'),
          h('Cut build time for a fully deployable sales prototype from 3 weeks to 4 hours, accelerating new customer acquisition.', 'ai'),
          h('Led the internal rollout of Claude across engineering, data science and sales: a training programme, usage guardrails and a fortnightly AI working group.', 'ai', 'leadership'),
          h('Delivered a customer-facing production planning tool for a meat processor, pairing LP optimisation with plain-language AI commentary.', 'ml', 'ai'),
        ],
      },
      {
        title: 'Senior Data Engineer · Client-Facing Data Architect',
        start: 'Aug 2023',
        end: 'Feb 2026',
        highlights: [
          h('Deployed and integrated scAIcloud™, the division’s end-to-end data science platform, for dairy and meat producers, from ingestion through optimisation to user configuration.', 'data'),
          h('Made complex data and mathematical problems clear to audiences from C-suite executives to end users.', 'leadership'),
          h('Delivered livestock forecasting and planning, and livestock and sales forecasting, for meat producers.', 'ml'),
        ],
      },
    ],
  },
  {
    id: 'parrot',
    company: 'Parrot Analytics',
    location: 'Auckland, New Zealand',
    blurb: 'Measures global demand for movies, TV, games and talent.',
    roles: [
      {
        title: 'Senior Data Scientist',
        start: 'Jul 2022',
        end: 'Jul 2023',
        highlights: [
          h('Forecast demand for movies and TV shows before release.', 'ml'),
          h('Predicted post-release movie demand, a proxy for box office, from metadata alone: genre, director, cast and studio.', 'ml'),
          h('Analysed how print and advertising spend relates to global demand for a title.', 'ml'),
          h('Built consumer segmentation and churn prediction for paid streaming platforms.', 'ml'),
        ],
      },
    ],
  },
  {
    id: 'tvnz',
    company: 'TVNZ',
    location: 'Auckland, New Zealand',
    roles: [
      {
        title: 'Data Scientist',
        start: 'Nov 2020',
        end: 'Jul 2022',
        highlights: [
          h('Set the advanced analytics roadmap, capability and technology stack for News and on-demand video, from event-tagging plans to production machine learning on Azure.', 'data', 'ml'),
          h('Mentored junior analysts and founded an internal data professionals group to lift data literacy across the organisation.', 'leadership'),
          h('Built an academic partnership with the University of Auckland, supervising Master of Data Science industry-placement projects.', 'leadership'),
          h('Hired product analysts, screened data engineers and managed vendors through RACI and RFQ processes.', 'leadership'),
          h('Led A/B experimentation on the on-demand platform and contributed to the Data Governance Forum.', 'ml'),
        ],
      },
    ],
  },
  {
    id: 'anz',
    company: 'ANZ',
    location: 'Melbourne, Australia',
    roles: [
      {
        title: 'Data Scientist',
        start: 'Sep 2019',
        end: 'Nov 2020',
        highlights: [
          h('Led the Data Chapter syllabus and its rollout, upskilling campaign analysts, data analysts and data scientists through a role-based skills matrix.', 'leadership'),
          h('Automated a big data ETL pipeline for high-net-worth customer data assets.', 'data'),
          h('Built a predictive customer-acquisition model for high-net-worth clients from segmentation and transaction data.', 'ml'),
        ],
      },
    ],
  },
  {
    id: 'fonterra',
    company: 'Fonterra',
    location: 'Auckland, New Zealand',
    roles: [
      {
        title: 'Data Scientist',
        start: 'Jun 2018',
        end: 'Sep 2019',
        highlights: [
          h('Delivered analytics projects valued at $40M (global sales pipeline dashboard), $14M (product sensory quality failure), $4M (production line quality simulation) and $3.5M (vehicle life extension).', 'ml', 'data'),
          h('Designed and deployed a big data pipeline on AWS, surfacing model outputs to sales managers in Tableau.', 'data'),
          h('Scrum Master for the Centre of Excellence data science team, and ran upskilling workshops across the business.', 'leadership'),
        ],
      },
    ],
  },
  {
    id: 'stjohn',
    company: 'St John New Zealand',
    location: 'Auckland, New Zealand',
    earlier: true,
    roles: [{ title: 'Health Integration Analyst', start: 'Jan 2018', end: 'May 2018', highlights: [] }],
  },
  {
    id: 'orion',
    company: 'Orion Health',
    location: 'Auckland, New Zealand',
    earlier: true,
    roles: [
      { title: 'Solution Engineer, Data Integrity & Ingestion', start: 'Nov 2015', end: 'Jan 2018', highlights: [] },
      { title: 'Implementation Consultant', start: 'Jan 2015', end: 'Nov 2015', highlights: [] },
    ],
  },
  {
    id: 'uoa',
    company: 'University of Auckland',
    location: 'Auckland, New Zealand',
    earlier: true,
    roles: [{ title: 'Research Assistant & Course Tutor', start: 'Jul 2010', end: 'Nov 2013', highlights: [] }],
  },
]
