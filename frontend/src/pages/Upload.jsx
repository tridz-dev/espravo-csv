import { useState } from "react";

import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import UploadWidget from "../components/UploadWidget";
function Upload() {
  return (
    <div className="mx-auto flex flex-col space-y-6">      
      <Header />      
      <div id="content" className="grid gap-12 md:grid-cols-[210px_2fr]">        
        <Sidebar />        
        <UploadWidget />        
      </div>
      
    </div>
  );
}

export default Upload;
