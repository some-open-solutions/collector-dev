const {app,
       BrowserWindow,
       dialog,
       remote,
       shell} = require('electron')

const ipc  = require('electron').ipcMain;


ipc.on('open_folder', (event,args) => {

  /*
  //detect if windows
  if(window.navigator.platform.toLowerCase().indexOf("win") !== -1){
    Collector.electron.open_folder("User\\Stimuli");

  //detect if mac
  } else if(window.navigator.platform.toLowerCase().indexOf("mac") !==-1 ){
    Collector.electron.open_folder("User/Stimuli");

  //assume it is linux
  } else {
    Collector.electron.open_folder("User/Stimuli");
  }
  */


  if(process.platform == "darwin"){
    var location = require("os").homedir() +
      "/Documents/Collector/" +
      args["folder"];
  } else {
    var location = app.getAppPath() +
      "\\" +
      args["folder"].replace("/","\\");
  }
  location = location.replace("resources\\app.asar\\","");
  shell.showItemInFolder(
    location
  );
  event.returnValue = location;
});
