import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import ImageGallery from "./ImageGallery";
import Button from "./Button";

function App() {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Header />
        <ImageGallery />
        <div className="button-container">
          <Button label="Save" />
          <Button label="Delete" />
        </div>
      </div>
    </div>
  );
}

export default App;