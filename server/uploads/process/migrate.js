const fs = require("fs");
const axios = require("axios")
const path = require("path")
const PROGRESS_FILE = 'progress.txt';
const FAILED_FILE = 'failed.txt';
const SUCCESS_FILE = "success.txt"
const SUCCESS_DETAIL = "success_details.txt"
const ERROR_FILE = "error.txt"
const API_URL = "https://esp-be.tridz.in"
const CREATE_URL = 'https://esp-be.tridz.in/api/product/create';
const UPDATE_URL = "https://esp-be.tridz.in/api/product/update"
const DISABLE_URL = "https://esp-be.tridz.in/api/product/disable"
const Progressstream = fs.createWriteStream('progress.txt', { flags: 'w' });
const failStream = fs.createWriteStream('failed.txt', { flags: 'a' });
const successStream = fs.createWriteStream('success.txt', { flags: 'a' });
const successDetailStream = fs.createWriteStream('success_details.txt', { flags: 'a' });
const Errorstream = fs.createWriteStream('error.txt', { flags: 'a' });

class Migrate {
    constructor(name) {
        // Read the contents of the JSON file
        // const jsonData = fs.readFileSync("uploads/csv/output.json", 'utf-8');
        const progress = fs.readFileSync("progress.txt", 'utf-8')
        // Parse the JSON data into a JavaScript object
        this.csv = []
        this.base_url = "https://esp-be.tridz.in";
        this.path = 'products/'
        this.final = []
        this.progress_text = progress
        this.shouldStop = false
    }
    async UpdateDisable() {
        console.log("success")
        const jsonData = fs.readFileSync("uploads/csv/output.json", 'utf-8');
        this.csv = JSON.parse(jsonData)
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
                            console.log("split is", split)
                            if ((split.length > 1 && ind > split[0] || split[0] === "") && !this.shouldStop) {
                                axios.get(`${API_URL}/api/products/vendor?page=${ind}&items_per_page=${items_per_page}`)
                                    .then(res => {
                                        let data = res?.data?.rows
                                        let single_loop = data.map((single, index) => {
                                            return new Promise((resolve1, reject1) => {
                                                try {
                                                    if (Progressstream.writable) {
                                                        Progressstream.write(`${ind},${index + 1}`);
                                                    }
                                                    Progressstream.close()
                                                }
                                                catch (err) {

                                                }
                                                // Checking csv for the product
                                                let find = this.csv.filter(x => x.ITEM_NUMBER == single.sku)
                                                let findIndex = this.csv.findIndex(x => x.ITEM_NUMBER == single.sku)
                                                if (find.length) {
                                                    // if found update product in backend
                                                    this.Update(single, find[0])
                                                        .then(res => {
                                                            this.csv.splice(findIndex, 1)
                                                            successStream.write(`success in ${ind},${index + 1}\n`);
                                                        })
                                                        .catch(err => {
                                                            failStream.write(`${ind},${index + 1}\n`);
                                                            // console.log("call error in update is", err)
                                                        })
                                                        .finally(res => {
                                                            resolve1(`${ind},${index + 1}`)
                                                        })
                                                }
                                                else {
                                                    // else disable product in backend
                                                    this.Disable(single)
                                                        .then(res => {
                                                            successStream.write(`success in ${ind},${index + 1}\n`);
                                                            this.csv.splice(findIndex, 1)
                                                        })
                                                        .catch(err => {
                                                            // console.log("call error in disable is", err)
                                                            failStream.write(`${ind},${index + 1}\n`);
                                                        })
                                                        .finally(res => {
                                                            resolve1(`${ind},${index + 1}`)
                                                        })
                                                }
                                            })
                                        })
                                        Promise.all(single_loop)
                                            .then(resolved => {
                                                console.log("Single loop completed", resolved[single_loop.length - 1])
                                                resolve(resolved)
                                            })
                                            .catch(err => {
                                                console.log("Error in single loop completed", err)
                                            })
                                    })
                                    .catch(err => {
                                        reject(err)
                                        // console.log("error in response", err)
                                        // return err
                                    })
                            }
                            else {
                                console.log("skipped", ind)
                                resolve(1)
                            }
                        });
                    })
                Promise.all(product_promises)
                    .then(resp => {
                        //Adding remaining product from csv to backend After API loop completed
                        const length = this.csv.length
                        console.log("loop completed remaining length", this.csv.length)
                        try {
                            if (Progressstream.writable) {
                                Progressstream.write(`0`);
                            }
                            Progressstream.close()
                        }
                        catch (err) {

                        }
                        fs.writeFileSync("csvlength.json", `${this.csv.length}`)
                        try {
                            let errorIndex = 0
                            if (Progressstream.writable) {
                                Progressstream.write(`1`);
                            }
                            Progressstream.close()
                            let complete = this.csv.map((data, index) => {
                                return new Promise((resolve1, reject1) => {
                                    if (!this.shouldStop) {
                                        try {
                                            if (Progressstream.writable) {
                                                Progressstream.write(`${index + 1}`);
                                            }
                                            Progressstream.close()

                                        }
                                        catch (err) {

                                        }
                                        this.Create(data)
                                            .then(res => {
                                                successStream.write(`${index + 1}\n`);
                                                this.csv.splice(index, 1)
                                            })
                                            .catch(err => {
                                                if (errorIndex == 0) {
                                                    // console.log("call error in create is", err)
                                                    errorIndex++
                                                }
                                                failStream.write(`${index + 1}\n`);
                                            })
                                            .finally(res => {
                                                resolve1(`${index + 1}`)
                                            })
                                    }
                                    else {
                                        resolve1("")
                                    }
                                })
                            })
                            Promise.all(complete)
                                .then((final) => {
                                    console.log("migrate process completed")
                                    try {
                                        if (Progressstream.writable) {
                                            Progressstream.write(`${length}`);
                                        }
                                        Progressstream.close()
                                    }
                                    catch (error) {

                                    }
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
                    successDetailStream.write(`success on update ${datas.sku} - ${datas.product_name}\n`)
                })
                .catch(err => {
                    Errorstream.write(`error on update ${file_to_update.ITEM_NUMBER}:-${(err)}\n`);
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
                    successDetailStream.write(`success on disable ${data.ITEM_NUMBER} - ${data.ITEM_NAME}\n`)
                })
                .catch(err => {
                    Errorstream.write(`error on disable ${data.variation_uuid}:-${(err)}\n`);
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
                    successStream.write(`${1}\n`);
                })
                .catch(err => {
                    Errorstream.write(`error on create ${file_to_update.ITEM_NUMBER}:-${(err)}\n`);
                    reject(err)
                })
        })
    }
    async stop() {
        this.shouldStop = true
    }
}
module.exports = Migrate;