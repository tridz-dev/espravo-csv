const fs = require("fs");
const axios = require("axios")
const path = require("path")
const PROGRESS_FILE = 'progress.txt';
const FAILED_FILE = 'failed.txt';
const SUCCESS_FILE = "success.txt"
const Progress_bar = "uploads/process/product_add_progress.txt"
const CSV_Length = "uploads/process/csv_length.txt"
const ERROR_FILE = "error.txt"
const CREATE_URL = 'http://espfarnew.tridz.in/api/product/create';
const API_URL = "http://espfarnew.tridz.in"
let upload_dir = 'uploads/csv/';

class AddProduct {
    constructor(props) {
        // Read the contents of the JSON file
        const jsonData = fs.readFileSync("uploads/csv/output.json", 'utf-8');

        // Parse the JSON data into a JavaScript object
        this.csv = JSON.parse(jsonData);
    }
    async CreateProcess() {
        fs.writeFileSync(CSV_Length, `${this.csv.length}`);
        let create_promises = this.csv.map((data, index) => {
            return new Promise((resolve1, reject1) => {
                this.Create(data)
                    .then(res => {
                        fs.appendFileSync(SUCCESS_FILE, `${index + 1}\n`);
                        this.csv.splice(index, 1)
                    })
                    .catch(err => {
                        fs.appendFileSync(FAILED_FILE, `${index + 1}\n`);
                    })
                    .finally(res => {
                        fs.writeFileSync(PROGRESS_FILE, `${index + 1}\n`);
                        if (fs.readFileSync(`${Progress_bar}`, 'utf-8')) {
                            fs.appendFileSync(`${Progress_bar}`, `,${index}`)
                        }
                        else {
                            fs.appendFileSync(`${Progress_bar}`, `${index}`)
                        }
                        resolve1(`${index + 1} done`)
                    })
            })
        })
        Promise.all(create_promises)
            .then(final => {
                fs.writeFile(`${upload_dir}output.json`, JSON.stringify(this.csv), (err) => {
                    if (err) {
                        console.error(`Error on CSV update: ${err}`);
                    } else {
                        console.log(`CSV updated with row ${final[0]}`)
                    }
                });
            })
            .catch(err => {
                console.log("create Promise error", err)
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
                })
                .catch(err => {
                    fs.appendFileSync(ERROR_FILE, `error on create ${file_to_update.ITEM_NUMBER}:-${(err)}\n`);
                    reject(err)
                })
        })
    }
}
module.exports = AddProduct;