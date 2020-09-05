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
    wait_till_exists("load_electron");
    break;
}
