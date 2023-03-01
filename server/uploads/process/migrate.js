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
        const progress = fs.readFileSync("progress.txt", 'utf-8')
        // Parse the JSON data into a JavaScript object
        this.csv = JSON.parse(jsonData);
        this.base_url = "http://espfarnew.tridz.in";
        this.path = 'products/'
        this.final = []
        this.progress_text = progress
    }
    async UpdateDisable() {
        console.log("success")
        let items_per_page = 500
        axios.get(`${API_URL}/api/products/vendor?page=0&items_per_page=1`)
            .then(response => {
                let total_pages = Math.ceil(response.data.pager?.total_items / items_per_page)
                let total_product = response.data.pager?.total_items
                // let total_pages = 5
                // let total_product = 50
                // console.log(`total pages ${total_pages}`)
                // total pages calculated to fetch all data
                fs.writeFileSync("looplength.json", `${total_product}`)
                let product_promises = Array.apply(null, { length: total_pages })
                    .map((data, ind) => {
                        return new Promise((resolve, reject) => {
                            let split = this.progress_text.split(",")
                            if (split.length > 1 || split[0] <= ind) {
                                console.log("skipped", ind)
                                resolve(1)
                            }
                            else {
                                axios.get(`${API_URL}/api/products/vendor?page=${ind}&items_per_page=${items_per_page}`)
                                    .then(res => {
                                        let data = res?.data?.rows
                                        let single_loop = data.map((single, index) => {
                                            return new Promise((resolve1, reject1) => {
                                                // Checking csv for the product
                                                let find = this.csv.filter(x => x.ITEM_NUMBER == single.sku)
                                                let findIndex = this.csv.findIndex(x => x.ITEM_NUMBER == single.sku)
                                                if (find.length) {
                                                    fs.writeFile(PROGRESS_FILE, `${ind},${index + 1}`, (err) => {
                                                        if (err)
                                                            console.error(`error in writing progress ${err})`)
                                                    });
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
                                                    fs.writeFile(PROGRESS_FILE, `${ind},${index + 1}`, (err) => {
                                                        if (err)
                                                            console.error(`error in writing progress ${err})`)
                                                    });
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
                                                console.log("Error in single loop completed", err)
                                            })
                                    })
                                    .catch(err => {
                                        reject(err)
                                        console.log("error in response", err)
                                        // return err
                                    })
                            }
                        });
                    })
                Promise.all(product_promises)
                    .then(resp => {
                        //Adding remaining product from csv to backend After API loop completed
                        console.log("loop completed remaining length", this.csv.length)
                        fs.writeFileSync("csvlength.json", `${this.csv.length}`)
                        try {
                            let errorIndex = 0
                            fs.writeFile(PROGRESS_FILE, `1`, (err) => {
                                if (err)
                                    console.error(`error in writing progress ${err})`)
                            });
                            let complete = this.csv.map((data, index) => {
                                return new Promise((resolve1, reject1) => {
                                    fs.writeFile(PROGRESS_FILE, `${index + 1}`, (err) => {
                                        if (err)
                                            console.error(`error in writing progress ${err})`)
                                    });
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
                                    console.log("migrate process completed")
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