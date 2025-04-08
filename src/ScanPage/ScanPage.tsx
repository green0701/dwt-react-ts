import React, { useEffect, useRef, useState } from 'react'
import Dynamsoft from 'dwt'
import { WebTwain } from 'dwt/dist/types/WebTwain'
import { ImageEditor } from 'dwt/dist/types/WebTwain.Viewer';
import { key,resourcesPath } from "./environment.ts";
import { Device } from 'dwt/dist/types/WebTwain.Acquire';
export default function ScanPage() {
    interface DWTState {
        deviceList: Device[],
        selectedDeviceIndex: number,
        scanConfig?: {
            Resolution: number,
            PixelType: number,
            IfFeederEnabled: boolean,
            IfDuplexEnabled: boolean,
            IfShowUI:boolean,
        }
    }
    const DWObjectRef = useRef<WebTwain>(null!);
    let imageEditor: ImageEditor;
    const containerId = "dwtcontrolContainer"
    const [state, setState] = useState<DWTState>({
        deviceList: [],
        selectedDeviceIndex: 0,
        scanConfig: {
            Resolution: 200,
            PixelType: 1,
            IfFeederEnabled: false,
            IfDuplexEnabled: false,
            IfShowUI:false,
        }
    });
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
    function capture() {
        DWObjectRef.current.Addon.Webcam.CaptureImage(() => {
            console.log(DWObjectRef.current.GetImageWidth(DWObjectRef.current.CurrentImageIndexInBuffer), DWObjectRef.current.GetImageHeight(DWObjectRef.current.CurrentImageIndexInBuffer))
        }, (c, s) => { console.error(c, s) })
    }
    async function acquireImage() {
        if (DWObjectRef.current) {
            await DWObjectRef.current.SelectDeviceAsync(state.deviceList[state.selectedDeviceIndex])
            DWObjectRef.current.AcquireImage(state.scanConfig, () => {
                console.log("success")
            }, (c, s) => {
                console.error(c, s)
            })
        }
    }
    function showImageEditor() {
        imageEditor = DWObjectRef.current.Viewer.createImageEditor({
            workMode: Dynamsoft.DWT.EnumDWT_WorkMode.balance,//normal updates in real time, and the balance speed is faster
        })
        imageEditor.show()
    }
    function load() {
        //When you need to load pdf documents
        // DWObjectRef.current.Addon.PDF.SetReaderOptions({
        //     convertMode: Dynamsoft.DWT.EnumDWT_ConvertMode.CM_RENDERALL,
        //     password: "123",
        //     renderOptions: {
        //         renderAnnotations: true,
        //         resolution: 100,
        //         maxWidth: 2000,
        //         maxHeight: 2000,
        //         renderGrayscale: true,
        //     }
        // })
        DWObjectRef.current.LoadImageEx("", 5, async () => {
            console.log("bitdepth", DWObjectRef.current.GetImageBitDepth(DWObjectRef.current.CurrentImageIndexInBuffer))
            console.log("width", DWObjectRef.current.GetImageWidth(DWObjectRef.current.CurrentImageIndexInBuffer))
            console.log("height", DWObjectRef.current.GetImageHeight(DWObjectRef.current.CurrentImageIndexInBuffer))
            // await DWObjectRef.current.MoveToDocumentAsync("A","B")
        }, () => { })
    }
    function save() {
        DWObjectRef.current.Addon.PDF.Write.Setup({
            // docCompressor: {
            //     enabled: true,
            // }
        })
        DWObjectRef.current.SaveAllAsPDF("temp.pdf", () => { }, () => { })
    }
    function handleSelect(event: React.ChangeEvent<HTMLSelectElement>) {
        setState((preState) => {
            return { ...preState, selectedDeviceIndex: event.target.selectedIndex }
        })
    }
    const handleResolutionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setState(prevState => ({
            ...prevState,
            scanConfig: {
                ...prevState.scanConfig!,
                Resolution: parseInt(e.target.value),
            },
        }));
    };

    const handlePixelTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setState(prevState => ({
            ...prevState,
            scanConfig: {
                ...prevState.scanConfig!,
                PixelType: parseInt(e.target.value),
            },
        }));
    };

    const handleFeederChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setState(prevState => ({
            ...prevState,
            scanConfig: {
                ...prevState.scanConfig!,
                IfFeederEnabled: e.target.checked,
            },
        }));
    };
    const handleShowUIChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setState(prevState => ({
            ...prevState,
            scanConfig: {
                ...prevState.scanConfig!,
                IfShowUI: e.target.checked,
            },
        }));
    };


    const handleDuplexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setState(prevState => ({
            ...prevState,
            scanConfig: {
                ...prevState.scanConfig!,
                IfDuplexEnabled: e.target.checked,
            },
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
                    <input type="checkbox" checked={state.scanConfig?.IfShowUI} onChange={handleShowUIChange} />
                </label>
                Resolution:
                <select value={state.scanConfig?.Resolution} onChange={handleResolutionChange}>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                    <option value={300}>300</option>
                    <option value={600}>600</option>
                </select>
                PixelType:
                <select value={state.scanConfig?.PixelType} onChange={handlePixelTypeChange}>
                    <option value={0}>BW</option>
                    <option value={1}>Gray</option>
                    <option value={2}>RGB</option>
                </select>
                <label>
                    Feeder:
                    <input type="checkbox" checked={state.scanConfig?.IfFeederEnabled} onChange={handleFeederChange} />
                </label>
                <label>
                    Duplex:
                    <input type="checkbox" checked={state.scanConfig?.IfDuplexEnabled} onChange={handleDuplexChange} />
                </label>
            </div>

            <button onClick={() => { acquireImage() }}>Scan</button>
            <button onClick={() => { capture() }}>Capture</button>
            <button onClick={() => { showImageEditor() }}>showImageEditor</button>
            <button onClick={() => { load() }}>load</button>
            <button onClick={() => { save() }}>save</button>
            <div id={containerId}></div>
        </>
    )
}
