const {app,
       BrowserWindow,
       dialog,
       remote,
       shell} = require('electron')

const ipc  = require('electron').ipcMain;


ipc.on('open_folder', (event,args) => {
  var location = app.getAppPath() + "\\" + args["folder"];
  console.dir(location);
  shell.showItemInFolder(
    location
  );
  event.returnValue = "success";
});
