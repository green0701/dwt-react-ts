import React, { useEffect, useRef, useState } from 'react'
import Dynamsoft from 'dwt'
import { WebTwain } from 'dwt/dist/types/WebTwain'
import { ImageEditor } from 'dwt/dist/types/WebTwain.Viewer';
import { key,resourcesPath } from "./environment.ts";
import { BufferChangeInfo } from 'dwt/dist/types/WebTwain.Util';
export default function DWTStorage() {
    interface StorageInfo {
        storageList:string[],
        currentStorage:string,
    }
    let DWObject = useRef<WebTwain>(null!);
    let imageEditor: ImageEditor;
    const containerId = "dwtcontrolContainer"
    let canvas: HTMLCanvasElement
    const [storageInfo,setStorageInfo]=useState<StorageInfo>({
        storageList:[],
        currentStorage:"", 
    })
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
        Dynamsoft.DWT.RegisterEvent("OnWebTwainReady",async () => {
            DWObject.current = Dynamsoft.DWT.GetWebTwain("dwtObject");
            DWObject.current.Viewer.ifAutoScroll=false;
            let curStorageInfo= await syncDatabase()
            if(curStorageInfo.curstorage=="")
            {
                let uid=await DWObject.current.createLocalStorage()
                localStorage.setItem("currentStorage",uid)
                curStorageInfo.storeList.push(uid)
                localStorage.setItem("dwtStorageList", JSON.stringify(curStorageInfo.storeList))
                curStorageInfo=await syncDatabase()
            }
            else
            {
                await DWObject.current.loadFromLocalStorage({uid:curStorageInfo.curstorage as string})
            }
            (window as any).DWObject = DWObject.current;
            DWObject.current.RegisterEvent("OnBufferChanged",(info:BufferChangeInfo)=>{
                console.log("OnBufferChanged")
                DWObject.current.saveToLocalStorage({ uid: curStorageInfo.curstorage as string});
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

  async function syncDatabase() {
    let oldLs = localStorage.getItem("dwtStorageList")
    let storeList: Array<string> = JSON.parse(oldLs || "[]") 
    let curstorage = localStorage.getItem("currentStorage") || ""
    let existList: string[] = []

    for (let i = 0; i < storeList.length; i++) {
        if (DWObject.current) {
            let exist = await DWObject.current.localStorageExist(storeList[i])
            if (exist) {
                existList.push(storeList[i])
            }
        }
    }

    let currentExist = curstorage && await DWObject.current.localStorageExist(curstorage)
    if (currentExist) {
        if (!existList.includes(curstorage)) {
            existList.push(curstorage)
        }
    } else {
        curstorage = ""
        localStorage.setItem("currentStorage", curstorage)
    }

    const ls = JSON.stringify(existList)
    if (oldLs !== ls) {
        localStorage.setItem("dwtStorageList", ls)
    }

    setStorageInfo({
        storageList: existList,
        currentStorage: curstorage
    })

    return {
        storeList: existList,
        curstorage
    }
}


    async function acquireImage() {
        if (DWObject) {
            await DWObject.current.SelectSourceAsync()
            DWObject.current.AcquireImage({}, () => {
                console.log("success")
            }, (c, s) => {
                console.error(c, s)
            })
        }
    }
    function showImageEditor() {
        imageEditor = DWObject.current.Viewer.createImageEditor({
            workMode: Dynamsoft.DWT.EnumDWT_WorkMode.balance,
        })
        imageEditor.show()
    }
    function load() {
        DWObject.current.LoadImageEx("", 5, async () => {
            console.log("bitdepth", DWObject.current.GetImageBitDepth(DWObject.current.CurrentImageIndexInBuffer))
            console.log("width", DWObject.current.GetImageWidth(DWObject.current.CurrentImageIndexInBuffer))
            console.log("height", DWObject.current.GetImageHeight(DWObject.current.CurrentImageIndexInBuffer))
        }, () => { })
    }
    function save() {
        DWObject.current.Addon.PDF.Write.Setup({
        })
        DWObject.current.SaveAllAsPDF("temp.pdf", () => { }, () => { })
    }
    async function removeCurrentStorage()
    {
        DWObject.current.removeLocalStorage({uid:storageInfo.currentStorage})
        await syncDatabase()
    }

    return (
        <>
            <button onClick={() => {removeCurrentStorage()}}>RemoveLocalStorage</button>
            <button onClick={() => { acquireImage() }}>Scan</button>
            <button onClick={() => { showImageEditor() }}>showImageEditor</button>
            <button onClick={() => { load() }}>load</button>
            <button onClick={() => { save() }}>save</button>
            <div id={containerId}></div>
        </>
    )
}
