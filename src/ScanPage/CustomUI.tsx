import React, { ChangeEvent, useEffect, useRef, useState } from 'react'
import Dynamsoft from 'dwt'
import { WebTwain } from 'dwt/dist/types/WebTwain'
import { key } from "./license.ts";
import { Device } from 'dwt/dist/types/WebTwain.Acquire';
import { DynamsoftEnumsDWT } from 'dwt/dist/types/Dynamsoft.Enum';
export default function CustomUI() {
    let DWObject = useRef<WebTwain | null>(null);
    const containerId = "dwtcontrolContainer"
    interface DeviceState {
        deviceList?: Device[];
        selectSourceIndex?: number;
        currenSourceName?: string;
        nomalDevice?: boolean;
        esclDevice?: boolean;
    }
    let [deviceState, setDeviceState] = useState<DeviceState>({
        deviceList: [],
        currenSourceName: "",
        selectSourceIndex: 0,
        nomalDevice: true,
        esclDevice: false,
    })
    let [loadingBarState, setLoadingBarState] = useState({
        isShow: false,
        displayContent: "waiting",
    })
    useEffect(() => {
        Dynamsoft.DWT.AutoLoad = false;
        Dynamsoft.DWT.UseDefaultViewer = true;
        Dynamsoft.DWT.ResourcesPath = "https://unpkg.com/dwt@latest/dist";
        Dynamsoft.DWT.ProductKey = key;
        Dynamsoft.DWT.UseLocalService = true;
        
        Dynamsoft.DWT.Containers = [
            {
                WebTwainId: "dwtObject",
                ContainerId: containerId,
                Width: 500,
                Height: 500
            },
        ];
        Dynamsoft.DWT.RegisterEvent("OnWebTwainReady", () => {
            DWObject.current = Dynamsoft.DWT.GetWebTwain("dwtObject");
            (window as any).DWObject = DWObject;
            if (DWObject.current.Viewer) {
                DWObject.current.Viewer.bind(document.getElementById(containerId) as HTMLElement)
                DWObject.current.Viewer.width = 400;
                DWObject.current.Viewer.height = 400;
                DWObject.current.Viewer.show()
            }
            getSource(Dynamsoft.DWT.EnumDWT_DeviceType.TWAINSCANNER)
        });
        console.log("dwt load")
        Dynamsoft.DWT.Load();
        return () => {
            console.log("dwt unload")
            if (DWObject.current) {
                DWObject.current.CloseSource()
            }
            Dynamsoft.DWT.Unload()
        }
    }, [])

    function getSource(deviceType: DynamsoftEnumsDWT.EnumDWT_DeviceType) {
        if (DWObject.current) {
            DWObject.current.GetDevicesAsync(deviceType).then(devices => {
                if(devices&&devices.length>0)
                {
                    setDeviceState((preState) => {
                        return { ...preState, deviceList: devices, currenSourceName: devices[0].displayName }
                    })
                }
                
            }).catch(e => console.error(e))
        }
        
    }

    function acquire() {
        DWObject.current.SelectDeviceAsync(deviceState.deviceList[deviceState.selectSourceIndex]).then(() => {
            return DWObject.current.AcquireImageAsync()
        }).then(() => {
            console.log("Acquire Success!")
        }).catch(e => console.error(e))
    }

    function handleDeviceTypeChange(e: ChangeEvent<HTMLInputElement>) {
        const { name, checked } = e.target;
        console.log(1)
        deviceState[name] = checked;
        let deviceTypeValue = 0;
        if (deviceState.nomalDevice) {
            deviceTypeValue |= 0x10 | 0x20 | 0x40 | 0x80 | 0x100; 
        }
        if (deviceState.esclDevice) {
            deviceTypeValue |= 0x200 | 0x400;
        }
        getSource(deviceTypeValue);
        setDeviceState((prevState) => {
            let result = {
                ...prevState,
                [name]: checked,
            }
            return result
        }
        );
    }
    function handleSelect(e: ChangeEvent<HTMLSelectElement>) {
        DWObject.current.CloseSource();
        setDeviceState((preState) => {
            return { ...preState, selectSourceIndex: e.target.selectedIndex, currenSourceName: e.target.value }
        })
    }

    return (
        <>
            StartScan
            <div>
                <div id={containerId}></div>
                <div>
                    <label>ESCL|WIFIDirect   <input type='checkbox' name='esclDevice' checked={deviceState.esclDevice} onChange={handleDeviceTypeChange}></input></label>
                </div>
                <span>SourceList:
                    <select onChange={(event) => { handleSelect(event) }} name='device'>
                        {
                            // device list
                            deviceState.deviceList.map((item, index) => <option value={item.displayName} key={index}>{item.displayName}</option>)
                        }
                    </select>
                    <button onClick={() => { acquire() }}>acquire</button>
                </span><br />
                {
                    loadingBarState.isShow == true ? (<div className="progress-ring">
                        <div className="progress-circle">
                        </div>
                        <span className='progress-content'> {loadingBarState.displayContent}</span>
                    </div>) : null
                }

            </div>
        </>
    )
}
