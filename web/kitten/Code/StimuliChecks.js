/*
* check that images have loaded succesfully, and reload if not
*/
alert("HO");
$("img").on("load", function() {
  // nothing to do, it all worked well
})
.on("error", function() {
  d = new Date();
  $(this).attr("src",                               // replace this
               "https://dl.dropbox.com/s/zcpro7lzj4lm7zu/GAAP1_AR.png?dl=0" + //$(this).attr("src") +
               "?" +
               d.getTime());  // with this
})
.each(function(){
  if(this.complete){
    $(this).load();
  } else if(this.error) {
    $(this).error();
  }
});