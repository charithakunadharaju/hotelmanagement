const mongoose = require('mongoose');

// Connect to MongoDB using Mongoose
mongoose.connect('mongodb://localhost:27017/mydatabase', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("Failed to connect to MongoDB", err));

// Define a Schema
const userSchema = new mongoose.Schema({
  name: String,
  age: Number,
  email: String
});

// Create a Model
const User = mongoose.model('User', userSchema);

 //Create a new user document
const newUser = new User({
  name: 'chandhu',
  age: 24,
  email: 'chandhu@example.com'
});

 //Save the new user to the database
newUser.save()
  .then(() => console.log("User created successfully"))
  .catch(err => console.error("Error creating user:", err));

// Async function to remove user by _id
async function removeUser(id) {
    const user = await User.findByIdAndDelete(id);
    console.log(user);
  }
  
  removeUser('678cd803d599142a59448e52'); 