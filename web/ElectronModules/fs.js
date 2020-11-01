const fs   = require('fs-extra')
const ipc  = require('electron').ipcMain;

/*
* fs functions in alphabetical order
*/


ipc.on('fs_delete_experiment', (event,args) => {

  /*
  * Security checks - should probably have more
  */

  if(args["exp_name"].indexOf("..") !== -1){
    var content = "This request could be insecure, and was blocked";
  } else {
    try{
      // delete the file
      fs.unlinkSync(
        "User/Experiments/" + args["exp_name"] + ".json"
      );
      // delete the folder
      fs.rmdirSync(
        "User/Experiments/" + args["exp_name"],
         {
           recursive: true
         }
      );
      event.returnValue = "success";
    } catch(error){
      //to trigger an attempt to load a trialtype from the master_json
      event.returnValue = "failed to delete: " + error;
    }

  }
});

ipc.on('fs_delete_survey', (event,args) => {

  /*
  * Security checks - should probably have more
  */

  if(args["survey_name"].indexOf("..") !== -1){
    event.returnValue = "This request could be insecure, and was blocked";
  } else {
    try{
      var content = fs.unlinkSync("User/Surveys/" +
                                  args["survey_name"].replace(".csv","") +
                                  ".csv");
      event.returnValue = "success";
    } catch(error){
      event.returnValue = "failed to delete the survey: " +
                          error;
    }

  }
});

ipc.on('fs_delete_trialtype', (event,args) => {

  /*
  * Security checks - should probably have more
  */

  if(args["trialtype_name"].indexOf("..") !== -1){
    event.returnValue = "This request could be insecure, and was blocked";
  } else {
    try{
      var content = fs.unlinkSync("User/Trialtypes/" +
                                  args["trialtype_name"] +
                                  ".html");
      event.returnValue = "success";
    } catch(error){
      event.returnValue = "failed to delete the trialtype: " +
                          error;
    }

  }
});

ipc.on('fs_list_trialtypes', (event,args) => {
  /*
  * list all files in "Trialtypes" folder
  */
  event.returnValue = JSON.stringify(
    fs.readdirSync("User/Trialtypes")
  );
});

ipc.on('fs_read_default', (event,args) => {
  /*
  * Security checks - should probably have more
  */
  if(args["user_folder"].indexOf("..") !== -1){
    var content = "This request could be insecure, and was blocked";
  } else if(args["this_file"].indexOf("../") !== -1){
    var content = "This request could be insecure, and was blocked";
  } else {
    try{
      var content = fs.readFileSync("Default/Default" +
                                      args["user_folder"] + "/" +
                                      args["this_file"]   + "/",
                                    'utf8');
      event.returnValue = content;
    } catch(error){
      //to trigger an attempt to load a trialtype from the master_json
      event.returnValue = "";
    }

  }
});

ipc.on('fs_read_file', (event,args) => {
  /*
  * Security checks - should probably have more
  */
  if(args["user_folder"].indexOf("..") !== -1){
    var content = "This request could be insecure, and was blocked";
  } else if(args["this_file"].indexOf("../") !== -1){
    var content = "This request could be insecure, and was blocked";
  } else {
    /*
    * create User folder if it doesn't exist (and all the relevant subfolders)
    */
    if(!fs.existsSync("User")){
      fs.mkdirSync("User");
    }
    if(!fs.existsSync("User/Data")){
      fs.mkdirSync("User/Data");
    }
    if(!fs.existsSync("User/Experiments")){
      fs.mkdirSync("User/Experiments");
    }
    if(!fs.existsSync("User/Stimuli")){
      fs.mkdirSync("User/Stimuli");
    }
    if(!fs.existsSync("User/Surveys")){
      fs.mkdirSync("User/Surveys");
    }
    if(!fs.existsSync("User/Trialtypes")){
      fs.mkdirSync("User/Trialtypes");
    }

    try{
      var content = fs.readFileSync("User"                + "/" +
                                      args["user_folder"] + "/" +
                                      args["this_file"],
                                    'utf8');
      event.returnValue = content;
    } catch(error){
      //to trigger an attempt to load a trialtype from the master_json
      event.returnValue = "";
    }

  }
});

ipc.on('fs_write_data', (event,args) => {

  /*
  * Security checks - should probably have more
  */

  if(args["experiment_folder"].indexOf("../") !== -1){
    var content = "This request could be insecure, and was blocked";
  } else if(args["this_file"].indexOf("../") !== -1){
    var content = "This request could be insecure, and was blocked";
  } else {
    try{

      /*
      * create experiment folder if it doesn't exist yet
      */

      if(!fs.existsSync(
          "User/Data/" + args["experiment_folder"]
        )
      ){
        fs.mkdirSync(
          "User/Data/" + args["experiment_folder"]
        )
      }
      var content = fs.writeFileSync(
        "User/Data/" + args["experiment_folder"] + "/" +
        args["this_file"]   ,
        args["file_content"],
        'utf8'
      );
      event.returnValue = "success";
    } catch(error){
      //to trigger an attempt to load a trialtype from the master_json
      event.returnValue = error;
    }

  }

});

ipc.on('fs_write_experiment', (event,args) => {

  /*
  * Security checks - probably need more
  */

  if(args["this_experiment"].indexOf("..") !== -1){
    var content = "This request could be insecure, and was blocked";
  } else {
    try{
      /*
      * save JSON
      */
      fs.writeFileSync(
        "User/Experiments/" +
         args["this_experiment"] + ".json",
         args["file_content"],
         'utf8'
       );

      /*
      * Create folder if it doesn't exist
      */
      if(!fs.existsSync(
          "User/Experiments/" + args["this_experiment"]
        )
      ){
        fs.mkdirSync(
          "User/Experiments/" + args["this_experiment"]
        )
      }

      /*
      * save specific csvs
      */
      parsed_contents = JSON.parse(args["file_content"]);

      fs.writeFileSync(
        "User/Experiments/" +
          args["this_experiment"] + "/" +
          "conditions.csv",
         parsed_contents["conditions_csv"],
         "utf-8"
       );

       Object.keys(parsed_contents.procs_csv).forEach(function(this_proc){
         fs.writeFileSync(
           "User/Experiments/" +
            args["this_experiment"] + "/" +
            this_proc,
            parsed_contents.procs_csv[this_proc]
          );
       });

       Object.keys(parsed_contents.stims_csv).forEach(function(this_stim){
         fs.writeFileSync(
           "User/Experiments/" +
            args["this_experiment"] + "/" +
            this_stim,
            parsed_contents.stims_csv[this_stim]
          );
       });
      event.returnValue = "success";
    } catch(error){
      //to trigger an attempt to load a trialtype from the master_json
      event.returnValue = "failed to save " + error;
    }
  }
});

ipc.on('fs_write_file', (event,args) => {

  /*
  * Security checks - should probably have more
  */

  if(args["user_folder"].indexOf("../") !== -1){
    var content = "This request could be insecure, and was blocked";
  } else if(args["this_file"].indexOf("../") !== -1){
    var content = "This request could be insecure, and was blocked";
  } else {
    try{
      var content = fs.writeFileSync("User/" +
                                       args["user_folder"] + "/" +
                                       args["this_file"]   + "/",
                                       args["file_content"],
                                     'utf8');
      event.returnValue = "success";
    } catch(error){
      //to trigger an attempt to load a trialtype from the master_json
      event.returnValue = "failed to save";
    }

  }
});
