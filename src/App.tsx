import React, { useState } from 'react';
import { useEffect, useRef } from 'react';
import ScanPage from './ScanPage/ScanPage';
import RemoteScan from './ScanPage/RemotePage';
import Thumb from './ScanPage/Thumb';
import "./App.css"
import Capability from './ScanPage/Capability';
import StartScan from './ScanPage/startScan';
import DWTStorage from './ScanPage/DWTStorage';
function App() {
  useEffect(() => {

  }, [])
  const [displayComponent, setDisplayComponent] = useState("Scan")
  const style = {
    backgroundColor: 'green',
    color: 'white',
  };
  function getComponent(compName: string) {
    if (compName === "Scan") {
      return <ScanPage />;
    } else if (compName === "remoteScan") {
      return <RemoteScan />;
    } else if (compName == "Thumb") {
      return <Thumb />;
    } else if (compName == "Capability") {
      return <Capability />
    } else if (compName == "StartScan") {
      return <StartScan />
    } else if (compName == "DWTStorage") {
      return <DWTStorage />
    }
  }
  return (
    <>
      <div >
        <div className='titleSpan'>
          <button className={displayComponent == "Scan" ? "titleSpanSelect" : ""} onClick={() => setDisplayComponent("Scan")}>LocalScan</button>
          <button className={displayComponent == "remoteScan" ? "titleSpanSelect" : ""} onClick={() => setDisplayComponent("remoteScan")}>RemoteScan</button>
          <button className={displayComponent == "Thumb" ? "titleSpanSelect" : ""} onClick={() => setDisplayComponent("Thumb")}>Custom Thumb</button>
          <button className={displayComponent == "Capability" ? "titleSpanSelect" : ""} onClick={() => setDisplayComponent("Capability")}>Capability</button>
          <button className={displayComponent == "StartScan" ? "titleSpanSelect" : ""} onClick={() => setDisplayComponent("StartScan")}>StartScan</button>
          <button className={displayComponent == "DWTStorage" ? "titleSpanSelect" : ""} onClick={() => setDisplayComponent("DWTStorage")}>DWTStorage</button>
        </div>
        <div>
          {
            getComponent(displayComponent)
          }
        </div>
      </div>

    </>

  );
}

export default App;
