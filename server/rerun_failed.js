const file_path = "uploads/csv/current.csv"
const API_URL = 'http://espfarnew.tridz.in/api/product/create';
const FAILED_FILE = 'failed.txt';
class RerunFailed {
  async rerunFailedItems() {
    try {
      const failed = fs.readFileSync(FAILED_FILE, 'utf-8').split('\n');
      for (let i = 0; i < failed.length; i++) {
        if (!failed[i]) continue;

        const failedLine = failed[i].split(',');
        const chunkIndex = parseInt(failedLine[0]);
        const lineNumber = parseInt(failedLine[1]);

        const stream = fs.createReadStream(`${file_path}`);
        let lineCounter = 0;
        const csvStream = csv.parse({ headers: true }).on("data", async function (data) {
          if (lineCounter === lineNumber) {
            try {
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
              const response = await axios.post(API_URL, datas);
              console.log(`Line ${lineNumber + 1} of chunk ${chunkIndex} successfully processed`);
              // Remove the line from the failed file
              fs.writeFileSync(FAILED_FILE, failed.filter(item => item !== failed[i]).join('\n'));
            } catch (error) {
              console.error(`Line ${lineNumber + 1} of chunk ${chunkIndex} failed with error: ${error.message}`);
            }

            return;
          }

          lineCounter++;
        });

        stream.pipe(csvStream);
      }
    } catch (error) {
      console.error(`Error processing failed items: ${error.message}`);
    }
  }
}

module.exports = RerunFailed
