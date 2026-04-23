const { GoogleAuth } = require('google-auth-library')
 
exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }
 
  try {
    const { token, title, body } = JSON.parse(event.body)
 
    if (!token || !title || !body) {
      return { statusCode: 400, body: 'Missing required fields' }
    }
 
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
            webpush: {
              notification: {
                title,
                body,
                icon: '/apple-touch-icon.png',
                badge: '/favicon-32x32.png',
                vibrate: [200, 100, 200]
              },
              fcm_options: {
                link: '/'
              }
            }
          }
        })
      }
    )
 
    const result = await response.json()
 
    if (!response.ok) {
      console.error('FCM error:', result)
      return { statusCode: 500, body: JSON.stringify(result) }
    }
 
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    }
  } catch (err) {
    console.error('notify function error:', err)
    return { statusCode: 500, body: err.message }
  }
}
 
