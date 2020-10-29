/*
* Github management
*/
const fs   = require('fs-extra')
const ipc  = require('electron').ipcMain;

const { Octokit }        = require("@octokit/rest");
const git_clone          = require('git-clone');
const simpleGit          = require('simple-git');
const git                = simpleGit();
const git_token_location = "User/Private/github_token.txt";

ipc.on('git_add_token', (event,args) => {
  try{
    fs.writeFileSync(
      git_token_location,
      args["auth_token"],
      'utf8'
    );
    event.returnValue = "success";
  } catch (error){
    event.returnValue = error;
  }
});

ipc.on('git_init', (event,args) => {

  //clone collector at location
  git.clone(
    "https://github.com/some-open-solutions/collector",
    "repositories"         + "/" +
      args["organisation"] + "/" +
      args["repository"]
  )
  .then(function(error){
    /*
    * Remove git folder to make this a new repo
    */
    fs.rmdirSync(
      "repositories"         + "/" +
        args["organisation"] + "/" +
        args["repository"]   + "/.git",
      {
         recursive: true
      }
    );
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
      try{
        const octokit = new Octokit({
          auth: auth_token,
        })
        .repos.createInOrg({
          org:  args["organisation"],
          name: args["repository"],
        })

        /*
        * initiate repository here
        */
        git.cwd(
          "repositories"      + "/" +
          args["organisation"] + "/" +
          args["repository"]
        ).init();

        event.returnValue = "success";
      } catch(error){
        event.returnValue = "error: " + error;
      }
    }
  });
});

ipc.on('git_local_repo', (event,args) => {
  try{
    if(!fs.existsSync("repositories")){
      fs.mkdirSync("repositories")
    }
    if(!fs.existsSync("repositories/"+args["organisation"])){
      fs.mkdirSync("repositories/" + args["organisation"])
    }
    git.clone("https://github.com"   + "/" +
                args["organisation"] + "/" +
                args["repository"],
              "repositories"         + "/" +
                args["organisation"] + "/" +
                args["repository"])
       .then(function(error){
         event.returnValue = "success";
       })
       .catch(function(error){
         event.returnValue = "error: " + error;
       });
  } catch(error){
    event.returnValue = "error: " + error;
  }
});

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
    )

    /*
    * move from temp to main folder
    */
    fs.moveSync(
      "temp",
      "repositories"         + "/" +
        args["organisation"]  + "/" +
        args["repository"],
      {
        "overwrite" : true
      }
    )

    event.returnValue = "success";
  });




  /*
  download_git_repo(
    "some-open-solutions/" +
      "collector",
    "repositories"         + "/" +
      args["organisation"] + "/" +
      args["repository"],
    {
      "clone" : false
    },function(err){
      if(typeof(err) !== "undefined"){
        event.returnValue = "error: " + err;
      } else {
        event.returnValue = "success";
      }

    }
  );
  */
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

  var remote =  "https://" +
                  args["organisation"] + ":" +
                  auth_token +
                  "@github.com"       + "/" +
                  args["organisation"] + "/" +
                  args["repository"]   + ".git";
  git.cwd(
    "repositories"      + "/" +
    args["organisation"] + "/" +
    args["repository"]
  ).
    add("./*").
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
      "owner":          args["organisation"],
      "repo":           args["repository"]
    })
    event.returnValue = "success";
  } catch(error){
    console.log("HERE BE THE ERROR");
    event.returnValue = "error: " + error;
  }
});

ipc.on('git_add_changes', (event,args) => {
  //copy folder from User folder into repository

  fs.copySync(
    "User",
    "repositories"        + "/" +
      args["organisation"] + "/" +
      args["repository"]   + "/" +
      "web"               + "/" +
      "User"
  )

  fs.rmdirSync(
    "repositories"        + "/" +
      args["organisation"] + "/" +
      args["repository"]   + "/" +
      "web"               + "/" +
      "User"              + "/" +
      "Private",
     {
       recursive: true
     }
  )

});



ipc.on('git_pull', (event,args) => {
  if(!fs.existsSync("repositories")){
    fs.mkdirSync("repositories");
  }

  if(!fs.existsSync("repositories" + "/" + args["organisation"])){
    fs.mkdirSync(
      "repositories"      + "/" +
      args["organisation"]
    )
  }


  /*
  * check if repo exists to confirm whether cloning or pulling
  */
  if(
    !fs.existsSync(
      "repositories"      + "/" +
      args["organisation"] + "/" +
      args["repository"]
    )
  ){
    console.log("Repository doesn't exist locally, so cloning");
    //cloning
    git.clone(
      "https://github.com"   + "/" +
        args["organisation"] + "/" +
        args["repository"],
      "repositories"         + "/" +
        args["organisation"] + "/" +
        args["repository"]
    )
    .then(function(error){
      //copy and replace the "User" folder
      fs.copySync(
        "repositories"         + "/" +
          args["organisation"] + "/" +
          args["repository"]   + "/" +
          "web"                + "/" +
          "User",
        "User"
      );
      event.returnValue = "success";
    });
  } else {
    console.log("Repository exists locally, so pulling in changes");

    git.cwd(
      "repositories"      + "/" +
      args["organisation"] + "/" +
      args["repository"]
    ).pull(
      'origin',
      'master'
    )
    .then(function(error){
      //copy and replace the "User" folder
      fs.copySync(
        "repositories"         + "/" +
          args["organisation"] + "/" +
          args["repository"]   + "/" +
          "web"                + "/" +
          "User",
        "User"
      );

      event.returnValue = "success";
    });
  }
});

ipc.on('git_token_exists', (event,args) => {
  event.returnValue = fs.existsSync(
    "User/Private/github_token.txt"
  )
});
