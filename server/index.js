var express = require('express');
var PORT = 3000;
var multer = require('multer');
var path = require('path');
var fs = require('fs');
const cors = require('cors');
// Import Items Class
const Items = require('./items.js');

// Initiate Items Class
const itemHandler = new Items("http://localhost");
 

// Initiate Express App
var app = express();
app.use(cors({ origin: '*' }));

//Upload directory
let upload_dir = 'uploads/csv/';

// Default CSV file
let csv_name = 'current.csv'

// Initiate router
var router = express.Router();


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, upload_dir);
    },
    filename: (req, file, cb) => {
     var timestamp = new Date().getTime();
        cb(null, csv_name);
     // upload preserving filename and add a timestamp.
     // cb(null, file.originalname + '-' + timestamp + path.extname(file.originalname));
    }
  });
  const upload = multer({ storage });
  
  app.post('/upload', upload.single('jsonFile'), (req, res) => {
    if (!req.file) {
      return res.status(400).send('No file was uploaded.');
    }
  
    res.send(`File was uploaded successfully to ${req.file.path}`);
  });
  
router.get('/delete', function (req, res, next) {
    let delete_path = `${upload_dir}${csv_name}`;
    fs.unlink(delete_path, (err) => {
        if (err) {
            console.log(err);
          return res.status(500).send('Error deleting file');
        }    
        res.send('File deleted successfully');
      });

})


// Ping route
router.get('/ping', function (req, res, next) {
    console.log("Router Working");
    res.send('Pong, pong.. ');
    res.end();
})

router.get('/items', function (req, res, next) {
    console.log("Router Working");
    console.log(itemHandler.fetchItems());
    res.end();
})

// Base route
router.get('/', function (req, res, next) {
    console.log("Router Working");
    res.end();
})

app.use(router);


app.listen(PORT, function (err) {
    if (err) console.log(err);
    console.log("Server listening on PORT", PORT);

});