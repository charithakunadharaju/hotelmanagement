const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/hotelManagementsystem', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

// Room Schema
const roomSchema = new mongoose.Schema({
  roomNumber: { type: Number, required: true, unique: true },
  roomType: { type: String, required: true, enum: ['1bhk', '2bhk', 'suite'] },
  price: { type: Number, required: true },
  status: { type: String, enum: ['available', 'booked', 'reserved'], default: 'available' }
});

// Reservation Schema
const reservationSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  roomNumber: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['booked', 'cancelled'], default: 'booked' }
});

// Models
const Room = mongoose.model('Room', roomSchema);
const Reservation = mongoose.model('Reservation', reservationSchema);

// Route for the root URL
app.get('/', (req, res) => {
  res.send('Welcome to the Hotel Management System API!');
});

//  rooms in inventory
async function initializeRooms() {
  const roomCount = await Room.countDocuments();
  if (roomCount === 0) {
    const roomTypes = ['1bhk', '2bhk', 'suite'];
    const prices = { '1bhk': 100, '2bhk': 150, 'suite': 200 };

    // Create 10 rooms for each type
    for (let i = 0; i < 10; i++) {
      for (let roomType of roomTypes) {
        const roomNumber = i + 1 + (roomTypes.indexOf(roomType) * 10); // Creating room numbers 1-10, 11-20, 21-30
        const room = new Room({
          roomNumber,
          roomType,
          price: prices[roomType]
        });
        await room.save();
      }
    }
    console.log("Room inventory initialized with 30 rooms.");
  }
}
initializeRooms();

// Route to get all available rooms
app.get('/rooms/available', async (req, res) => {
  try {
    const availableRooms = await Room.find({ status: 'available' });
    res.json(availableRooms);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching available rooms', error: err });
  }
});

// Route to get all booked room details
app.get('/rooms/booked', async (req, res) => {
  try {
    const bookedRooms = await Reservation.find({ status: 'booked' }).populate('roomNumber');
    res.json(bookedRooms);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching booked room details', error: err });
  }
});

// Route to reserve a room
app.post('/rooms/reserve', async (req, res) => {
  const { customerName, roomNumber, startDate, endDate } = req.body;

  try {
    // Check if the room is available
    const room = await Room.findOne({ roomNumber, status: 'available' });
    if (!room) {
      return res.status(400).json({ message: 'Room not available or already reserved' });
    }

    // Create reservation
    const reservation = new Reservation({
      customerName,
      roomNumber,
      startDate,
      endDate,
    });

    await reservation.save();

    // Update room status to 'reserved'
    await Room.updateOne({ roomNumber }, { status: 'reserved' });

    res.status(201).json({ message: 'Room reserved successfully', reservation });
  } catch (err) {
    res.status(500).json({ message: 'Error reserving room', error: err });
  }
});

// Route to cancel a reservation
app.post('/rooms/cancel', async (req, res) => {
  const { reservationId } = req.body;

  try {
    const reservation = await Reservation.findById(reservationId);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    
    if (reservation.status === 'cancelled') {
        return res.status(400).json({ message: 'Reservation is already cancelled' });
      }

    reservation.status = 'cancelled';
    await reservation.save();

    // Update room status to 'available'
    await Room.updateOne({ roomNumber: reservation.roomNumber }, { status: 'available' });

    res.json({ message: 'Reservation cancelled successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error cancelling reservation', error: err });
  }
});

// Route to add a new room
app.post('/rooms', async (req, res) => {
  const { roomNumber, roomType, price } = req.body;

  try {
    const room = new Room({
      roomNumber,
      roomType,
      price
    });

    await room.save();
    res.status(201).json({ message: 'Room added successfully', room });
  } catch (err) {
    res.status(500).json({ message: 'Error adding room', error: err });
  }
});


// Start server
const port = 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
