// Modules to control application life and create native browser window
//require('coffee-script').register();

//const remote = require('remote');

const {app,
       BrowserWindow,
       dialog,
       remote,
       socket} = require('electron')

const ipc = require('electron').ipcMain;

const fs   = require('fs')
const path = require('path')


function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    icon: __dirname + "/logos/collector.ico.png",
    webPreferences: {
      enableRemoteModule: true,
      //nodeIntegration :true,
      preload: path.join(__dirname, 'preload.js')
      //preload: path.join(app.getAppPath(), 'preload.js')
    }
  })
  mainWindow.maximize()

  // and load the index.html of the app.
  mainWindow.loadFile(__dirname +'/kitten/index_local.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}
app.on('ready', createWindow)
app.on('window-all-closed', function () {
 if (process.platform !== 'darwin') {
  app.quit()
 }
})

app.on('activate', function () {
 if (mainWindow === null) {
  createWindow()
 }
})



/*
* Functions to read and write in User Folder
*/


ipc.on('read_file', (event,args) => {
  /*
  * Security checks
  */
  if(args["user_folder"].indexOf("../") !== -1){
    var content = "This request could be insecure, and was blocked";
  } else if(args["this_file"].indexOf("../") !== -1){
    var content = "This request could be insecure, and was blocked";
  } else {
    var content = fs.readFileSync("User/" +
                                    args["user_folder"] + "/" +
                                    args["this_file"]   + "/",
                                  'utf8');
    event.returnValue = content;
  }
});


/*
* To allow right click to inspect element:
*/

const contextMenu = require('electron-context-menu');



function awaiting_trigger(){


  // Asynchronous read
  fs.readFile('hall_of_fame.csv', function (err, data) {
    if (err) {
      return console.error(err);
    }
    console.log("Asynchronous read: " + data.toString());
  });

  // Synchronous read

  console.log("Synchronous read: " + data.toString());
  console.log("Program Ended");
}


contextMenu({
    prepend: (defaultActions, params, browserWindow) => [
        {
            label: 'Rainbow',
            // Only show it when right-clicking images
            visible: params.mediaType === 'image'
        },
        {
            label: 'Search Google for “{selection}”',
            // Only show it when right-clicking text
            visible: params.selectionText.trim().length > 0,
            click: () => {
              dialog.showOpenDialog((fileNames) => {
                // fileNames is an array that contains all the selected
                  if(fileNames === undefined){
                      console.log("No file selected");
                      return;
                  }

                  fs.readFile(filepath, 'utf-8', (err, data) => {
                      if(err){
                          alert("An error ocurred reading the file :" + err.message);
                          return;
                      }

                      // Change how to handle the file content
                      console.log("The file content is : " + data);
                  });
              });

                //shell.openExternal(`https://google.com/search?q=${encodeURIComponent(params.selectionText)}`);
            }
        }
    ]
});
