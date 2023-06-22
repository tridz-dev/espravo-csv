import React, { useEffect, useState } from "react";
import axios from "axios";
import { IconFileSpreadsheet } from "@tabler/icons";
import { useSearchParams } from "react-router-dom"
import Title from "../components/global/page/title";
// import Upload from "../pages/Upload";
// const API_URL = "http://localhost:3001"
const API_URL = "https://csv-be.tridz.in"
function UploadWidget() {
  // let [searchParams, setSearchParams] = useSearchParams();
  const [file, setFile] = useState(null);
  const [intervalId, setIntervalId] = useState([]);
  const [uploaded, setUploaded] = useState(null);
  const [migrated, setMigrated] = useState(null);
  const [migrate_stage, setMigrateStage] = useState("");
  const [progress, setProgress] = useState(0);
  let interval
  const handleFileChange = (e) => {
    let file = e.target.files[0]
    setFile(e.target.files[0]);
    localStorage.setItem("filename", file?.name)
    console.log(file);
  };
  // useEffect(() => {
  //   if (searchParams) {
  //     console.log("change on params", searchParams.get("state"))
  //     let search = searchParams.get("state")
  //     if (search == "start") {
  //       console.log("change on params", "uploaded")
  //       setUploaded(1)
  //       let filename = localStorage.getItem("filename")
  //       // console.log("session storage", localStorage.getItem("filename"))
  //       let file = { name: filename }
  //       setFile(file)
  //       Progress_check()
  //       setMigrated(1)
  //       localStorage.setItem("state", `${search}`)
  //       setMigrateStage(`${search}`)
  //     }
  //     else if (search) {
  //       setMigrateStage(`${search}`)
  //       localStorage.setItem("state", `${search}`)
  //     }
  //     else {
  //       setMigrateStage("initial")
  //       localStorage.setItem("state", "initial")
  //     }
  //   }
  // }, [searchParams])
  useEffect(() => {
    let state = localStorage.getItem("state") ? localStorage.getItem("state") : ""
    if (state === "start") {
      setUploaded(1)
      let filename = localStorage.getItem("filename")
      // console.log("session storage", localStorage.getItem("filename"))
      let file = { name: filename }
      setFile(file)
      Progress_check()
      setMigrated(1)
    }
    else if (state === "completed") {
      let filename = localStorage.getItem("filename")
      setUploaded(1)
      // console.log("session storage", localStorage.getItem("filename"))
      let file = { name: filename }
      setFile(file)
    }
    else if (state === "pause") {
      setUploaded(1)
      let filename = localStorage.getItem("filename")
      // console.log("session storage", localStorage.getItem("filename"))
      let file = { name: filename }
      setFile(file)
      setMigrated(1)
    }
    console.log("state changes to:", localStorage.getItem("state"))
  }, [localStorage.getItem("state")])
  useEffect(() => {
    if (localStorage.getItem("state")) {
      setMigrateStage(`${localStorage.getItem("state")}`)
    }
  }, [])
  const clearFile = () => {
    console.log(file);
    setFile(null)
    console.log("cleared");
    console.log(file);
  };
  const deleteFile = () => {
    axios
      .get(API_URL + "/delete")
      .then((res) => {
        setFile(null);
        setUploaded(null);
        console.log(res.data);
        // setSearchParams([])
        localStorage.setItem("initial")
      })
      .catch((err) => {
        // setUploaded(-1);
        setUploaded(null);
        console.error(err);
      });


  };
  const handleUpload = () => {
    const formData = new FormData();
    formData.append("jsonFile", file);

    axios
      .post(API_URL + "/upload", formData)
      .then((res) => {
        setUploaded(1);
        console.log(res.data);
        localStorage.setItem("state", "initial")
      })
      .catch((err) => {
        alert("something went wrong on uploading")
        setUploaded(null);
        console.error("error on file uplaod", err);
      });
  };

  const Progress_check = async () => {
    interval = setInterval(() => {
      console.log("calling migration", interval, "as")
      axios.get(API_URL + "/progress")
        .then(res => {
          console.log("getting migration progress", res.data, "of type", typeof res.data)
          setProgress(res.data)
          if (res.data == 100) {
            clearIntervals(intervalId)
            interval = 0
            setMigrateStage("completed")
            localStorage.setItem("state", "completed")
            // setSearchParams({ state: "completed" })
            console.log("migration progress fetch is stoping")
          }
          else {

          }
        })
        .catch(err => {
          console.log("migration progress error", err)
        })
    }, 7000)
    setIntervals(interval)
  }

  const migrateFile = (detail) => {
    setProgress(0)
    setMigrated(1)
    setMigrateStage("start")
    localStorage.setItem("state", "start")
    // setSearchParams({ state: "start" })

    if (detail === "fresh_start") {
      axios.get(API_URL + "/clear_progress")
        .then(res => {
          setTimeout(() => {
            axios.get(API_URL + "/migrate")
              .then(res => {
                Progress_check()
              })
              .catch(err => {
                console.log("error in", err)
              })
          }, 3000)
        })
        .catch(err => {

        })
    }
    else {
      axios.get(API_URL + "/migrate")
        .then(res => {
          Progress_check()
        })
        .catch(err => {
          console.log("error in", err)
        })
    }
  };
  useEffect(() => {
    return () => {
      clearIntervals(intervalId);
      interval = 0
    }

  }, [])
  const callError = () => {

  }
  const PauseMigrate = () => {
    axios.get(API_URL + "/pause_migrate")
      .then(res => {
        clearIntervals(intervalId)
      })
      .catch(err => {
        console.log("error in", err)
      })
    // setSearchParams({ state: "pause" })
    localStorage.setItem("state", "pause")
    setMigrateStage("pause")
  }
  const RestartMigrate = () => {
    migrateFile()
    // setSearchParams({ state: "start" })
    localStorage.setItem("state", "start")
    setMigrateStage("start")
  }
  const setIntervals = (id) => {
    let intervalArray = intervalId
    const find = intervalId.find(x => x === id);
    if (!find) {
      intervalArray.push(id)
      setIntervalId(intervalArray)
    }
  }
  const clearIntervals = (intervalIds) => {
    intervalIds.map(interval => {
      clearInterval(interval)
    })
  }
  const AbortMigrate = () => {
    console.log("aborting migration")
    setMigrated(0)
    clearIntervals(intervalId)
    interval = 0
    axios.get(API_URL + "/abort_migrate")
      .then(res => {
        clearIntervals(intervalId)
      })
      .catch(err => {
        console.log("error in", err)
      })
      .finally(res => {
        setUploaded(null)
        setFile(null)
        setProgress(0)
        localStorage.setItem("state", "stop")
        setMigrateStage("stop")
      })
    // setSearchParams({ state: "stop" })
  }

  const Upload = () => {
    return (
      <div>
        {file ? (
          <div>
            <div className="flex  border border-slate-400 mb-2 border-dashed">
              <div className="w-3/8 p-4 border-r border-slate-400 border-dashed ">
                <IconFileSpreadsheet size={50} stroke={0.5} />
              </div>
              <div className="w-5/8 p-4 text-slate-700 text-sm mt-4 px-8">
                {file ? file.name : null}
                {uploaded ? //   delete // <button className="underline pl-2 text-blue-500 border-slate-400 pb-1">
                  // </button>
                  null : (
                    <span>
                      {/* <button className="underline pl-2 text-blue-500 border-slate-400 pb-1">
                      upload
                    </button> */}
                      <button
                        onClick={clearFile}
                        className="underline pl-2 text-blue-500 border-slate-400 pb-1"
                      >
                        clear
                      </button>
                    </span>
                  )}
              </div>
            </div>

            {/* <div className="filename">{ uploaded == 1 ? "Uploaded." : "Not uploaded." }</div> */}
            {/* <input type="file" name="jsonFile" onChange={handleFileChange} /> */}
            {uploaded == null ? (
              <button
                className="relative inline-flex h-9 items-center border border-slate-900 bg-slate-900 px-4 py-1 text-sm font-medium text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                onClick={handleUpload}
              >
                Upload
              </button>
            ) : (
              <div className="flex mt-8">
                {migrate_stage == "stop" || migrate_stage == "initial" ? < div className="w-full">
                  <button
                    className="relative inline-flex h-9 items-center mr-1 border border-slate-900 bg-slate-700 px-4 py-1 text-sm font-medium text-white hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                    onClick={() => migrateFile("fresh_start")}
                    title="Migrate data from the uploaded file to the E-commerce backend."
                  >
                    Migrate Data
                  </button>
                  <button
                    className="relative inline-flex h-9 items-center  px-4 py-1 text-sm font-medium text-red-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                    onClick={deleteFile}
                    title="Abort data migration and delete data from the server."
                  >
                    Abort & Delete
                  </button>
                </div> : ""}
                {migrate_stage === "pause" || migrate_stage === "start" ? <p className="progress-bar w-full">
                  {migrate_stage == "pause" ?
                    <div>
                      <button
                        className="relative inline-flex h-9 items-center mr-1 border border-slate-900 bg-slate-700 px-4 py-1 text-sm font-medium text-white hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                        onClick={RestartMigrate}
                        title="Migrate data from the uploaded file to the E-commerce backend."
                      >
                        Restart
                      </button>
                      <button
                        className="relative inline-flex h-9 items-center  px-4 py-1 text-sm font-medium text-red-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                        onClick={() => AbortMigrate()}
                        title="Abort data migration"
                      >
                        Abort
                      </button>
                      <div className="w-full h-[30px]" style={{ background: `linear-gradient(90deg, green ${progress}%, lightgrey ${progress}%)` }} />
                      {progress.toFixed(2)}% completed
                    </div>
                    :
                    <div>
                      <button
                        className="relative inline-flex h-9 items-center mr-1 border border-slate-900 bg-slate-700 px-4 py-1 text-sm font-medium text-white hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                        onClick={PauseMigrate}
                        title="Migrate data from the uploaded file to the E-commerce backend."
                      >
                        Pause
                      </button>
                      <button
                        className="relative inline-flex h-9 items-center  px-4 py-1 text-sm font-medium text-red-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                        onClick={() => AbortMigrate()}
                        title="Abort data migration"
                      >
                        Abort
                      </button>
                      <div className="my-2 w-full h-[30px]" style={{ background: `linear-gradient(90deg, green ${progress}%, lightgrey ${progress}%)` }} />
                      {progress.toFixed(2)}% completed
                    </div>
                  }
                </p> :
                  migrate_stage === "completed" ? <div className="w-full">
                    <p className="text-sm font-medium pb-3">Bulk Upload Successfully Completed</p>
                    <button
                      className="relative inline-flex h-9 items-center mr-1 border border-slate-900 bg-slate-700 px-4 py-1 text-sm font-medium text-white hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                      onClick={() => AbortMigrate()}
                      title="Finish the process and Continue to Home"
                    >
                      Continue
                    </button>
                  </div> : ""
                }
              </div>
            )}

            <br />
          </div>
        ) : (
          <div>
            <input type="file" name="jsonFile" onChange={handleFileChange} />

            {/* <button
              className="relative inline-flex h-9 items-center border border-slate-900 bg-slate-900 px-4 py-1 text-sm font-medium text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
              onClick={handleUpload}
            >
              Uploads
            </button> */}
          </div>
        )
        }
      </div >
      // `<div>
      //   <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50 ml-1 mr-4">
      //     <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
      //       <div>
      //         <input type="file" name="jsonFile" onChange={handleFileChange} />
      //         <button
      //           className="relative inline-flex h-9 items-center border border-slate-900 bg-slate-900 px-4 py-1 text-sm font-medium text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
      //           onClick={handleUpload}
      //         >
      //           Upload
      //         </button>
      //       </div>
      //     </div>
      //   </div>
      // </div>`
    );
  };

  return (
    <main className="flex w-full flex-1 flex-col overflow-hidden">
      {/* Cookie is {document.cookie.match("(^|;)\\s*" + "_ga_ZNZBZEKB2F" + "\\s*=\\s*([^;]+)")} */}
      <div className="grid items-start gap-8">
        {/* title + button */}
        <Title title="Upload Data" subtitle="CSV file with data to upload." />
        {/* title + button */}
        <div>
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50 ml-1 mr-4">
            <div className="mx-auto flex max-w-[500px] flex-col items-center justify-center text-center">
              <Upload />
            </div>
          </div>
        </div>
        {/* <Upload /> */}

        {console.log(file)}
      </div>
    </main>
  );
}
export default UploadWidget;
