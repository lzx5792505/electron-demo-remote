// 控制应用生命周期和创建原生浏览器窗口的模组
const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron')
const isDev = require('electron-is-dev')
const Store = require('electron-store')
const path = require('path')
const menuTemplate = require('./src/utils/menuTemplate')
const AppWindow = require('./src/AppWindow')
const settingsStore = new Store({ name: 'Settings' })
const fileStore = new Store({'name': 'Files Data'})
const QiniuManager = require('./src/utils/QiniuManager')

let mainWindow, settingWindow

const createManager = () => {
  const accessKey = settingsStore.get('accessKey')
  const secretKey = settingsStore.get('secretKey')
  const bucketName = settingsStore.get('bucketName')
  return new QiniuManager(accessKey, secretKey, bucketName)
}

function createWindow () {
  // 创建浏览器窗口
  const mainWindowConfig = {
    width: 1064,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  }
  // 初始化 remote 
  require('@electron/remote/main').initialize()

  // 加载URL
  const urlLocation = isDev ? 'http://localhost:3000' : 'dummyurl'
  mainWindow =  new AppWindow(mainWindowConfig, urlLocation)
  
  // 主界面使用remote
  require('@electron/remote/main').enable(mainWindow.webContents)

  mainWindow.on('closed',() => {
    mainWindow = null
  })

  ipcMain.on('open-setting-window', () => {
    const settingWindowConfig = {
      width: 500,
      height: 400,
      parent:mainWindow,
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: true,
        contextIsolation: false,
      }
    }

    const settingLocation = `file://${path.join(__dirname, './settings/settings.html')}`
    settingWindow = new AppWindow(settingWindowConfig, settingLocation)
    // settingWindow.removeMenu()
    settingWindow.on('closed', () => {
      settingWindow = null
    })

    // 子界面使用remote
    require('@electron/remote/main').enable(settingWindow.webContents)
  })

}

// 这段程序将会在 Electron 结束初始化
// 和创建浏览器窗口的时候调用
// 部分 API 在 ready 事件触发后才能使用。
app.whenReady().then(() => {
  createWindow()

  // 初始化 electron-store
  Store.initRenderer()

  //设置菜单
  let menu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(menu)

  ipcMain.on('config-is-saved', () => {
    //苹果 和  win 区别
    let qiniuMenu = process.platform === 'darwin' ? menu.items[3] : menu.items[2]
    const switchItems = (toggle) => {
      [1,2,3].forEach(num => {
        qiniuMenu.submenu.items[num].enabled =  toggle
      })
    }
    const qiniuConfiged = ['accessKey', 'secretKey', 'bucketName'].every( key => !!settingsStore.get(key))
    if(qiniuConfiged){
      switchItems(true)
    } else {
      switchItems(false)
    }
  })

  ipcMain.on('upload-file', ( event, data ) => {
    const manager = createManager()
    manager.uploadFile( data.key, data.path ).then( data => {
      mainWindow.webContents.send('active-file-uploaded')
    }).catch( err => {
      dialog.showErrorBox('同步失败','请检查七牛云参数是否正确')
    })
  })

  ipcMain.on('download-file', ( event, data ) => {
    const manager = createManager()
    const filesObj = fileStore.get('files')
    manager.getStat(data.key).then((resp) => {
      console.log(filesObj[data.id],resp);
    }, (err) => {
      // console.log(err);
      if(err.statusCode === 612){
        mainWindow.webContents.send('file-downloaded', { status: 'no-file' })
      }
    })
  })

  app.on('activate', function () {
    // 通常在 macOS 上，当点击 dock 中的应用程序图标时，如果没有其他
    // 打开的窗口，那么程序会重新创建一个窗口。
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// 除了 macOS 外，当所有窗口都被关闭的时候退出程序。 因此，通常对程序和它们在
// 任务栏上的图标来说，应当保持活跃状态，直到用户使用 Cmd + Q 退出。
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// 在这个文件中，你可以包含应用程序剩余的所有部分的代码，
// 也可以拆分成几个文件，然后用 require 导入。