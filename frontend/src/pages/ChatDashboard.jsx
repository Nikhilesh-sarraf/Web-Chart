import { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const ChatDashboard = () => {
  const { user, loading, logout } = useAuth();
  const { socket, onlineUsers } = useSocket();
  
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  
  // For typing indicator
  const [typingUsers, setTypingUsers] = useState({});
  let typingTimeout = useRef(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  // Load Rooms
  useEffect(() => {
    if (user) {
      axios.get('/api/rooms').then(res => setRooms(res.data)).catch(console.error);
    }
  }, [user]);

  // Handle Socket Events
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMsg = (msg) => {
      // Only append if it belongs to currently active room
      if (activeRoom && msg.room === activeRoom._id) {
        setMessages(prev => [...prev, msg]);
      }
    };

    const handleTyping = ({ userId, isTyping }) => {
      setTypingUsers(prev => ({
        ...prev,
        [userId]: isTyping
      }));
    };

    socket.on('receive-message', handleReceiveMsg);
    socket.on('user-typing', handleTyping);

    return () => {
      socket.off('receive-message', handleReceiveMsg);
      socket.off('user-typing', handleTyping);
    };
  }, [socket, activeRoom]);

  // Join Room
  const handleJoinRoom = async (room) => {
    try {
      setActiveRoom(room);
      // Join socket room
      socket?.emit('join-room', room._id);
      
      // Hit backend to join room in DB if not already member
      await axios.post('/api/rooms/join', { roomId: room._id });
      
      // Fetch old messages
      const res = await axios.get(`/api/messages/${room._id}`);
      setMessages(res.data);
    } catch (err) {
      console.error("Error joining room:", err);
    }
  };

  // Create Room
  const handleCreateRoom = async () => {
    const name = prompt("Enter room name:");
    if (!name) return;
    try {
      const res = await axios.post('/api/rooms/create', { name });
      setRooms(prev => [...prev, res.data]);
    } catch (err) {
      alert("Failed to create room. It might already exist.");
    }
  };

  // Delete Room
  const handleDeleteRoom = async (e, room) => {
    e.stopPropagation(); // prevent triggering handleJoinRoom
    if (!window.confirm(`Are you sure you want to delete the room "${room.name}"?`)) return;
    
    try {
      await axios.delete(`/api/rooms/${room._id}`);
      setRooms(prev => prev.filter(r => r._id !== room._id));
      if (activeRoom?._id === room._id) {
        setActiveRoom(null);
        setMessages([]);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete room");
    }
  };

  // Send Message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !activeRoom) return;

    socket.emit('send-message', {
      roomId: activeRoom._id,
      userId: user._id, // if available, or socket backend uses token decoded id
      content: inputValue
    });
    
    // Stop typing
    socket.emit('typing-stop', { roomId: activeRoom._id });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);

    setInputValue('');
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    
    // Typing logic
    if (activeRoom) {
      socket.emit('typing-start', { roomId: activeRoom._id });
      
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        socket.emit('typing-stop', { roomId: activeRoom._id });
      }, 1500);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="chat-layout">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div>
            <div style={{ fontWeight: '600' }}>{user.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>● Online</div>
          </div>
          <button className="btn" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', background: 'var(--bg-input)' }} onClick={logout}>
            Logout
          </button>
        </div>
        
        <div className="sidebar-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="section-title">Rooms</div>
            <button style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer' }} onClick={handleCreateRoom}>+ New</button>
          </div>
          
          {rooms.map(room => (
            <div 
              key={room._id} 
              className={`list-item ${activeRoom?._id === room._id ? 'active' : ''}`}
              onClick={() => handleJoinRoom(room)}
              style={{ justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span>#</span>
                <span style={{ fontWeight: '500' }}>{room.name}</span>
              </div>
              {room.createdBy === user._id && (
                <button 
                  onClick={(e) => handleDeleteRoom(e, room)}
                  style={{ 
                    background: 'none', border: 'none', color: 'var(--danger)', 
                    cursor: 'pointer', fontSize: '1.2rem', padding: '0 5px',
                    opacity: 0.7
                  }}
                  title="Delete Room"
                >
                  ×
                </button>
              )}
            </div>
          ))}

          <div className="section-title">Online Users</div>
          {onlineUsers.map(uId => {
             // In a real app we'd map this ID to a user object/name
             if (uId === user._id) return null; // don't show self
             return (
              <div key={uId} className="list-item">
                <div className="status-dot online"></div>
                <span>User {uId.slice(-4)}</span>
              </div>
             )
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-area">
        {activeRoom ? (
          <>
            <div className="chat-header">
              <h3 style={{ margin: 0 }}># {activeRoom.name}</h3>
            </div>
            
            <div className="message-list">
              {messages.map((msg, index) => {
                // Render System Messages
                if (msg.isSystem) {
                  return (
                    <div key={msg._id || index} style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.5rem 0' }}>
                      — {msg.content} —
                    </div>
                  );
                }

                const isSentByMe = msg.sender && typeof msg.sender === 'object' 
                  ? msg.sender._id === user._id 
                  : msg.sender === user._id;
                  
                const senderName = msg.sender?.name || 'Unknown';
                const timeString = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';
                
                return (
                  <div key={msg._id || index} className={`message ${isSentByMe ? 'sent' : 'received'}`}>
                    {!isSentByMe && <div className="message-sender">{senderName}</div>}
                    <div className="message-bubble">
                      {msg.content}
                      {timeString && (
                        <div style={{ fontSize: '0.65rem', opacity: 0.7, marginTop: '4px', textAlign: isSentByMe ? 'right' : 'left' }}>
                          {timeString}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {/* Typing Indicator */}
              {Object.values(typingUsers).some(isT => isT) && (
                <div className="typing-indicator">
                  <div className="dot"></div><div className="dot"></div><div className="dot"></div>
                  <span className="typing-text">Someone is typing</span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={handleSendMessage}>
              <input 
                type="text" 
                className="input-field" 
                placeholder={`Message #${activeRoom.name}`}
                value={inputValue}
                onChange={handleInputChange}
              />
              <button type="submit" className="btn">Send</button>
            </form>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Select a room to start chatting
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatDashboard;
