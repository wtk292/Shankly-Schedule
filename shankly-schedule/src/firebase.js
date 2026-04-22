import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

// Replace these values with your Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyCOao0HHSgr92kjqyvEoafEE3ozB_ygIWw",
  authDomain: "shankly-schedule.firebaseapp.com",
  databaseURL: "https://shankly-schedule-default-rtdb.firebaseio.com",
  projectId: "shankly-schedule",
  storageBucket: "shankly-schedule.firebasestorage.app",
  messagingSenderId: "939898424652",
  appId: "1:939898424652:web:e5d6923ea5b2d82c4a93e9"
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)
