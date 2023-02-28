const fs = require("fs");
const axios = require("axios")
const path = require("path")
const PROGRESS_FILE = 'progress.txt';
const FAILED_FILE = 'failed.txt';
const SUCCESS_FILE = "success.txt"
const SUCCESS_DETAIL = "success_details.txt"
const ERROR_FILE = "error.txt"
const CREATE_URL = 'http://espfarnew.tridz.in/api/product/create';
const UPDATE_URL = "http://espfarnew.tridz.in/api/product/update"
const DISABLE_URL = "http://espfarnew.tridz.in/api/product/disable"
const API_URL = "http://espfarnew.tridz.in"

class Migrate {
    constructor(name) {
        // Read the contents of the JSON file
        const jsonData = fs.readFileSync("uploads/csv/output.json", 'utf-8');

        // Parse the JSON data into a JavaScript object
        this.csv = JSON.parse(jsonData);
        this.base_url = "http://espfarnew.tridz.in";
        this.path = 'products/'
        this.final = []
    }
    async UpdateDisable() {
        console.log("success")
        axios.get(`${API_URL}/api/products/vendor?page=0&items_per_page=1`)
            .then(response => {
                let total_pages = Math.ceil(response.data.pager?.total_items / 500)
                // console.log(`total pages ${total_pages}`)
                // total pages calculated to fetch all data
                let product_promises = Array.apply(null, { length: total_pages })
                    .map((data, ind) => {
                        return new Promise((resolve, reject) => {
                            axios.get(`${API_URL}/api/products/vendor?page=${ind}&items_per_page=500`)
                                .then(res => {
                                    let data = res?.data?.rows
                                    let single_loop = data.map((single, index) => {
                                        return new Promise((resolve1, reject1) => {
                                            // Checking csv for the product
                                            let find = this.csv.filter(x => x.ITEM_NUMBER == single.sku)
                                            let findIndex = this.csv.findIndex(x => x.ITEM_NUMBER == single.sku)
                                            if (find.length) {
                                                fs.writeFileSync(PROGRESS_FILE, `${ind},${index + 1}\n`);
                                                // if found update product in backend
                                                this.Update(single, find[0])
                                                    .then(res => {
                                                        this.csv.splice(findIndex, 1)
                                                        fs.appendFileSync(SUCCESS_FILE, `success in ${ind},${index + 1}\n`);
                                                    })
                                                    .catch(err => {
                                                        fs.appendFileSync(FAILED_FILE, `${ind},${index + 1}\n`);
                                                        // console.log("call error in update is", err)
                                                    })
                                                    .finally(res => {
                                                        resolve1(`${ind},${index + 1} done`)
                                                    })
                                            }
                                            else {
                                                // else disable product in backend
                                                fs.writeFileSync(PROGRESS_FILE, `${ind},${index + 1}\n`);
                                                this.Disable(single)
                                                    .then(res => {
                                                        fs.appendFileSync(SUCCESS_FILE, `success in ${ind},${index + 1}\n`);
                                                        this.csv.splice(findIndex, 1)
                                                    })
                                                    .catch(err => {
                                                        // console.log("call error in disable is", err)
                                                        fs.appendFileSync(FAILED_FILE, `${ind},${index + 1}\n`);
                                                    })
                                                    .finally(res => {
                                                        resolve1(`${ind},${index + 1} done`)
                                                    })
                                            }
                                        })
                                    })
                                    Promise.all(single_loop)
                                        .then(resolved => {
                                            console.log("Single loop completed")
                                            resolve(resolved)
                                        })
                                        .catch(err => {
                                            console.log("Error in single loop completed",err)
                                        })
                                })
                                .catch(err => {
                                    reject(err)
                                    console.log("error in response", err)
                                    // return err
                                })
                        });
                    })
                Promise.all(product_promises)
                    .then(resp => {
                        //Adding remaining product from csv to backend After API loop completed
                        console.log("loop completed remaining length", this.csv.length)
                        try {
                            let errorIndex = 0
                            let complete = this.csv.map((data, index) => {
                                return new Promise((resolve1, reject1) => {
                                    fs.writeFileSync(PROGRESS_FILE, `${index + 1}\n`);
                                    this.Create(data)
                                        .then(res => {
                                            fs.appendFileSync(SUCCESS_FILE, `${index + 1}\n`);
                                            this.csv.splice(index, 1)
                                        })
                                        .catch(err => {
                                            if (errorIndex == 0) {
                                                // console.log("call error in create is", err)
                                                errorIndex++
                                            }
                                            fs.appendFileSync(FAILED_FILE, `${index + 1}\n`);
                                        })
                                        .finally(res => {
                                            resolve1(`${index + 1} done`)
                                        })
                                })
                            })
                            Promise.all(complete)
                                .then((final) => {
                                    return "completed"
                                })
                                .catch(err => {
                                    console.log(`final error is${err}`)
                                })
                        }
                        catch (err) {
                            console.log("loop completed error", err)
                        }
                    })
                    .catch(err => {
                        console.log("error in fetch data", err)
                    })
            })
            .catch(error => {
                console.log(error);
                return false
            });
    }
    async Update(data, file_to_update) {
        return new Promise((resolve, reject) => {
            let datas
            // console.log(`calling update with data: ${file_to_update.ITEM_NUMBER},${data.variation_uuid}`)
            try {
                let category = []
                for (const key in file_to_update) {
                    if (key.includes("CATEGORY") && file_to_update[key] !== "") {
                        category.push(file_to_update[key]);
                    }
                }
                datas = {
                    "product_name": file_to_update.ITEM_NAME,
                    "sku": file_to_update.ITEM_NUMBER,
                    "variation_id": data.variation_uuid,
                    "weight": 200,
                    "data": {
                        "price": "0",
                        "vendor": "Tridz",
                        "artist": [`${file_to_update.ARTIST}`],
                        "available": file_to_update.AVAILABLE,
                        "collections": category,
                        "favourite": 0,
                        "image_id": file_to_update.IMAGE_ID,
                        "image_type": file_to_update.IMAGE_TYPE,
                        "keyword": file_to_update.KEYWORD.split("|"),
                        "max_height": file_to_update.MAX_HEIGHT,
                        "max_width": file_to_update.MAX_WIDTH,
                        "orientation": file_to_update.ORIENTATION,
                        "publisher_id": file_to_update.PUBLISHER_ID,
                        "publisher_name": file_to_update.PUBLISHER_NAME,
                        "media": "",
                        "weight": ""
                    }
                }
            }
            catch (err) {
                console.log('Error in datas update', err)
            }
            axios.post(UPDATE_URL, datas)
                .then(resp => {
                    resolve(resp.data)
                    fs.appendFileSync(SUCCESS_DETAIL, `success on update ${datas.sku} - ${datas.product_name}\n`)
                })
                .catch(err => {
                    fs.appendFileSync(ERROR_FILE, `error on update ${file_to_update.ITEM_NUMBER}:-${(err)}\n`);
                    reject(err)
                })
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
                    fs.appendFileSync(SUCCESS_DETAIL, `success on disable ${data.ITEM_NUMBER} - ${data.ITEM_NAME}\n`)
                })
                .catch(err => {
                    fs.appendFileSync(ERROR_FILE, `error on disable ${data.variation_uuid}:-${(err)}\n`);
                    reject(err)
                })
        })
    }
    async Create(file_to_update) {
        return new Promise((resolve, reject) => {
            let datas
            try {
                let category = []
                for (const key in file_to_update) {
                    if (key.includes("CATEGORY") && file_to_update[key] !== "") {
                        category.push(file_to_update[key]);
                    }
                }
                datas = {
                    "product_name": file_to_update.ITEM_NAME,
                    "sku": file_to_update.ITEM_NUMBER,
                    "weight": 200,
                    "data": {
                        "price": "0",
                        "vendor": ["Tridz"],
                        "artist": file_to_update.ARTIST ? [`${file_to_update.ARTIST}`] : [],
                        "available": file_to_update.AVAILABLE,
                        "collections": category,
                        "favourite": 0,
                        "image_id": file_to_update.IMAGE_ID,
                        "image_type": file_to_update.IMAGE_TYPE,
                        "keyword": file_to_update.KEYWORD.split("|"),
                        "max_height": file_to_update.MAX_HEIGHT,
                        "max_width": file_to_update.MAX_WIDTH,
                        "orientation": file_to_update.ORIENTATION ? [`${file_to_update.ORIENTATION}`] : [],
                        "publisher_id": file_to_update.PUBLISHER_ID,
                        "publisher_name": file_to_update.PUBLISHER_NAME,
                        "media": "",
                        "weight": ""
                    }
                }
            }
            catch (err) {
                console.log('Error in datas', err)
            }

            axios.post(CREATE_URL, datas)
                .then(resp => {
                    resolve(resp.data)
                    fs.appendFileSync(SUCCESS_FILE, `${1}\n`);
                })
                .catch(err => {
                    fs.appendFileSync(ERROR_FILE, `error on create ${file_to_update.ITEM_NUMBER}:-${(err)}\n`);
                    reject(err)
                })
        })
    }
}
module.exports = Migrate;