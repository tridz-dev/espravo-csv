const axios = require('axios');
const fs = require('fs');
const csv = require('fast-csv');

const API_URL = 'http://espfarnew.tridz.in/api/product/create';
const CHUNK_SIZE = 50;
const PROGRESS_FILE = 'progress.txt';
const FAILED_FILE = 'failed.txt';
const API_error = 'error.txt'
const file_path = "uploads/csv/current.csv"
class Process {
    async processCsv(filePath) {
        let chunkIndex = 0;
        let lineNumber = 0;

        // Read the progress file to get the last processed chunk and line number
        try {
            const progress = fs.readFileSync(PROGRESS_FILE, 'utf-8').split(',');
            if (isNaN(parseInt(progress[0]))) {
                chunkIndex = 0;
                lineNumber = 0;
            }
            else {
                chunkIndex = parseInt(progress[0]);
                lineNumber = parseInt(progress[1]);
            }
        } catch (error) {
            chunkIndex = 0;
            lineNumber = 0;
        }
        console.log("numbers", chunkIndex, lineNumber)
        let chunkStart = 0;
        let chunkEnd = CHUNK_SIZE;
        const stream = fs.createReadStream(`${file_path}`, 'utf-8');
        let start = (chunkIndex + 1) * (lineNumber + 1)
        const csvStream = csv.parseStream(stream, { headers: true, fromLine: start }).on("data", async function (data) {
            if (lineNumber >= chunkEnd) {
                chunkIndex++;
                chunkStart = chunkEnd;
                chunkEnd += CHUNK_SIZE;
                lineNumber = 0;
                return;
            }

            try {
                let category = []
                for (const key in data) {
                    if (key.includes("CATEGORY") && data[key] !== "") {
                        category.push(data[key]);
                    }
                }
                let datas = {
                    "product_name": data.ITEM_NAME,
                    "sku": data.ITEM_NUMBER,
                    "weight": 200,
                    "data": {
                        "price": "0",
                        "vendor": "Tridz",
                        "artist": [`${data.ARTIST}`],
                        "available": data.AVAILABLE,
                        "collections": category,
                        "favourite": 1,
                        "image_id": data.IMAGE_ID,
                        "image_type": data.IMAGE_TYPE,
                        "keyword": data.KEYWORD.split("|"),
                        "max_height": data.MAX_HEIGHT,
                        "max_width": data.MAX_WIDTH,
                        "orientation": data.ORIENTATION,
                        "publisher_id": data.PUBLISHER_ID,
                        "publisher_name": data.PUBLISHER_NAME,
                        "media": "",
                        "weight": ""
                    }
                }
                axios.post(API_URL, datas)
                    .then(resp => {
                        // Update the progress file with the current chunk and line number
                        fs.writeFileSync(PROGRESS_FILE, `${chunkIndex},${lineNumber + 1}\n`);
                        console.log(`Line ${lineNumber + 1} of chunk ${chunkIndex} successfully processed`);
                    })
                    .catch(err => {
                        fs.appendFileSync(API_error, `error on ${data.ITEM_NUMBER}:-${err.response.data}\n`);
                        throw err.response.data
                    })

            } catch (error) {
                // console.error(`Line ${lineNumber + 1} of chunk ${chunkIndex} failed with error: ${error.message}`);
                // Write the failed line number to the failed file
                if (error.message === "Request failed with status code 500") {
                    // console.log("response", error.response.data)
                }
                fs.appendFileSync(FAILED_FILE, `${chunkIndex},${lineNumber + 1}\n`);
            }

            lineNumber++;
        }).on("end", function () {
            console.log("CSV file successfully processed");
            return true
        });

        stream.pipe(csvStream);
    }
}

module.exports = Process;