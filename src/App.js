import React, { useState } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css'
import FileSearch from './components/FileSearch';
import FileList from './components/FileList';
import BottomBtn from './components/BottomBtn';
import TabList from './components/TabList';
import { objToArr, flattenArr } from './utils/helper'
import uuidv4 from 'uuid/dist/v4'
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";
import { faPlus, faFileImport, faSave } from '@fortawesome/free-solid-svg-icons'

//node api
import { writeFile, renameFile, delFile, readFile } from './utils/fileHelper'
const { join, basename, extname, dirname } = window.require('path')
//electron api
const { app, dialog } = window.require('@electron/remote')
const Store = window.require('electron-store')
//本地存储
const fileStore = new Store({'name': 'Files Data'})
const saveFilesToStore = (files) => {
  const filesStoreObj = objToArr(files).reduce((result, file) => {
    const {id, path, title, createdAt } = file
    result[id] = {
      id,
      path,
      title,
      createdAt
    }
    return result
  },{})
  fileStore.set('files', filesStoreObj)
} 

function App() {
  const [files, setFiles ] =  useState(fileStore.get('files') || {})
  const [ activeFileID, setActiveFileID ] = useState('')
  const [ opnedFileIDs, setOpnedFileIDs ] = useState([])
  const [ unsavedFileIDs, setUnsavedFileIDs ] = useState([])
  const [ searchedFiles, setSearchedFiles ] = useState([])
  const filesArr = objToArr(files)
  const savedLocation = app.getPath('documents')

  const openedFiles = opnedFileIDs.map(openID => {return files[openID]})
  const activeFile = files[activeFileID]
  const fileListArr = (searchedFiles.length > 0) ? searchedFiles : filesArr

  const fileClick = (fileID) => {
    setActiveFileID(fileID)

    const currentFile = files[fileID]
    if(!currentFile.isLoaded){
      readFile(currentFile.path).then(value => {
        const newFile = { ...files[fileID], body: value, isLoaded: true}
        setFiles({ ...files, [fileID]: newFile })
      })
    }

    if(!opnedFileIDs.includes(fileID)){
      setOpnedFileIDs([ ...opnedFileIDs, fileID ])
    }
  }

  const tabClick = (fileID) => {
    setActiveFileID(fileID)
  }

  const tabClose = (id) => {
    const tabWithout = opnedFileIDs.filter( fileID => fileID !== id )
    setOpnedFileIDs(tabWithout)
    if(tabWithout.length > 0){
      if(tabWithout.includes(activeFile.id)){
        setActiveFileID(activeFile.id)
      }else{
        setActiveFileID(tabWithout[0])
      }
      
    }else{
      setActiveFileID('')
    }
  }

  const fileChange = (id,value) => {
    if (files[id].body === value) {
      return;
    }
    if(files[id].body !== value){
      const newFiles = { ...files[id], body: value}
      setFiles({ ...files, [id]: newFiles })
      if(!unsavedFileIDs.includes(id)){
        setUnsavedFileIDs([ ...unsavedFileIDs, id ])
      }
    }
  }

  const deleteFile = (id) => {
    if(files[id].isNew){
      const { [id]: value, ...afterDelete } = files
      setFiles(afterDelete)
    }else{
      delFile(files[id].path).then(() => {
        const { [id]: value, ...afterDelete } = files
        setFiles(afterDelete)
        saveFilesToStore(afterDelete)
        tabClose(id)
      })
    }
  }

  const updateFileName = (id, title, isNew) => {
    const newPath = isNew 
    ? join(savedLocation, `${title}.md`)
    :join(dirname(files[id].path), `${title}.md`)

    const modifFile = { ...files[id], title, isNew:false, path: newPath}
    const newFiles = { ...files, [id]:modifFile }
    if( isNew ){
      writeFile(newPath, files[id].body).then(() => {
        setFiles(newFiles)
        saveFilesToStore(newFiles)
      })
    } else {
      const oldPath = files[id].path
      renameFile(oldPath, newPath).then(() => {
        setFiles(newFiles)
        saveFilesToStore(newFiles)
      })
    }
  }

  const fileSearch = (keyword) => {
    const newFiles = filesArr.filter(file => file.title.includes(keyword))
    setSearchedFiles(newFiles)
  }

  const createNewFile = () => {
    const newID = uuidv4()
    const newFiles = {
      id: newID,
      title:'',
      body: '## 请输入 makrdown',
      createdAt: new Date().getTime(),
      isNew:true
    }
    setFiles({ ...files, [newID]:newFiles})
  }

  const saveCurrentFile = () => {
    writeFile(activeFile.path, activeFile.body).then(() => {
      setUnsavedFileIDs(unsavedFileIDs.filter(id => id !== activeFile.id))
    })
  }

  const importFiles = () => {
    dialog.showOpenDialog({
      title:'选择导入的 Markdown 文件',
      properties:[ 'openFile', 'multiSelections' ],
      filters:[{ name:'Markdown files', extensions:['md'] }]
    }).then(result => {
      if(Array.isArray(result.filePaths)){
        const filteredPaths = result.filePaths.filter(path => {
          const alreadyyAdded = Object.values(files).find(file => {
            return file.path === result.filePaths
          })
          return !alreadyyAdded
        })

        const importFilesArr = filteredPaths.map(path => {
          return {
            id:uuidv4(),
            title:basename(path, extname(path)),
            path
          }
        })

        const newFiles = { ...files, ...flattenArr(importFilesArr)}

        setFiles(newFiles)
        saveFilesToStore(newFiles)
        if(importFilesArr.length > 0){
          dialog.showMessageBox({
            type:'info',
            title:`文件导入成功`,
            message:`成功导入${importFilesArr.length}个文件`,
          })
        }
      }
    }).catch(err => {
      console.log(err)
    })
  }

  return (
    <div className="App container-fluid px-0">
      <div className="row g-0">
        <div className="col-3 left-panel">
          <FileSearch 
            onFileSearch={ fileSearch }
          />
          <FileList 
            files={ fileListArr }
            onFileClick={ fileClick }
            onSaveEdit={ updateFileName }
            onFileDelete={ deleteFile }
          />
          <div className="row g-0 button-group">
            <div className="col">
                <BottomBtn
                  text="新建"
                  colorClass="btn-primary"
                  icon={faPlus}
                  onBtnClick={ createNewFile }
                />
            </div>
            <div className="col">
              <BottomBtn
                text="导入"
                colorClass="btn-success"
                icon={faFileImport}
                onBtnClick={importFiles}
              />
            </div>
          </div>
        </div>
        <div className="col-9 right-panel">
          {
            !activeFile && 
            <div className="start-page">
              选择或者创建新的 Markdown 文档
            </div>

          }
          {
            activeFile &&
            <>
              <TabList 
                files={ openedFiles }
                activeId={ activeFileID }
                unsaveIds={ unsavedFileIDs }
                onTabClick={ tabClick }
                onCloseTab={ tabClose }
              />
              <SimpleMDE
                key={ activeFile && activeFile.id } 
                value={ activeFile && activeFile.body }
                onChange={ (value) => { fileChange(activeFile.id, value) }}
                options={{
                  lineNumbers:false,
                  minHeight:'388px'
                }}
              />
              <BottomBtn
                text="保存"
                colorClass="btn-success"
                icon={faSave}
                onBtnClick={saveCurrentFile}
              />
            </>
          }
        </div>
      </div>
    </div>
  );
}

export default App;
