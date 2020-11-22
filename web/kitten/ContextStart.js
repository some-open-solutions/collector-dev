/*
* this is a hack to deal with asynchronous order of parts of the page loading
*/
function wait_till_exists(this_function){
  if(typeof(window[this_function]) == "undefined"){
    setTimeout(function(){
      wait_till_exists(this_function);
    },100);
  } else {
    window[this_function]();
  }
}

/*
* Start Collector
*/
$_GET = window.location.href.substr(1).split("&").reduce((o,i)=>(u=decodeURIComponent,[k,v]=i.split("="),o[u(k)]=v&&u(v),o),{});

Collector.tests.run();                        // display the test dialog before anything else (assuming tests are being run)

Collector.start = function(){
  wait_till_exists("list_studies");
  wait_till_exists("list_graphics");
  list_mods();
  wait_till_exists("list_trialtypes");
  wait_till_exists("initiate_actions");
  autoload_mods();
  wait_till_exists("list_keys");
  wait_till_exists("list_data_servers");
  wait_till_exists("list_servers");
  wait_till_exists("list_surveys");
  wait_till_exists("list_pathways");
}

switch(Collector.detect_context()){
  case "gitpod":
  case "server":
  case "github":
    wait_till_exists("check_authenticated");  //check dropbox
    break;
  case "localhost":

    Collector.tests.pass("helper",
                         "startup");          // this can't fail in localhost version
    wait_for_electron = setInterval(function(){
      //alert("hi");
      if(typeof(Collector.electron) !== "undefined"){
        clearInterval(wait_for_electron);
        master_json = Collector.electron.fs.read_file("","master.json");
        if(master_json !== ""){
          master_json = JSON.parse(master_json);
        } else {
          master_json = default_master_json;
          var write_response = Collector.electron.fs.write_file(
            "",
            "master.json",
            JSON.stringify(master_json, null, 2));
          if(write_response !== "success"){
            bootbox.alert(response);
          }
        }
        var git_exists = Collector.electron.git.exists();
        if(git_exists !== "success"){
          bootbox.alert(git_exists);
        } else {
          github_json = JSON.parse(
            Collector.electron.git.load_master()
          );
        }
        Collector.start();
      }
    },100);
    break;
}
