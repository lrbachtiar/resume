import type { SkillGroup } from './types'

export const skills: SkillGroup[] = [
  {
    label: 'Leadership',
    items: ['Team leadership & hiring', 'Mentoring engineers & data scientists', 'Skills curricula', 'AI adoption & guardrails', 'Client relationships'],
  },
  {
    label: 'Data engineering',
    items: ['Data modelling', 'Pipeline architecture', 'ETL', 'API design', 'SFTP ingestion'],
  },
  {
    label: 'AI & machine learning',
    items: ['Agentic AI (Claude Code, Codex)', 'LLM applications', 'Optimisation (LP)', 'Forecasting', 'scikit-learn', 'Optuna', 'MLflow'],
  },
  { label: 'Languages', items: ['Python', 'SQL', 'PySpark', 'Bash'] },
  {
    label: 'Data platforms',
    items: ['Databricks', 'Apache Spark', 'Google BigQuery', 'MySQL', 'PostgreSQL', 'SQL Server', 'Oracle', 'Teradata'],
  },
  { label: 'Cloud', items: ['AWS', 'Microsoft Azure', 'Google Cloud'] },
  { label: 'Visualisation', items: ['Tableau', 'Power BI', 'Apache Superset'] },
  { label: 'Ways of working', items: ['Agile', 'SDLC', 'Jira & Confluence', 'Azure DevOps'] },
]
