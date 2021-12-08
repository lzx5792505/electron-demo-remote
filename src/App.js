import React, { useState } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css'
import FileSearch from './components/FileSearch';
import FileList from './components/FileList';
import BottomBtn from './components/BottomBtn';
import TabList from './components/TabList';
import { flattenArr, objToArr } from './utils/helper'
import uuidv4 from 'uuid/dist/v4'
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";
import { faPlus, faFileImport, faSave } from '@fortawesome/free-solid-svg-icons'
import defaultFiles from './utils/dataFiles';

//node api
import { writeFile, renameFile } from './utils/fileHelper'
const { join } = window.require('path')
const { app } = window.require('@electron/remote')
//electron api


function App() {
  const [files, setFiles ] =  useState(flattenArr(defaultFiles))
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
    delete files[id]
    setFiles(files)
    tabClose(id)
  }

  const updateFileName = (id, title, isNew) => {
    const modifFile = { ...files[id], title, isNew:false}
    if( isNew ){
      writeFile(join(savedLocation, `${title}.md`), files[id].body).then(() => {
        setFiles({ ...files, [id]:modifFile })
      })
    } else {
      renameFile(join(savedLocation, `${files[id].title}.md`), join(savedLocation, `${title}.md`)).then(() => {
        setFiles({ ...files, [id]:modifFile })
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
    writeFile(join(savedLocation, `${activeFile.title}.md`), activeFile.body).then(() => {
      setUnsavedFileIDs(unsavedFileIDs.filter(id => id !== activeFile.id))
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
