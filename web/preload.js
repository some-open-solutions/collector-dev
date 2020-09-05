window.onload=function(){
  setTimeout(function(){
    const ipc      = require('electron').ipcRenderer;

    Collector.electron = {
      read_file:function(user_folder,
                         this_file,
                         file_action){
        file_content = ipc.sendSync('read_file',{
          "user_folder" : user_folder,
          "this_file"   : this_file
        });
        file_action(file_content);
      },
      first_function:function(){
        console.dir("howdy");
      }
    }


    /*

    syncBtn = document.getElementById("syncBtn")

    //syncBtn  = document.querySelector('#syncBtn'),
    asyncBtn = document.querySelector('#asyncBtn');

    let replyDiv = document.querySelector('#reply');

    syncBtn.addEventListener('click', () => {
     let
     reply = ipc.sendSync('synMessage','A sync message to main');
     replyDiv.innerHTML = reply;
    });

    asyncBtn.addEventListener('click', () => {
     ipc.send('aSynMessage','A async message to main')
    });

    ipc.on('asynReply', (event, args) => {
     replyDiv.innerHTML = args;
    });
    */
  },5000);
}
