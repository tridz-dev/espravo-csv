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
const Process = require("./Process_env")
const Process_env = new Process("http://localhost")
const ReRun  = require("./rerun_failed")
const RerunFailed = new ReRun("http://localhost")

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

app.get('/migrate', (req, res) => {
  if (!req) {
    return res.status(400).send('No file migrated.');
  }
  Process_env.processCsv()
  res.send("File is spliting")
})

app.get('/rerun',(req,res)=>{
  if(!req){
    return res.status(400).send('No file was uploaded.');
  }

})

const API_URL = 'http://espfarnew.tridz.in/api/product/create';
const axios = require("axios")
app.get("/single_upload", (req, res) => {
  if (!req) {
    return res.status(400).send('No file was uploaded.');
  }
  let datas = {
    "product_name": "Product5",
    "sku": "1234",
    "weight": 200,
    "data": {
      "price": "100",
      "vendor": "Tridz",
      "artist": ["Eminem", "BigB", "Islo"],
      "available": 2,
      "collections": ["Paris Art", "French Modern"],
      "colour": "Black",
      "custom_filters": "Mega Filter",
      "favourite": 1,
      "image_id": 2546,
      "image_type": 2,
      "keyword": ["Featured", "Top 10", "Trending"],
      "max_height": 250,
      "max_width": 250,
      "orientation": "Landscape",
      "publisher_id": 1562,
      "publisher_name": "Penguin",
      "media": "",
      "weight": ""
    }
  }
  try {
    axios.post(API_URL, datas)
      .then(res => {
        console.log("response detected", res.data)
      })
      .catch(err => {
        console.error("error on axios", err)
      })
  }
  catch (error) {
    console.error("response failed", error)
  }
  // let final = response.json()
  // console.log("final response", final)
  res.send("upload success")
})

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