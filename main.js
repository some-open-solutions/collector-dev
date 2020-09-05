// Modules to control application life and create native browser window
//require('coffee-script').register();

//const remote = require('remote');
const {app, BrowserWindow} = require('electron')
const path = require('path')


function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    //width: 600,
    //height: 600,
    icon: __dirname + "/logos/collector.ico.png",
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      enableRemoteModule: true
    }
  })
  mainWindow.maximize()

  // and load the index.html of the app.
  mainWindow.loadFile('kitten/index_local.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

/*
* To allow right click to inspect element:
*/

// const contextMenu = require('electron-context-menu');
//
//
// contextMenu({
//     prepend: (defaultActions, params, browserWindow) => [
//         /* some examples of more sophisticated things you can do
//         {
//             label: 'Rainbow',
//             // Only show it when right-clicking images
//             visible: params.mediaType === 'image'
//         },
//         {
//             label: 'Search Google for “{selection}”',
//             // Only show it when right-clicking text
//             visible: params.selectionText.trim().length > 0,
//             click: () => {
//                 shell.openExternal(`https://google.com/search?q=${encodeURIComponent(params.selectionText)}`);
//             }
//         }
//         */
//     ]
// });
