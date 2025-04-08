import React, { ChangeEvent, useEffect, useRef, useState } from 'react'
import Dynamsoft from 'dwt'
import { WebTwain } from 'dwt/dist/types/WebTwain'
import { key,resourcesPath } from "./environment.ts";
import { Device, ScanSetup } from 'dwt/dist/types/WebTwain.Acquire';
import { DynamsoftEnumsDWT } from 'dwt/dist/types/Dynamsoft.Enum';
export default function StartScan() {
    interface DWTState {
        deviceList: Device[],
        selectedDeviceIndex: number,
    }
    const DWObjectRef = useRef<WebTwain>(null!);
    const containerId = "dwtcontrolContainer"
    const [state, setState] = useState<DWTState>({
        deviceList: [],
        selectedDeviceIndex: 0,
    });
    const [scanSetUpState,setScanSetUpState]=useState<ScanSetup>({
        settings:{
            pixelType:2,
            resolution:200,
            bFeeder:false,
            bDuplex:false,

        },
        ui:{
            bShowUI:false
        }
    })
    useEffect(()=>{
        setScanSetUpState((preState)=>{
            return {...preState,scanner:state.deviceList[state.selectedDeviceIndex]} 
        })
    },[state])
    useEffect(() => {
        Dynamsoft.DWT.AutoLoad = false;
        Dynamsoft.DWT.UseDefaultViewer = true;
        Dynamsoft.DWT.ResourcesPath = resourcesPath;
        Dynamsoft.DWT.ProductKey = key;
        Dynamsoft.DWT.Containers = [
            {
                WebTwainId: "dwtObject",
                ContainerId: containerId,
                Width: 500,
                Height: 500
            },
        ];

        Dynamsoft.DWT.RegisterEvent("OnWebTwainReady", () => {
            DWObjectRef.current = Dynamsoft.DWT.GetWebTwain("dwtObject");
            (window as any).DWObject = DWObjectRef.current; //for debugging
            DWObjectRef.current.GetDevicesAsync().then((deviceList) => {
                setState((preState) => {
                    return { ...preState, deviceList }
                })
            }).catch((e) => {
                console.error(e)
            })
        });
        Dynamsoft.DWT.OnWebTwainError = (e) => {
            console.error(e)
        }
        console.log("dwt load")
        Dynamsoft.DWT.Load();
        return () => {
            console.log("dwt unload")
            Dynamsoft.DWT.Unload()
        }
    }, [])
    async function acquireImage() {
        //https://www.dynamsoft.com/web-twain/docs/info/api/WebTwain_Acquire.html#startscan
        DWObjectRef.current.startScan(scanSetUpState).then(()=>{
            DWObjectRef.current.CloseSource()
        }).catch((e)=>{
            console.error(e)
        })
      
    }
    function load() {
        DWObjectRef.current.LoadImageEx("", 5, async () => {
            console.log("bitdepth", DWObjectRef.current.GetImageBitDepth(DWObjectRef.current.CurrentImageIndexInBuffer))
            console.log("width", DWObjectRef.current.GetImageWidth(DWObjectRef.current.CurrentImageIndexInBuffer))
            console.log("height", DWObjectRef.current.GetImageHeight(DWObjectRef.current.CurrentImageIndexInBuffer))
            // await DWObjectRef.current.MoveToDocumentAsync("A","B")
        }, () => { })
    }
    function save() {
        DWObjectRef.current.Addon.PDF.Write.Setup({
        })
        DWObjectRef.current.SaveAllAsPDF("temp.pdf", () => { }, () => { })
    }
    function handleSelect(event: React.ChangeEvent<HTMLSelectElement>) {
        setState((preState) => {
            return { ...preState, selectedDeviceIndex: event.target.selectedIndex }
        })
    }
    const handleResolutionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setScanSetUpState(prevState => ({
            ...prevState,
            settings:{
                ...prevState.settings,
                resolution:parseInt(e.target.value)
            }
        }));
    };

    const handlePixelTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setScanSetUpState(prevState => ({
            ...prevState,
            settings:{
                ...prevState.settings,
                pixelType: parseInt(e.target.value),
            }
        }));
    };

    const handleFeederChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setScanSetUpState(prevState => ({
            ...prevState,
            settings:{
                ...prevState.settings,
                bFeeder:e.target.checked
            }
        }));
    };
    const handleShowUIChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setScanSetUpState(prevState => ({
            ...prevState,
            ui:{
                ...prevState.settings,
                bShowUI:e.target.checked,
            }
        }));
    };


    const handleDuplexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setScanSetUpState(prevState => ({
            ...prevState,
            settings:{
                ...prevState.settings,
                bDuplex:e.target.checked,
            }
        }));
    };
    return (
        <>
            DeviceList:
            <select onChange={(event) => {
                handleSelect(event)
            }}>
                {state.deviceList.map((device, index) => {
                    return <option key={index}>{device.displayName}</option>
                })}
            </select>
            <div>
                <label>
                    ShowUI:
                    <input type="checkbox" checked={scanSetUpState.ui?.bShowUI} onChange={handleShowUIChange} />
                </label>
                Resolution:
                <select value={scanSetUpState.settings?.resolution} onChange={handleResolutionChange}>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                    <option value={300}>300</option>
                    <option value={600}>600</option>
                </select>
                PixelType:
                <select value={scanSetUpState.settings?.pixelType} onChange={handlePixelTypeChange}>
                    <option value={0}>BW</option>
                    <option value={1}>Gray</option>
                    <option value={2}>RGB</option>
                </select>
                <label>
                    Feeder:
                    <input type="checkbox" checked={scanSetUpState.settings?.bFeeder} onChange={handleFeederChange} />
                </label>
                <label>
                    Duplex:
                    <input type="checkbox" checked={scanSetUpState.settings?.bDuplex} onChange={handleDuplexChange} />
                </label>
            </div>
            <button onClick={() => { acquireImage() }}>Scan</button>
            <button onClick={() => { load() }}>load</button>
            <button onClick={() => { save() }}>save</button>
            <div id={containerId}></div>
        </>
    )

}
