import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import { Upload, Error } from "./pages";
import "./index.css";



const router = createBrowserRouter([
  {
    path: "/",
    element: <Upload />,
  },
  {
    path: "/admin/npi/import",
    element: <Upload />,
  },
  {
    path: "/import_products_csv",
    element: <Upload />,
  },
  {
    path: "*",
    element: <Error />
  }
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

// ReactDOM.createRoot(document.getElementById('root')).render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>,
// )
