const fs = require("fs");
const axios = require("axios")
const API_URL = "https://esp-be.hzdev.tridz.in"
const ENABLE_URL = "/api/product/enable"
const CREATE_URL = "/api/product/create";
const UPDATE_URL = "/api/product/update"
const DISABLE_URL = "/api/product/disable"
const Progressstream = fs.createWriteStream('progress.txt', { flags: 'a' });
const failStream = fs.createWriteStream('failed.txt', { flags: 'a' });
const successStream = fs.createWriteStream('success.txt', { flags: 'a' });
const successIdStream = fs.createWriteStream("success_id.txt", { flags: "a" })
const successDetailStream = fs.createWriteStream('success_details.txt', { flags: 'a' });
const Errorstream = fs.createWriteStream('error.txt', { flags: 'a' });
const queue = [];
const create_queue = [];
class Migrate {
    constructor(name) {
        // Read the contents of the JSON file
        // const jsonData = fs.readFileSync("uploads/csv/output.json", 'utf-8');
        const progress = fs.readFileSync("progress.txt", 'utf-8')
        // Parse the JSON data into a JavaScript object
        this.csv = []
        this.progress_ids = []
        this.base_url = "https://esp-be.hzdev.tridz.in";
        this.path = 'products/'
        this.final = []
        this.progress_text = progress
        this.shouldStop = false
    }
    // Add a new item to the queue
    async UpdateDisable() {
        console.log("success")
        try {

            const jsonData = fs.readFileSync("uploads/csv/output.json", 'utf-8');
            this.csv = JSON.parse(jsonData)
        }
        catch (err) {
            console.error("CSV file not found:", err)
        }
        console.log("csv uploaded", this.csv.length)
        let items_per_page = 500
        // process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
        axios.get(`${API_URL}/api/products/vendor?page=0&items_per_page=1`,
            {
                headers: {
                    'Authorization': 'Basic YWRtaW46SGFsZi1DYXhuLVByZWNpb3VzLUNvbnF1ZXJ4ci02',
                }
            }
        )
            .then(response => {
                let total_pages = Math.ceil(response.data.pager?.total_items / items_per_page)
                let total_product = response.data.pager?.total_items
                // let total_pages = 2
                // let total_product = 50
                // console.log(`total pages ${total_pages}`)
                // total pages calculated to fetch all data
                fs.writeFileSync("looplength.json", `${total_product}`)
                let product_promises = Array.apply(null, { length: total_pages })
                    .map((data, ind) => {
                        return new Promise((resolve, reject) => {
                            let progress = fs.readFileSync("progress.txt", 'utf-8')
                            let progress_ids = fs.readFileSync("success_id.txt", "utf-8")
                            this.progress_ids = progress_ids.split("\n")
                            let split_data = progress.split(";").length > 1 ? progress.split(";")[progress.split(";").length - 2] : ""
                            let split = split_data.split(",")
                            console.log("split is", split)
                            if ((split.length > 1 && ind > split[0] || split[0] === "") && !this.shouldStop) {
                                axios.get(`${API_URL}/api/products/vendor?page=${ind}&items_per_page=${items_per_page}`,
                                    {
                                        headers: {
                                            'Authorization': 'Basic YWRtaW46SGFsZi1DYXhuLVByZWNpb3VzLUNvbnF1ZXJ4ci02',
                                        }
                                    }
                                )
                                    .then(res => {
                                        let data = res?.data?.rows
                                        // console.log("rows", data)
                                        let single_loop = data.map((single, index) => {
                                            return new Promise((resolve1, reject1) => {
                                                if (this.progress_ids.includes(single.sku)) {
                                                    resolve1(`${ind},${index + 1}`)
                                                }
                                                else {
                                                    //check product is in CSV
                                                    let find = this.csv.filter(x => x.ITEM_NUMBER == single.sku);
                                                    let findIndex = this.csv.findIndex(x => x.ITEM_NUMBER == single.sku);
                                                    if (!this.shouldStop) {
                                                        if (find.length) {
                                                            // if found enable product if in disabled or archived state
                                                            if (single.variation_status == "False" || single.archived == "True") {
                                                                this.addToQueue({ single, ind, index, resolve1 });
                                                            }
                                                            else {
                                                                this.csv.splice(findIndex, 1);
                                                                resolve1(`${ind},${index + 1}`);
                                                                successStream.write(`${ind},${index + 1}\n`);
                                                                Progressstream.write(`${ind},${index + 1};`)
                                                                successIdStream.write(`${single.sku}\n`);
                                                            }
                                                        }
                                                        else {
                                                            // else disable product in backend
                                                            if (single.archived == "True") {
                                                                // avoid already disabled product
                                                                successStream.write(`${ind},${index + 1}\n`);
                                                                Progressstream.write(`${ind},${index + 1};`)
                                                                successIdStream.write(`${single.sku}\n`);
                                                                resolve1(`${ind},${index + 1}`);
                                                            }
                                                            else {
                                                                this.addToQueue({ single, ind, index, resolve1 });
                                                            }
                                                        }
                                                    }
                                                }
                                            })
                                        })
                                        Promise.all(single_loop)
                                            .then(resolved => {
                                                console.log("Single loop completed", resolved[single_loop.length - 1])
                                                resolve(resolved)
                                            })
                                            .catch(err => {
                                                console.error("Error in single loop completed", err)
                                            })
                                    })
                                    .catch(err => {
                                        reject(err)
                                        console.error("error in get", err)
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
                            Progressstream.write(`0;`, (err) => {
                                if (err) {
                                    console.error('Error writing to stream:', err);
                                }
                            });
                        }
                        catch (err) {

                        }
                        fs.writeFileSync("csvlength.json", `${this.csv.length}`)
                        try {
                            let errorIndex = 0
                            let complete = this.csv.map((data, index) => {
                                return new Promise((resolve1, reject1) => {
                                    if (!this.shouldStop) {
                                        this.addToCreateQueue({ data, index, resolve1 });
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
                                        Progressstream.write(`${length};`, (err) => {
                                            if (err) {
                                                console.error('Error writing to stream:', err);
                                            }
                                        });
                                    }
                                    catch (error) {

                                    }
                                    return "completed"
                                })
                                .catch(err => {
                                    console.error(`final error is${err}`)
                                })
                        }
                        catch (err) {
                            console.log("loop completed error", err)
                        }
                    })
                    .catch(err => {
                        console.error("error in fetch data", err)
                    })
            })
            .catch(error => {
                console.error(error);
                return false
            });
    }
    async processQueue() {
        const item = queue[0];
        const { single, ind, index, resolve1 } = item;
        // Checking csv for the product
        let find = this.csv.filter(x => x.ITEM_NUMBER == single.sku);
        let findIndex = this.csv.findIndex(x => x.ITEM_NUMBER == single.sku);
        if (!this.shouldStop) {
            if (find.length) {
                //if found and archived enable product
                this.csv.splice(findIndex, 1);
                this.Enable(single)
                    .then(res => {
                        successStream.write(`${ind},${index + 1}\n`);
                        successIdStream.write(`${single.sku}\n`);
                    })
                    .catch(err => {
                        failStream.write(`${ind},${index + 1}\n`);
                    })
                    .finally(res => {
                        Progressstream.write(`${ind},${index + 1};`)
                        resolve1(`${ind},${index + 1}`);
                        // Remove the item from the queue and process the next item
                        queue.shift();
                        if (queue.length) {
                            this.processQueue();
                        }
                    });
            }
            else {
                // else disable product in backend
                this.Disable(single)
                    .then(res => {
                        successStream.write(`${ind},${index + 1}\n`);
                        successIdStream.write(`${single.sku}\n`);
                        // this.csv.splice(findIndex, 1);
                    })
                    .catch(err => {
                        failStream.write(`${ind},${index + 1}\n`);
                    })
                    .finally(res => {
                        Progressstream.write(`${ind},${index + 1};`)
                        resolve1(`${ind},${index + 1}`);
                        // Remove the item from the queue and process the next item
                        queue.shift();
                        if (queue.length) {
                            this.processQueue();
                        }
                    });
            }
        }
    }
    async processCreateQueue() {
        const item = create_queue[0];
        const { data, index, resolve1 } = item;
        if (!this.shouldStop) {
            this.Create(data)
                .then(res => {
                    successStream.write(`${index + 1}\n`);
                    successIdStream.write(`${data.ITEM_NUMBER}\n`);
                    this.csv.splice(index, 1)
                })
                .catch(err => {
                    failStream.write(`${index + 1}\n`);
                })
                .finally(res => {
                    Progressstream.write(`${index + 1};`)
                    // Remove the item from the queue and process the next item
                    create_queue.shift();
                    if (create_queue.length) {
                        this.processCreateQueue();
                    }
                    resolve1(`${index + 1}`)
                })
        }
    }
    addToQueue(item) {
        queue.push(item);
        if (queue.length === 1) {
            // If the queue was previously empty, start processing it
            this.processQueue();
        }
    }
    addToCreateQueue(item) {
        create_queue.push(item);
        if (create_queue.length === 1) {
            // If the queue was previously empty, start processing it
            this.processCreateQueue();
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
                        "keyword": file_to_update.KEYWORD ? file_to_update.KEYWORD.split('|').filter(str => str.length > 0) : [],
                        "max_height": file_to_update.MAX_HEIGHT,
                        "max_width": file_to_update.MAX_WIDTH,
                        "orientation": file_to_update.ORIENTATION ? [`${file_to_update.ORIENTATION}`] : [],
                        "publisher_id": file_to_update.PUBLISHER_ID,
                        "publisher_name": file_to_update.PUBLISHER_NAME,
                        "image_url": file_to_update.LOWRES,
                        "media": "",
                        "weight": ""
                    }
                }
            }
            catch (err) {
                console.log('Error in datas update', err)
            }
            axios.post(API_URL + UPDATE_URL, datas)
                .then(resp => {
                    resolve(resp.data)
                    successDetailStream.write(`success on update ${datas.sku} - ${datas.product_name}\n`)
                })
                .catch(err => {
                    Errorstream.write(`error on update ${file_to_update.ITEM_NUMBER} ${datas.variation_id}:-${(err)}\n`);
                    reject(err)
                })
        })
    }
    async Disable(data) {
        return new Promise((resolve, reject) => {
            let datas = {
                "variation_id": data.variation_uuid
            }
            axios.post(API_URL + DISABLE_URL, datas)
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
    async Enable(data) {
        return new Promise((resolve, reject) => {
            let datas = {
                "variation_id": data.variation_uuid
            }
            axios.post(API_URL + ENABLE_URL, datas)
                .then(resp => {
                    resolve(resp.data)
                    successDetailStream.write(`success on enable ${data.sku} - ${data.product}\n`)
                })
                .catch(err => {
                    Errorstream.write(`error on enable ${data.variation_uuid}:-${(err)}\n`);
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
                        "keyword": file_to_update.KEYWORD ? file_to_update.KEYWORD.split('|').filter(str => str.length > 0) : [],
                        "max_height": file_to_update.MAX_HEIGHT,
                        "max_width": file_to_update.MAX_WIDTH,
                        "orientation": file_to_update.ORIENTATION ? [`${file_to_update.ORIENTATION}`] : [],
                        "publisher_id": file_to_update.PUBLISHER_ID,
                        "publisher_name": file_to_update.PUBLISHER_NAME,
                        "image_url": file_to_update.LOWRES,
                        "media": "",
                        "weight": ""
                    }
                }
            }
            catch (err) {
                console.log('Error in datas', err)
            }

            axios.post(API_URL + CREATE_URL, datas)
                .then(resp => {
                    resolve(resp.data)
                    successDetailStream.write(`success on creating ${file_to_update.ITEM_NUMBER} - ${file_to_update.ITEM_NAME}\n`)
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