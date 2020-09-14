window.onload=function(){
  const ipc      = require('electron').ipcRenderer;

  wait_for_collector = setInterval(function(){
    console.dir(Collector);
    if(typeof(Collector) !== "undefined"){
      clearInterval(wait_for_collector);
      Collector.electron = {
        delete_experiment: function(exp_name,
                                    file_action){
          delete_response = ipc.sendSync('delete_experiment',{
            "exp_name" : exp_name
          });
          file_action(delete_response);
        },
        delete_survey: function(survey_name,
                                file_action){
          delete_response = ipc.sendSync('delete_survey',{
            "survey_name" : survey_name
          });
        },
        delete_trialtype: function(exp_name,
                                   file_action){
          delete_response = ipc.sendSync('delete_trialtype',{
            "trialtype_name" : exp_name
          });
          file_action(delete_response);
        },
        list_trialtypes: function(){
          return ipc.sendSync('list_trialtypes');
        },
        read_default: function(user_folder,
                               this_file){
          file_content = ipc.sendSync('read_default',{
            "user_folder" : user_folder,
            "this_file"   : this_file
          });
          return file_content;
        },
        read_file: function(user_folder,
                            this_file){
          file_content = ipc.sendSync('read_file',{
            "user_folder" : user_folder,
            "this_file"   : this_file
          });
          return file_content;
        },
        write_experiment: function(this_experiment,
                                   file_content,
                                   file_action){
          write_response = ipc.sendSync('write_experiment',{
            "this_experiment" : this_experiment,
            "file_content"    : file_content
          });
          file_action(write_response);
        },
        write_file: function(
          user_folder,
          this_file,
          file_content
        ){
          write_response = ipc.sendSync('write_file',{
            "user_folder"  : user_folder,
            "this_file"    : this_file,
            "file_content" : file_content
          });
          return write_response;
        }
      }
    }
  },100);
}
