const fs = require("fs");
const axios = require("axios")
const PROGRESS_FILE = 'progress.txt';
const FAILED_FILE = 'failed.txt';
const SUCCESS_FILE = "success.txt"
const ERROR_FILE = "error.txt"
const CREATE_URL = '/api/product/create';
const UPDATE_URL = "/api/product/update"
const DISABLE_URL = "/api/product/disable"
const API_URL = "http://espfarnew.tridz.in"
let upload_dir = 'uploads/csv/';

class Process {
    constructor(data) {
        console.log(data)
        // Read the contents of the JSON file
        const jsonData = fs.readFileSync("uploads/csv/output.json", 'utf-8');
        const progress = fs.readFileSync("uploads/process/progress.txt", 'utf-8')

        // Parse the JSON data into a JavaScript object
        this.csv = JSON.parse(jsonData);
        this.progress = progress
        this.data = data
    }
    static async UpdateDisable(data) {
        const thiss = new Process()
        console.log("progress txt", thiss.progress)
        if (!thiss.progress.includes(`${data.index}`)) {
            let promsie = data?.data.map((single, ind) => {
                return new Promise((resolve, reject) => {
                    let find = thiss.csv.filter(x => x.ITEM_NUMBER == single.sku)
                    let findIndex = thiss.csv.findIndex(x => x.ITEM_NUMBER == single.sku)
                    if (find.length) {
                        // if found update product in backend
                        thiss.Update(single, find[0])
                            .then(res => {
                                thiss.csv.splice(findIndex, 1)
                                fs.appendFileSync(SUCCESS_FILE, `success in ${ind}\n`);
                            })
                            .catch(err => {
                                fs.appendFileSync(FAILED_FILE, `${ind}\n`);
                                // console.log("call error in update is", err)
                            })
                            .finally(res => {
                                fs.writeFileSync(PROGRESS_FILE, `${ind}\n`);
                                resolve(data.index)
                            })
                    }
                    else {
                        // else disable product in backend

                        thiss.Disable(single)
                            .then(res => {
                                fs.appendFileSync(SUCCESS_FILE, `success in ${ind}\n`);
                                thiss.csv.splice(findIndex, 1)
                            })
                            .catch(err => {
                                // console.log("call error in disable is", err)
                                fs.appendFileSync(FAILED_FILE, `${ind}\n`);
                            })
                            .finally(res => {
                                fs.writeFileSync(PROGRESS_FILE, `${ind}\n`);
                                resolve(data.index)
                            })
                    }
                })
            })
            Promise.all(promsie)
                .then(async final => {
                    fs.writeFile(`${upload_dir}output.json`, JSON.stringify(thiss.csv), (err) => {
                        if (err) {
                            console.error(`Error on CSV update: ${err}`);
                        } else {
                            console.log(`CSV updated with row ${final[0]}`)
                        }
                    });
                    if (fs.readFileSync("uploads/process/progress.txt", 'utf-8')) {
                        fs.appendFileSync(`uploads/process/progress.txt`, `,${final[0]}`)
                        return true
                    }
                    else {
                        fs.appendFileSync(`uploads/process/progress.txt`, `${final[0]}`)
                        return true
                    }
                })
        }
        else {
            return true
        }
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
                console.log('Error in datas update', err)
            }
            axios.post(UPDATE_URL, datas)
                .then(resp => {
                    resolve(resp.data)
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
                })
                .catch(err => {
                    fs.appendFileSync(ERROR_FILE, `error on disable ${data.variation_uuid}:-${(err)}\n`);
                    reject(err)
                })
        })
    }
}
module.exports = Process;