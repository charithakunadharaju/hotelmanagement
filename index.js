
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/playground')
  .then(() => console.log('connected to MongoDB...'))
  .catch(err => console.error('could not connect to MongoDB...', err)); //connecting to db

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  author: { type: String, required: true },
  tags: [String], // Array of strings
  date: { type: Date, default: Date.now },
  isPublished: Boolean
});// for data validation and for structure of data

const Course = mongoose.model('Course', courseSchema);

async function createCourse() {
  const course = new Course({
    name: 'mongodb Course',
    author: 'charitha',
    tags: ['javascript', 'frontend'],
    isPublished: true
  });
  
  const result = await course.save();
  console.log(result);
} //creating document 
createCourse();

async function getCourses(){
  const courses = await Course.find({author: 'charitha', isPublished: true})
  .limit(10)
  .sort({name:1,tags: 1});
  console.log(courses);
   
}//for reading a specific data

getCourses();

//async function updateCourse(id){
  //const course = await Course.findById(id);
//if(!course) return;
  //course.isPublished = true;
//course.author = 'Another Author';
  //const result = await course.save();
  //console.log(result);

//}
//updateCourse('678104d3a95e59cf7d67001c') // updating data




async function removeCourse(id){
  const course =  await Course.findByIdAndDelete(id);
  console.log(course);
}
removeCourse('678104d3a95e59cf7d67001c');

