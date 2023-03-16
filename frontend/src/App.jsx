import { useState, useEffect } from "react";
import "./App.css";
import { Upload } from "./pages";


function App() {
  const [user, setUser] = useState(null);

  return (
    <>
      <Upload />
    </>
  );
}

export default App;
