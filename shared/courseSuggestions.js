const ideas = [
  { title: 'Customer Discovery and Interview Skills', category: 'Product Strategy', description: 'Learn to identify customer problems, run useful interviews, and turn insights into clear product decisions.', hours: 5 },
  { title: 'MVP Planning and Product Validation', category: 'Product Development', description: 'Scope a focused minimum viable product, test key assumptions, and use feedback to guide your next iteration.', hours: 6 },
  { title: 'Startup Finance, Cash Flow, and Runway', category: 'Finance', description: 'Build a practical budget, understand runway, and make informed decisions about startup spending.', hours: 7 },
  { title: 'Growth Marketing and Customer Acquisition', category: 'Marketing', description: 'Choose the right acquisition channels, create experiments, and measure what drives sustainable growth.', hours: 6 },
  { title: 'Pitch Deck and Fundraising Readiness', category: 'Fundraising', description: 'Shape your startup story, prepare a clear pitch deck, and understand what investors look for.', hours: 5 },
  { title: 'Pricing Strategy and Revenue Models', category: 'Business Strategy', description: 'Compare pricing approaches, test willingness to pay, and build a revenue model that can scale.', hours: 4 },
  { title: 'Building and Leading a Startup Team', category: 'Leadership', description: 'Set team priorities, establish healthy ways of working, and hire for the needs of an early-stage company.', hours: 5 },
  { title: 'Startup Legal Basics and Intellectual Property', category: 'Legal', description: 'Understand common founder agreements, intellectual property basics, and when to seek professional advice.', hours: 4 },
  { title: 'Data-Driven Decisions for Founders', category: 'Analytics', description: 'Select meaningful startup metrics, build a simple reporting habit, and use evidence to prioritize work.', hours: 4 },
  { title: 'Operations and Execution for Early-Stage Startups', category: 'Startup Operations', description: 'Create lightweight operating rhythms, clarify ownership, and turn startup priorities into consistent execution.', hours: 5 },
]

export const fallbackCourseSuggestions = ({ existingTitles: savedTitles = [] } = {}) => {
  const existingTitles = new Set(savedTitles.map((title) => title.trim().toLowerCase()))

  return ideas.filter((idea) => !existingTitles.has(idea.title.toLowerCase())).slice(0, 5)
}
