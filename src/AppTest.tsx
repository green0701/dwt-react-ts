import React, { useState } from 'react';
import { useEffect,useRef } from 'react';
import ScanPage from './ScanPage/ScanPage';
import "./App.css"
function App() {
  useEffect(()=>{
    
  },[])
  const [displayComponent,setDisplayComponent]=useState("Scan")
  const style = {
    backgroundColor:'green' ,
    color: 'white',
  };
  function getComponent(compName:string) {
    if (compName === "Scan") {
      return <ScanPage />;
    } else if (compName === "remoteScan") {
      return <></>;
    } else {
      return null;
    }
  }
  return (
    <>
      <div style={style}>
        <div className='titleSpan'>
          <button onClick={()=>setDisplayComponent("Scan")}>LocalScan</button>
          <button onClick={()=>setDisplayComponent("remoteScan")}>RemoteScan</button>
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
