import React, { ChangeEvent, useEffect, useRef, useState } from 'react'
import Dynamsoft from 'dwt'
import { WebTwain } from 'dwt/dist/types/WebTwain'
import { key, resourcesPath } from "./environment.ts";
import "./Capability.css"
import { Capabilities, CapabilityDetails, CapabilitySetup, Device, Frame, ValueAndLabel } from 'dwt/dist/types/WebTwain.Acquire';
import { DynamsoftEnumsDWT } from 'dwt/dist/types/Dynamsoft.Enum';
export default function Capability() {
    let DWObject = useRef<WebTwain>(null!);
    const containerId = "dwtcontrolContainer"
    let canvas: HTMLCanvasElement
    enum SetCapKey {
        values = "values",
        curValue = "curValue"
    }
    enum CapStatus {
        GRAY = "gray",
        GREEN = "green",
        RED = "red",
        YELLOW = "yellow",
    }
    interface State {
        modifyCapSetUps: CapabilitySetup[];
        currentCapabilityList: CapabilityDetails[]; // 
        isSearch: boolean;
        capStatus: CapStatus,
        findCapabilityList: number[]
        inputAddCap?: number,
        isGetSpecificCap: boolean,
    }
    interface SearchState {
        searchStr: string;
    }
    interface DeviceState {
        deviceList: Device[];
        selectSourceIndex: number;
        currenSourceName: string;
        nomalDevice: boolean;
        esclDevice: boolean;
        ifShowUI: boolean,
    }
    let [state, setState] = useState<State>({
        modifyCapSetUps: [], //modify capability list
        currentCapabilityList: [],
        isSearch: false,
        capStatus: CapStatus.GRAY,
        findCapabilityList: [],
        isGetSpecificCap: false,
    })
    let [searchState, setSearchState] = useState<SearchState>({
        searchStr: "",
    })
    let [deviceState, setDeviceState] = useState<DeviceState>({
        deviceList: [],
        currenSourceName: "",
        selectSourceIndex: 0,
        nomalDevice: true,
        esclDevice: false,
        ifShowUI: false,
    })
    let [loadingBarState, setLoadingBarState] = useState({
        isShow: false,
        displayContent: "waiting",
    })
    function readActualValueForCap(v: any) {
        //get value or return self
        let setValue = undefined
        if (typeof v === 'object' && v !== null && v.hasOwnProperty('value')) {
            setValue = v.value
        }
        else {
            setValue = v;
        }
        return setValue
    }
    useEffect(() => {
        Dynamsoft.DWT.AutoLoad = false;
        Dynamsoft.DWT.UseDefaultViewer = true;
        Dynamsoft.DWT.ResourcesPath = resourcesPath;
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
            (window as any).DWObject = DWObject.current;
            if (DWObject.current.Viewer) {
                DWObject.current.Viewer.bind(document.getElementById(containerId) as HTMLElement)
                DWObject.current.Viewer.width = 400;
                DWObject.current.Viewer.height = 400;
                DWObject.current.Viewer.show()
            }
            // TWAINSCANNER = 0x10, 
            // WIASCANNER = 0x20,
            // TWAINX64SCANNER = 0x40,
            // ICASCANNER = 0x80,
            // SANESCANNER = 0x100,

            //ESCLSCANNER = 0x200,
            //WIFIDIRECTSCANNER = 0x400,
            getSource(0x10 | 0x20 | 0x40 | 0x80 | 0x100)
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
                setDeviceState((preState) => {
                    return { ...preState, deviceList: devices, currenSourceName: devices[0].displayName }
                })
            }).catch(e => console.error(e))
        }
    }

    function acquire() {
        DWObject.current.SelectDeviceAsync(deviceState.deviceList[deviceState.selectSourceIndex]).then(() => {
            return DWObject.current.AcquireImageAsync({
                IfShowUI: deviceState.ifShowUI
            })
        }).then(() => {
            console.log("Acquire Success!")
        }).catch(e => console.error(e))
    }
    function removeAll() {
        DWObject.current.RemoveAllImages()
    }

    function handleSelect(e: ChangeEvent<HTMLSelectElement>) {
        DWObject.current.CloseSource();
        setState((preState) => {
            return { ...preState, currentCapabilityList: [], modifyCapSetUps: [], capStatus: CapStatus.GRAY }
        })
        setDeviceState((preState) => {
            return { ...preState, selectSourceIndex: e.target.selectedIndex, currenSourceName: e.target.value }
        })
    }

    function handleInput(e: ChangeEvent<HTMLInputElement>) {
        let str = e.target.value.toUpperCase();
        setSearchState((preState) => {
            return { ...preState, searchStr: str }
        })
    }

    function handleDeviceTypeChange(e: ChangeEvent<HTMLInputElement>) {
        const { name, checked } = e.target;
        console.log(1)
        // deviceState[name] = checked;
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
    function handleShowUIChange(e: ChangeEvent<HTMLInputElement>) {
        const { checked } = e.target;
        setDeviceState((prevState) => {
            let result = {
                ...prevState,
                ifShowUI: checked,
            }
            return result
        }
        );
    }
    function getCapBySpecificID(capID: any) {
        DWObject.current.getCapabilities([], () => { }, () => { })
    }
    function getCaps(capList: any) {
        DWObject.current.SelectDeviceAsync(deviceState.deviceList[deviceState.selectSourceIndex]).then(() => {
            setLoadingBarState((preState) => {
                preState.isShow = true;
                preState.displayContent = "getCapabilities";
                return { ...preState }
            });
            let successCallback = (cap: CapabilityDetails[]) => {
                (window as any).currentCapList = cap
                console.log(cap)
                setLoadingBarState((preState) => {
                    preState.isShow = false;
                    return { ...preState }
                })
                setState((preState) => {
                    return { ...preState, currentCapabilityList: cap, capStatus: CapStatus.GRAY }
                })
            }
            let failCallback = (c: number, s: string) => {
                setLoadingBarState((preState) => {
                    preState.isShow = false;
                    return { ...preState }
                })
                setState((preState) => {
                    return { ...preState, capStatus: CapStatus.RED }
                })
                console.error(c, s)
            }
            if (capList) {
                DWObject.current.getCapabilities(capList, successCallback, failCallback)
            }
            else {
                DWObject.current.getCapabilities(successCallback, failCallback)
            }
        }).catch(e => console.error(e))
    }
    function showCaps() {
        //18.5 support
        setState((preState) => {
            return { ...preState, isGetSpecificCap: true }
        })
    }

    function setCap() {
        let setCapabliitiesConfig: Capabilities = {
            exception: "fail",
            capabilities: state.modifyCapSetUps,
        }
        setLoadingBarState((preState) => {
            preState.isShow = true;
            preState.displayContent = "setCapabilities";
            return { ...preState }
        })
        console.log(setCapabliitiesConfig)
        DWObject.current.setCapabilities(setCapabliitiesConfig, function (successData) {
            console.log("success", successData);
            setLoadingBarState((preState) => {
                preState.isShow = false;
                return { ...preState }
            })
            setState((preState) => {
                return { ...preState, capStatus: CapStatus.GREEN }
            })
        }, function (failData) {
            console.error("fail", failData)
            alert(JSON.stringify(failData));
            setLoadingBarState((preState) => {
                preState.isShow = false;
                return { ...preState }
            })
            setState((preState) => {
                return { ...preState, capStatus: CapStatus.RED }
            })
        })
    }
    function addModifyCapability(capDetail: CapabilityDetails, key: SetCapKey, value: any) {
        console.log(capDetail, key, value)
        console.log(state.currentCapabilityList)
        setState(prevState => {
            let cap: CapabilitySetup = {
                capability: capDetail.capability.value as number,
                [key]: value
            };
            let found = false;
            let modifiedCaps = prevState.modifyCapSetUps.map(modifyCap => {
                if (modifyCap.capability === cap.capability) {
                    found = true;
                    return cap;
                }
                return modifyCap;
            });

            if (!found) {
                modifiedCaps.push(cap);
            }
            return { ...prevState, modifyCapSetUps: modifiedCaps, capStatus: CapStatus.YELLOW };
        });

    }
    function handleFrameCapability(e: ChangeEvent<HTMLInputElement>, capDetail: CapabilityDetails) {
        let inputs = (e.target.parentElement as HTMLElement).getElementsByTagName("input")
        let setValue = {
            left: Number(inputs[0].value),
            top: Number(inputs[1].value),
            right: Number(inputs[2].value),
            bottom: Number(inputs[3].value),
        }
        addModifyCapability(capDetail, SetCapKey.curValue, setValue)
    }
    function handleRangeCapability(e: ChangeEvent<HTMLInputElement>, capDetail: CapabilityDetails, min: number, max: number) {
        let value = Number(e.target.value) || 0
        if (value < min) {
            value = min;
        } else if (value > max) {
            value = max;
        }
        e.target.value = value.toString();
        if (e.target.nextSibling) {
            (e.target.nextSibling as HTMLInputElement)["value"] = value.toString();
        }
        else if (e.target.previousSibling) {
            (e.target.previousSibling as HTMLInputElement)["value"] = value.toString();
        }
        addModifyCapability(capDetail, SetCapKey.curValue, value);
    }
    function generateSettingUI(capDetail: CapabilityDetails) {
        if (capDetail?.query == undefined) {
            return <td>cant read query</td>
        }
        if (capDetail?.query?.indexOf("set") != -1) {
            // #define TWON_ARRAY           3
            // #define TWON_ENUMERATION     4
            // #define TWON_ONEVALUE        5
            // #define TWON_RANGE           6
            if (capDetail?.conType?.value == 5) {
                // #define TWTY_INT8        0x0000
                // #define TWTY_INT16       0x0001
                // #define TWTY_INT32       0x0002

                // #define TWTY_UINT8       0x0003
                // #define TWTY_UINT16      0x0004
                // #define TWTY_UINT32      0x0005

                // #define TWTY_BOOL        0x0006

                // #define TWTY_FIX32       0x0007

                // #define TWTY_FRAME       0x0008

                // #define TWTY_STR32       0x0009
                // #define TWTY_STR64       0x000a
                // #define TWTY_STR128      0x000b
                // #define TWTY_STR255      0x000c
                // #define TWTY_HANDLE      0x000f
                switch (capDetail?.valueType?.value) {
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                    case 4:
                    case 5:
                    case 7:
                        return <td><input type="number" defaultValue={String(readActualValueForCap(capDetail?.curValue))} onChange={(e) => {
                            addModifyCapability(capDetail, SetCapKey.curValue, Number(e.target.value))
                        }} /></td>
                    case 6:
                        let result = Boolean(readActualValueForCap(capDetail?.curValue));//
                        return <td>
                            <select defaultValue={result.toString()} onChange={(e) => {
                                addModifyCapability(capDetail, SetCapKey.curValue, e.target.value == "true" ? 1 : 0)
                            }}>
                                <option value={true.toString()}>true</option>
                                <option value={false.toString()}>false</option>
                            </select></td>
                    case 8:
                        return <td>left:<input defaultValue={readActualValueForCap((capDetail?.curValue as Frame)["left"])} type='number' onChange={(e) => {
                            handleFrameCapability(e, capDetail)
                        }} />,
                            top:<input type='number' defaultValue={readActualValueForCap((capDetail?.curValue as Frame)["top"])}
                                onChange={(e) => {
                                    handleFrameCapability(e, capDetail)
                                }} />,
                            right:<input type='number' defaultValue={readActualValueForCap((capDetail?.curValue as Frame)["right"])} onChange={(e) => {
                                handleFrameCapability(e, capDetail)
                            }} />,
                            bottom:<input type='number' defaultValue={readActualValueForCap((capDetail?.curValue as Frame)["bottom"])} onChange={(e) => {
                                handleFrameCapability(e, capDetail)
                            }} /></td>
                    case 9:
                    case 10:
                    case 11:
                    case 12:
                        return <td><input type='text' defaultValue={readActualValueForCap(capDetail?.curValue)} onChange={(e) => {
                            addModifyCapability(capDetail, SetCapKey.curValue, e.target.value)
                        }} /></td>
                }
                console.warn(capDetail?.valueType?.value)
                return <td>valueType not support</td>

            }
            else if (capDetail?.conType?.value == 3) {
                //TWON_ARRAY
                return <td><input type="text" defaultValue={JSON.stringify(capDetail?.values)} onChange={(e) => {
                    try {
                        addModifyCapability(capDetail, SetCapKey.values, JSON.parse(e.target.value))
                    }
                    catch (e) {

                    }

                }} /></td>
            }
            else if (capDetail?.conType?.value == 4) {
                //TWON_ENUMERATION     4
                // let values = capDetail?.values; //before 18.5
                //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                let values = capDetail?.enums ? capDetail?.enums : capDetail?.values; //after dwt18.5
                let currentIndex = capDetail?.curIndex
                return <td>
                    <select defaultValue={currentIndex} onChange={(e) => {
                        let selectValue = (values as any[])[e.target.selectedIndex]
                        addModifyCapability(capDetail, SetCapKey.curValue, readActualValueForCap(selectValue))
                    }}>{
                            (values as any[]).map((v, index) => {
                                let type = typeof v
                                if (type == "object") {
                                    if (v["label"]) //v as ValueAndLabel
                                    {
                                        return <option value={index} key={index}>{v["label"]}</option>
                                    }
                                    else //v as normal object
                                    {
                                        return <option value={index} key={index}>{JSON.stringify(v)}</option>
                                    }
                                }
                                else {
                                    return <option value={index} key={index}>
                                        {v}
                                    </option>
                                }

                            })
                        }
                    </select></td>

            }
            else if (capDetail?.conType?.value == 6) {
                let min = readActualValueForCap(capDetail['minValue']);//-1000
                let max = readActualValueForCap(capDetail['maxValue']);//1000
                return <td>
                    <input
                        type="range"
                        min={min}
                        max={max}
                        defaultValue={String(readActualValueForCap(capDetail?.curValue))}
                        onChange={(event) => {
                            handleRangeCapability(event, capDetail, min, max)
                        }}
                    />
                    <input type="number" defaultValue={String(readActualValueForCap(capDetail?.curValue))} onChange={(event) => {
                        handleRangeCapability(event, capDetail, min, max)
                    }} /></td>
            }
            else {
                return <td>type not support</td>
            }
        }
        else {
            return <td>can't set</td>
        }

    }

    function getCurrentValue(capDetail: CapabilityDetails) {
        if (capDetail?.conType?.value == 3) {
            return <td>{JSON.stringify(capDetail?.values)}</td>
        }
        else {
            if ((typeof capDetail.curValue) === 'object') {
                return <td>{JSON.stringify(capDetail.curValue)}</td>
            }
            else {
                return <td>{String(capDetail.curValue)}</td>
            }
        }
    }
    return (
        <>
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
                    <label>IfShowUI<input type='checkbox' checked={deviceState.ifShowUI} onChange={handleShowUIChange}></input></label>
                    <button onClick={() => { acquire() }}>acquire</button>
                    <button onClick={() => { removeAll() }}>removeAll</button>
                </span><br />
                <button onClick={() => { getCaps(null) }}>getAllCaps</button>
                <button onClick={() => { showCaps() }}>getSpecificCaps</button>
                <button onClick={() => { setCap() }}>setCapabilities</button>
                <label>Status:
                    <span className='CapStatus' style={{
                        backgroundColor: state.capStatus,
                    }} ></span>
                </label>
                {
                    state.isGetSpecificCap ? (
                        <div className=''>

                            SpecificCapList: {state.findCapabilityList.length > 0 ? (
                                state.findCapabilityList.map((cap, index) => (
                                    <span className='capSpan' key={index}>
                                        <label>{cap}</label>
                                        <button onClick={() => {
                                            setState(prevState => ({
                                                ...prevState,
                                                findCapabilityList: prevState.findCapabilityList.filter((_, i) => i !== index)
                                            }));
                                        }}>X</button>
                                    </span>
                                ))
                            ) : <span color='brown'>Empty Capability</span>}
                            <button onClick={() => {
                                getCaps(state.findCapabilityList)
                                setState((preState) => {
                                    return { ...preState, isGetSpecificCap: false }
                                })
                            }}>Get</button>
                            <br></br>
                            <div className='autocomplete-container'>
                                CapValue:<input list='options' type='text' value={state.inputAddCap || ''} onChange={(e) => {
                                    setState(prevState => {
                                        return { ...prevState, inputAddCap: Number(e.target.value) };
                                    });
                                }}></input>
                                <datalist id='options'>
                                    {Object.keys(Dynamsoft.DWT.EnumDWT_Cap)
                                        .filter((cap) => Dynamsoft.DWT.EnumDWT_Cap[cap as keyof typeof Dynamsoft.DWT.EnumDWT_Cap] !== Dynamsoft.DWT.EnumDWT_Cap.CAP_NONE)
                                        .map((cap) => {
                                            const value = Dynamsoft.DWT.EnumDWT_Cap[cap as keyof typeof Dynamsoft.DWT.EnumDWT_Cap];
                                            return (
                                                <option key={cap} value={value}>
                                                    {cap}: {value}
                                                </option>
                                            );
                                        })}
                                </datalist>
                                <button onClick={() => {
                                    setState(prevState => {
                                        return {
                                            ...prevState,
                                            findCapabilityList: [...prevState.findCapabilityList, state.inputAddCap as number]
                                        }
                                    });
                                }}>add</button>
                            </div>
                        </div>
                    ) : null
                }
                {state.currentCapabilityList.length > 0 ? (<div>
                    <div>
                        Filter:<input onChange={(e) => { handleInput(e) }}></input>
                    </div>
                    <div className='tableDiv'>
                        <table>
                            <thead>
                                <tr>
                                    <td>index</td>
                                    <td>value</td>
                                    <td>capability</td>
                                    <td>currentValue</td>
                                    <td>query</td>
                                    <td>set value
                                        <button className='clearChange' onClick={() => {
                                            setState(prevState => {
                                                return { ...prevState, modifyCapSetUps: [] };
                                            });
                                        }}>ClearChange</button>
                                    </td>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    state.currentCapabilityList.filter((item) => {
                                        const isModifyItem = state.modifyCapSetUps.some((r) => {
                                            return r.capability == item.capability.value
                                        })
                                        return item.capability.label?.toUpperCase().indexOf(searchState.searchStr) != -1 || item.capability.value?.toString().toUpperCase().indexOf(searchState.searchStr) != -1 || isModifyItem
                                    }).map((item) => {
                                        const filteredIndex = state.currentCapabilityList.findIndex((listItem) => listItem === item);
                                        return (
                                            <tr key={item.capability.value} className={state.modifyCapSetUps.some((r) => {
                                                return r.capability == item.capability.value
                                            }) ? "modifyCapability" : ""}>
                                                <td>{filteredIndex}</td>
                                                <td>{item.capability?.value}</td>
                                                <td>{item.capability?.label}</td>
                                                {
                                                    getCurrentValue(item)
                                                }
                                                <td>{item?.query?.join('|')}</td>
                                                {
                                                    generateSettingUI(item)
                                                }</tr>
                                        )
                                    })
                                }

                            </tbody>
                        </table>
                    </div>
                    {
                        loadingBarState.isShow == true ? (<div className="progress-ring">
                            <div className="progress-circle">
                            </div>
                            <span className='progress-content'> {loadingBarState.displayContent}</span>
                        </div>) : null
                    }
                </div>) : null
                }


            </div>
        </>
    )
}
