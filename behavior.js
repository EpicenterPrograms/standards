function read(URL, callback) {
    /**
    reads the contents of the file at the URL,
    converts it into a string, and then
    calls the callback function (which has no arguments)
    with "this" equalling the responseText
    */
    var file = new XMLHttpRequest();
    file.open("GET", URL);  // Don't add false as an extra argument (browsers don't like it). (default: asynchronous=true)
    file.onreadystatechange = function () {
        if(file.readyState === 4) {  // Is it done?
            if(file.status === 200 || file.status == 0) {  // Was it successful?
                // file.responseXML might have something
                callback.call(file.responseText);  // .call(calling object / value of "this", function arguments (listed individually))  .apply has function arguments in an array
                // You could also use callback(argument(s)) like a normal function, but it wouldn't change the value of "this".
            }
        }
    }
    file.send();
}

function pageJump(ID) {
    /**
    makes a section to jump to certain parts of the page
    */
    document.getElementsByTagName("h1")[0].id = "top";
    var division = document.getElementById(ID);
    var contents = document.createElement("div");
    contents.className = "list";
    contents.innerHTML = "<br><h2>Jump to:</h2>";
    var sections = division.getElementsByTagName("h2");
    var toTop = document.createElement("a");
    toTop.href = "#top";
    toTop.innerHTML = "To top";
    var listItems = "";  // I need this variable to hold the list items because trying to add <ul> at the beginning and </ul> at the end separately causes it to fill in the </ul> immediately after the <ul> and omit the real </ul>
    for (var index=0; index<sections.length; index++) {  // I would use (var in array), but index exceeds entries.length for no apparent reason
        var inside = sections[index].innerHTML.trim();  // The inner HTML has a bunch of whitespace for no apparent reason.
        sections[index].id = inside;
        listItems += "<li><a href='#" + inside + "'>" + inside + "</a></li>";
        division.insertBefore(toTop.cloneNode(true), division.getElementsByTagName("h2")[index].nextSibling);  // inserts after <h2>
        // toTop needs to be cloned so it doesn't keep getting reasigned to the next place (it also needs to have true to clone all children of the node, although it doesn't apply here)
    }
    contents.innerHTML += "<ul>" + listItems + "</ul><br>";
    document.body.insertBefore(contents, division);  // .insertBefore() only works for the immediate descendants of the parent
}

//This is able to run without waiting for anything else to load.

// makes my custom tag which overlines things
document.createElement("over");

// adds the universal formatting
var style = document.createElement("link");
style.rel = "stylesheet";
style.href = "formatting.css";
document.head.insertBefore(style, document.head.children[0]);

// links the favicon
// var icon = document.createElement("link");
// icon.rel = "icon";
// icon.href = "images/favicon.ico";
// document.head.insertBefore(icon, document.head.children[0]);

window.addEventListener("load", function() {  // This waits for everything past the script import to load before running.
    
    // surrounds every list with <div class="list"></div>
    var orderedLists = document.getElementsByTagName("ol");
    var unorderedLists = document.getElementsByTagName("ul");
    for (var index=0; index<orderedLists.length; index++) {
        orderedLists[index].outerHTML = "<div class='list'>" + orderedLists[index].outerHTML + "</div>";
    }
    for (var index=0; index<unorderedLists.length; index++) {
        unorderedLists[index].outerHTML = "<div class='list'>" + unorderedLists[index].outerHTML + "</div>";
    }
});
