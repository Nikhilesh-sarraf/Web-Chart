# Real-Time Web Chat Application 💬

A modern, highly scalable real-time chat application built with the **MERN Stack** (MongoDB, Express, React, Node.js) and **Socket.IO**. It features public chat rooms, private 1-on-1 messaging, real-time presence tracking, and a sleek dark-mode UI.

## 🚀 Features

- **Real-Time Communication**: Instant messaging using Socket.IO without page reloads.
- **Secure Authentication**: JSON Web Token (JWT) based authentication for both HTTP and WebSockets.
- **Room Management**: Create public rooms, join existing ones, and delete rooms you created (with automatic cascading deletion of messages).
- **Private Messaging**: Send direct messages to specific users. Messages are stored persistently even if the receiver is offline.
- **Live Presence Tracking**: See exactly who is online in real-time.
- **Typing Indicators**: Animated bouncing dots appear when someone is typing in a room or private chat.
- **System Announcements**: Automated in-chat announcements when users join a room.
- **Modern UI/UX**: Premium "Glassmorphism" dark-mode interface built with React and Vite.

## 🛠️ Technology Stack

- **Frontend**: React.js, Vite, React Router DOM, Axios, Socket.IO-Client, Vanilla CSS
- **Backend**: Node.js, Express.js, Socket.IO, Mongoose, bcrypt, jsonwebtoken
- **Database**: MongoDB

## 📂 Project Structure

```text
web-chat/
├── backend/            # Express.js REST API and Socket.IO server
│   ├── config/         # MongoDB connection setup
│   ├── controllers/    # API logic (Auth, Rooms, Messages)
│   ├── middleware/     # JWT authentication middleware
│   ├── model/          # Mongoose Schemas (User, Room, Message, PrivateMessage)
│   ├── routes/         # Express API routes
│   ├── sockets/        # Socket.IO event handlers
│   └── app.js          # Entry point for backend
│
└── frontend/           # React frontend built with Vite
    ├── src/
    │   ├── context/    # Global State (AuthContext, SocketContext)
    │   ├── pages/      # Route Components (Login, Register, ChatDashboard)
    │   ├── App.jsx     # Main React Router setup
    │   └── index.css   # Global Design System
    └── package.json    # Frontend dependencies
```

## ⚙️ Installation & Setup

To run this project locally, you will need to start both the backend and frontend servers simultaneously in two different terminal windows.

### 1. Backend Setup
Open your first terminal window:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory with the following variables:
```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
```

Start the backend server:
```bash
node app.js
```

### 2. Frontend Setup
Open a second, new terminal window:
```bash
cd frontend
npm install
```

Start the Vite development server:
```bash
npm run dev
```

The frontend will start on `http://localhost:5173`. 

## 🔒 Security Measures
- **Password Hashing**: Passwords are cryptographically hashed using `bcrypt` before database storage.
- **Socket Interception**: WebSockets use `io.use()` middleware to intercept and validate JWT tokens during the initial handshake, preventing unauthorized socket spam.
- **Validation**: Strict Mongoose and `validator.js` rules ensure clean data input.

## 📜 License
This project is open-source and available under the MIT License.
