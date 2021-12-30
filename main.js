// 控制应用生命周期和创建原生浏览器窗口的模组
const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron')
const isDev = require('electron-is-dev')
const Store = require('electron-store')
const { autoUpdater } = require('electron-updater')
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
  const urlLocation = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, './index.html')}`
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
  //自动更新
  if(isDev){
    autoUpdater.updateConfigPath = path.join(__dirname, 'dev-app-update.yml')
  }
  autoUpdater.autoDownload = false
  autoUpdater.checkForUpdates()
  autoUpdater.on('error', (error) => {
    dialog.showErrorBox('Error: ', error == null ? 'unknown' : ( error.statusCode))
  })
  autoUpdater.on('checking-for-update', () => {
    dialog.showMessageBox({
      title: 'Checking for update...',
      message: 'Checking for update...',
    })
  })
  autoUpdater.on('update-available', () => {
    dialog.showMessageBox({
      type: 'info',
      title: '应用有新版本',
      message: '发现新版本， 是否现在更新?',
      buttons: ['是', '否']
    }, (index) => {
      if( index === 0 ){
        autoUpdater.downloadUpdate()
      }
    })
  })
  autoUpdater.on('update-not-available', () => {
    dialog.showMessageBox({
      title: '没有新版本',
      message: '当前已是新版本',
    })
  })
  autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "Download speed: " + progressObj.bytesPerSecond;
    log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
    log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    dialog.showMessageBox({
      title: log_message,
      message: log_message,
    })
  })
  autoUpdater.on('update-downloaded', (info) => {
    dialog.showMessageBox({
      title: '安装更新',
      message: '更新完毕，应用将重启并进行更新'
    }, () => {
      setImmediate(() => autoUpdater.quitAndInstall())
    })
  });

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
    const { key, path, id } = data
    manager.getStat(key).then((resp) => {
      const serverUpdateTime = Math.round( resp.putTime / 10000 )
      const loaclUpdateTime = filesObj[id].updatedAt
      if(serverUpdateTime > loaclUpdateTime || !loaclUpdateTime){
        manager.downloadFile(key, path).then(() => {
          mainWindow.webContents.send('file-dowbloaded', { status: 'dowbload-success', id})
        })
      }else{
        mainWindow.webContents.send('file-dowbloaded', { status: 'no-now-file', id})
      }
    }, (err) => {
      if(err.statusCode === 612){
        mainWindow.webContents.send('file-dowbloaded', { status: 'no-file', id })
      }
    })
  })

  ipcMain.on('upload-all-to-qiniu', () => {
    mainWindow.webContents.send('loading-status', true)
    const manager = createManager()
    const filesObj = fileStore.get('files') || {}
    const uploadArr = Object.keys(filesObj).map(key => {
      const file = filesObj[key]
      return manager.uploadFile( `${file.title}`, file.path )
    })
    Promise.all(uploadArr).then(res => {
      console.log(res);
      dialog.showMessageBox({
        type:'info',
        title:`成功上传了 ${res.length} 个文件`,
        message:`成功上传了 ${res.length} 个文件`,
      })
      mainWindow.webContents.send('files-uploaded')
    }).catch( err => {
      dialog.showErrorBox('同步失败','请检查七牛云参数是否正确')
    }).finally(() => {
      mainWindow.webContents.send('loading-status', false)
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