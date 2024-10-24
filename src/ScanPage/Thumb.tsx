import React, { useEffect, useRef, useState } from 'react'
import Dynamsoft from 'dwt'
import { WebTwain } from 'dwt/dist/types/WebTwain'
import { ImageEditor } from 'dwt/dist/types/WebTwain.Viewer';
import { key,resourcesPath } from "./environment.ts";
import "./Thumb.css"
import { BufferChangeInfo } from 'dwt/dist/types/WebTwain.Util';
export default function Thumb() {
    let DWObject = useRef<WebTwain>(null!);
    const galleryRef = useRef<HTMLDivElement>(null!);
    let imageEditor: ImageEditor;
    const containerId = "dwtcontrolContainer"
    const [imageMapList, setImageMapList] = useState<Array<{
        imageID:string,
        imageURL:string,
        highlight:boolean,
        seperate:boolean,
        isCurrentSelect:boolean,
    }>>([]);
    const [showLoading, setShowLoading] = useState(false);
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
                Width: 400,
                Height: 600
            },
        ];
        Dynamsoft.DWT.RegisterEvent("OnWebTwainReady", () => {
            DWObject.current = Dynamsoft.DWT.GetWebTwain("dwtObject");
            DWObject.current.Viewer.setViewMode(-1,-1);
            (window as any).DWObject = DWObject.current;
            DWObject.current.Viewer.ifAutoScroll=true
            DWObject.current.RegisterEvent("OnBufferChanged", (changeInfo:BufferChangeInfo) => {
                //'add', 'remove', 'modify', 'shift' and 'filter'
                let currentIndex=DWObject.current.CurrentImageIndexInBuffer;
                if(changeInfo.action=="shift")
                {
                    // thumbGotoPage(DWObject.current.CurrentImageIndexInBuffer); //
                    setImageMapList((prevImageMapList)=>{
                        return prevImageMapList.map((item, i) => {
                            if (i === currentIndex) {
                                return { ...item,isCurrentSelect:true};
                            } else {
                                return { ...item,isCurrentSelect:false};
                            }
                        }) 
                    })
                }
                else if(changeInfo.action=="modify")
                {
                    console.log(changeInfo.modifiedId) 
                    setImageMapList((prevImageMapList)=>{
                        return prevImageMapList.map((item, i) => {
                            if (item.imageID === changeInfo.modifiedId) {
                                return { ...item,imageURL:DWObject.current.GetImageURL(DWObject.current.ImageIDToIndex(item.imageID))};
                            } else {
                                return item;
                            }
                        }) 
                    })
                }
                else
                {
                    setImageMapList((prevImageMapList)=>{
                        let newMap = [];
                        let newimageIds=changeInfo.imageIds
                        for (let i = 0; i < newimageIds.length; i++) {
                            let found = false;
                            for (let j = 0; j < prevImageMapList.length; j++) {
                                if (newimageIds[i] === prevImageMapList[j].imageID) {
                                    newMap.push(prevImageMapList[j]);
                                    found = true;
                                    break;
                                }
                            }
                            if (!found) {
                                newMap.push({ imageID: newimageIds[i],imageURL:DWObject.current.GetImageURL(i),highlight:false,seperate:false});
                            }
                        }
                        let removedItems = prevImageMapList.filter(item => !newimageIds.includes(item.imageID));
                        for (let k = 0; k < removedItems.length; k++) {
                            newMap = newMap.filter(item => item.imageID !== removedItems[k].imageID);
                        }
                        return newMap.map((item, i) => {
                            if (i === currentIndex) {
                                return { ...item,isCurrentSelect:true};
                            } else {
                                return { ...item,isCurrentSelect:false};
                            }
                        }) 
                    })
                    if(DWObject.current.Viewer.ifAutoScroll&&changeInfo.action=="add")
                    {
                        setTimeout(()=>{
                            thumbGotoPage(DWObject.current.CurrentImageIndexInBuffer) //wait for render!can be optimized!
                        },0)
                    }
                    
                }  
            })
        });
        console.log("dwt load")
        Dynamsoft.DWT.Load();
        return () => {
            console.log("dwt unload")
            Dynamsoft.DWT.Unload()
        }
    }, [])
    async function acquireImage() {
        if (DWObject.current) {
            await DWObject.current.SelectSourceAsync()
            setShowLoading(true);
            DWObject.current.AcquireImage({}, () => {
                console.log("success")
                setShowLoading(false);
            }, (c, s) => {
                console.error(c, s)
                setShowLoading(false);
            })
        }
    }
    function thumbGotoPage(index:number) {
        const dwtImageList = galleryRef.current.querySelectorAll(".dwtImg")
        // console.log("thumbGotoPage",DWObject.current.CurrentImageIndexInBuffer)
        dwtImageList[index]?.scrollIntoView({
            behavior: "auto",
            block: "start",
        })
    }
    (window as any).thumbGotoPage=thumbGotoPage;
    function showImageEditor() {
        imageEditor = DWObject.current.Viewer.createImageEditor({
            workMode: Dynamsoft.DWT.EnumDWT_WorkMode.balance,
        })
        imageEditor.show()
    }
    function load() {
        // DWObject.current.Addon.PDF.SetReaderOptions({
        //     convertMode: Dynamsoft.DWT.EnumDWT_ConvertMode.CM_RENDERALL,
        //     password: "123",
        //     renderOptions: {
        //         renderAnnotations: true,
        //         resolution: 100,
        //         maxWidth: 2000,
        //         maxHeight: 2000,
        //         renderGrayscale: false,
        //     }
        // })
        DWObject.current.LoadImageEx("", 5, async () => {
            console.log("bitdepth", DWObject.current.GetImageBitDepth(DWObject.current.CurrentImageIndexInBuffer))
            console.log("width", DWObject.current.GetImageWidth(DWObject.current.CurrentImageIndexInBuffer))
            console.log("height", DWObject.current.GetImageHeight(DWObject.current.CurrentImageIndexInBuffer))
        }, () => { })
    }
    function save() {
        DWObject.current.Addon.PDF.Write.Setup({
            // docCompressor: {
            //     enabled: true,
            // }
        })
        DWObject.current.SaveAllAsPDF("temp.pdf", () => { }, () => { })
    }
    function remove(index:number)
    {
        DWObject.current.RemoveImage(index)
    }
    function rotateCurrent() {
        DWObject.current.RotateRight(DWObject.current.CurrentImageIndexInBuffer,()=>{},()=>{})
    }
    function highlightImg(index:number) {
        setImageMapList((prevImageMapList)=>{
            return prevImageMapList.map((item, i) => {
                if (i === index) {
                    return { ...item, highlight: true };
                } else {
                    return item;
                }
            })
        })
    }

    function seperateDoc(index:number) {
        setImageMapList((prevImageMapList)=>{
            return prevImageMapList.map((item, i) => {
                if (i === index) {
                    return { ...item, seperate: true };
                } else {
                    return item;
                }
            })
        })
    }
    function gotoPage(index:number)
    {
        DWObject.current.Viewer.gotoPage(index)
    }

    return (
        <>
            <button onClick={() => { acquireImage() }}>Scan</button>
            <button onClick={() => { showImageEditor() }}>showImageEditor</button>
            <button onClick={() => { load() }}>load</button>
            <button onClick={() => { save() }}>save</button>
            <button onClick={() => { remove(DWObject.current.CurrentImageIndexInBuffer)}}>removeCurrent</button>
            <button onClick={() => { rotateCurrent() }}>rotateCurrent</button>
            <button onClick={() => { highlightImg(DWObject.current.CurrentImageIndexInBuffer) }}>highlightImg</button>
            <button onClick={() => { seperateDoc(DWObject.current.CurrentImageIndexInBuffer) }}>seperateDoc</button>
            <div className='dwtContainer'>
                    <div ref={galleryRef} className='gallery'>
                    {
                    imageMapList.map((data, index) => (
                        <div className={`dwtImgContainer ${data.seperate ? 'seperate' : ''}`} key={data.imageID}>
                            <img onClick={()=>{gotoPage(index)}} className={`dwtImg ${data.highlight ? 'highlightImg' : ''} ${data.isCurrentSelect ? 'currentImg' : ''}`} src={data.imageURL} alt={`Image:${data.imageID}`} />
                        </div>
                    ))
                    }
                     {showLoading ? <div className='loading'></div> : null}
                </div>
                <div id={containerId}></div>
            </div>
        </>
    )
}
