const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { swaggerUi, swaggerSpec } = require('./swagger'); // Import Swagger

const app = express();
app.use(bodyParser.json());

// Swagger route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const JWT_SECRET = 'your_secret_key';

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/hotelManagementsystem')
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const User = mongoose.model('User', userSchema);

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

const Room = mongoose.model('Room', roomSchema);
const Reservation = mongoose.model('Reservation', reservationSchema);

// Auth Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// Root Route
app.get('/', (req, res) => {
  res.send('Welcome to the Hotel Management System API!');
});

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     tags: [auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: Lohith
 *               password:
 *                 type: Chandhu@28
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Username already exists
 *       500:
 *         description: Registration failed (server error)
 */
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: 'Username already exists' });

    const user = new User({ username, password });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err });
  }
});

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login a user
 *     tags: [auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: Rekha
 *               password:
 *                 type: Hari@28
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: Login successful
 *                 token:
 *                   type: 123
 *       400:
 *         description: Invalid credentials
 *       500:
 *         description: Login failed
 */

// Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Login successful', token });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err });
  }
});

// Initialize rooms 
async function initializeRooms() {
  const roomCount = await Room.countDocuments();
  if (roomCount === 0) {
    const roomTypes = ['1bhk', '2bhk', 'suite'];
    const prices = { '1bhk': 100, '2bhk': 150, 'suite': 200 };

    for (let i = 0; i < 10; i++) {
      for (let type of roomTypes) {
        const roomNumber = i + 1 + (roomTypes.indexOf(type) * 10);
        const room = new Room({ roomNumber, roomType: type, price: prices[type] });
        await room.save();
      }
    }
    console.log("Room inventory initialized with 30 rooms.");
  }
}
initializeRooms();

// Get available rooms
app.get('/rooms/available', async (req, res) => {
  try {
    const availableRooms = await Room.find({ status: 'available' });
    const summary = availableRooms.reduce((acc, room) => {
      if (!acc[room.roomType]) acc[room.roomType] = { count: 0, price: room.price };
      acc[room.roomType].count++;
      return acc;
    }, {});
    
    let response = '';
    for (let type in summary) {
      const { count, price } = summary[type];
      response += `No of rooms = ${count}, Type: ${type}, Price: ${price}, Status: Available\n`;
    }

    res.send(response);
  } catch (err) {
    res.status(500).send('Error fetching available rooms');
  }
});

// Get booked rooms
app.get('/rooms/booked', authenticateToken, async (req, res) => {
  try {
    const bookedRooms = await Reservation.find({ status: 'booked' });
    res.json(bookedRooms);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching booked rooms', error: err });
  }
});

// Reserve a room
app.post('/rooms/reserve', authenticateToken, async (req, res) => {
  const { customerName, roomNumber, startDate, endDate } = req.body;

  try {
    const room = await Room.findOne({ roomNumber, status: 'available' });
    if (!room) return res.status(400).json({ message: 'Room not available or already reserved' });

    const reservation = new Reservation({ customerName, roomNumber, startDate, endDate });
    await reservation.save();

    await Room.updateOne({ roomNumber }, { status: 'reserved' });

    res.status(201).json({ message: 'Room reserved successfully', reservation });
  } catch (err) {
    res.status(500).json({ message: 'Error reserving room', error: err });
  }
});

// Cancel a reservation
app.post('/rooms/cancel', authenticateToken, async (req, res) => {
  const { reservationId } = req.body;

  try {
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

    if (reservation.status === 'cancelled') {
      return res.status(400).json({ message: 'Reservation already cancelled' });
    }

    reservation.status = 'cancelled';
    await reservation.save();
    await Room.updateOne({ roomNumber: reservation.roomNumber }, { status: 'available' });

    res.json({ message: 'Reservation cancelled successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error cancelling reservation', error: err });
  }
});

// Add a new room
app.post('/rooms', authenticateToken, async (req, res) => {
  const { roomNumber, roomType, price } = req.body;

  try {
    const room = new Room({ roomNumber, roomType, price });
    await room.save();
    res.status(201).json({ message: 'Room added successfully', room });
  } catch (err) {
    res.status(500).json({ message: 'Error adding room', error: err });
  }
});

// Start Server
const port = 3001;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/api-docs`);
});
