// Import dependencies
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// Initialize Express app
const app = express();
const PORT = 3002;

// Middleware
app.use(bodyParser.json());

// MongoDB connection 
mongoose.connect('mongodb://localhost:27017/expense_tracker')
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// MongoDB Schema and Model for Expense
const expenseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
});

const Expense = mongoose.model('Expense', expenseSchema);

// Create a new expense
app.post('/api/expenses', async (req, res) => {
  try {
    const { title, amount, date } = req.body;

    const expense = new Expense({
      title,
      amount,
      date,
    });

    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all expenses
app.get('/api/expenses', async (req, res) => {
  try {
    const expenses = await Expense.find();
    res.json(expenses);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get a single expense by ID
app.get('/api/expenses/:id', async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.json(expense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update an expense by ID
app.put('/api/expenses/:id', async (req, res) => {
  try {
    const { title, amount, date } = req.body;
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      { title, amount, date },
      { new: true }
    );

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.json(expense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete an expense by ID
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Home Route
app.get('/', (req, res) => {
  res.send('Welcome to the Expense Tracker API!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
