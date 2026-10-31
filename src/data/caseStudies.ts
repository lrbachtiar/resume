/**
 * Project case studies. Facts come from the CVs, the owner's handover and the projects'
 * own code; no invented metrics. Customer work stays anonymised.
 */

export interface Screenshot {
  /** Path under public/, e.g. "projects/fairwayplan/itinerary.png". */
  src: string
  caption: string
}

export interface CaseStudy {
  projectId: string
  problem: string
  built: string[]
  stack: string
  status: string
  /** Static demo served by this site, relative to the site base (a folder, not an app route). */
  demo?: string
  screenshots: Screenshot[]
}

export const caseStudies: CaseStudy[] = [
  {
    projectId: 'fairwayplan',
    problem:
      'Planning a multi-day golf trip around New Zealand means juggling hundreds of courses, green fees, drive times, weather and daylight. Doing it by hand, you trade one constraint off against another and rarely know whether a better trip existed.',
    built: [
      'A mixed-integer optimiser (HiGHS) that picks which courses to play on which day. It maximises a weighted score of prestige, forecast weather, rating and fit with the trip’s intent, minus green fees, hilliness and distance. Tighter budgets automatically shift the weights toward value.',
      'Hard rules the solver respects: one course per round slot, a cap on rounds per day, no course played twice, a firm budget, and never two hilly rounds on the same day. Bad-weather days are excluded outright.',
      'Tee times that fit the daylight: the first preferred slot whose 4.5-hour round finishes half an hour before sunset, with sunset calculated for the date and latitude.',
      'Four-tier weather: the live forecast up to a week out, five-year averages up to three months out, a local history grid, then a seasonal fallback by latitude, with tee-time temperature and what to wear.',
      'Resilient by design: if the solver times out (15 seconds) or finds nothing, a greedy planner steps in and labels its plan as a suggestion. Short trips also get ranked alternatives for each day.',
      'Shareable, editable itineraries with a route map, across a catalogue of more than 400 New Zealand courses.',
    ],
    stack:
      'Next.js frontend; FastAPI backend with separate optimiser and weather services; PostgreSQL and Redis; Docker Compose; deployed on DigitalOcean behind Cloudflare.',
    status:
      'Designed, built and launched solo. The live service has since been retired to save hosting costs. The demo replays real optimiser output for four sample trips (Queenstown, Northland, Canterbury and Hawke’s Bay), with five-year weather averages.',
    demo: 'fairwayplan/',
    screenshots: [
      { src: 'projects/fairwayplan/05-itinerary-route-map.png', caption: 'An optimised trip: summary and course route map.' },
      { src: 'projects/fairwayplan/06-day-card-weather-clothing.png', caption: 'Day by day: tee times, weather and what to wear.' },
      { src: 'projects/fairwayplan/07-course-catalogue-map.png', caption: 'The course catalogue: more than 400 courses on one map.' },
      { src: 'projects/fairwayplan/01-home-hero.png', caption: 'The home page.' },
      { src: 'projects/fairwayplan/08-wizard-demo-sample-picker.png', caption: 'In the demo, the trip wizard hands over to a sample trip.' },
    ],
  },
  {
    projectId: 'beanmarkd',
    problem:
      'Specialty coffee tastes different depending on how many days it is off roast, yet ratings rarely say how fresh the bag was. Beanmarkd puts freshness at the centre: drinkers rate the beans they brew, and roasters announce fresh batches.',
    built: [
      'A freshness curve for every bean: average rating against days off roast, with a confidence level on each roast date (verified, from the bag, estimated or unknown).',
      'Tasting notes on the SCA flavour wheel, rolled up into a community flavour fingerprint for each bean.',
      'A roaster portal with server-side analytics: rating distribution, the freshness curve by days off roast, top brew methods, follower growth and per-bean performance.',
      'A shareable Instagram story card drawn in the browser. It samples the photo’s brightness so the text stays readable, and keeps clear of Instagram’s safe zones.',
      'Tidy engineering underneath: every API call goes through one typed client, brew links use short reversible codes instead of database IDs, and the seed data rebuilds identically from a single date.',
    ],
    stack:
      'React, Vite and TypeScript with Tailwind; FastAPI with hand-written, parameterised SQL (no ORM) on MySQL 8 across 43 migrations; JWT authentication; Docker Compose behind nginx.',
    status:
      'Designed and built solo, and used by real people. The live service has since been retired to save hosting costs. The demo runs on sample data with fictional roasters and cafés, and lets you view it as a coffee drinker, a roaster or a moderator.',
    demo: 'beanmarkd/',
    screenshots: [
      { src: 'projects/beanmarkd/02-bean-freshness-curve.png', caption: 'A bean page: ratings and the freshness curve by days off roast.' },
      { src: 'projects/beanmarkd/04-portal-analytics.png', caption: 'The roaster portal’s analytics.' },
      { src: 'projects/beanmarkd/06-share-card.png', caption: 'A story card generated in the browser, ready for Instagram.' },
      { src: 'projects/beanmarkd/05-brew-tasting.png', caption: 'A brew with tasting notes on the flavour wheel.' },
      { src: 'projects/beanmarkd/01-feed-desktop.png', caption: 'The feed, with fresh roast drops from roasters.' },
    ],
  },
  {
    projectId: 'ferry',
    problem:
      'Healthcare teams need realistic patient data to test their systems, but real records can’t leave production. Hand-made test data misses the shape and messiness of the real thing.',
    built: [
      'Seeds a referentially intact slice of an electronic health record into lower environments, so related records still line up.',
      'Mirrors the shape of real records while masking every personal detail, so nothing private is exposed.',
      'Works with the main healthcare data standards out of the box.',
    ],
    stack: 'Open source on GitHub, with a live tool on GitHub Pages.',
    status: 'Live and open source.',
    screenshots: [],
  },
  {
    projectId: 'manufacturing-optimiser',
    problem:
      'A meat processor has to decide what to make each season to match demand, within the real limits of its plants. The trade-offs are too many to weigh by hand, and planners need to trust the answer.',
    built: [
      'Linear-programming optimisation that matches production to seasonal demand while respecting plant constraints.',
      'AI-written commentary that explains each recommendation in plain language for planners.',
      'Bulk data upload over SFTP, so the customer’s planning data flows in without manual steps.',
    ],
    stack: 'Built at Ever.Ag Data Labs with Python and SQL. Architecture and customer details are confidential.',
    status: 'In production and in daily use by the customer. Customer details are kept confidential.',
    screenshots: [],
  },
]

export const caseStudyFor = (projectId: string) => caseStudies.find((c) => c.projectId === projectId)
