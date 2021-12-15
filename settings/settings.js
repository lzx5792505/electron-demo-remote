const { dialog, getCurrentWindow } = require('@electron/remote')
const Store = require('electron-store')
const settingsStore = new Store({name: 'Settings'})


function $(selector) {
    return window.document.querySelector(selector);
  }

document.addEventListener('DOMContentLoaded', () => {
    let savedLocation = settingsStore.get('savedFileLocation')
    if(savedLocation){
        $('#savedFileLocation').value = savedLocation
    }

    $('#selectNewLocation').addEventListener('click', () => {
        dialog.showOpenDialog({
            properties:['openDirectory'],
            message:'选择文件的存储路径'
        }).then(result => {
            console.log(result.filePaths);
            if(Array.isArray(result.filePaths)){
                $('#savedFileLocation').value = result.filePaths[0]
                savedLocation = result.filePaths[0]
            }
        })
    })

    $('#settings-form').addEventListener('submit', () => {
        settingsStore.set('savedFileLocation', savedLocation)
        getCurrentWindow().close()
    })
})