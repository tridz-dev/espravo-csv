import React, { useState } from "react";
import axios from "axios";
import { IconFileSpreadsheet } from "@tabler/icons";
import Title from "./global/page/title";
// import Upload from "../pages/Upload";

function UploadWidget() {
  const [file, setFile] = useState(null);
  const [uploaded, setUploaded] = useState(null);
  const [migrated, setMigrated] = useState(null);
  const [rerun, setReRun] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    console.log(file);
  };

  const clearFile = () => {
    console.log(file);

    console.log("cleared");
    console.log(file);
  };
  const ReRunFailed = () => {
    axios
      .get("http://localhost:3000/rerun")
      .then((res) => {
        setReRun(true)
        console.log(res.data);
      })
      .catch((err) => {
        // setUploaded(-1);
        console.error(err);
      });
  }
  const deleteFile = () => {
    // console.log(file);
    // setFile(null);
    // setUploaded(null);
    // console.log("deleted");
    // console.log(file);
    axios
      .get("http://localhost:3000/delete")
      .then((res) => {
        setFile(null);
        console.log(res.data);
      })
      .catch((err) => {
        // setUploaded(-1);
        console.error(err);
      });


  };
  const handleUpload = () => {
    const formData = new FormData();
    formData.append("jsonFile", file);

    axios
      .post("http://localhost:3000/upload", formData)
      .then((res) => {
        setUploaded(1);
        console.log(res.data);
      })
      .catch((err) => {
        setUploaded(-1);
        console.error(err);
      });
  };

  const migrateFile = () => {
    axios
      .get("http://localhost:3000/migrate")
      .then((res) => {
        setMigrated(1);
        console.log(res.data);
      })
      .catch((err) => {
        setMigrated(-1);
        console.error(err);
      });
  };

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


                <button
                  className="relative inline-flex h-9 items-center mr-1 border border-slate-900 bg-slate-700 px-4 py-1 text-sm font-medium text-white hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                  onClick={migrateFile}
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

              </div>
            )}

            <br />
          </div>
        ) : (
          <div>
            <input type="file" name="jsonFile" onChange={handleFileChange} />

            <button
              className="relative inline-flex h-9 items-center border border-slate-900 bg-slate-900 px-4 py-1 text-sm font-medium text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
              onClick={handleUpload}
            >
              Upload
            </button>
          </div>
        )}
      </div>
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
