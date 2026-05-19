const Room = require("../model/Room");
const Message = require("../model/Message");

const createRoom = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Room name is required" });

    const existingRoom = await Room.findOne({ name });
    if (existingRoom) return res.status(400).json({ message: "Room already exists" });

    const newRoom = await Room.create({
      name,
      members: [req.user.id],
      createdBy: req.user.id
    });
    res.status(201).json(newRoom);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const joinRoom = async (req, res) => {
  try {
    const { roomId } = req.body;
    const room = await Room.findById(roomId);
    
    if (!room) return res.status(404).json({ message: "Room not found" });

    if (!room.members.includes(req.user.id)) {
      room.members.push(req.user.id);
      await room.save();
    }
    res.json({ message: "Joined room successfully", room });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findById(roomId);
    
    if (!room) return res.status(404).json({ message: "Room not found" });

    // Check if the user is the creator
    if (room.createdBy && room.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "You are not authorized to delete this room" });
    }

    // Delete associated messages
    await Message.deleteMany({ room: roomId });

    // Delete the room
    await Room.findByIdAndDelete(roomId);

    res.json({ message: "Room deleted successfully", roomId });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { createRoom, getAllRooms, joinRoom, deleteRoom };
