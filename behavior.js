var options = options || {};
    /**
    allows specifications to be added if the variable is already present
    (otherwise uses default values and settings)
    valid options =
        "automation" : "none", "basic", "full"
            runs a corresponding amount of code after defining everything
        "formatting" : URL
            gives the document the styling located at the URL
        "icon" : URL
            gives the window the icon located at the URL
        "makeTitle" : true, false
            inserts a <h1> at the top of the document with the same content as the <title> if true
            (default = true)
        "navigation" : URL
            makes a navigation section using the (HTML) document located at the URL
    */
var audio = new window.AudioContext() || window.webkitAudioContext();
// audio.close() gets rid of the instance (if you used multiple instances, you'd max out at around 6)

var Sound = function(specs) {
    /**
    creates tones which can be modified in certain way
    frequency = frequency of the primary tone/wave
    volume = volume
    waveform = waveform of primary wave
        "sine", "square", "sawtooth", or "triangle"
        defaults to "sine"
    modulation = frequency of modulating wave = how often the primary wave is modified
    hertzChange = the frequency change of the primary wave upon modulation
    changeWave = waveform of the modulating wave
    */
    var sound = this,
        osc1 = audio.createOscillator(),
        osc2 = audio.createOscillator(),
        gain1 = audio.createGain(),
        gain2 = audio.createGain();
    this.frequency = 440;
    this.volume = 0
    this.waveform = "sine";
    this.modulation = 0;
    this.hertzChange = 0;
    this.changeWave = "sine";
    for (var spec in specs) {
        this[spec] = specs[spec];
    }
    function setValues(time) {
        time = time || 0;
        time /= 1000;  // ramps use time in seconds
        gain1.gain.exponentialRampToValueAtTime(sound.volume+.0001, audio.currentTime + time);  // exponential ramping doesn't work with 0s
        osc1.frequency.exponentialRampToValueAtTime(sound.frequency+.0001, audio.currentTime + time);
        osc1.type = sound.waveform;
        gain2.gain.linearRampToValueAtTime(sound.hertzChange, audio.currentTime + time);
        osc2.frequency.linearRampToValueAtTime(sound.modulation, audio.currentTime + time);;
        osc2.type = sound.changeWave;
        // The second set of transitions are linear because I want them to be able to have values of 0.
    }
    setValues();
    gain1.connect(audio.destination);
    osc1.connect(gain1);
    gain2.connect(osc1.frequency);
    osc2.connect(gain2);
    osc1.start();
    osc2.start();
    this.start = function(volume, time) {  // starts/unmutes the tone
        time = time || 0;
        gain1.gain.value = sound.volume+.0001;
        sound.volume = volume || 1;
        gain1.gain.exponentialRampToValueAtTime(sound.volume, audio.currentTime + time/1000);
    };
    this.change = function(property, value, time) {  // changes a property of the tone
        sound[property] = value;
        setValues(time);
    };
    this.play = function(noteString, newDefaults) { // plays a song based on notes you put in a string
        var defaults = {
            "attack" : 50,
            "noteLength" : 200,
            "decay" : 50,
            "spacing" : 0
        };
        for (var item in newDefaults) {
            if (defaults.hasOwnProperty(item)) {
                defaults[item] = newDefaults[item];
            }
        }
        function interpret(index) {
            index = index || 0;
            if (index < noteString.length) {
                if (noteString[index].match(/[a-z]/i)) {  // is the character at that index a letter?
                    switch(noteString[index].toLowerCase()+noteString[index+1]) {
                        case "g4":
                            sound.change("frequency", 392.00);
                            break;
                        case "a4":
                            sound.change("frequency", 440.00);
                            break;
                        case "b4":
                            sound.change("frequency", 493.88);
                            break;
                    }
                    sound.start(null, defaults.attack);
                    if (noteString[index+2] && noteString[index+2] == "-") {
                        setTimeout(function() {
                            interpret(index+2);
                        }, defaults.attack+defaults.noteLength+defaults.decay+defaults.spacing);
                    } else {
                        setTimeout(function() {
                            sound.stop(defaults.decay);
                            setTimeout(function() {
                                interpret(index+2);
                            }, defaults.decay+defaults.spacing);
                        }, defaults.attack+defaults.noteLength);
                    }
                } else if (noteString[index] == "-" && noteString[index+1] != "-") {
                    sound.stop(defaults.decay);
                    setTimeout(function() {
                        interpret(index+1);
                    }, defaults.decay+defaults.spacing);
                } else {
                    setTimeout(function() {
                        interpret(index+1);
                    }, defaults.attack+defaults.noteLength+defaults.decay+defaults.spacing);
                }
            }
        }
        interpret();
    };
    this.stop = function(time) {  // stops/mutes the tone
        time = time || 0;
        gain1.gain.exponentialRampToValueAtTime(.0001, audio.currentTime + time/1000);
        setTimeout(function() {
            gain1.gain.value = 0;
            sound.volume = 0;
        }, time);
    };
    this.destroy = function(time) {  // gets rid of the tone (can't be used again)
        time = time || 0;
        gain1.gain.exponentialRampToValueAtTime(.0001, audio.currentTime + time/1000);
        setTimeout(function() {
            osc1.stop();
            osc2.stop();
            osc2.disconnect(gain2);
            gain2.disconnect(osc1.frequency);
            osc1.disconnect(gain1);
            gain1.disconnect(audio.destination);
        }, time);
    };
};

HTMLCollection.prototype.forEach = function(doStuff) {
    /**
    HTMLCollection elements = stuff like the list in document.getElementsByClassName() or document.getElementsByTagName()
    creates a static list of HTMLCollection elements
    and does stuff for each one like Array.forEach()
    (.forEach() doesn't work for these lists without this code)
    implication of static list = you can remove the elements in doStuff without messing everything up
    */
    var elements = [];
    for (var index=0; index<this.length; index++) {
        elements.push(this[index]);
    }
    for (index=0; index<elements.length; index++) {
        var returnValue = doStuff(elements[index], index, elements);
        if (returnValue == "break") {
            break;
        }
    }
};

NodeList.prototype.forEach = function(doStuff) {
    /**
    similar to HTMLCollection.forEach()
    */
    var elements = [];
    for (var index=0; index<this.length; index++) {
        elements.push(this[index]);
    }
    for (index=0; index<elements.length; index++) {
        var returnValue = doStuff(elements[index], index, elements);
        if (returnValue == "break") {
            break;
        }
    }
};

Object.prototype.keyHasValue = function(key, value) {
    /**
    checks if an object has a property and then
    checks if the property equals the value
    */
    return (this.hasOwnProperty(key)&&this[key]==value) ? true : false;
};

function read(URL, callback) {
    /**
    reads the contents of the file at the URL,
    converts it into a string,
    puts the string into a <div>, and then
    calls the callback function (which has no arguments)
    with "this" equalling the <div>
    */
    var file = new XMLHttpRequest();
    file.open("GET", URL);  // Don't add false as an extra argument (browsers don't like it). (default: asynchronous=true)
    file.onreadystatechange = function () {
        if(file.readyState === 4) {  // Is it done?
            if(file.status === 200 || file.status == 0) {  // Was it successful?
                // file.responseXML might have something
                var container = document.createElement("div");
                container.innerHTML = file.responseText;
                // This is necessary because HTML5 doesn't think script tags and innerHTML should go together (for security reasons).
                var scripts = file.responseText.split("<script");
                if (scripts.length > 1) {
                    scripts.forEach(function(script, index) {
                        if (index > 0) {
                            var scriptTag = document.createElement("script");
                            scriptTag.appendChild(document.createTextNode(script.slice(script.indexOf(">")+1, script.indexOf("</script>"))));
                            container.insertBefore(scriptTag, container.getElementsByTagName("script")[index-1]);
                            var oldTag = container.getElementsByTagName("script")[index];
                            oldTag.parentNode.removeChild(oldTag);
                        }
                    });
                }
                callback.call(container);  // .call(calling object / value of "this", function arguments (listed individually))  .apply has function arguments in an array
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
    contents.id = "pageJump";
    contents.className = "list";
    contents.style = "margin: 2em; padding: 0em 1em 1em 0em; background: rgba(255,255,255,.5);";
    contents.innerHTML = "<h2 style='text-align:center;'>Jump to:</h2>";
    var sections = division.getElementsByTagName("h2");
    var toTop = document.createElement("p");  // This has to be a <p><a></a></p> rather than just a <a></a> because, otherwise, "To top" has the possibility of appearing in-line.
    toTop.innerHTML = "<a href='#top'>To top</a>";
    var listItems = "";  // I need this variable to hold the list items because trying to add <ol> at the beginning and </ol> at the end separately causes it to fill in the </ol> immediately after the <ol> and omit the real </ol>
    for (var index=0; index<sections.length; index++) {  // I would use (var in array), but index exceeds entries.length for no apparent reason
        var inside = sections[index].innerHTML.trim();  // The inner HTML has a bunch of whitespace for no apparent reason.
        sections[index].id = inside;
        listItems += "<li><a href='#" + inside + "'>" + inside + "</a></li>";
        division.insertBefore(toTop.cloneNode(true), division.getElementsByTagName("h2")[index].nextSibling);  // inserts after <h2>
        // toTop needs to be cloned so it doesn't keep getting reasigned to the next place (it also needs to have true to clone all children of the node, although it doesn't apply here)
    }
    contents.innerHTML += "<ol style='visibility:visible'>" + listItems + "</ol>";
    division.parentNode.insertBefore(contents, division);  // .insertBefore() only works for the immediate descendants of the parent
    contents.outerHTML += "<br>";  // Elements need to have a parent node before the outer HTML can be modified. (This makes sure the "Jump to:" section appears on its own line.)
    // This takes you to a certain part of the page after the IDs and links load (if you were trying to go to a certain part of the page.
    if (window.location.href.indexOf("#") > -1) {
        var found = false;
        document.getElementById("pageJump").getElementsByTagName("a").forEach(function(link) {
            if (link.innerHTML.trim() == window.location.href.split("#")[1].trim()) {
                found = true;
                link.click();
                return "break";
            }
        });
        if (!found) {  // Was the section found?
            console.warn('The section "' + window.location.href.split("#")[1].trim() + '" doesn\'t exist on this page.');
        }
    }
}

function colorCode(element, end1, end2) {
    /**
    color codes an element (likely a table)
    end1 and end2 specify the ends of a range (not used for strings)
    colors specifications can be added after all of the arguments
    colors are an indefinite number of 3-item arrays listed as arguments
    (items are integers from 0 to 255)
    e.g. colorCode(element, end1, end2, [12,23,34], [45,56,67], [78,89,90]);
    default colors = red and green
    */
    var args = Array.prototype.slice.call(arguments, 3);
    var colors = args.length>0 ? args : [[255, 0, 0],[0, 255, 0]];  // Are there colors specified?
    if (element.tagName == "TABLE") {
        element.getElementsByTagName("td").forEach(function(data) {
            if (!isNaN(data.innerHTML.trim()) && data.innerHTML.trim()!="") {
                var ends = [end1];
                colors.forEach(function(color, index, colors) {
                    ends.push(end1+(end2-end1)*(index+2)/colors.length);
                });
                var number = Number(data.innerHTML.trim());
                var endIndex = 1,
                    intermediate1 = [],
                    intermediate2 = [],
                    colorValue;
                while (number > ends[endIndex]) {
                    endIndex++;
                }
                colors[endIndex-1].forEach(function(color) {
                    colorValue = Math.round(Math.abs(number-ends[endIndex])/(ends[endIndex]-ends[endIndex-1])*color*2);
                    intermediate1.push(colorValue<=color ? colorValue : color);
                });
                colors[endIndex].forEach(function(color) {
                    colorValue = Math.round(Math.abs(number-ends[endIndex-1])/(ends[endIndex]-ends[endIndex-1])*color*2);
                    intermediate2.push(colorValue<=color ? colorValue : color);
                });
                var red = intermediate1[0]+intermediate2[0]<=255 ? intermediate1[0]+intermediate2[0] : 255,
                    green = intermediate1[1]+intermediate2[1]<=255 ? intermediate1[1]+intermediate2[1] : 255,
                    blue = intermediate1[2]+intermediate2[2]<=255 ? intermediate1[2]+intermediate2[2] : 255;
                data.style.backgroundColor = "rgb(" + red + ", " + green + ", " + blue + ")";
            }
        });
    } else if (compareAll(element.tagName, "==", ["P", "H1", "H2", "H3", "H4", "H5", "H6", "SPAN"], "||")) {
        if (element.innerHTML.trim() != "") {
            end1 = 0;
            end2 = element.innerHTML.trim().length;
            var ends = [end1];
            colors.forEach(function(color, index, colors) {
                ends.push(end1+(end2-end1)*(index+2)/colors.length);
            });
            var replacement = document.createElement(element.tagName);
            element.innerHTML.trim().split("").forEach(function(character, index) {
                var span = document.createElement("span");
                span.innerHTML = character;
                span.style.display = "inline";
                var number = index;
                var endIndex = 1,
                    intermediate1 = [],
                    intermediate2 = [],
                    colorValue;
                while (number > ends[endIndex]) {
                    endIndex++;
                }
                colors[endIndex-1].forEach(function(color) {
                    colorValue = Math.round(Math.abs(number-ends[endIndex])/(ends[endIndex]-ends[endIndex-1])*color*2);
                    intermediate1.push(colorValue<=color ? colorValue : color);
                });
                colors[endIndex].forEach(function(color) {
                    colorValue = Math.round(Math.abs(number-ends[endIndex-1])/(ends[endIndex]-ends[endIndex-1])*color*2);
                    intermediate2.push(colorValue<=color ? colorValue : color);
                });
                var red = intermediate1[0]+intermediate2[0]<=255 ? intermediate1[0]+intermediate2[0] : 255,
                    green = intermediate1[1]+intermediate2[1]<=255 ? intermediate1[1]+intermediate2[1] : 255,
                    blue = intermediate1[2]+intermediate2[2]<=255 ? intermediate1[2]+intermediate2[2] : 255;
                span.style.color = "rgb(" + red + ", " + green + ", " + blue + ")";
                replacement.appendChild(span);
            });
            element.parentNode.insertBefore(replacement, element);
            element.parentNode.removeChild(element);
        }
    }
}

// makes my custom tag which overlines things
document.createElement("over");

if (!options.keyHasValue("automation", "none")) {
    
    //This is able to run without waiting for anything else to load.
    
    // adds the universal formatting
    var style = document.createElement("link");
    style.rel = "stylesheet";
    style.href = options.hasOwnProperty("formatting") ? options.formatting : "https://coolprogramminguser.github.io/Standards/formatting.css";
    document.head.insertBefore(style, document.head.children[0]);
    
    // links a favicon
    var icon = document.createElement("link");
    icon.rel = "icon";
    document.head.insertBefore(icon, document.head.children[0]);
    
    if (options.hasOwnProperty("icon")) {
        icon.href = options.icon;
    } else {
        // cycles the favicon
        var canvas = document.createElement("canvas");
        var context = canvas.getContext("2d");
        var color = 0;
        canvas.width = 64;
        canvas.height = 64;
        context.beginPath();
        context.arc(canvas.width/2, canvas.height/2, 32, 0, 2*Math.PI);
        setInterval(function() {
            if (color >= 360) {
                color = 0;
            }
            context.fillStyle = "hsl(" + color + ", 100%, 50%)";
            context.fill();
            icon.href = canvas.toDataURL();
            color++;
        }, 20);
    }
}

window.addEventListener("load", function() {  // This waits for everything past the script import to load before running.
    
    if (!options.hasOwnProperty("automation") || options.automation == "full") {
        
        // surrounds the <body> content with a <section> tag
        document.body.innerHTML = "<section>" + document.body.innerHTML + "</section>";
        
        if (!options.keyHasValue("makeTitle", false)) {
            // adds a title to the page
            var title = document.createElement("h1");
            title.style.color = "white";
            title.innerHTML = document.title;
            document.body.insertBefore(title, document.body.children[0]);
        }
        
        // surrounds every list with <div class="list"></div>
        var orderedLists = document.getElementsByTagName("ol");
        var unorderedLists = document.getElementsByTagName("ul");
        for (var index=0; index<orderedLists.length; index++) {
            orderedLists[index].outerHTML = "<div class='list'>" + orderedLists[index].outerHTML + "</div>";
            orderedLists[index].style.visibility = "visible";
        }
        for (var index=0; index<unorderedLists.length; index++) {
            unorderedLists[index].outerHTML = "<div class='list'>" + unorderedLists[index].outerHTML + "</div>";
            unorderedLists[index].style.visibility = "visible";
        }
        
        // interprets condensed tables
        var tables = document.getElementsByClassName("compact");
        for (var counter=0; counter<tables.length; counter++) {
            var table = tables[counter];
            table.getElementsByTagName("th").forEach(function(thList) {
                var parent = thList.parentNode;
                var newHeadings = thList.innerHTML.split("|");
                parent.removeChild(thList);
                newHeadings.forEach(function(heading) {
                    parent.innerHTML += "<th>" + heading.trim() + "</th>";
                });
            });
            table.getElementsByTagName("td").forEach(function(tdList) {
                var parent = tdList.parentNode;
                var newData = tdList.innerHTML.split("|");
                parent.removeChild(tdList);
                newData.forEach(function(data) {
                    parent.innerHTML += "<td>" + data.trim() + "</td>";
                });
            });
            table.style.visibility = "visible";
        }
    }
    
    // handles the options
    for (var spec in options) {
        switch (spec) {
            case "navigation":
                document.body.style = "margin:0vw 0vh 0vh 15vw; width: 85%;";
                read(options[spec], function() {
                    this.className = "nav";
                    document.body.insertBefore(this, document.body.childNodes[0]);
                });
                break;
        }
    }
});
