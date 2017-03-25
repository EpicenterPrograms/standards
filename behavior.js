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
        "section" : "none"
            allows you to prevent the creation of the surrounding <section> tag
        "title" : "none", other
            puts a title (<h1>) at the top of the page (not the page tab) if not "none"
            if a different option (String or Number), the option is used as the title
            if the first character of a String is "~", the string will be evaluated as code
            default = inserts the same content as the <title>
        "navigation" : URL
            makes a navigation section using the (HTML) document located at the URL
    */
var audio = new window.AudioContext() || window.webkitAudioContext();  // used in Sound()
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
    this.play = function(noteString, newDefaults, callback) { // plays a song based on notes you put in a string
        var defaults = {
            "volume" : 1,
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
                    sound.start(defaults.volume, defaults.attack);
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
            } else if (callback) {
                callback();
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

String.prototype.forEach = function(doStuff) {
    /**
    .forEach() for strings
    non-native functions used = none
    */
    var string = "";
    for (var index=0; index<this.length; index++) {
        string += this[index];
    }
    for (index=0; index<string.length; index++) {
        var returnValue = doStuff(string[index], index, string) || "";
        if (returnValue.toLowerCase() == "break") {
            break;
        }
    }
}

String.prototype.format = function() {
    /**
    inserts specified items at a location indicated by an index number within curly braces
    takes an indefinite number of arguments
    example:
        "{0}'m super {2}. {0}'ve always been this {1}.".format("I", "cool", "awesome");
        "I'm super awesome. I've always been this cool."
    non-native functions used = none
    */
    var args = arguments;  // If "arguments" was used in place of "args", if would return the values of the inner function arguments.
    return this.replace(/{(\d+)}/g, function(match, number) {  // These function variables represent the match found and the number inside.
        return (typeof args[number]!="undefined") ? args[number] : match;  // only replaces things if there's something to replace it with
    });
}

HTMLCollection.prototype.forEach = function(doStuff) {
    /**
    HTMLCollection elements = stuff like the list in document.getElementsByClassName() or document.getElementsByTagName()
    creates a static list of HTMLCollection elements
    and does stuff for each one like Array.forEach()
    (.forEach() doesn't work for these lists without this code)
    implication of static list = you can remove the elements in doStuff without messing everything up
    non-native functions used = none
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
    non-native functions used = none
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
    non-native functions used = none
    */
    return (this.hasOwnProperty(key)&&this[key]==value) ? true : false;
};

function onLoad(doStuff) {
    /**
    does whatever the argument of the function says when the page loads
    non-native functions = none
    */
    return window.addEventListener("load", doStuff);  // There's no () after doStuff because it would run right away (not when the page loads).
}

function getTag(tag) {
    /**
    gets all of the elements made by a certain tag
    non-native functions = none
    */
    return document.getElementsByTagName(tag);
}

function getId(ID) {
    /**
    gets an element by ID
    non-native functions = none
    */
    return document.getElementById(ID);
}

function getClass(name) {
    /**
    gets elements with a certain class
    non-native functions = none
    */
    return document.getElementsByClassName(name);
}

function insertBefore(insertion, place) {
    /**
    inserts the insertion before the place
    applies to HTML elements
    the place can be a string of the ID of an element
    non-native functions = none
    */
    if (typeof place == "string") {
        return document.getElementById(place).parentNode.insertBefore(insertion, document.getElementById(place));
    } else {
        return place.parentNode.insertBefore(insertion, place);
    }
}

function insertAfter(insertion, place) {
    /**
    inserts the insertion after the place
    applies to HTML elements
    the place can be a string of the ID of an element
    non-native functions = none
    */
    if (typeof place == "string") {
        return document.getElementById(place).parentNode.insertBefore(insertion, document.getElementById(place).nextSibling);
    } else {
        return place.parentNode.insertBefore(insertion, place.nextSibling);
    }
}

function checkAll(item, comparator, comparisons, type) {
    /**
    comparisons = an array of things to be used in comparing things
    type = whether you need all of the comparisons to be true or just one ("&&" or "||")
    type must be a string
    when comparator isn't null:
        compares a given item to all items in an array
        comparator = how the items are being compared e.g. "==", ">", etc.
        comparator must be a string
        example:
            checkAll(document.getElementById("tester").innerHTML, "==", ["testing", "hello", "I'm really cool."], "||");
    when comparator is null:
        evaluates a formattable string (item) after formatting with the comparisons
        uses String.format() (my own function)
        items in comparisons = arguments to go in the () in .format()
            strings = one string is used per iteration
            arrays containing strings = one array is used per iteration
        examples:
            checkAll("{0} > 0 ", null, [2,"6",7,4,"3"], "||");
            checkAll("('abc'+'{0}'+'{1}'+'xyz').length == {2}", null, [["def","ghi",12],["qrstu","vw",13]], "&&");  // notice quotation marks around {}s for insertion of a string
    non-native functions used = String.format()
    */
    if (! comparator == null) {
        // >== and <== might not be comparators
        if (["==", "===", "!=", "!==", ">", "<", ">=", "<=", ">==", "<=="].indexOf(comparator) == -1) {
            throw "Invalid type of comparator.";
        }
    }
    var trueFalse;
    if (type == "||" || type.toLowerCase() == "or") {
        trueFalse = false;
        if (comparator == null) {
            if (typeof comparisons[0] == "array") {
                comparisons.forEach(function(comparison) {
                    if (eval(item.format.apply(this, comparison))) {
                        trueFalse = true;
                    }
                });
            } else {
                comparisons.forEach(function(comparison) {
                    if (eval(item.format(comparison))) {
                        trueFalse = true;
                    }
                });
            }
        } else {
            comparisons.forEach(function(comparison) {
                if (eval((typeof item == "string" ? '"' + item + '"' : item) + comparator + (typeof comparison == "string" ? '"' + comparison + '"' : comparison))) {
                    trueFalse = true;
                }
            });
        }
    } else if (type == "&&" || type.toLowerCase() == "and") {
        trueFalse = true;
        if (comparator == null) {
            if (typeof comparisons[0] == "array") {
                comparisons.forEach(function(comparison) {
                    if (! eval(item.format.apply(this, comparison))) {
                        trueFalse = false;
                    }
                });
            } else {
                comparisons.forEach(function(comparison) {
                    if (! eval(item.format(comparison))) {
                        trueFalse = false;
                    }
                });
            }
        } else {
            comparisons.forEach(function(comparison) {
                if (eval("!(" + (typeof item == "string" ? '"' + item + '"' : item) + comparator + (typeof comparison == "string" ? '"' + comparison + '"' : comparison) + ")")) {
                    trueFalse = false;
                }
            });
        }
    } else {
        throw "Invalid type of comparison.";
    }
    return trueFalse;
}

function read(URL, callback) {
    /**
    reads the contents of the file at the URL,
    converts it into a string,
    puts the string into a <div>, and then
    calls the callback function (which has no arguments)
    with "this" equalling the <div>
    non-native functions used = none
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
    non-native functions used = HTMLCollection.forEach()
    */
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
    color codes an element
    end1 and end2 specify the ends of a range (not used for strings)
    colors specifications can be added after all of the arguments
    colors are an indefinite number of 3-item arrays listed as arguments
    (items are integers from 0 to 255)
    e.g. colorCode(element, end1, end2, [12,23,34], [45,56,67], [78,89,90]);
    default colors = red and green
    for tables, the type of data contained is determined by a sample of the fourth and/or seventh item
    non-native functions = HTMLCollection.forEach() and checkAll()
    */
    var args = Array.prototype.slice.call(arguments, 3);
    var colors = args.length>0 ? args : [[255, 0, 0],[0, 255, 0]];  // Are there colors specified?
    if (element.tagName == "TABLE") {
        function backgroundColor(value) {
            var ends = [end1];
            colors.forEach(function(color, index, colors) {
                ends.push(end1+(end2-end1)*(index+2)/colors.length);
            });
            var number = value;
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
            return "rgb(" + red + ", " + green + ", " + blue + ")";
        }
        var tds = element.getElementsByTagName("td");  // tds[3] and tds[6] are representative samples of the type of data
        if (!isNaN(tds[3]) || !isNaN(tds[6])) {  // Is the data numbers?
            if (!(end1 && end2)) {  // if one or both ends aren't specified
                var lowest = Infinity,
                    highest = -Infinity;
                tds.forEach(function(item) {
                    try {
                        if (Number(item.innerHTML) < lowest) {
                            lowest = Number(item.innerHTML);
                        }
                        if (Number(item.innerHTML) > highest) {
                            highest = Number(item.innerHTML);
                        }
                    } finally {
                    }
                });
                end1 = lowest;
                end2 = highest;
            }
            tds.forEach(function(data) {
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
        } else if (tds[3].innerHTML.indexOf(":") > -1 || tds[6].innerHTML.indexOf(":") > -1) {  // if the data has a : (if it's a time or ratio)
            function toTimeNumber(time) {
                // converts the time into hours (or possibly minutes if minutes:seconds)
                var hours = time.split(":")[0].trim(),
                    minutes = time.split(":")[1] + "    ";  // extra spaces ensure the index isn't exceeded later on
                if (isNaN(hours[hours.length-2])) {  // Is there not 2 digits in the hour?
                    hours = hours.slice(-1);
                } else {
                    hours = hours.slice(-2);
                }
                hours = Number(hours);
                if (minutes.slice(2,5).toLowerCase().indexOf("pm") > -1) { 
                    hours += 12;
                }
                minutes = Number(minutes.slice(0,2))/60;
                return hours + minutes;
            }
            if (tds[3].innerHTML.indexOf("-") > -1 || tds[6].innerHTML.indexOf("-") > -1) {  // if the data has a - (if it's a time range)
                function timeDifference(difference, unit) {
                    unit = unit || "hours";
                    var first = difference.split("-")[0].trim(),
                        second = difference.split("-")[1].trim();
                    first = toTimeNumber(first);
                    second = toTimeNumber(second);
                    if (first > second) {
                        if (unit == "hours") {
                            second += 24;
                        } else if (unit == "minutes") {
                            second += 60;
                        }
                    }
                    return second - first;
                }
                if (!(end1 && end2)) {
                    var lowest = Infinity,
                        highest = -Infinity;
                    tds.forEach(function(item) {
                        try {
                            var difference = timeDifference(item.innerHTML);
                            if (difference < lowest) {
                                lowest = difference;
                            }
                            if (difference > highest) {
                                highest = difference;
                            }
                        } finally {
                        }
                    });
                    end1 = lowest;
                    end2 = highest;
                }
                tds.forEach(function(data) {
                    try {
                        data.style.backgroundColor = backgroundColor(timeDifference(data.innerHTML));
                    } finally {
                    }
                });
            } else {
                
            }
        }
    } else if (checkAll(element.tagName, "==", ["P", "H1", "H2", "H3", "H4", "H5", "H6", "SPAN"], "||")) {
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

// makes my custom tag which formats things as notes
document.createElement("note");
// makes my custom tag which overlines things
document.createElement("over");

if (!options.keyHasValue("automation", "none")) {
    
    //This is able to run without waiting for anything else to load.
    
    // adds the universal formatting
    if (options.hasOwnProperty("formatting")) {
        var localStyle = document.createElement("link");
        localStyle.rel = "stylesheet";
        localStyle.href = options.formatting;
        insertBefore(localStyle, document.head.children[0]);
    }
    var style = document.createElement("link");
    style.rel = "stylesheet";
    style.href = "https://coolprogramminguser.github.io/Standards/formatting.css";
    insertBefore(style, document.head.children[0]);
    
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
        
        if (!options.keyHasValue("section", "none")) {
            // surrounds the <body> content with a <section> tag
            var section = document.createElement("section");
            document.body.children.forEach(function(child) {
                section.appendChild(child);
            });
            document.body.appendChild(section);
        }
        
        if (!options.keyHasValue("title", "none")) {
            // adds a title to the page
            var title = document.createElement("h1");
            title.className = "mainTitle";
            title.id = "top";
            if (!options.hasOwnProperty("title")) {
                title.innerHTML = document.title;
            } else if (isNaN(options.title) && options.title[0]=="~") {
                eval("title.innerHTML = " + options.title.slice(1) + ";");
            } else {
                title.innerHTML = options.title;
            }
            document.body.insertBefore(title, document.body.children[0]);
        }
        
        // interprets <note> tags
        var noteNumber = 1;
        getTag("note").forEach(function(note, index, notes) {
            if (note.innerHTML[0] == "[" && note.innerHTML[note.innerHTML.length-1] == "]") {
                var reference = getId(note.innerHTML.slice(1,-1));
                note.title = reference.title;
                note.innerHTML = reference.innerHTML;
            } else {
                note.title = note.innerHTML;
                note.innerHTML = "<sup>[" + noteNumber + "]</sup>";
                noteNumber++;
            }
        });
        
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
                document.body.style = "margin:0vw 0vh 0vh 15vw; width: 80%;";
                read(options[spec], function() {
                    this.className = "nav";
                    document.body.insertBefore(this, document.body.childNodes[0]);
                });
                break;
        }
    }
    window.dispatchEvent(new CustomEvent("finished", {"detail":"This can say stuff."}));
});

// remember new Function() and function*
