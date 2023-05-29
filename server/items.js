const axios = require("axios")
const fs = require('fs');
// Define the class

const Migrate = require("./uploads/process/migrate")
const MigrateProcess = new Migrate("http://localhost")
const failStream = fs.createWriteStream('failedduplicate.txt', { flags: 'a' });
const successStream = fs.createWriteStream('successduplicate.txt', { flags: 'a' });

const successDetailStream = fs.createWriteStream('successduplicate_details.txt', { flags: 'a' });
const Errorstream = fs.createWriteStream('errorduplicate.txt', { flags: 'a' });
const queue = [];
const DISABLE_URL = "https://esp-be.tridz.in/api/product/disable"

class Items {
  constructor(name) {
    this.base_url = "https://esp-be.tridz.in";
    this.path = 'products/'
    this.final = []
  }

  fetchItems() {
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
    axios.get(`${this.base_url}/api/products/vendor?page=0&items_per_page=1`)
      .then(response => {
        let total_pages = Math.ceil(response.data.pager?.total_items / 500)
        //total pages calculated to fetch all data
        let product_promises = Array.apply(null, { length: total_pages })
          .map((data, ind) => {
            return new Promise((resolve, reject) => {
              axios.get(`${this.base_url}/api/products/vendor?page=${ind}&items_per_page=500`)
                .then(res => {
                  let data = res?.data?.rows
                  resolve(data)
                })
                .catch(err => {
                  reject(err)
                  console.log("error in response", err)
                })
            });
          })
        Promise.all(product_promises)
          .then(resp => {
            let data = resp.flat(1)
            console.log("total products", data.length)
            let dataString = JSON.stringify(data)
            fs.writeFile(`${this.path}data.json`, dataString, (err) => {
              if (err) throw err;
              console.log('Data written to file');
            })
          })
          .catch(err => {
            console.log("error in fetch data", err)
          })
      })
      .catch(error => {
        console.log(error);
      });
  }
  async DuplicateDisable() {
    let array = fs.readFileSync("products/data.json", 'utf-8');
    let data = JSON.parse(array)
    let duplicates = [];
    let skuCounts = {};
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
    data.forEach((item) => {
      let sku = item.sku;
      skuCounts[sku] = (skuCounts[sku] || 0) + 1;
      if (skuCounts[sku] === 2) {
        duplicates.push(sku);
      }
    });
    console.log("duplicate length", duplicates.length)
    let promises = duplicates.map((data, index) => {
      new Promise((resolve, reject) => {
        let single = { variation_uuid: data }
        this.addToQueue({ single, index, index, resolve });
      })
    })
    Promise.all(promises)
      .then(res => {
        console.log("completed duplicate disable")
      })
  }
  addToQueue(item) {
    queue.push(item);
    if (queue.length === 1) {
      // If the queue was previously empty, start processing it
      this.processQueue();
    }
  }
  async processQueue() {
    const item = queue[0];
    const { single, ind, index, resolve } = item;
    this.Disable(single)
      .then(res => {
        successStream.write(`${index}\n`);
      })
      .catch(err => {
        // console.log("call error in disable is", err)
        failStream.write(`${index}\n`);
      })
      .finally(res => {
        // Remove the item from the queue and process the next item
        queue.shift();
        if (queue.length) {
          this.processQueue();
        }
        resolve(`${index}`)
      })
  }
  async Disable(data) {
    return new Promise((resolve, reject) => {
      let datas = {
        "variation_id": data.variation_uuid
      }
      axios.post(DISABLE_URL, datas)
        .then(resp => {
          resolve(resp.data)
          successDetailStream.write(`success on disable ${data.sku} - ${data.product}\n`)
        })
        .catch(err => {
          Errorstream.write(`error on disable ${data.variation_uuid}:-${(err)}\n`);
          reject(err)
        })
    })
  }
}


// Export the class
module.exports = Items;