# 🍱 FoodShare – Community Food Donation Platform

FoodShare is a web platform designed to reduce food waste and support communities by enabling users to **donate** surplus food or **request** meals. Built with a strong focus on usability and real-time coordination, the platform integrates **Firebase** for seamless data handling and location tracking.

---

## 🚀 Features

- ✅ Post food donations with images, expiry info, and location
- ✅ Request or claim donations from nearby areas
- ✅ Real-time status updates (Available → Claimed → Picked Up)
- ✅ Map view with filters (Leaflet + OpenStreetMap)
- ✅ User ratings after pickup (1–5 stars)
- ✅ Donation history and profile stats

---
## 🛠 Tech Stack

- **Frontend**: HTML, CSS, JS, React (no bundler), Bootstrap
- **Backend**: Firebase (Firestore, Auth)
- **Maps**: Leaflet + OpenStreetMap
- **Hosting**: Local or Firebase Hosting

---

## 🧪 Run Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/foodshare.git
   cd foodshare
Install live-server or use a VSCode extension:

bash
Copy
Edit
npx live-server
In src/firebase-config.js, paste your Firebase credentials:

js
Copy
Edit
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
🔐 Firebase Notice
This public repository excludes real Firebase keys for security.
Please use your own Firebase project and credentials in firebase-config.js.

🤝 Contributors
Bavishya Sankaranarayanan – Developer, Designer, Firebase Integration

📜 License
This project is open source and available under the MIT License.
