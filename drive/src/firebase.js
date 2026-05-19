import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyB0ICV_rFH3npV8GYN7klL-e6OKZFWlQ7Q",
  authDomain: "drivelogins-89e10.firebaseapp.com",
  projectId: "drivelogins-89e10",
  storageBucket: "drivelogins-89e10.firebasestorage.app",
  messagingSenderId: "864471537999",
  appId: "1:864471537999:web:097f25df843c004b4ccd3a",
  measurementId: "G-EJQFZSM93W"
};
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { app, auth, provider, analytics };
