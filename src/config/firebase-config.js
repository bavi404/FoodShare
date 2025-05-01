// firebase-config.js
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "YOUR_REAL_API_KEY",
  authDomain: "your-auth-domain.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-bucket",
  messagingSenderId: "your-msg-id",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);

export default app;
