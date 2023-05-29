const file_path = "uploads/csv/current.csv"
const API_URL = 'http://espfarnew.tridz.in/api/product/create';
const FAILED_FILE = 'error.txt';
const fs = require("fs");
const axios = require("axios")
const Migrate = require("./uploads/process/migrate")
const MigrateProcess = new Migrate("http://localhost")
const Progressstream = fs.createWriteStream('progress.txt', { flags: 'w' });
const failStream = fs.createWriteStream('failed.txt', { flags: 'a' });
const successStream = fs.createWriteStream('success.txt', { flags: 'a' });
const successDetailStream = fs.createWriteStream('success_details.txt', { flags: 'a' });
const Errorstream = fs.createWriteStream('error.txt', { flags: 'a' });
class RerunFailed {
  constructor() {
    this.csv = []
  }
  async rerunFailedItems() {
    try {
      
      const failed = fs.readFileSync(FAILED_FILE, 'utf-8')
      const regex = /(update|disable|create)\s+(\S+):-/;
      console.log("success")
      try {

        const jsonData = fs.readFileSync("uploads/csv/output.json", 'utf-8');
        this.csv = JSON.parse(jsonData)
      }
      catch (err) {
        console.error("CSV file not found:", err)
      }
      let result = failed.split("\n").map((line) => {
        const match = line.match(regex);
        return new Promise((resolve, reject) => {
          console.log("match", match)
          if (match) {
            let id = match[2],
              action = match[1]
            if (action === "update") {
              let find = this.csv.filter(x => x.ITEM_NUMBER == id)
              let single = { "variation_uuid": id }
              MigrateProcess.Update(single, find[0])
                .then(res => {
                  this.csv.splice(findIndex, 1)
                  successStream.write(`success in ${line}\n`);
                })
                .catch(err => {
                  failStream.write(`${line}`);
                  // console.log("call error in update is", err)
                })
                .finally(res => {
                  resolve(`${line}`)
                })
            }
            else if (action === "disable") {
              let single = { "variation_uuid": id }
              MigrateProcess.Disable(single)
                .then(res => {
                  successStream.write(`success in ${line}\n`);
                  this.csv.splice(findIndex, 1)
                })
                .catch(err => {
                  // console.log("call error in disable is", err)
                  failStream.write(`${line}\n`);
                })
                .finally(res => {
                  resolve(`${line}`)
                })
            }
            else {
              let data = this.csv.filter(x => x.ITEM_NUMBER == id)
              MigrateProcess.Create(data)
                .then(res => {
                  successStream.write(`${line}`);
                  this.csv.splice(index, 1)
                })
                .catch(err => {
                  if (errorIndex == 0) {
                    // console.log("call error in create is", err)
                    errorIndex++
                  }
                  failStream.write(`${line}`);
                })
                .finally(res => {
                  resolve(`${line}`)
                })
            }
          }
        })
      });
    } catch (error) {
      console.error(`Error processing failed items: ${error.message}`);
    }
  }
}

module.exports = RerunFailed
