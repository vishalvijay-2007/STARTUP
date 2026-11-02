export const generateLocalInsights = ({ startups = [], cohorts = [], mentors = [], sessions = [], milestones = [], resources = [] }) => {
  const insights = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (startups.length) {
    const activeStartups = startups.filter((startup) => startup.status === 'Active').length
    insights.push(`${activeStartups} of ${startups.length} startups are active. Review paused or graduated startups to keep your portfolio status current.`)
  } else {
    insights.push('No startups are recorded yet. Add your startups to unlock portfolio and milestone insights.')
  }

  const overdueMilestones = milestones.filter((milestone) => {
    if (!milestone.dueDate || milestone.status === 'Completed') return false
    const dueDate = new Date(milestone.dueDate)
    if (Number.isNaN(dueDate.getTime())) return false
    dueDate.setHours(0, 0, 0, 0)
    return dueDate < today
  })
  if (overdueMilestones.length) {
    insights.push(`${overdueMilestones.length} incomplete milestone${overdueMilestones.length === 1 ? '' : 's'} ${overdueMilestones.length === 1 ? 'is' : 'are'} past due. Review owners and update due dates or status.`)
  } else if (milestones.length) {
    const incompleteMilestones = milestones.filter((milestone) => milestone.status !== 'Completed').length
    insights.push(`${incompleteMilestones} of ${milestones.length} milestones ${incompleteMilestones === 1 ? 'is' : 'are'} still in progress. Keep the next due dates visible in your weekly check-ins.`)
  } else if (startups.length) {
    insights.push('No milestones are recorded. Add measurable next steps so startup progress can be tracked.')
  }

  const missedSessions = sessions.filter((session) => session.status === 'Missed').length
  const upcomingSessions = sessions.filter((session) => {
    if (session.status !== 'Scheduled' || !session.date) return false
    const sessionDate = new Date(session.date)
    return !Number.isNaN(sessionDate.getTime()) && sessionDate >= today
  }).length
  if (missedSessions) {
    insights.push(`${missedSessions} mentor session${missedSessions === 1 ? '' : 's'} ${missedSessions === 1 ? 'was' : 'were'} marked missed. Consider rescheduling to maintain founder support.`)
  } else if (startups.length && !upcomingSessions && mentors.length) {
    insights.push(`You have ${mentors.length} mentor${mentors.length === 1 ? '' : 's'} but no upcoming scheduled sessions. Book a check-in for startups that need support.`)
  } else if (upcomingSessions) {
    insights.push(`${upcomingSessions} mentor session${upcomingSessions === 1 ? ' is' : 's are'} scheduled. Review agendas beforehand to make each session actionable.`)
  }

  const lowResources = resources.filter((resource) => Number(resource.available) < Number(resource.quantity))
  if (lowResources.length) {
    insights.push(`${lowResources.length} resource${lowResources.length === 1 ? ' has' : 's have'} limited availability. Check allocations before promising them to another startup.`)
  }
  if (cohorts.length) {
    const activeCohorts = cohorts.filter((cohort) => cohort.status === 'Active').length
    insights.push(`${activeCohorts} of ${cohorts.length} cohorts ${activeCohorts === 1 ? 'is' : 'are'} active. Check that each active cohort has current milestones and mentor sessions.`)
  }

  return insights.map((insight, index) => `${index + 1}. ${insight}`).join('\n')
}

export const generateLocalAssistantResponse = ({ message, records = {} }) => {
  const question = message.toLowerCase()
  if (/வணக்கம்/.test(message)) {
    return 'வணக்கம்! உங்கள் startup workspace, milestones, mentors அல்லது அடுத்த படிகள் பற்றி கேளுங்கள். எப்படி உதவலாம்?'
  }

  if (/\b(h+i+|hello+|hey+)\b/.test(question)) {
    return 'Hi! I’m doing well, thanks for asking. I can help with your incubator workspace and startup next steps. What would you like to know?'
  }

  if (/\bhow are you\b|\bhow're you\b/.test(question)) {
    return 'I’m doing well, thanks for asking! What can I help you with today?'
  }

  if (
    (/\bidea\b/.test(question) && /\b(validat|test|customer|market)\w*/.test(question))
    || /\b(validat|test)\w*\b.*\b(startup|business|product)\b/.test(question)
  ) {
    return [
      'Validate the idea before investing heavily:',
      '1. Choose one specific customer group and describe the problem they face.',
      '2. Interview 10–15 people in that group. Ask about what they do today and what the problem costs them; do not pitch your solution first.',
      '3. Check whether the problem is frequent and urgent, and whether people already spend time or money solving it.',
      '4. Create the smallest test: a landing page, clickable mock-up, manual service, or pilot.',
      '5. Measure real commitment (sign-ups, repeat use, referrals, or paid pilots), not just compliments.',
      '6. Set a pass/fail target before the test, review the results, and adjust the customer or solution if needed.',
    ].join('\n')
  }

  if (/\b(workspace|portfolio|startup|startups|cohort|cohorts|mentor|mentors|session|sessions|milestone|milestones|resource|resources|overdue|எத்தனை)\b/.test(question)) {
    const startups = records.startups || []
    const cohorts = records.cohorts || []
    const mentors = records.mentors || []
    const sessions = records.sessions || []
    const milestones = records.milestones || []
    const resources = records.resources || []
    return [
      `Your workspace has ${startups.length} startup${startups.length === 1 ? '' : 's'}, ${cohorts.length} cohort${cohorts.length === 1 ? '' : 's'}, ${mentors.length} mentor${mentors.length === 1 ? '' : 's'}, ${sessions.length} mentor session${sessions.length === 1 ? '' : 's'}, ${milestones.length} milestone${milestones.length === 1 ? '' : 's'}, and ${resources.length} resource${resources.length === 1 ? '' : 's'}.`,
      '',
      generateLocalInsights(records),
    ].join('\n')
  }

  return 'I can provide basic startup guidance and answer questions using your workspace data. For open-ended answers like ChatGPT, add a valid OPENAI_API_KEY to the server .env file and restart the backend. I do not want to guess at an answer without the AI service.'
}
