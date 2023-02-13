const axios = require("axios")
const fs = require('fs');
// Define the class
class Items {
  constructor(name) {
    this.base_url = "http://espfarnew.tridz.in";
    this.path = 'products/'
    this.final = []
  }

  fetchItems() {
    axios.get(`${this.base_url}/api/products/vendor?page=0&items_per_page=1`)
      .then(response => {
        let total_pages = Math.ceil(response.data.pager?.total_items / 500)
        //total pages calculated to fetch all data
        let product_promises = Array.apply(null, { length: total_pages })
          .map((data, ind) => {
            return new Promise((resolve) => {
              axios.get(`${this.base_url}/api/products/vendor?page=${ind}&items_per_page=500`)
                .then(res => {
                  let data = res?.data?.rows
                  resolve(data)
                })
                .catch(err => {
                  if (ind == 1)
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
      })
      .catch(error => {
        console.log(error);
      });
  }
}

// Export the class
module.exports = Items;