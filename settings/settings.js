const { dialog, getCurrentWindow } = require('@electron/remote')
const { ipcRenderer } = require('electron')
console.log( require('@electron/remote'));
const Store = require('electron-store')
const settingsStore = new Store({name: 'Settings'})
const qiniuConfigArr = ['#savedFileLocation', '#accessKey', '#secretKey', '#bucketName']

const $ = (selector) => {
    const res = document.querySelectorAll(selector)
    return res.length > 1 ? res : res[0]
}

document.addEventListener('DOMContentLoaded', () => {
    let savedLocation = settingsStore.get('savedFileLocation')
    if(savedLocation){
        $('#savedFileLocation').value = savedLocation
    }

    qiniuConfigArr.forEach( selector => {
        const savedValue = settingsStore.get(selector.substr(1))
        if(savedValue){
            $(selector).value = savedValue
        }
    })

    $('#selectNewLocation').addEventListener('click', () => {
        dialog.showOpenDialog({
            properties:['openDirectory'],
            message:'选择文件的存储路径'
        }).then(result => {
            if(Array.isArray(result.filePaths)){
                $('#savedFileLocation').value = result.filePaths[0]
            }
        })
    })

    $('#settings-form').addEventListener('submit', (e) => {
        e.preventDefault()
        qiniuConfigArr.forEach( selector => {
            if($(selector)){
                let {id, value} = $(selector)
                settingsStore.set(id, value ? value : '')
            }
        })
        // 动态菜单
        ipcRenderer.send('config-is-saved')
        getCurrentWindow().close()
    })

    $('.nav-tabs').addEventListener('click', (e) => {
        e.preventDefault()
        $('.nav-link').forEach(element => {
            element.classList.remove('active')
        });
        e.target.classList.add('active')
        $('.config-area').forEach(e => {
            e.style.display = 'none'
        })
        $(e.target.dataset.tab).style.display = 'block'
    })
})