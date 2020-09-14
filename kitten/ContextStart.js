/*
* Eel functions
*/
python_dialog = bootbox.dialog({
  show:false,
  title:"Please wait",
  message:"<div id='python_message'></div>"
});

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
        master_json = JSON.parse(
          Collector.electron.read_file("","master.json")
        );
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
      }
    },100);
    break;
}
