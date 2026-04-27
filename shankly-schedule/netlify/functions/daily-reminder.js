const { GoogleAuth } = require('google-auth-library')

async function sendNotification(token, title, body) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  const projectId = serviceAccount.project_id

  const auth = new GoogleAuth({
    credentials: serviceAccount,
    scopes: ['https://www.googleapis.com/auth/firebase.messaging']
  })

  const client = await auth.getClient()
  const accessToken = await client.getAccessToken()

  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body },
          apns: {
            payload: { aps: { badge: 1, sound: 'default' } }
          },
          webpush: {
            notification: {
              title, body,
              icon: '/apple-touch-icon.png',
              badge: '/favicon-32x32.png',
            },
            fcm_options: { link: '/' }
          }
        }
      })
    }
  )

  const result = await response.json()
  if (!response.ok) console.error('FCM error:', result)
  return result
}

exports.handler = async function() {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    const dbUrl = `https://shankly-schedule-default-rtdb.firebaseio.com`

    // Get today's date in YYYY-MM-DD
    const today = new Date().toISOString().slice(0, 10)

    // Fetch sessions
    const sessionsRes = await fetch(`${dbUrl}/sessions.json`)
    const sessionsData = await sessionsRes.json()
    if (!sessionsData) return { statusCode: 200, body: 'No sessions' }

    // Fetch coaches
    const coachesRes = await fetch(`${dbUrl}/coaches.json`)
    const coachesData = await coachesRes.json()
    if (!coachesData) return { statusCode: 200, body: 'No coaches' }

    // Fetch FCM tokens
    const tokensRes = await fetch(`${dbUrl}/fcmTokens.json`)
    const tokensData = await tokensRes.json()
    if (!tokensData) return { statusCode: 200, body: 'No tokens' }

    // Find sessions today that are not confirmed
    const sessions = Object.entries(sessionsData).map(([id, s]) => ({ id, ...s }))
    const coaches = Object.entries(coachesData).map(([id, c]) => ({ id, ...c }))

    // Group unconfirmed sessions by coach
    const unconfirmedByCoach = {}
    sessions.forEach(s => {
      const isToday = s.date === today ||
        (s.repeat === 'weekly' && new Date().getDay() === parseInt(s.dow))
      if (!isToday) return

      const coachIds = s.type === 'league' ? (s.coachIds || []) :
        [s.coachId, ...(s.assistIds || [])].filter(Boolean)

      coachIds.forEach(coachId => {
        const confirmed = s.confirmedBy && s.confirmedBy[coachId]
        if (!confirmed) {
          if (!unconfirmedByCoach[coachId]) unconfirmedByCoach[coachId] = []
          unconfirmedByCoach[coachId].push(s)
        }
      })
    })

    // Send notifications
    const results = []
    for (const [coachId, unconfirmed] of Object.entries(unconfirmedByCoach)) {
      const token = tokensData[coachId]
      if (!token) continue
      const count = unconfirmed.length
      const result = await sendNotification(
        token,
        '⏰ Sessions need confirmation',
        `You have ${count} unconfirmed session${count !== 1 ? 's' : ''} today. Please confirm them in the app.`
      )
      results.push({ coachId, count, result })
    }

    console.log('Daily reminder results:', JSON.stringify(results))
    return { statusCode: 200, body: JSON.stringify({ sent: results.length }) }
  } catch (err) {
    console.error('daily-reminder error:', err)
    return { statusCode: 500, body: err.message }
  }
}
