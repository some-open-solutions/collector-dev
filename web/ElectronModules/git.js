/*
* Github management
*/
const fs   = require('fs-extra')
const ipc  = require('electron').ipcMain;

const { Octokit }     = require("@octokit/rest");
const simpleGit       = require('simple-git');
const git             = simpleGit();
var commandExistsSync = require('command-exists').sync;

const git_token_location = "repositories/Private/github_token.txt";


/*
* In alphabetical order
*/

ipc.on('git_add_changes', (event, args) => {
  //copy folder from User folder into repository

  fs.copySync(
    "User",
    "repositories"        + "/" +
      args["organization"] + "/" +
      args["repository"]   + "/" +
      "web"               + "/" +
      "User"
  )

  fs.rmdirSync(
    "repositories"        + "/" +
      args["organization"] + "/" +
      args["repository"]   + "/" +
      "web"               + "/" +
      "User"              + "/" +
      "Private",
     {
       recursive: true
     }
  )

});

ipc.on('git_add_repo', (event,args) => {
  /*
  * Make sure the relevant folders are ready
  */
  if(!fs.existsSync("repositories")){
    fs.mkdirSync("repositories");
  }

  if(!fs.existsSync("repositories" + "/" + args["organization"])){
    fs.mkdirSync(
      "repositories"       + "/" +
      args["organization"]
    )
  }

  /*
  * Check if the repository exists locally
  */
  if(
    fs.existsSync(
      "repositories"         + "/" +
        args["organization"] + "/" +
        args["repository"]
    )
  ){
    event.returnValue = "Error: You already have a copy of this repository";
  } else {
    /*
    * Check if the repository exists online
    */
    if(!fs.existsSync(
        git_token_location
      )
    ){
      event.returnValue = "auth token missing";
    } else {
      var auth_token = fs.readFileSync(
        git_token_location,
        'utf8'
      );

      const octokit = new Octokit({
        auth: auth_token,
      });

      octokit.orgs.get({
        org: args["organization"]
      }).then(function(result){
        /*
        * Then check if repository exists
        */
        octokit.repos.get({
          owner: args["organization"],
          repo:  args["repository"]
        }).then(function(result){
          /*
          * Then clone the repository
          */
          git.clone(
            "https://github.com" + "/" +
              args["organization"] + "/" +
              args["repository"],
            "repositories"         + "/" +
              args["organization"] + "/" +
              args["repository"]
          ).then(function(result){
            event.returnValue = "success"
          }).catch(function(error){
            event.returnValue = "failed to clone your existing repository onto your computer"
          });
        }).catch(function(error){
          /*
          * Create repository online
          */
          octokit.repos.createInOrg({
            org:  args["organization"],
            name: args["repository"],
          }).then(function(result){
            /*
            * Create repository locally
            */
            git.clone(
              "https://github.com/some-open-solutions/collector",
              "repositories"         + "/" +
                args["organization"] + "/" +
                args["repository"]
            ).then(function(result){
              /*
              * Remove the local .git folder to prevent synching with some-open-solutions version
              */
              fs.rmdirSync(
                "repositories"        + "/" +
                  args["organization"] + "/" +
                  args["repository"]   + "/" +
                  ".git",
                 {
                   recursive: true
                 }
              );
              event.returnValue = "success"
            }).catch(function(error){
              event.returnValue = "failed to clone Collector onto your computer: " + error;
            });
          }).catch(function(error){
            event.return = "error - failed to create online repo:" + error;
          })
        });
      }).catch(function(error){
        event.returnValue = "This organization doesn't exist."
      });
    }
  }
});

ipc.on('git_add_token', (event,args) => {
  /*
  * Make sure the required folders exist
  */
  if(!fs.existsSync("repositories")){
    fs.mkdirSync("repositories");
  }
  if(!fs.existsSync("repositories/Private")){
    fs.mkdirSync("repositories/Private");
  }

  try{
    fs.writeFileSync(
      git_token_location,
      args["auth_token"],
      'utf8'
    );
    event.returnValue = "success";
  } catch (error){
    event.returnValue = "error - could not add token to: " + git_token_location;
  }
});

ipc.on('git_delete_repo', (event,args) => {
  console.log("JSON.stringify(args)");
  console.log(JSON.stringify(args));

  try{
    fs.rmdirSync(
      "repositories"         + "/" +
        args["organization"] + "/" +
        args["repository"],
      {
         recursive: true
      }
    );
    event.returnValue = "success";
  } catch(error) {
    event.returnValue = "failed to delete:" + error
  }
})

ipc.on('git_download_collector', (event,args) =>{

  //cloning
  git.clone(
    "https://github.com/some-open-solutions/collector",
    "temp"
  )
  .then(function(error){
    /*
    * Remove git folder to make this a new repo
    */
    fs.rmdirSync(
      "temp/.git",
       {
         recursive: true
       }
    );

    /*
    * move from temp to main folder
    */
    fs.moveSync(
      "temp",
      "repositories"         + "/" +
        args["organization"]  + "/" +
        args["repository"],
      {
        "overwrite" : true
      }
    );
    event.returnValue = "success";
  });
});

ipc.on('git_exists', (event,args) => {
  if(commandExistsSync('git')){
    event.returnValue = "success"
  } else {
    event.returnValue = "Git is not yet installed. Please go to https://git-scm.com/ to download and install it so that you can do online research.";
  }
});

ipc.on('git_init', (event,args) => {

  if(!fs.existsSync(
      git_token_location
    )
  ){
    event.returnValue = "auth token missing";
  } else {
    var auth_token = fs.readFileSync(
      git_token_location,
      'utf8'
    );
    const octokit = new Octokit({
      auth: auth_token,
    }).repos.createInOrg({
      org:  args["organization"],
      name: args["repository"],
    }).then(function(response){
      if(
        !fs.existsSync(
          "repositories/" +args["organization"]
        )
      ){
        fs.mkdirSync(
          "repositories/" +args["organization"]
        )
      }

      var remote =  "https://" +
                    args["organization"] + ":" +
                    auth_token +
                    "@github.com"       + "/" +
                    args["organization"] + "/" +
                    args["repository"]   + ".git";

      git.clone(
        "https://github.com/some-open-solutions/collector",
        "repositories"         + "/" +
          args["organization"] + "/" +
          args["repository"]
      ).then(function(result){
        // Remove git folder to make this a new repo
        fs.rmdirSync(
          "repositories"         + "/" +
            args["organization"] + "/" +
            args["repository"]   + "/.git",
          {
             recursive: true
          }
        );
        git.cwd(
          "repositories"      + "/" +
          args["organization"] + "/" +
          args["repository"]
        ).init()
         .add("./*").
          commit(args["message"]).
          push(remote, 'master').
          then(function(new_err){
            console.log(new_err)
            event.returnValue = "success";
          })
          .catch(function(error){
            console.log(error)
            event.returnValue = "error when pushing:" + error;
          });

        event.returnValue = "success";
      }).catch(function(error){
        event.returnValue = error;
      });
    }).catch(function(error){
      event.returnValue = error;
    });
  }
});

ipc.on('git_load_master', (event,args) => {
  try{
    var content = fs.readFileSync(
      "repositories/github.json",
      'utf8'
    );
    event.returnValue = content;
  } catch(error){
    fs.writeFileSync(
      "repositories/github.json",
      "{}",
      'utf8'
    );
    event.returnValue = "{}";
  };
});

ipc.on('git_local_repo', (event,args) => {
  try{
    if(!fs.existsSync("repositories")){
      fs.mkdirSync("repositories")
    }
    if(!fs.existsSync("repositories/"+args["organization"])){
      fs.mkdirSync("repositories/" + args["organization"])
    }
    git.clone("https://github.com"   + "/" +
                args["organization"] + "/" +
                args["repository"],
              "repositories"         + "/" +
                args["organization"] + "/" +
                args["repository"]).then(function(result){
         event.returnValue = "success";
       })
       .catch(function(error){
         event.returnValue = "error: " + error;
       });
  } catch(error){
    event.returnValue = "error: " + error;
  }
});

ipc.on('git_pages', (event,args) => {
  /*
  * confirm authentication file exists
  */
  var auth_token = fs.readFileSync(
    git_token_location,
    'utf8'
  );
  try{
    const octokit = new Octokit({
      auth: auth_token,
    }).repos.createPagesSite({
      "owner":          args["organization"],
      "repo":           args["repository"]
    })
    event.returnValue = "success";
  } catch(error){
    console.log("HERE BE THE ERROR");
    event.returnValue = "error: " + error;
  }
});

ipc.on('git_pull', (event,args) => {
  if(!fs.existsSync("repositories")){
    fs.mkdirSync("repositories");
  }

  if(!fs.existsSync("repositories" + "/" + args["organization"])){
    fs.mkdirSync(
      "repositories"      + "/" +
      args["organization"]
    )
  }
  /*
  * check if repo exists to confirm whether cloning or pulling
  */
  if(
    !fs.existsSync(
      "repositories"      + "/" +
      args["organization"] + "/" +
      args["repository"]
    )
  ){
    console.log("Repository doesn't exist locally, so cloning");
    //cloning
    git.clone(
      "https://github.com"   + "/" +
        args["organization"] + "/" +
        args["repository"],
      "repositories"         + "/" +
        args["organization"] + "/" +
        args["repository"]
    )
    .then(function(error){
      //copy and replace the "User" folder
      fs.copySync(
        "repositories"         + "/" +
          args["organization"] + "/" +
          args["repository"]   + "/" +
          "web"                + "/" +
          "User",
        "User"
      );
      event.returnValue = "success";
    })
    .catch(function(error){
      event.returnValue = "error: " + error;
    });
  } else {
    console.log("Repository exists locally, so pulling in changes");

    var remote =  "https://" +
                    args["organization"] +
                    "@github.com"        + "/" +
                    args["organization"] + "/" +
                    args["repository"]   + ".git";

    /*
    for debugging
    const simpleGit          = require('simple-git');
    const git                = simpleGit();
    */

    console.log("remote = " + remote);

    try{
      git.cwd(
        "repositories"      + "/" +
        args["organization"] + "/" +
        args["repository"]
      ).pull(
        remote,
        'master'
      ).then(function(result){
        console.log("response to pull request");
        console.log(result);
        //copy and replace the "User" folder

        try{
          fs.copySync(
            "repositories"         + "/" +
              args["organization"] + "/" +
              args["repository"]   + "/" +
              "web"                + "/" +
              "User",
            "User"
          );
          event.returnValue = "success";
        } catch(error){
          event.returnValue = "failed to switch to the new repository - are you sure this is a valid Collector repository (e.g. has a user folder)";
        }

      }).catch(function(error){
        console.log("error");
        console.log(error);
        event.returnValue = "error: " + error;
      });
    } catch(error){
      event.returnValue = "error:" + error
    }
  }
});

ipc.on('git_push', (event,args) => {
  /*
  * check that auth token exists and deal with eventuality if it doesn't
  */

  var auth_token = fs.readFileSync(
    git_token_location,
    'utf8'
  );

  if(typeof(args["message"]) == "undefined"){
    args["message"] = "automatic commit"
  }

  console.log("args");
  console.log(args);

  var remote =  "https://" +
                  args["organization"] + ":" +
                  auth_token +
                  "@github.com"        + "/" +
                  args["organization"] + "/" +
                  args["repository"]   + ".git";
  git.cwd(
    "repositories"       + "/" +
    args["organization"] + "/" +
    args["repository"]
  ).init().
    add("./*").
    commit(args["message"]).
    push(remote, 'master').
    then(function(new_err){
      console.log("success");
      console.log(new_err)
      event.returnValue = "success";
    })
    .catch(function(error){
      console.log("error");
      console.log(error)
      event.returnValue = "error when pushing:" + error;
    });
});

ipc.on('git_save_master', (event,args) => {
  fs.writeFileSync(
    "repositories/github.json",
    args["git_master_json"],
    'utf8'
  );
  event.returnValue = "success";
});

ipc.on('git_switch_repo', (event, args) => {
  try{
    /*
    * backup the old repo
    */
    if(typeof(args["old_repo"]) !== "undefined"){
      fs.copySync(
        "User",
        "repositories"    + "/" +
          args["old_org"] + "/" +
          args["old_rep"] + "/" +
          "web"           + "/" +
          "User"
      );
    }

    if(
      !fs.existsSync(
        "repositories"         + "/" +
          args["organization"] + "/" +
          args["repository"]   + "/" +
          "web"                + "/" +
          "User"
      )
    ){
      fs.mkdirSync(
        "repositories"         + "/" +
          args["organization"] + "/" +
          args["repository"]   + "/" +
          "web"                + "/" +
          "User"
      )
    }

    /*
    * Copy the selected repo
    */
    fs.rmdirSync(
      "User", {
        recursive: true
      }
    )
    fs.copySync(
      "repositories"         + "/" +
        args["organization"] + "/" +
        args["repository"]   + "/" +
        "web"                + "/" +
        "User",
      "User", {
        recursive: true
      }
    );
    event.returnValue = "success";
  } catch(error){
    event.returnValue = "error: " + error;
  }
});

ipc.on('git_token_exists', (event,args) => {
  event.returnValue = fs.existsSync(
    "repositories/Private/github_token.txt"
  )
});
