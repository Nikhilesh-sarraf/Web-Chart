const jwt = require("jsonwebtoken");
const Message = require("../model/Message");
const PrivateMessage = require("../model/PrivateMessage");

// Map to track online users: userId -> socket.id
const onlineUsers = new Map();

const socketHandler = (io) => {
  // Socket Authentication Middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.token;
      if (!token) {
        return next(new Error("Authentication error: Token missing"));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "webchat_secret_key");
      socket.user = decoded; // attach user payload to the socket
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user.id;
    console.log(`User connected: ${userId} with socket ID: ${socket.id}`);

    // Track user presence
    onlineUsers.set(userId, socket.id);
    
    // Broadcast to everyone that this user is online
    io.emit("user-online", { userId });

    // Join room
    socket.on("join-room", (roomId) => {
      socket.join(roomId);
      console.log(`User ${userId} joined room ${roomId}`);
      
      // Send a system message to others in the room
      socket.to(roomId).emit("receive-message", {
        _id: Date.now().toString(),
        isSystem: true,
        room: roomId,
        content: `${socket.user?.name || "A user"} joined the room.`
      });
    });

    // Send room message
    socket.on("send-message", async (data) => {
      try {
        const { roomId, content } = data;
        
        // Store in DB
        const message = await Message.create({
          room: roomId,
          sender: userId,
          content
        });

        const populatedMessage = await message.populate("sender", "name avatar");

        // Broadcast to everyone in the room
        io.to(roomId).emit("receive-message", populatedMessage);
      } catch (error) {
        console.error("Error saving room message:", error);
      }
    });

    // Send private message
    socket.on("send-private-message", async (data) => {
      try {
        const { receiverId, content } = data;
        
        // Store in DB always
        const privateMessage = await PrivateMessage.create({
          sender: userId,
          receiver: receiverId,
          content
        });

        const populatedMessage = await privateMessage.populate("sender", "name avatar");

        // Check if receiver is online
        const receiverSocketId = onlineUsers.get(receiverId);
        
        if (receiverSocketId) {
          // Send instantly to receiver
          io.to(receiverSocketId).emit("receive-private-message", populatedMessage);
        } else {
          // Receiver is offline. Here you could optionally trigger a Push Notification.
          console.log(`Receiver ${receiverId} is offline. Message saved in DB.`);
        }
        
        // Also send back to sender for their own UI update
        socket.emit("receive-private-message", populatedMessage);
      } catch (error) {
        console.error("Error saving private message:", error);
      }
    });

    // Typing Indicators
    socket.on("typing-start", (data) => {
      const { roomId, receiverId } = data;
      if (roomId) {
        socket.to(roomId).emit("user-typing", { userId, isTyping: true });
      } else if (receiverId) {
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("user-typing", { userId, isTyping: true });
        }
      }
    });

    socket.on("typing-stop", (data) => {
      const { roomId, receiverId } = data;
      if (roomId) {
        socket.to(roomId).emit("user-typing", { userId, isTyping: false });
      } else if (receiverId) {
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("user-typing", { userId, isTyping: false });
        }
      }
    });

    // Handle Disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${userId}`);
      // Remove from online map
      onlineUsers.delete(userId);
      // Broadcast offline status
      io.emit("user-offline", { userId });
    });
  });
};

module.exports = socketHandler;
