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
const ReRun = require("./rerun_failed")
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
const csv = require('fast-csv');
const upload = multer({ storage: multer.memoryStorage() });
app.post('/upload', upload.single('jsonFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file was uploaded.');
  }
  const csvData = req.file.buffer.toString();
  const jsonData = [];
  csv.parseString(csvData, { headers: true })
    .on('data', (row) => {
      jsonData.push(row);
    })
    .on('end', () => {
      fs.writeFile(`${upload_dir}output.json`, JSON.stringify(jsonData, null, 2), (err) => {
        if (err) {
          console.error(err);
          res.status(500).send('Error while saving file');
        } else {
          res.send(`File was uploaded successfully to ${req.file.path}`);
        }
      });
    });
});
const Migrate = require("./uploads/process/migrate")
const MigrateProcess = new Migrate("http://localhost")
app.get('/migrate', async (req, res) => {
  if (!req) {
    return res.status(400).send('No file migrated.');
  }
  try {
    const data = MigrateProcess.UpdateDisable()
  } catch (error) {
    console.error("error is", error)
    res.status(500).send(error);
  }
  res.send("Successfull")
})
const Process = require("./uploads/process/progress")
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
router.post("/process", (req, res) => {
  try {
    Process.UpdateDisable(req.body)
      .then(response => {
        res.send(`done`)
      })
      .catch(err => {
        res.sendStatus(500);
      })
  }
  catch (error) {

  }
})
const AddProduct = require("./uploads/process/add_product")
const ProductAdd = new AddProduct("http://localhost")
app.get("/add_products", (req, res) => {
  if (!req)
    res.status(500).send("Something went wrong")
  try {
    const data = ProductAdd.CreateProcess()
    res.send("done")
  }
  catch (err) {

  }
})
app.get("/progress", (req, res) => {
  let loop = fs.readFileSync("looplength.json", "utf-8")
  let csv = fs.readFileSync("csvlength.json", "utf-8")
  let final = { "loop": loop, "csv": csv }
  fs.readFile("progress.txt", "utf-8", (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error reading data file');
    } else {
      console.log("progress data is", data)
      const final = { "loop": loop, "csv": csv, "data": data }
      res.json(final);
    }
  })
})
app.get('/rerun', (req, res) => {
  if (!req) {
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
  let delete_path = `${upload_dir}output.json`;
  fs.unlink(delete_path, (err) => {
    if (err) {
      console.log(err);
      return res.status(500).send('Error deleting file');
    }
    res.send('File deleted successfully');
  });

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