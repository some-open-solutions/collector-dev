/*
  Collector (Garcia, Kornell, Kerr, Blake & Haffey)
  A program for running experiments on the web
  Copyright 2012-2016 Mikey Garcia & Nate Kornell


  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License version 3 as published by
  the Free Software Foundation.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <http://www.gnu.org/licenses/>

  Kitten release (2019) author: Dr. Anthony Haffey (a.haffey@reading.ac.uk)
*/
if(typeof(dev_obj) == "undefined"){
  dev_obj = {};
}
dev_obj.context = "";
dev_obj.version = "kitten"; //this needs to be updated when moving to cat, but perhaps can just be hardcoded
dev_obj.published_links = [];


function collectorPapaParsed(content){
  //check if parsed stylesheet
  if(typeof(content) == "object"){
    post_parsed = Papa.parse(Papa.unparse(content),{
  		beforeFirstChunk: function(chunk) {
  			var rows = chunk.split( /\r\n|\r|\n/ );
  			var headings = rows[0].toLowerCase();
  			rows[0] = headings;
  			return rows.join("\r\n");
  		},
  		header:true,
  		skipEmptyLines:true
  	}).data;
  } else {
    post_parsed = Papa.parse(content,{
  		beforeFirstChunk: function(chunk) {
  			var rows = chunk.split( /\r\n|\r|\n/ );
  			var headings = rows[0].toLowerCase();
  			rows[0] = headings;
  			return rows.join("\r\n");
  		},
  		header:true,
  		skipEmptyLines:true
  	}).data;
  }
	return post_parsed;
}

/*
* Check if Collector is still connected
*/

eel.expose(collector_live);
function collector_live(){
	$("#top_navbar").addClass("bg-primary");
}

function complete_csv(this_csv){
  response_headers 		 = [];
  for(var i = 0; i < this_csv.length ; i++) {
    csv_row = this_csv[i];
    Object.keys(csv_row).forEach(function(header){
      if(response_headers.indexOf(header) == -1){
        response_headers.push(header);
      };
    });
  }

  for(var i =0; i < this_csv.length; i++){
    response_headers.forEach(function(this_header){
      if(typeof(this_csv[i][this_header]) == "undefined"){
        this_csv[i][this_header] = "";
      }
    });
  }
  return this_csv;
}
function create_alerts_container() {
	if (typeof(alerts_ready) !== "undefined" && alerts_ready) return;

	var top_padding = parseFloat($("#sim_navbar").css("height").replace("px","")) + parseFloat($("#top_navbar").css("height").replace("px",""));


	var el = $("<div>");
	el.css({
			position: "fixed",
			top: top_padding + "px",
			left: "10px",
			right: "10px",
			backgroundColor: "#ffc8c8",
			borderRadius: "6px",
			border: "1px solid #DAA",
			color: "#800",
	});

	el.attr("id", "alerts");
	el.css("z-index", "1000");

	$("body").append(el);

	var style = $("<style>");
	style.html("#alerts > div { margin: 10px 5px; }");

	$("body").append(style);

	alerts_ready = true;
}
function custom_alert(msg,duration) {
  if(typeof(duration) == "undefined"){
		duration = 1000;
	}
	create_alerts_container();
	var el = $("<div>");
	el.html(msg);
	el.css("opacity", "0");
	$("#alerts").append(el).show();
	el.animate({opacity: "1"}, 600, "swing", function() {
		$(this).delay(duration).animate({height: "0px"}, 800, "swing", function() {
			$(this).remove();
			if ($("#alerts").html() === '') {
				$("#alerts").hide();
			}
		});
	});
}



function detect_context(){
  
  
  //turn to false to make use of eel and python
  if(document.URL.indexOf("localhost") !== -1){
    if(typeof(parent.dropbox_developer) !== "undefined" &&
              parent.dropbox_developer  ==  true){
      return "github";
    } else {
      return "localhost";
    }
  } else if(document.URL.indexOf("github.io") !== -1) { //assume it's github
    return "github";
  } else if(document.URL.indexOf("gitpod.io") !== -1){
    return "gitpod"
  } else {
    return "server";
  }
}
function detect_version(){
  if(document.URL.indexOf("/kitten/") !== -1){
    return "kitten";
  }
}

function list_variables(trialtype){
  var variables = [];

  split_trialtype = trialtype.split("{{");
  split_trialtype = split_trialtype.map(function(split_part){
    if(split_part.indexOf("}}") !== -1){
      more_split_part = split_part.split("}}");
      variables.push(more_split_part[0].toLowerCase());
      more_split_part[0] = more_split_part[0].toLowerCase();
      split_part = more_split_part.join("}}");
    }
    return split_part;
  });
  mod_html = split_trialtype.join("{{");
  return variables;
}

function save_csv (filename, data) {
	var blob = new Blob([data], {type: 'text/csv'});
	if(window.navigator.msSaveOrOpenBlob) {
		window.navigator.msSaveBlob(blob, filename);
	}
	else{
		var elem = window.document.createElement('a');
		elem.href = window.URL.createObjectURL(blob);
		elem.download = filename;
		document.body.appendChild(elem);
		elem.click();
		document.body.removeChild(elem);
	}
}
function update_dropdown_list(list_id,list,option_class){
    user_trialtype_list = user_trialtype_list.sort();
	user_trialtype_list.forEach(function(trialtype){
		var new_option = "<option class='"+option_class+"'>"+trialtype+"</option>";
		$("#"+list_id).append(new_option);
	});
}

String.prototype.replaceAll = function(str1, str2, ignore) //by qwerty at https://stackoverflow.com/questions/2116558/fastest-method-to-replace-all-instances-of-a-character-in-a-string
{
  return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g,"\\$&"),(ignore?"gi":"g")),(typeof(str2)=="string")?str2.replace(/\$/g,"$$$$"):str2);
}

setInterval(function(){
	
	/*
	* set background to grey until validated that Collector is live
	*/
	$("#top_navbar").removeClass("bg-primary");
	
	/*
	* the next step depends on whether user is online or not
	*/
	
	switch(detect_context()){
		case "github":
		case "github":
		case "server":
			
			/*
			* Check if google exists. If not, assume that the user is not connected
			*/
			if(navigator.onLine){
				collector_live();
			} else {
				bootbox.alert("You seem to not be connected to the internet - changes might not be saved");
			}
			
			break;
		case "localhost":
			eel.collector_live();
			setTimeout(function(){
				if($("#top_navbar").hasClass("bg-primary") == false){
					bootbox.alert("It seems like localhost turned off some time in the last minute. You may want to copy any changes you recently made to a text or spreadsheet editor and then restart Collector");
				}
			},15000);
			break;
	}
},30000);
