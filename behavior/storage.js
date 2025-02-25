if (Standards) {
	if (!(Standards instanceof Object)) {
		var Standards = {};
		console.warn("Standards is not an object");
	}
} else {
	var Standards = {};
}
if (Standards.storage) {
	if (!(Standards.storage instanceof Object)) {
		Standards.storage = {};
		console.warn("Standards.storage is not an object");
	}
} else {
	Standards.storage = {};
}
if (typeof Standards.storage.options !== "undefined") {
	if (Standards.storage.options.constructor !== Object) {
		Standards.storage.options = {};
		console.warn("Standards.storage.options is not an Object");
	}
} else {
	Standards.storage.options = {};
}
/**
allows specifications to be added if the variable is already present
(otherwise uses default values and settings)
valid options =
	"automation": "none", "basic", "full"
		runs a corresponding amount of code after defining everything
		default = "full"
*/



Standards.storage.getType = function (item) {
	/**
	finds the type of an item since it's unnecessarily complicated to be sure normally
	extra arguments can be added to check against special types first
		each argument must be a string representation of the constructor
		checks are done with instanceof
	non-native functions = none
	*/
	var extraTypes = Array.prototype.slice.call(arguments, 1);
	var reverseIndex = extraTypes.length;
	if (reverseIndex > 0) {
		while (reverseIndex--) {
			let type = extraTypes[reverseIndex];
			if (type && type.constructor === String && type.search(/[^\w.()]/) === -1) {
				try {
					if (item instanceof eval(type)) {
						return type;
					}
				} catch (error) {
					console.warn('There was a problem evaluating the type of "' + type + '".');
				}
			}
		}
	}
	if (item === undefined) {  // if it's undefined
		/// undeclared variables won't make it to this function
		/// typeof item === "undefined" checks whether a variable exists
		return "undefined";
	} else if (item === null) {  // if it's null
		return "null";
	} else if (item.constructor === Number && isNaN(item)) {  // if it's not a number
		return "NaN";
	} else if (item.constructor.toString().search(/function HTML\w*Element\(\) \{ \[native code\] \}/) > -1) {  // if it's an HTML element
		return "HTMLElement";
	} else if (item instanceof Error) {
		return "Error";
	} else if (Object.prototype.toString.call(item) === "[object Object]") {
		// Use Object.getPrototypeOf to further check if it's a plain object
		if (Object.getPrototypeOf(item) === Object.prototype || Object.getPrototypeOf(item) === null) {
			return "Object";  // plain object like a Python dictionary
		} else {
			return "Instance";  // class instance or object with a custom prototype
		}
	} else {
		let match = item.constructor.toString().match(/^function (\w+)\(\)/);
		if (match === null) {
			console.error(TypeError("The item has an unknown type."));
			console.log(item.constructor.toString());
			console.log(item.constructor);
			return undefined;
		} else {
			return match[1];
		}
	}
};

Standards.storage.forEach = function (list, doStuff, shouldCopy) {
	/**
	does stuff for every item of an iterable list (or object)
	non-native functions = getType
	*/
	if (Standards.storage.getType(doStuff) != "Function") {
		throw new Error("The second arument provided in Standards.storage.forEach (" + doStuff + ") isn't a function.");
	}
	let index = 0;
	let returnValue;
	if (Standards.storage.getType(list) == "Object") {
		let associativeList,
			keys = Object.keys(list);
		shouldCopy = shouldCopy === undefined ? false : shouldCopy;
		if (shouldCopy) {
			associativeList = JSON.parse(JSON.stringify(list));
		} else {
			associativeList = list;
		}
		while (index < keys.length) {
			returnValue = doStuff(associativeList[keys[index]], keys[index], associativeList, index);
			if (returnValue == "break") {
				break;
			} else {
				index++;
			}
		}
		/// Using Object.keys() and a while loop is about 100 times faster than a for...in... loop.
		/// That's not to mention the fact that this.propertyIsEnumerable() would also need to be used which is also slow.
		/// This is still about 10 times slower than looping through things with number indicies, though.
		/// (These time comparisons are based on usage outside of this function;
		/// doing things by referencing a function makes things about 10 times longer.)
	} else if (Standards.storage.getType(list[Symbol.iterator]) == "Function" || list instanceof HTMLCollection) {
		/// Microsoft Edge doesn't think HTMLCollections have Symbol.iterator
		//// check this in Microsoft Edge again
		let item;
		if (shouldCopy) {
			let items = [];
			for (item of list) {
				items.push(item);
			}
			for (item of items) {
				returnValue = doStuff(item, index, items);
				if (returnValue == "break") {
					break;
				}
				index++;
			}
		} else {
			for (item of list) {
				returnValue = doStuff(item, index, list);
				if (returnValue == "break") {
					break;
				}
				index++;
			}
		}
	} else if (Standards.storage.getType(list) == "Number") {
		while (index < list) {
			returnValue = doStuff(list - index, index, list);
			if (returnValue == "break") {
				break;
			} else {
				index++;
			}
		}
	} else {
		throw new Error("The item provided (" + list + ") isn't iterable.");
	}
	//// add a function type option
};

Standards.storage.toHTML = function (HTML) {
	/**
	converts a string representation of HTML into (an) actual element(s) inside a <div>
	argument:
		HTML = required; the HTML string to convert
	non-native functions = getType
	*/
	if (!HTML) {
		throw new Error("No HTML was provided to convert.");
	} else if (Standards.storage.getType(HTML) != "String") {
		throw new Error("The provided argument is of an incorrect type.");
	}
	let container = document.createElement("div");
	container.innerHTML = HTML;
	// This is necessary because HTML5 doesn't think script tags and innerHTML should go together (for security reasons).
	let scripts = HTML.split("<script");  // adding the closing ">" in the splitting would close the script block
	if (scripts.length > 1) {
		scripts.forEach(function (script, index) {
			if (index > 0) {
				let scriptTag = document.createElement("script");
				scriptTag.appendChild(document.createTextNode(script.slice(script.indexOf(">") + 1, script.indexOf("</script>"))));
				container.insertBefore(scriptTag, container.getElementsByTagName("script")[index - 1]);
				let oldTag = container.getElementsByTagName("script")[index];
				oldTag.parentNode.removeChild(oldTag);
			}
		});
	}
	return container;
};

Standards.storage.flattenObject = function (object, options) {
	/**
	Takes a nested object and creates shallow object with the path of keys from the original strung together as the new key for each item.
	Arguments:
		object = required; the object to flatten
		options = optional; a dictionary of options
			"separator" = the string used to separate keys in the new object
				default = "/"
	*/
	if (!object) {
		throw new TypeError("No object was provided to flatten.");
	}
	options = options || {};
	if (!options.separator) {
		options.separator = "/";
	}
	if (!options.prefix) {
		options.prefix = "";
	}
	let flattenedObject = {};
	function exploreObject(obj, path) {
		let prepath = path;
		if (prepath != "" && prepath.slice(-options.separator.length) != options.separator) {
			prepath += options.separator;
		}
		Object.entries(obj).forEach(([key, item]) => {
			if (Standards.storage.getType(item) == "Object") {
				exploreObject(item, prepath + key);
			} else {
				flattenedObject[prepath + key] = item;
			}
		});
	}
	exploreObject(object, options.prefix);
	return flattenedObject;
};

Standards.storage.deepenObject = function (object, options) {
	/**
	Creates a nested object from a shallow object using the keys as paths.
	Arguments:
		object = required; the object to deepen
		options = optional; a dictionary of options
			"separator" = the string to find in the object keys to separate nesting levels
				default = "/"
	*/
	if (!object) {
		throw new TypeError("No object was provided to flatten.");
	}
	options = options || {};
	if (!options.separator) {
		options.separator = "/";
	}
	let deepenedObject = {};
	for (const key in object) {
		// Split the key by the separator and filter out any empty parts (e.g., due to trailing slashes)
		const parts = key.split(options.separator).filter(Boolean);
		let current = deepenedObject;
		parts.forEach((part, index) => {
			if (index === parts.length - 1) {  // if this is the last part, assign the value
				current[part] = object[key];
			} else {  // otherwise, create an empty object if it doesn't exist
				if (!current[part]) {
					current[part] = {};
				}
				current = current[part];  // then go to that level
			}
		});
	}
	return deepenedObject;
};

Standards.storage.makeDialog = function (message) {
	/**
	makes a dialog box pop up
	message = the content of the dialog box (can be an HTML element)
	Arguments after the message are two-item arrays which form buttons.
		first item = text of the button (innerHTML)
		second item = the function to run if that button is pressed
	The two-item arrays can be replaced with a single dictionary object.
		key = text of the button (innerHTML)
		value = the function called when the button is pressed
	The text of the button is passed to the functions,
	so the same function can be used for all of the buttons if the function checks the text.
	HTML buttons in the message can be used as the dialog buttons if they have the class "replace".
	Buttons can be left out by adding a falsy argument after the message.
	examples:
		Standards.storage.makeDialog(
			"Don't you think this dialog box is awesome?",
			["Yes", function () {console.log("You're awesome too!");}],
			["No", function () {console.log("Nobody cares what you think anyway!");}]
		);
		Standards.storage.makeDialog(
			"What do you think is the answer to life, the universe, and everything?",
			{
				love: function () {console.log("Don't make me laugh!");},
				money: function () {console.log("You're not too far off.");},
				42: function () {console.log("Your intelligence is indisputably immense.");}
			}
		);
	non-native functions = getType, forEach, and toHTML
	*/
	let pairs = Array.prototype.slice.call(arguments, 1),
		identifier = Standards.storage.identifier++;
	return new Promise(function (resolve, reject) {
		if (Standards.storage.getType(pairs[0]) == "Object") {
			let list = [];
			Standards.storage.forEach(pairs[0], function (value, key) {
				if (Standards.storage.getType(value) == "Function") {
					list.push([key, value]);
				} else if (!value) {
					list.push([key, function () { return; }]);
				} else {
					console.error('Behavior for the button "' + key + '" couldn\'t be recognized.');
				}
			});
			pairs = list;
			if (Standards.storage.getType(pairs[0]) == "Object") {  // if the object was empty
				pairs = [];
			}
		}
		if (pairs.length < 1) {
			pairs = [["Okay", function () { return; }]];
		} else if (pairs.length == 1 && !pairs[0]) {  // if there's only one falsy extra argument (if a button isn't desired)
			pairs = [];
		}
		pairs.forEach(function (pair, index) {
			if (Standards.storage.getType(pair) == "String") {
				pairs.splice(index, 1, [pair, function () { return; }]);
			} else if (Standards.storage.getType(pair) != "Array") {
				console.error("The item at position " + (index + 1) + " isn't a two-item array.");
				reject(new TypeError("The item at position " + (index + 1) + " isn't a two-item array."));
			} else if (pair.length != 2) {
				console.error("The item at position " + (index + 1) + " needs to have exactly two items.");
				reject(new Error("The item at position " + (index + 1) + " needs to have exactly two items."));
			}
		});
		let container = document.createElement("div");
		container.className = "dialog-container";
		let darkener = document.createElement("div"),
			dialog = document.createElement("div"),  // This could be changed to make a <dialog> element (without a class) if there were more support for it.
			contents,
			buttons = document.createElement("div");
		if (Standards.storage.getType(message) == "String") {
			contents = Standards.storage.toHTML(message);
		} else if (Standards.storage.getType(message) == "HTMLElement") {
			contents = message;
		} else {
			throw new Error("The message is of an incorrect type.");
		}
		let placedButtonsNumber = contents.getElementsByClassName("replace").length - 1;
		darkener.className = "darkener";
		darkener.style.pointerEvents = "auto";
		dialog.className = "dialog";
		buttons.className = "buttons";
		pairs.forEach(function (pair, index) {
			if (Standards.storage.getType(pair[0]) != "String") {
				console.error("The pair at position " + (index + 1) + " doesn't have a string as the first value.");
				reject(new Error("The pair at position " + (index + 1) + " doesn't have a string as the first value."));
			} else if (Standards.storage.getType(pair[1]) != "Function") {
				console.error("The pair at position " + (index + 1) + " doesn't have a function as the second value.");
				reject(new Error("The pair at position " + (index + 1) + " doesn't have a function as the second value."));
			}
			if (placedButtonsNumber >= index) {
				let button = contents.getElementsByClassName("replace")[index];
				button.innerHTML = pair[0];
				button.addEventListener("click", function () {
					pair[1](pair[0]);
					container.dispatchEvent(new Event("dialog" + identifier + "Answered"));
					this.removeEventListener("click", arguments.callee);
				});
			} else {
				let button = document.createElement("button");
				button.innerHTML = pair[0];
				buttons.appendChild(button);
				button.addEventListener("click", function () {
					pair[1](pair[0]);
					container.dispatchEvent(new Event("dialog" + identifier + "Answered"));
					this.removeEventListener("click", arguments.callee);
				});
			}
		});
		dialog.appendChild(contents);
		if (buttons.innerHTML) {
			dialog.appendChild(buttons);
		}
		let dialogs = document.getElementsByClassName("dialog");
		if (dialogs.length > 0 && dialogs[dialogs.length - 1].innerHTML == dialog.innerHTML) {  // if it's a repeat dialog
			console.warn("A dialog with this same message was already created.");
		} else {
			let x = document.createElement("div");
			x.className = "x";
			x.textContent = "X";
			x.addEventListener("click", function () {
				container.dispatchEvent(new Event("dialog" + identifier + "Answered"));
				this.removeEventListener("click", arguments.callee);
				reject("X");
			});
			container.appendChild(x);
			container.appendChild(dialog);
			darkener.appendChild(container);
			document.body.appendChild(darkener);
			container.addEventListener("dialog" + identifier + "Answered", function () {
				darkener.style.backgroundColor = "rgba(0, 0, 0, 0)";
				this.style.MsTransform = "scale(.001, .001)";
				this.style.WebkitTransform = "scale(.001, .001)";
				this.style.transform = "scale(.001, .001)";
				setTimeout(function () {  // waits until the dialog box is finished transitioning before removing it
					document.body.removeChild(darkener);
					resolve();
				}, 500);
			});
			setTimeout(function () {  // This breaks out of the execution block and allows transitioning to the states.
				darkener.style.backgroundColor = "rgba(0, 0, 0, .8)";
				container.style.MsTransform = "scale(1, 1)";
				container.style.WebkitTransform = "scale(1, 1)";
				container.style.transform = "scale(1, 1)";
			}, 0);
		}
	});
};

Standards.storage.Listenable = function () {
	/**
	creates an object which has a "value" property which can be listened to
	non-native functions = none
	*/
	var internalValue;
	var callbacks = [];
	return {
		get value() {
			setTimeout(function () {
				let index = 0;
				while (index < callbacks.length) {
					if (callbacks[index][0] == "get") {
						callbacks[index][1]();
					}
					if (callbacks[index] !== undefined && callbacks[index][2]) {  // The first test is needed in case a callback removes a listener.
						callbacks.splice(index, 1);
					} else {
						index++;
					}
				}
			}, 0);
			/// Putting the running of callbacks in a timeout ensures that the value is returned first.
			/// (Returning first would end function execution.)
			return internalValue;
		},
		set value(variable) {
			let originalValue = internalValue;
			internalValue = variable;
			let index = 0;
			while (index < callbacks.length) {
				if (callbacks[index][0] == "set") {
					callbacks[index][1](variable);
				} else if (callbacks[index][0] == "change" && originalValue !== internalValue) {
					callbacks[index][1](variable);
				}
				if (callbacks[index] !== undefined && callbacks[index][2]) {
					callbacks.splice(index, 1);
				} else {
					index++;
				}
			}
		},
		addEventListener: function (type, doStuff, listenOnce) {
			callbacks.push([type, doStuff, listenOnce]);
			setTimeout(function () {
				let index = 0;
				while (index < callbacks.length) {
					if (callbacks[index][0] == "listen") {
						callbacks[index][1]();
					}
					if (callbacks[index] !== undefined && callbacks[index][2]) {  // The first test is needed in case a callback removes a listener.
						callbacks.splice(index, 1);
					} else {
						index++;
					}
				}
			}, 0);
		},
		removeEventListener: function (type, doStuff) {
			let index = 0;
			while (index < callbacks.length) {
				if (callbacks[index][0] == type && callbacks[index][1] == doStuff) {
					callbacks.splice(index, 1);
				} else {
					index++;
				}
			}
			setTimeout(function () {
				let index = 0;
				while (index < callbacks.length) {
					if (callbacks[index][0] == "ignore") {
						callbacks[index][1]();
					}
					if (callbacks[index] !== undefined && callbacks[index][2]) {  // The first test is needed in case a callback removes a listener.
						callbacks.splice(index, 1);
					} else {
						index++;
					}
				}
			}, 0);
		}
	};
};



function convertToString(item) {  //// Make part of Standards.storage object?
	if (Standards.storage.getType(item) === undefined) {
		item = "~~" + String(item);
	} else {
		switch (Standards.storage.getType(item)) {
			case "Array":
				item = "~Array~" + JSON.stringify(item);
				break;
			case "Object":
				item = "~Object~" + JSON.stringify(item);
				break;
			case "HTMLElement":
				let container = document.createElement("div");
				container.appendChild(item.cloneNode(true));
				item = "~HTMLElement~" + container.innerHTML;
				break;
			case "Function":
				item = "~Function~";
				let stringified = String(item);
				if (stringified.search(/function *\( *\) *\{/) > -1) {  // if it's an anonymous function
					item += stringified.slice(stringified.indexOf("{") + 1, stringified.lastIndexOf("}"));
				} else {
					item += stringified;
				}
			default:
				item = "~" + Standards.storage.getType(item) + "~" + String(item);
		}
	}
	return item;
}
function convertFromString(info) {  //// Make part of Standards.storage object?
	if (info.search(/^~\w{0,20}~/) > -1) {  // if the information indicates a type
		info = info.slice(1);
		switch (info.split("~")[0]) {
			case "undefined":
			case "":
				return undefined;
			case "null":
				return null;
			case "NaN":
				return NaN;
			case "Array":
			case "Object":
				return JSON.parse(info.slice(info.indexOf("~") + 1));
			case "HTMLElement":
				let container = document.createElement("div");
				container.innerHTML = info.slice(info.indexOf("~") + 1);
				return container.children[0];
			default:
				try {
					return window[info.split("~")[0]](info.slice(info.indexOf("~") + 1));  // dynamically creates a constructor
				} catch (error) {
					console.error("There was a problem converting the data type.");
					return info.slice(info.indexOf("~") + 1);
				}
		}
	} else {
		console.warn("The information didn't have a data type associated with it.");
		return info;
	}
}

Standards.storage.standardizeStorageLocation = function (location, type, shouldAddSlash) {
	/**
	Takes a shorthand file location and converts it into a standardly formatted string (if necessary)
	Arguments:
		location = kind-of required; a string representing the file location you want to refer to
			undefined, null, or "" are assigned to the default location
		type = required; the type of storage being used ("local" or "session")
		shouldAddSlash = optional; whether or not to add a trailing slash to the location (typically for targeting folders)
			default is false
	Location formatting:
		Only a slash ("/") = the root directory
		Starting with a slash ("/") = an absolute file location (starting from the root directory)
			This bypasses the default location
		Starting with a period and a slash ("./") = a location relative to the default location
			This parallels the default behavior when the location isn't absolute
		Starting with any number of two periods and a slash ("../") = navigates to the parent folder(s) of the default location
			This pattern can't be contained in the middle of a provided location
		Starting by naming a folder or other location = a location relative to the default location
	Returns either a slash (for the root directory) or a string of folders separated by slashes (without a leading slash)
	*/
	let d = Standards.storage[type].defaultLocation;
	// sets unspecified locations to the default location
	if ((location === undefined || location === null || location === "") && d) {
		location = d;
		if (location[0] != "/") {
			location = "/" + location;
		}
	}
	if (Standards.storage.getType(location) == "String") {
		if (location[0] != "/" && !d) {  // if the location isn't absolute, and there's no default location
			throw new ReferenceError("No default location is present.");
		}
		// makes sure the default location is formatted properly
		d = d || "/";
		if (d[0] != "/") {
			d = "/" + d;
		}
		if (d.slice(-1) != "/") {
			d = d + "/";
		}
		// decides how to combine the default and provided locations
		if (location.slice(0, 2) == "..") {
			if (d == "/") {
				throw new Error("It's not possible to go above the root directory.");
			}
			let prelocation = d.slice(1, -1).split("/");
			while (location.slice(0, 2) == ".." && prelocation.length > 0) {
				prelocation.pop();
				location = location.slice(3);  // takes slashes into account
			}
			if (location.slice(0, 2) == "..") {
				throw new Error("The location goes above the root directory.");
			}
			location = "/" + prelocation.join("/") + "/" + location;
		} else if (location[0] == ".") {
			if (location.length > 1) {
				location = d + location.slice(2);
			} else {  // if the location is just "."
				location = d;
			}
		} else if (location[0] != "/") {  // if the location isn't absolute (from the root)
			location = d + location;
		}
		if (location != "/") {
			location = location.slice(1);  // eliminates the leading slash for easier downstream processing
		}
		// makes sure the list doesn't include the parent folder
		// (The most likely desired behavior when not specifying a location is getting all children without the known parent folder.)
		if (shouldAddSlash && location.slice(-1) != "/") {  // if a slash should be added to the end of the location
			location += "/";
		}
		// checks to make sure the final location is formatted properly
		if (location != "/" && location.search(/^[^/]+(?:\/[^/]+)*\/?$/) == -1) {
			throw new SyntaxError("The location \"" + location + "\" isn't formatted properly.");
		}
	} else {
		throw new TypeError("The location given wasn't a String.");
	}
	return location;
};

Standards.storage.session = {
	defaultLocation: "/",
	store: function (location, information) {
		/**
		stores information in session storage
		any primitive data type can be stored
		string type tags are used behind the scenes to keep track of data types
		items stored with this function will always be recalled correctly with the recall() function
		non-native functions = getType, forEach
		*/
		if (typeof Storage == "undefined") {
			alert("Your browser doesn't support the Storage object.");
			throw new Error("Client storage isn't supported.");
		} else {
			location = Standards.storage.standardizeStorageLocation(location, "session");
			if (location.slice(-1) == "/") {
				if (Standards.storage.getType(information) == "Object") {
					if (location == "/") {
						Standards.storage.forEach(information, function (value, key) {
							sessionStorage.setItem(key, convertToString(value));
						});
					} else {
						Standards.storage.forEach(information, function (value, key) {
							sessionStorage.setItem(location + key, convertToString(value));
						});
					}
				} else {
					console.warn("The folder was converted into a key since the information wasn't an Object.");
					if (location != "/") {
						sessionStorage.setItem(location.slice(0, -1), convertToString(information));
					} else {
						throw new Error("No storage key was provided.");
					}
				}
			} else if (location != "/") {
				sessionStorage.setItem(location, convertToString(information));
			} else {
				throw new Error("No storage key was provided.");
			}
		}
	},
	recall: function (location) {
		/**
		recalls information from session storage
		information is returned in its original form
			e.g. an array will be returned as an array, not a string representation
			null is considered a number and will return NaN (the number)
		if retrieving something that was stored directly into sessionStorage (without the store() function), there could be unexpected results
			items without "~[type]~" at the beginning should return as a string
			including any of those tags at the beginning will result in the tag being removed and the data type possibly being incorrectly determined
		non-native functions = getType, forEach
		*/
		if (typeof Storage == "undefined") {
			alert("Your browser doesn't support the Storage object.");
			throw new Error("Client storage isn't supported.");
		} else {
			location = Standards.storage.standardizeStorageLocation(location, "session");
			let information = "";
			if (location.slice(-1) == "/") {
				information = {};
				Object.keys(sessionStorage).forEach(function (key) {
					if (key.indexOf(location) == 0 && key.length > location.length && !key.slice(location.length).includes("/")) {
						information[key.slice(location.length)] = sessionStorage.getItem(key);
					}
				});
			} else {
				information = sessionStorage.getItem(location);
			}
			if (information === null) {
				console.warn("The information couldn't be found.");
				return Error("The information couldn't be found.");
			} else if (Standards.storage.getType(information) == "String") {
				return convertFromString(information);
			} else if (Standards.storage.getType(information) == "Object") {
				Standards.storage.forEach(information, function (value, key) {
					information[key] = convertFromString(value);
				});
				return information;
			} else {
				console.error("An error occurred while retrieving the information.");
				return convertFromString(information);
			}
		}
	},
	forget: function (location) {
		/**
		deletes information in session storage
		non-native functions = getType
		*/
		if (typeof Storage == "undefined") {
			alert("Your browser doesn't support the Storage object.");
			throw new Error("Client storage isn't supported.");
		} else {
			location = Standards.storage.standardizeStorageLocation(location, "session");
			if (location == "/") {
				sessionStorage.clear();
			} else if (location.slice(-1) == "/") {
				Object.keys(sessionStorage).forEach(function (key) {
					if (key.indexOf(location) == 0) {
						sessionStorage.removeItem(key);
					}
				});
				/// only deletes sub-documents, not the parent folder (or information with a key the same as the parent folder)
			} else {
				sessionStorage.removeItem(location);
			}
		}
	},
	list: function (location, options) {
		/**
		lists the keys of everything in session storage
		non-native functions = getType
		*/
		options = options || {};
		if (typeof Storage == "undefined") {
			alert("Your browser doesn't support the Storage object.");
			throw new Error("Client storage isn't supported.");
		} else {
			location = Standards.storage.standardizeStorageLocation(location, "session", true);
			var keyList = [];
			Object.keys(sessionStorage).forEach(function (key) {
				if (location == "/") {
					keyList.push(key);
				} else {
					if (location.slice(-1) == "/") {
						if (key.indexOf(location) == 0 && key.length > location.length) {
							keyList.push(key.slice(location.length));
						}
					} else {
						if (key.indexOf(location) == 0) {
							let locationArray = location.split("/");
							if (locationArray.length > 1) {
								keyList.push(key.slice(locationArray.slice(0, -1).join("/").length + 1));
							} else {
								keyList.push(key.slice(locationArray.slice(0, -1).join("/").length));
							}
						}
					}
				}
			});
			if (options.shallowKeyList) {
				let parentFolders = [];
				Standards.storage.forEach(keyList, function (key) {
					if (key.indexOf("/") > -1) {
						key = key.slice(0, key.indexOf("/"));
					}
					if (!parentFolders.includes(key)) {
						parentFolders.push(key);
					}
				});
				return parentFolders;
			} else if (options.maxDepth) {
				if (options.maxDepth > 0) {
					let trimmedFolders = [];
					Standards.storage.forEach(keyList, function (key) {
						key = key.split("/").slice(0, options.maxDepth).join("/");
						if (!trimmedFolders.includes(key)) {
							trimmedFolders.push(key);
						}
					});
					return trimmedFolders;
				} else {
					console.error("The maximum folder depth must be larger than 0.");
					return keyList;
				}
			} else {
				return keyList;
			}
		}
	},
	move: function (oldPlace, newPlace) {
		/**
		moves information in one place to another place
		non-native functions = getType, forEach
		*/
		if (typeof Storage == "undefined") {
			alert("Your browser doesn't support the Storage object.");
			throw new Error("Client storage isn't supported.");
		} else if (oldPlace != newPlace && Standards.storage.session.recall(oldPlace) !== null) {
			if (newPlace.slice(-1) != "/") { //// ?
				newPlace += "/";
			}
			if (oldPlace.slice(-1) == "/") {
				Standards.storage.forEach(Standards.storage.session.list(oldPlace), function (key) {
					Standards.storage.session.store(newPlace + key, Standards.storage.session.recall(oldPlace + key));
				});
				Standards.storage.session.forget(oldPlace);
			} else {
				Standards.storage.forEach(Standards.storage.session.list(oldPlace), function (key) {
					key = key.split("/").slice(1).join("/");
					if (key == "") {
						Standards.storage.session.store(newPlace.slice(0, -1), Standards.storage.session.recall(oldPlace));
						Standards.storage.session.forget(oldPlace);
					} else {
						Standards.storage.session.store(newPlace + key, Standards.storage.session.recall(oldPlace + "/" + key));
						Standards.storage.session.forget(oldPlace + "/" + key);
					}
				});
			}
		}
	}
};

Standards.storage.local = {
	defaultLocation: "/",
	store: function (location, information) {
		/**
		stores information in local storage
		any primitive data type can be stored
		string type tags are used behind the scenes to keep track of data types
		items stored with this function will always be recalled correctly with the recall() function
		non-native functions = getType, forEach
		*/
		if (typeof Storage == "undefined") {
			alert("Your browser doesn't support the Storage object.");
			throw new Error("Client storage isn't supported.");
		} else {
			location = Standards.storage.standardizeStorageLocation(location, "local");
			if (location.slice(-1) == "/") {
				if (Standards.storage.getType(information) == "Object") {
					if (location == "/") {
						Standards.storage.forEach(information, function (value, key) {
							localStorage.setItem(key, convertToString(value));
						});
					} else {
						Standards.storage.forEach(information, function (value, key) {
							localStorage.setItem(location + key, convertToString(value));
						});
					}
				} else {
					console.warn("The folder was converted into a key since the information wasn't an Object.");
					if (location != "/") {
						localStorage.setItem(location.slice(0, -1), convertToString(information));
					} else {
						throw new Error("No storage key was provided.");
					}
				}
			} else if (location != "/") {
				localStorage.setItem(location, convertToString(information));
			} else {
				throw new Error("No storage key was provided.");
			}
		}
	},
	recall: function (location) {
		/**
		recalls information from local storage
		information is returned in its original form
			e.g. an array will be returned as an array, not a string representation
			null is considered a number and will return NaN (the number)
		if retrieving something that was stored directly into localStorage (without the store() function), there could be unexpected results
			items without "~[type]~" at the beginning should return as a string
			including any of those tags at the beginning will result in the tag being removed and the data type possibly being incorrectly determined
		non-native functions = getType, forEach
		*/
		if (typeof Storage == "undefined") {
			alert("Your browser doesn't support the Storage object.");
			throw new Error("Client storage isn't supported.");
		} else {
			location = Standards.storage.standardizeStorageLocation(location, "local");
			let information = "";
			if (location.slice(-1) == "/") {
				information = {};
				Object.keys(localStorage).forEach(function (key) {
					if (key.indexOf(location) == 0 && key.length > location.length && !key.slice(location.length).includes("/")) {
						information[key.slice(location.length)] = localStorage.getItem(key);
					}
				});
			} else {
				information = localStorage.getItem(location);
			}
			if (information === null) {
				console.warn("The information couldn't be found.");
				return Error("The information couldn't be found.");
			} else if (Standards.storage.getType(information) == "String") {
				return convertFromString(information);
			} else if (Standards.storage.getType(information) == "Object") {
				Standards.storage.forEach(information, function (value, key) {
					information[key] = convertFromString(value);
				});
				return information;
			} else {
				console.error("An error occurred while retrieving the information.");
				return convertFromString(information);
			}
		}
	},
	forget: function (location) {
		/**
		deletes information in local storage
		non-native functions = getType
		*/
		if (typeof Storage == "undefined") {
			alert("Your browser doesn't support the Storage object.");
			throw new Error("Client storage isn't supported.");
		} else {
			location = Standards.storage.standardizeStorageLocation(location, "local");
			if (location == "/") {
				localStorage.clear();
			} else if (location.slice(-1) == "/") {
				Object.keys(localStorage).forEach(function (key) {
					if (key.indexOf(location) == 0) {
						localStorage.removeItem(key);
					}
				});
				/// only deletes sub-documents, not the parent folder (or information with a key the same as the parent folder)
			} else {
				localStorage.removeItem(location);
			}
		}
	},
	list: function (location, options) {
		/**
		lists the keys of everything in local storage
		non-native functions = getType
		*/
		options = options || {};
		if (typeof Storage == "undefined") {
			alert("Your browser doesn't support the Storage object.");
			throw new Error("Client storage isn't supported.");
		} else {
			location = Standards.storage.standardizeStorageLocation(location, "local", true);
			var keyList = [];
			Object.keys(localStorage).forEach(function (key) {
				if (location == "/") {
					keyList.push(key);
				} else {
					if (location.slice(-1) == "/") {
						if (key.indexOf(location) == 0 && key.length > location.length) {
							keyList.push(key.slice(location.length));
						}
					} else {
						if (key.indexOf(location) == 0) {
							let locationArray = location.split("/");
							if (locationArray.length > 1) {
								keyList.push(key.slice(locationArray.slice(0, -1).join("/").length + 1));
							} else {
								keyList.push(key.slice(locationArray.slice(0, -1).join("/").length));
							}
						}
					}
				}
			});
			if (options.shallowKeyList) {
				let parentFolders = [];
				Standards.storage.forEach(keyList, function (key) {
					if (key.indexOf("/") > -1) {
						key = key.slice(0, key.indexOf("/"));
					}
					if (!parentFolders.includes(key)) {
						parentFolders.push(key);
					}
				});
				return parentFolders;
			} else if (options.maxDepth) {
				if (options.maxDepth > 0) {
					let trimmedFolders = [];
					Standards.storage.forEach(keyList, function (key) {
						key = key.split("/").slice(0, options.maxDepth).join("/");
						if (!trimmedFolders.includes(key)) {
							trimmedFolders.push(key);
						}
					});
					return trimmedFolders;
				} else {
					console.error("The maximum folder depth must be larger than 0.");
					return keyList;
				}
			} else {
				return keyList;
			}
		}
	},
	move: function (oldPlace, newPlace) {
		/**
		moves information in one place to another place
		non-native functions = getType, forEach
		*/
		if (typeof Storage == "undefined") {
			alert("Your browser doesn't support the Storage object.");
			throw new Error("Client storage isn't supported.");
		} else if (oldPlace != newPlace && Standards.storage.local.recall(oldPlace) !== null) {
			if (newPlace.slice(-1) != "/") {  //// ?
				newPlace += "/";
			}
			if (oldPlace.slice(-1) == "/") {
				Standards.storage.forEach(Standards.storage.local.list(oldPlace), function (key) {
					Standards.storage.local.store(newPlace + key, Standards.storage.local.recall(oldPlace + key));
				});
				Standards.storage.local.forget(oldPlace);
			} else {
				Standards.storage.forEach(Standards.storage.local.list(oldPlace), function (key) {
					key = key.split("/").slice(1).join("/");
					if (key == "") {
						Standards.storage.local.store(newPlace.slice(0, -1), Standards.storage.local.recall(oldPlace));
						Standards.storage.local.forget(oldPlace);
					} else {
						Standards.storage.local.store(newPlace + key, Standards.storage.local.recall(oldPlace + "/" + key));
						Standards.storage.local.forget(oldPlace + "/" + key);
					}
				});
			}
		}
	}
};

Standards.storage.location = Standards.storage.local;  //// might be pointless
// allows one reference to be used for any storage location
// especially useful for switching to session storage for testing

Standards.storage.server = {
	database: typeof firebase != "undefined" && firebase.firestore ? firebase.firestore() : undefined,  // Using "typeof" is the only way to check if a non-argument variable exists without an error.
	defaultLocation: "/",
	user: undefined,  // gets set to firebase.auth().currentUser
	requireSignIn: true,
	checkCompatibility: function (shouldCheckUser) {
		if (navigator.onLine) {
			shouldCheckUser = shouldCheckUser === undefined ? Standards.storage.server.requireSignIn : shouldCheckUser;
			if (Standards.storage.server.database === undefined) {
				Standards.storage.makeDialog("There's no server to handle this action.");
				console.error("Firebase or Firestore doesn't exist.");
			}
			if (window.location.protocol != "http:" && window.location.protocol != "https:") {
				if (window.location.protocol == "file:") {
					console.warn("Signing in isn't possible from this URL.");
				} else {
					Standards.storage.makeDialog("Access to the server isn't allowed from this URL.");
					console.error('The URL doesn\'t use the protocol "http" or "https".');
				}
			}
			if (shouldCheckUser && !Standards.storage.server.user) {
				Standards.storage.makeDialog("That action isn't allowed without logging in.");
				console.warn("The action couldn't be completed because the user wasn't logged on.");
				return false;
			}
			return true;
		} else {
			Standards.storage.makeDialog("You're not connected to the internet.");
			console.error("No internet connection.");
			return false;
		}
	},
	locationType: "hybrid",  // shallow, hybrid, or deep
	formatLocation: function (location, ignoreLength) {
		/**
		formats the location
		the last section of the path should be the storage key
		preceding a location with a slash ("/") will allow location setting from the top of the user's directory
		preceding a location with a tilde ("~") or caret ("^") will allow absolute location setting (not within a user's directory)
		(the tilde is deprecated and will be changed eventually)
		ending a location with a slash ("/") indicates that a folder (not a key) is desired
		".." goes up a level from the default location
		ignoreLength = optional boolean; whether the length of the location should be ignored
			default: false
		non-native functions = getType
		*/

		// makes sure the default location is in the proper format
		if (Standards.storage.server.defaultLocation[0] == ".") {
			alert("An invalid default server storage location was provided");
			throw new Error("An invalid default server storage location was provided");
		}
		if (Standards.storage.server.defaultLocation[0] == "~" || Standards.storage.server.defaultLocation[0] == "^") {
			Standards.storage.server.defaultLocation = Standards.storage.server.defaultLocation.slice(1);
		} else if (Standards.storage.server.defaultLocation[0] == "/") {
			Standards.storage.server.defaultLocation = "users/" + Standards.storage.server.user.uid + Standards.storage.server.defaultLocation;
		}
		if (Standards.storage.server.defaultLocation.slice(-1) == "/") {
			Standards.storage.server.defaultLocation = Standards.storage.server.defaultLocation.slice(0, -1);
		}
		Standards.storage.server.defaultLocation = Standards.storage.server.defaultLocation.replace(/\//g, "<slash>");
		if (Standards.storage.server.defaultLocation.search(/^(?:(?:(?!<slash>).)+<slash>)*.+$/) == -1) {
			alert("The default server storage location has an improper path pattern.");
			throw new Error("The default server storage location has an improper path pattern.");
		}

		// converts the location into an absolute file location
		if (location === undefined || location === "") {
			location = "^" + Standards.storage.server.defaultLocation + "/";
		} else if (location == ".") {
			location = "^" + Standards.storage.server.defaultLocation;
		}
		if (Standards.storage.getType(location) == "String") {
			location = location.trim().replace(/\s*\/\s*/g, "<slash>");  // prevents undesireable whitespace and problems with slashes in document IDs
			if (location.slice(0, 8) == ".<slash>") {
				location = "^" + Standards.storage.server.defaultLocation + location.slice(1);
			}
			if (location[0] == "~" || location[0] == "^") {
				location = location.slice(1);
			} else if (location.slice(0, 7) == "<slash>") {
				if (location == "<slash>") {
					location = "users<slash>" + Standards.storage.server.user.uid;
				} else {
					location = "users<slash>" + Standards.storage.server.user.uid + location;
				}
			} else {
				let prelocation = Standards.storage.server.defaultLocation.split("<slash>");
				while (location.slice(0, 2) == "..") {
					prelocation.pop();
					location = location.slice(2);
					if (location == "" || location == "<slash>") {
						break;
					} else if (location.search(/<slash>./) > -1) {
						location = location.slice(7);
					} else {
						throw new Error("An invalid location pattern was provided.");
					}
				}
				if (location == "") {
					location = prelocation.join("<slash>");
				} else if (location == "<slash>") {
					location = prelocation.join("<slash>") + "<slash>";
				} else {
					location = prelocation.join("<slash>") + "<slash>" + location;
				}
			}
		} else {
			throw new Error("The location given wasn't a String.");
		}
		if (!ignoreLength && location.indexOf("<slash>") == -1) {
			throw new Error("No key was provided.");
		} else if (location === "") {
			location = "^";
		}
		return location;  // returns the location without the key
	},
	getReference: function (location, shouldCreate) {
		/**
		creates a storage reference based on a provided location
		formatted locations are used here
		shouldCreate = optional boolean; whether documents should be created as the path is navigated
			default: false
		different paths are separated by "<slash>"
		uses Google Firebase
		non-native functions = getType
		*/
		let reference = Standards.storage.server.database;
		if (location === "~" || location === "^" || !location.includes("<slash>")) {
			return reference;
		}
		location = location.slice(0, location.lastIndexOf("<slash>"));
		if (Standards.storage.server.locationType == "shallow") {
			reference = reference.collection("<collection>").doc(location);
			if (shouldCreate) {
				reference.set({ "<document>": "exists" }, { merge: true });
			}
		} else if (Standards.storage.server.locationType == "hybrid") {
			let defaultFolders = Standards.storage.server.defaultLocation.split("<slash>").length;
			let locationFolders = location.split("<slash>").length;
			let index = 0;
			while (locationFolders > index && index < defaultFolders) {
				reference = reference.collection("<collection>").doc(location.split("<slash>")[index]);
				if (shouldCreate) {
					reference.set({ "<document>": "exists" }, { merge: true });
				}
				index++;
			}
			if (locationFolders > defaultFolders) {
				// puts everything after the number of default folders into one document
				reference = reference.collection("<collection>").doc(location.match(new RegExp("(?:(?:(?!<slash>).)+<slash>){" + defaultFolders + "}(.+)"))[1]);
				if (shouldCreate) {
					reference.set({ "<document>": "exists" }, { merge: true });
				}
			}
		} else if (Standards.storage.server.locationType == "deep") {
			location.split("<slash>").forEach(function (place) {
				reference = reference.collection("<collection>").doc(place);
				if (shouldCreate) {
					reference.set({ "<document>": "exists" }, { merge: true });
				}
			});
		} else {
			throw new Error("An improper location type was given.");
		}
		return reference;
	},
	signUp: function (methods) {
		return new Promise(function (resolve, reject) {
			if (!Standards.storage.server.checkCompatibility(false)) {
				reject();
			}
			if (methods === undefined) {
				methods = "anonymous";
			}
			if (Standards.storage.getType(methods) == "Array") {
				let buttons = {};
				if (methods.includes("google")) {
					buttons.Google = function () {
						firebase.auth().signInWithRedirect(new firebase.auth.GoogleAuthProvider()).catch(function (error) {
							console.error("A problem occurred during sign-up.");
							console.error(error);
							Standards.storage.makeDialog("A problem occurred during sign-up.");
						});
					};
				}
				if (methods.includes("password")) {
					buttons["Email &<br>password"] = function () {
						Standards.storage.makeDialog(
							'Enter an email and secure password. The password must be at least 8 characters long and contain at least one letter, one capital, and one number.<br><input type="text" id="signUpEmailInput" placeholder="Email"><br><input type="password" id="signUpPasswordInput" placeholder="Password">',
							[
								"Sign up",
								function () {
									let email = document.getElementById("signUpEmailInput").value.trim();
									if (email.search(/.+@.+\..+/) > -1) {  // if a proper email is provided
										let password = document.getElementById("signUpPasswordInput").value.trim();
										if (password.length < 8) {  // if the password isn't long enough
											Standards.storage.makeDialog(
												"The password isn't long enough.",
												["Try again", function () {
													Standards.storage.server.signUp(methods);
												}]
											);
										} else if (password.search(/\w/) == -1) {  // if the password doesn't have any letters
											Standards.storage.makeDialog(
												"The password doesn't contain any letters.",
												["Try again", function () {
													Standards.storage.server.signUp(methods);
												}]
											);
										} else if (password == password.toLowerCase()) {  // if the password doesn't have any capital letters
											Standards.storage.makeDialog(
												"The password doesn't contain any capital letters.",
												["Try again", function () {
													Standards.storage.server.signUp(methods);
												}]
											);
										} else if (password.search(/\d/) == -1) {  // if the password doesn't have any numbers
											Standards.storage.makeDialog(
												"The password doesn't contain any numbers.",
												["Try again", function () {
													Standards.storage.server.signUp(methods);
												}]
											);
										} else {  // if the password passes
											firebase.auth().createUserWithEmailAndPassword(email, password).catch(function (error) {
												console.error("A problem occurred during sign-up.");
												console.error(error);
												Standards.storage.makeDialog("A problem occurred during sign-up.");
											});
										}
									} else {
										Standards.storage.makeDialog(
											"A properly formatted email wasn't provided.",
											["Try again", function () {
												Standards.storage.server.signUp(methods);
											}]
										);
									}
								}
							],
							["Cancel", reject]
						);
					};
				}
				Standards.storage.makeDialog("Sign up with your prefered sign-in provider.", buttons).then(resolve).catch(reject);
			} else if (Standards.storage.getType(methods) == "String") {
				switch (methods.toLowerCase()) {
					case "google":
						firebase.auth().signInWithRedirect(new firebase.auth.GoogleAuthProvider()).catch(function (error) {
							console.error("A problem occurred during sign-up.");
							console.error(error);
							Standards.storage.makeDialog("A problem occurred during sign-up.");
						});
						break;
					case "password":
						Standards.storage.makeDialog(
							'Enter an email and secure password. The password must be at least 8 characters long and contain at least one letter, one capital, and one number.<br><input type="text" id="signUpEmailInput" placeholder="Email"><br><input type="password" id="signUpPasswordInput" placeholder="Password">',
							[
								"Sign up",
								function () {
									let email = document.getElementById("signUpEmailInput").value.trim();
									if (email.search(/.+@.+\..+/) > -1) {  // if a proper email is provided
										let password = document.getElementById("signUpPasswordInput").value.trim();
										if (password.length < 8) {  // if the password isn't long enough
											Standards.storage.makeDialog(
												"The password isn't long enough.",
												["Try again", function () {
													Standards.storage.server.signUp(methods);
												}]
											);
											reject();
										} else if (password.search(/[a-zA-Z]/) == -1) {  // if the password doesn't have any letters
											Standards.storage.makeDialog(
												"The password doesn't contain any letters.",
												["Try again", function () {
													Standards.storage.server.signUp(methods);
												}]
											);
											reject();
										} else if (password == password.toLowerCase()) {  // if the password doesn't have any capital letters
											Standards.storage.makeDialog(
												"The password doesn't contain any capital letters.",
												["Try again", function () {
													Standards.storage.server.signUp(methods);
												}]
											);
											reject();
										} else if (password.search(/\d/) == -1) {  // if the password doesn't have any numbers
											Standards.storage.makeDialog(
												"The password doesn't contain any numbers.",
												["Try again", function () {
													Standards.storage.server.signUp(methods);
												}]
											);
											reject();
										} else {  // if the password passes
											firebase.auth().createUserWithEmailAndPassword(email, password).then(resolve).catch(function (error) {
												console.error("A problem occurred during sign-up.");
												console.error(error);
												Standards.storage.makeDialog("A problem occurred during sign-up.");
												reject();
											});
										}
									} else {
										Standards.storage.makeDialog(
											"A properly formatted email wasn't provided.",
											["Try again", function () {
												Standards.storage.server.signUp(methods);
											}]
										);
										reject();
									}
								}
							],
							["Cancel", reject]
						).catch(reject);
						break;
					default:
						console.error("The method of sign-up wasn't recognized.");
						Standards.storage.makeDialog("An attempt was made to sign up with an incorrect method.");
						reject();
				}
			} else {
				console.error('The "methods" of sign-up was an incorrect type.');
				Standards.storage.makeDialog("A problem occurred during sign-up.");
				reject();
			}
		});
	},
	signIn: function (methods) {
		return new Promise(function (resolve, reject) {
			if (!Standards.storage.server.checkCompatibility(false)) {
				reject();
			}
			if (methods === undefined) {
				methods = "anonymous";
			}
			switch (Standards.storage.getType(methods)) {
				case "Array":
					let buttons = {};
					if (methods.includes("google")) {
						buttons.Google = function () {
							firebase.auth().signInWithRedirect(new firebase.auth.GoogleAuthProvider()).catch(function (error) {
								console.error("A problem occurred during sign-in.");
								console.error(error);
								Standards.storage.makeDialog("A problem occurred during sign-in.");
							});
						};
					}
					if (methods.includes("password")) {
						buttons["Email &<br>password"] = function () {
							Standards.storage.makeDialog(
								'Enter your email and password.<br><input type="text" id="signInEmailInput" placeholder="Email"><br><input type="password" id="signInPasswordInput" placeholder="Password">',
								[
									"Sign in",
									function () {
										firebase.auth().signInWithEmailAndPassword(
											document.getElementById("signInEmailInput").value.trim(), document.getElementById("signInPasswordInput").value.trim()
										).catch(function (error) {
											console.error("A problem occurred during sign-in.");
											console.error(error);
											Standards.storage.makeDialog("A problem occurred during sign-in.");
										});
									}
								],
								"Cancel"
							);
						};
					}
					if (methods.includes("anonymous")) {
						buttons.Anonymous = function () {
							firebase.auth().signInAnonymously().catch(function (error) {
								console.error("A problem occurred during sign-in.");
								console.error(error);
								Standards.storage.makeDialog("A problem occurred during sign-in.");
							});
						};
					}
					Standards.storage.makeDialog("Sign in with your prefered sign-in provider.", buttons).then(resolve).catch(reject);
					break;
				case "String":
					switch (methods.toLowerCase()) {
						case "google":
							firebase.auth().signInWithRedirect(new firebase.auth.GoogleAuthProvider()).then(resolve).catch(function (error) {
								console.error("A problem occurred during sign-in.");
								console.error(error);
								Standards.storage.makeDialog("A problem occurred during sign-in.");
								reject();
							});
							break;
						case "password":
							Standards.storage.makeDialog(
								'Enter your email and password.<br><input type="text" id="signInEmailInput" placeholder="Email"><br><input type="password" id="signInPasswordInput" placeholder="Password">',
								[
									"Sign in",
									function () {
										firebase.auth().signInWithEmailAndPassword(
											document.getElementById("signInEmailInput").value.trim(), document.getElementById("signInPasswordInput").value.trim()
										).then(resolve).catch(function (error) {
											console.error("A problem occurred during sign-in.");
											console.error(error);
											Standards.storage.makeDialog("A problem occurred during sign-in.");
											reject();
										});
									}
								],
								["Cancel", reject]
							).catch(reject);
							break;
						case "anonymous":
							firebase.auth().signInAnonymously().then(resolve).catch(function (error) {
								console.error("A problem occurred during sign-in.");
								console.error(error);
								Standards.storage.makeDialog("A problem occurred during sign-in.");
								reject();
							});
							break;
						default:
							console.error("The method of sign-in wasn't recognized.");
							Standards.storage.makeDialog("An attempt was made to sign in with an incorrect method.");
							reject();
					}
					break;
				case "Function":
					methods = new Promise(methods);
				case "Promise":
					// allows briefly signing in to perform a function
					firebase.auth().signInAnonymously().then(function (userCredential) {
						methods.then(function () {
							userCredential.user.delete().then(resolve).catch(function (error) {
								console.error("It wasn't possible to delete the anonymous user's account.");
								console.error(error);
								resolve();
							});
						}).catch(function (error) {
							console.error("There was a problem completing the provided promise.");
							console.error(error);
							userCredential.user.delete().then(reject).catch(function (error) {
								console.error("It wasn't possible to delete the anonymous user's account.");
								console.error(error);
								reject();
							});
						});
					}).catch(function (error) {
						console.error("A problem occurred during sign-in.");
						console.error(error);
						Standards.storage.makeDialog("A problem occurred during sign-in.");
						reject();
					});
					break;
				default:
					console.error('The "methods" of sign-in was an incorrect type.');
					Standards.storage.makeDialog("A problem occurred during sign-in.");
					reject();
			}
		});
	},
	signOut: function () {
		Standards.storage.server.checkCompatibility();
		Standards.storage.makeDialog("Are you sure you want to log out?",
			["Yes", function () {
				firebase.auth().signOut();
			}],
			"No"
		);
	},
	mergeAccounts: function () {
		return new Promise(function (resolve, reject) {
			if (!Standards.storage.server.checkCompatibility()) {
				reject(new Error("It wasn't possible to access the server."));
			}
			//// do stuff
		});
	},
	store: function (location, item, options) {
		return new Promise(function (resolve, reject) {
			options = options || {};
			if (!Standards.storage.server.checkCompatibility(options.requireSignIn)) {
				reject(new Error("It wasn't possible to access the server."));
			}
			location = Standards.storage.server.formatLocation(location);
			let reference;
			if (location.slice(-7) == "<slash>") {  // if storing a whole folder of items
				if (Standards.storage.getType(item) == "Object") {
					// stores the items from the object
					let promiseList = [];
					Standards.storage.forEach(Standards.storage.flattenObject(item, { separator: "<slash>", prefix: location }), function (value, key) {
						reference = Standards.storage.server.getReference(key, true);
						promiseList.push(reference.set({
							[key.slice(key.lastIndexOf("<slash>") + 7)]: value
						}, { merge: true }));
						//// promiseList.push(reference.set(item, { merge: true }));  // stores multiple things at a time if the first argument is an object
					});
					// finishes things up after storing is finished
					Promise.all(promiseList).then(resolve).catch(function (error) {
						console.error("There was an error storing the information.");
						console.error(error);
						reject(error);
					});
				} else {
					console.error("Storing a folder requires an Object as the item to store.");
					reject(new TypeError("Storing a folder requires an Object as the item to store."));
				}
			} else {  // if storing a single key-value pair
				reference = Standards.storage.server.getReference(location, true);
				reference.set({
					[location.slice(location.lastIndexOf("<slash>") + 7)]: item
				}, { merge: true }).then(resolve).catch(function (error) {
					console.error("There was an error storing the information.");  // Putting an extra error here allows origin tracing when the error is in Firebase.
					console.error(error);
					reject(error);
				});
			}
		});
	},
	recall: function (location, callback, options) {
		return new Promise(function (resolve, reject) {
			options = options || {};
			if (!Standards.storage.server.checkCompatibility(options.requireSignIn)) {
				reject(new Error("It wasn't possible to access the server."));
			}
			location = Standards.storage.server.formatLocation(location);
			if (location.slice(-7) == "<slash>") {  // if retrieving a folder
				Standards.storage.server.getReference(location).get().then(function (doc) {
					if (doc.exists) {
						let data = doc.data();
						delete data["<document>"];
						if (callback) {
							new Promise(function () {
								callback(data);
								resolve(data);
							}).catch(function (error) {
								console.error("There was a problem running the callback.");
								console.error(error);
								reject(error);
							});
						} else {
							resolve(data);
						}
					} else {
						//// There might be something to do here depending on the locationType.
						console.warn("An attempt was made to access a non-existent document.");
						if (callback) {
							new Promise(function () {
								callback(Error("The information couldn't be found."));
								resolve(Error("The information couldn't be found."));
							}).catch(function (error) {
								console.error("There was a problem running the callback.");
								console.error(error);
								reject(error);
							});
						} else {
							resolve(Error("The information couldn't be found."));
						}
					}
				}).catch(function (error) {
					console.error("There was an error retrieving the information.");  // Putting an extra error here allows origin tracing when the error is in Firebase.
					console.error(error);
					reject(error);
				});
			} else {  // if retrieving a single item
				Standards.storage.server.getReference(location).get().then(function (doc) {
					if (doc.exists) {
						if (callback) {
							new Promise(function () {
								callback(doc.data()[location.slice(location.lastIndexOf("<slash>") + 7)]);
								resolve(doc.data()[location.slice(location.lastIndexOf("<slash>") + 7)]);
							}).catch(function (error) {
								console.error("There was a problem running the callback.");
								console.error(error);
								reject(error);
							});
						} else {
							resolve(doc.data()[location.slice(location.lastIndexOf("<slash>") + 7)]);
						}
					} else {
						console.warn("An attempt was made to access a non-existent document.");
						if (callback) {
							new Promise(function () {
								callback(Error("The information couldn't be found."));
								resolve(Error("The information couldn't be found."));
							}).catch(function (error) {
								console.error("There was a problem running the callback.");
								console.error(error);
								reject(error);
							});
						} else {
							resolve(Error("The information couldn't be found."));
						}
					}
				}).catch(function (error) {
					console.error("There was an error retrieving the information.");  // Putting an extra error here allows origin tracing when the error is in Firebase.
					console.error(error);
					reject(error);
				});
			}
		});
	},
	forget: function (location, callback, options) {
		return new Promise(function (resolve, reject) {
			options = options || {};
			if (!Standards.storage.server.checkCompatibility(options.requireSignIn)) {
				reject(new Error("It wasn't possible to access the server."));
			}
			location = Standards.storage.server.formatLocation(location);
			if (location == "~" || location == "^") {
				console.error("Deleting all server information is forbidden.");
				reject(new Error("Deleting all server information is forbidden."));
			} else if (location == "users<slash>") {
				console.error("Deleting every user's information is forbidden.");
				reject(new Error("Deleting every user's information is forbidden."));
			}
			let reference = Standards.storage.server.getReference(location);
			if (Standards.storage.server.locationType == "shallow") {
				if (location.slice(-7) == "<slash>") {  // if deleting a whole folder
					location = location.slice(0, -7);
					Standards.storage.server.database.collection("<collection>").get().then(function (collection) {
						let keyList = [];
						Standards.storage.forEach(collection.docs, function (subdoc) {
							if (subdoc.exists && subdoc.id.slice(0, location.length) == location) {
								keyList.push(subdoc.id);
							}
						});
						let remaining = new Standards.storage.Listenable();
						remaining.value = 0;
						remaining.addEventListener("change", function (value) {
							if (value == 0) {  // once all items have been deleted
								remaining.removeEventListener("change", arguments.callee);
								if (callback) {
									new Promise(function () {
										callback();
										resolve();
									}).catch(function (error) {
										console.error("There was a problem running the callback.");
										console.error(error);
										reject(error);
									});
								} else {
									resolve();
								}
							}
						});
						Standards.storage.forEach(keyList, function (id) {
							remaining.value++;
							Standards.storage.server.database.collection("<collection>").doc(id).delete().then(function () {
								remaining.value--;
							}).catch(function (error) {
								console.error("The information couldn't be deleted.");
								console.error(error);
								reject(error);
							});
						});
						remaining.value++;
						Standards.storage.server.database.delete().then(function () {  // deletes the document (which deletes all of the keys within)
							remaining.value--;
						}).catch(function (error) {
							console.error("The information couldn't be deleted.");
							console.error(error);
							reject(error);
						});
					}).catch(function (error) {
						console.error("There was an error finding the information.");
						console.error(error);
						reject(error);
					});
				} else {  // if deleting a single key-value pair
					Standards.storage.server.database.collection("<collection>").get().then(function (collection) {
						let found = false;
						Standards.storage.forEach(collection.docs, function (doc) {
							if (doc.exists && doc.id == location.slice(0, location.lastIndexOf("<slash>"))) {
								found = true;
								doc.ref.update({
									[location.slice(location.lastIndexOf("<slash>") + 7)]: firebase.firestore.FieldValue.delete()
								}).then(function () {
									if (callback) {
										new Promise(function () {
											callback();
											resolve();
										}).catch(function (error) {
											console.error("There was a problem running the callback.");
											console.error(error);
											reject(error);
										});
									} else {
										resolve();
									}
								}).catch(function (error) {  // This comes after .then so .then doesn't always run.
									console.error("The information couldn't be deleted.");
									console.error(error);
									reject(error);
								});
							}
						});
						if (!found) {
							console.warn("No information was found to delete.");
							if (callback) {
								new Promise(function () {
									callback();
									resolve();
								}).catch(function (error) {
									console.error("There was a problem running the callback.");
									console.error(error);
									reject(error);
								});
							} else {
								resolve();
							}
						}
					}).catch(function (error) {
						console.error("There was an error finding the information.");
						console.error(error);
						reject(error);
					});
				}
			} else if (Standards.storage.server.locationType == "hybrid") {
				let defaultLength = Standards.storage.server.defaultLocation.split("<slash>").length;
				if (location.split("<slash>").length - 1 > defaultLength) {  // if the location extends into shallow folders
					let docLocation = location.split("<slash>").slice(0, defaultLength).join("<slash>") + "<slash>";
					let remainingLocation = location.split("<slash>").slice(defaultLength).join("<slash>");
					reference = Standards.storage.server.getReference(docLocation);
					if (remainingLocation.slice(-7) == "<slash>") {  // if deleting a whole folder
						remainingLocation = remainingLocation.slice(0, -7);
						reference.collection("<collection>").get().then(function (collection) {
							let keyList = [];
							Standards.storage.forEach(collection.docs, function (subdoc) {
								if (subdoc.exists && subdoc.id.slice(0, remainingLocation.length) == remainingLocation) {
									keyList.push(subdoc.id);
								}
							});
							let remaining = new Standards.storage.Listenable();
							remaining.value = 0;
							remaining.addEventListener("set", function (value) {
								if (value == 0) {  // once all items have been deleted
									remaining.removeEventListener("set", arguments.callee);
									if (callback) {
										new Promise(function () {
											callback();
											resolve();
										}).catch(function (error) {
											console.error("There was a problem running the callback.");
											console.error(error);
											reject(error);
										});
									} else {
										resolve();
									}
								}
							});
							Standards.storage.forEach(keyList, function (id) {  // deletes all subdocuments
								remaining.value++;
								reference.collection("<collection>").doc(id).delete().then(function () {
									remaining.value--;
								}).catch(function (error) {
									console.error("The information couldn't be deleted.");
									console.error(error);
									reject(error);
								});
							});
							remaining.value = remaining.value;  // makes sure the callback is run even if there's nothing to delete
						}).catch(function (error) {
							console.error("There was an error finding the information.");
							console.error(error);
							reject(error);
						});
					} else {  // if deleting a single key-value pair
						reference.collection("<collection>").get().then(function (collection) {
							let found = false;
							Standards.storage.forEach(collection.docs, function (doc) {
								if (doc.exists && doc.id == remainingLocation.slice(0, remainingLocation.lastIndexOf("<slash>"))) {
									found = true;
									doc.ref.update({
										[remainingLocation.slice(remainingLocation.lastIndexOf("<slash>") + 7)]: firebase.firestore.FieldValue.delete()
									}).then(function () {
										if (callback) {
											new Promise(function () {
												callback();
												resolve();
											}).catch(function (error) {
												console.error("There was a problem running the callback.");
												console.error(error);
												reject(error);
											});
										} else {
											resolve();
										}
									}).catch(function (error) {  // This comes after .then so .then doesn't always run.
										console.error("The information couldn't be deleted.");
										console.error(error);
										reject(error);
									});
								}
							});
							if (!found) {
								console.warn("No information was found to delete.");
								if (callback) {
									new Promise(function () {
										callback();
										resolve();
									}).catch(function (error) {
										console.error("There was a problem running the callback.");
										console.error(error);
										reject(error);
									});
								} else {
									resolve();
								}
							}
						}).catch(function (error) {
							console.error("There was an error finding the information.");
							console.error(error);
							reject(error);
						});
					}
				} else {  // if the location stays in "deep" folders
					if (location.slice(-7) == "<slash>") {  // if deleting a whole folder
						reference.collection("<collection>").get().then(function (collectionProbe) {
							let listener = new Standards.storage.Listenable();
							listener.value = 0;
							listener.addEventListener("set", function (value) {
								if (value == 0) {  // once all items have been deleted
									listener.removeEventListener("set", arguments.callee);
									if (callback) {
										new Promise(function () {
											callback();
											resolve();
										}).catch(function (error) {
											console.error("There was a problem running the callback.");
											console.error(error);
											reject(error);
										});
									} else {
										resolve();
									}
								}
							});
							if (collectionProbe.size > 0) {  // if there's sub-documents
								/// when a new document is encountered, listener.value is incremented
								/// when a document is deleted, listener.value is decremented
								function deleteCollection(collection) {
									Standards.storage.forEach(collection, function (subdoc) {
										if (subdoc.exists) {
											listener.value++;
											subdoc.ref.collection("<collection>").get().then(function (subcollection) {
												if (subcollection.size > 0) {  // if there's sub-sub-documents
													deleteCollection(subcollection.docs);
												}
												subdoc.ref.delete().then(function () {
													listener.value--;
												}).catch(function (error) {
													console.error("The information couldn't be deleted.");
													console.error(error);
													reject(error);
												});
											}).catch(function (error) {
												console.error("There was an error retrieving the information.");
												console.error(error);
												reject(error);
											});
										}
									});
								}
								deleteCollection(collectionProbe.docs);
							}
							listener.value++;
							reference.delete().then(function () {
								listener.value--;
							}).catch(function (error) {
								console.error("The information couldn't be deleted.");
								console.error(error);
								reject(error);
							});
						}).catch(function (error) {
							console.error("There was an error retrieving the information.");
							console.error(error);
							reject(error);
						});
					} else {  // if deleting a single key-value pair
						reference.update({
							[location.slice(location.lastIndexOf("<slash>") + 7)]: firebase.firestore.FieldValue.delete()
						}).then(function () {
							if (callback) {
								new Promise(function () {
									callback();
									resolve();
								}).catch(function (error) {
									console.error("There was a problem running the callback.");
									console.error(error);
									reject(error);
								});
							} else {
								resolve();
							}
						}).catch(function (error) {  // This comes after .then so .then doesn't always run.
							console.error("The information couldn't be deleted.");
							console.error(error);
							reject(error);
						});
					}
				}
			} else if (Standards.storage.server.locationType == "deep") {
				if (location.slice(-7) == "<slash>") {  // if deleting a whole folder
					reference.collection("<collection>").get().then(function (collectionProbe) {
						let listener = new Standards.storage.Listenable();
						listener.value = 0;
						listener.addEventListener("change", function (value) {
							if (value == 0) {  // once all items have been deleted
								listener.removeEventListener("change", arguments.callee);
								if (callback) {
									new Promise(function () {
										callback();
										resolve();
									}).catch(function (error) {
										console.error("There was a problem running the callback.");
										console.error(error);
										reject(error);
									});
								} else {
									resolve();
								}
							}
						});
						if (collectionProbe.size > 0) {  // if there's sub-documents
							/// when a new document is encountered, listener.value is incremented
							/// when a document is deleted, listener.value is decremented
							function deleteCollection(collection) {
								Standards.storage.forEach(collection, function (subdoc) {
									if (subdoc.exists) {
										listener.value++;
										subdoc.ref.collection("<collection>").get().then(function (subcollection) {
											if (subcollection.size > 0) {  // if there's sub-sub-documents
												deleteCollection(subcollection.docs);
											}
											subdoc.ref.delete().then(function () {
												listener.value--;
											}).catch(function (error) {
												console.error("The information couldn't be deleted.");
												console.error(error);
												reject(error);
											});
										}).catch(function (error) {
											console.error("There was an error retrieving the information.");
											console.error(error);
											reject(error);
										});
									}
								});
							}
							deleteCollection(collectionProbe.docs);
						}
						listener.value++;
						reference.delete().then(function () {
							listener.value--;
						}).catch(function (error) {
							console.error("The information couldn't be deleted.");
							console.error(error);
							reject(error);
						});
					}).catch(function (error) {
						console.error("There was an error retrieving the information.");
						console.error(error);
						reject(error);
					});
				} else {  // if deleting a single key-value pair
					reference.update({
						[location.slice(location.lastIndexOf("<slash>") + 7)]: firebase.firestore.FieldValue.delete()
					}).then(function () {
						if (callback) {
							new Promise(function () {
								callback();
								resolve();
							}).catch(function (error) {
								console.error("There was a problem running the callback.");
								console.error(error);
								reject(error);
							});
						} else {
							resolve();
						}
					}).catch(function (error) {  // This comes after .then so .then doesn't always run.
						console.error("The information couldn't be deleted.");
						console.error(error);
						reject(error);
					});
				}
			} else {
				console.error("An improper locationType was provided.");
				reject(new Error("An improper locationType was provided."));
			}
		});
	},
	list: function (location, options) {
		/**
		lists the keys of items stored on the server

		arguments:
			location = optional; a string of the file location to start listing from
				default is Standards.storage.server.defaultLocation
			options = optional; an object specifying various options
				shallowKeyList (deprecated): whether only the first folder layer after the location should be returned
					default is false
				maxDepth: the number of folder levels to return
					default is 0 (all levels)
					a number greater than the number of levels will include all levels
					a value of 1 is the same as shallowKeyList
				//// keepTrailingSlashes: whether a slash should be added to the end when a key has deeper folder levels after it
					//// needs to be implemented
		*/
		return new Promise(function (resolve, reject) {
			// checks whether this function can be used
			if (!Standards.storage.server.checkCompatibility(options.requireSignIn)) {
				reject(new Error("It wasn't possible to access the server."));
			}
			// makes sure a standard location formatting is used
			if (location === undefined) {
				location = "./";
				/// makes sure the list doesn't include the parent folder
				/// (The most likely desired behavior when not specifying a location is getting all children without the known parent folder.)
			}
			location = Standards.storage.server.formatLocation(location, true);
			// fills in options unaccounted for
			options = options || {};
			if (!options.maxDepth) {
				options.maxDepth = 0;
			}

			let keyList = [];

			if (Standards.storage.server.locationType == "shallow") {  // if all documents are held in one collection
				Standards.storage.server.database.collection("<collection>").get().then(function (collection) {
					let preKey = "";  // holds the found file locations (document IDs)
					if (location == "~" || location == "^") {  // if trying to get all keys
						Standards.storage.forEach(collection.docs, function (doc) {
							let key = doc.id.split("<slash>")[0];
							if (!keyList.includes(key)) {
								keyList.push(key);
							}
						});
						/// returns only the first folder level of everything at the top of the directory
					} else if (location.slice(-7) == "<slash>") {  // if getting the key names within a folder
						location = location.slice(0, -7);
						Standards.storage.forEach(collection.docs, function (doc) {
							if (doc.exists && doc.id.search(new RegExp("^" + location + "(?:<slash>|$)")) > -1) {  // if beginning of document ID contains the file location
								if (doc.id.length > location.length) {
									preKey = doc.id.slice(location.length + 7) + "<slash>";
								} else {
									preKey = "";
								}
								Standards.storage.forEach(doc.data(), function (value, key) {
									if (key != "<document>") {
										keyList.push(preKey + key);
									}
								});
							}
						});
					} else {  // if getting a key with the same name or keys within a folder (includes folder name in returned path)
						Standards.storage.forEach(collection.docs, function (doc) {
							if (doc.exists) {
								if (doc.id == location.split("<slash>").slice(0, -1).join("<slash>")) {  // if the document is one folder-level up
									if (doc.data().hasOwnProperty(location.split("<slash>").slice(-1)[0])) {  // if the document has the key at the end of the location
										keyList.push(location.split("<slash>").slice(-1)[0]);
									}
								} else if (doc.id.search(new RegExp("^" + location + "<slash>")) > -1) {  // if beginning of the document ID contains the file location
									if (location.includes("<slash>")) {
										preKey = doc.id.slice(location.lastIndexOf("<slash>") + 7) + "<slash>";
									} else {
										preKey = "";
									}
									Standards.storage.forEach(doc.data(), function (value, key) {
										if (key != "<document>") {
											keyList.push(preKey + key);
										}
									});
								}
							}
						});
					}
					Standards.storage.forEach(keyList, function (key, index) {
						keyList[index] = key.replace(/<slash>/g, "/");
					});
					if (options.shallowKeyList) {
						let parentFolders = [];
						Standards.storage.forEach(keyList, function (key) {
							if (key.indexOf("/") > -1) {
								key = key.slice(0, key.indexOf("/"));
							}
							if (!parentFolders.includes(key)) {
								parentFolders.push(key);
							}
						});
						resolve(parentFolders);
					} else if (options.maxDepth) {
						if (options.maxDepth > 0) {
							let trimmedFolders = [];
							Standards.storage.forEach(keyList, function (key) {
								key = key.split("/").slice(0, options.maxDepth).join("/");
								if (!trimmedFolders.includes(key)) {
									trimmedFolders.push(key);
								}
							});
							resolve(trimmedFolders);
						} else {
							console.error("The maximum folder depth must be larger than 0.");
							resolve(keyList);
						}
					} else {
						resolve(keyList);
					}
				}).catch(function (error) {
					console.error("There was an error finding the information.");
					console.error(error);
					reject(error);
				});

			} else if (Standards.storage.server.locationType == "hybrid") {  // if the default location is "deep" and the modifier locations are "shallow"
				let defaultLength = Standards.storage.server.defaultLocation.split("<slash>").length;
				if (location == "~" || location == "^") {
					Standards.storage.server.database.collection("<collection>").get().then(function (collection) {
						Standards.storage.forEach(collection.docs, function (doc) {
							let key = doc.id.split("<slash>")[0];
							if (!keyList.includes(key)) {
								keyList.push(key);
							}
						});
						/// returns only the first folder level of everything at the top of the directory
						// none of the keys should have "<slash>"
						if (options.shallowKeyList) {
							let parentFolders = [];
							Standards.storage.forEach(keyList, function (key) {
								if (key.indexOf("/") > -1) {
									key = key.slice(0, key.indexOf("/"));
								}
								if (!parentFolders.includes(key)) {
									parentFolders.push(key);
								}
							});
							resolve(parentFolders);
						} else if (options.maxDepth) {
							if (options.maxDepth > 0) {
								let trimmedFolders = [];
								Standards.storage.forEach(keyList, function (key) {
									key = key.split("/").slice(0, options.maxDepth).join("/");
									if (!trimmedFolders.includes(key)) {
										trimmedFolders.push(key);
									}
								});
								resolve(trimmedFolders);
							} else {
								console.error("The maximum folder depth must be larger than 0.");
								resolve(keyList);
							}
						} else {
							resolve(keyList);
						}
					}).catch(function (error) {
						console.error("There was an error finding the information.");
						console.error(error);
						reject(error);
					});
				} else if (location.split("<slash>").length - 1 > defaultLength) {  // if the provided location goes deeper than the default location
					let docLocation = location.split("<slash>").slice(0, defaultLength).join("<slash>") + "<slash>";
					let remainingLocation = location.split("<slash>").slice(defaultLength).join("<slash>");
					Standards.storage.server.getReference(docLocation).collection("<collection>").get().then(function (collection) {
						let preKey = "";  // holds the found file locations (document IDs)
						if (remainingLocation.slice(-7) == "<slash>") {  // if getting the key names within a folder
							remainingLocation = remainingLocation.slice(0, -7);
							Standards.storage.forEach(collection.docs, function (doc) {
								if (doc.exists && doc.id.search(new RegExp("^" + remainingLocation + "(?:<slash>|$)")) > -1) {  // if beginning of doc ID contains location
									if (doc.id.length > remainingLocation.length) {
										preKey = doc.id.slice(remainingLocation.length + 7) + "<slash>";
									} else {
										preKey = "";
									}
									Standards.storage.forEach(doc.data(), function (value, key) {
										if (key != "<document>") {
											keyList.push(preKey + key);
										}
									});
								}
							});
						} else {  // if getting a key with the same name or keys within a folder (includes folder name in returned path)
							Standards.storage.forEach(collection.docs, function (doc) {
								if (doc.exists) {
									if (doc.id == remainingLocation.split("<slash>").slice(0, -1).join("<slash>")) {  // if the document is one folder-level up
										if (doc.data().hasOwnProperty(remainingLocation.split("<slash>").slice(-1)[0])) {  // if document has key at the end of the location
											keyList.push(remainingLocation.split("<slash>").slice(-1)[0]);
										}
									} else if (doc.id.search(new RegExp("^" + remainingLocation + "(?:<slash>|$)")) > -1) { // if beginning of doc ID contains file location
										/// remainingLocation always contains "<slash>" at this point
										preKey = doc.id.slice(remainingLocation.lastIndexOf("<slash>") + 7) + "<slash>";
										Standards.storage.forEach(doc.data(), function (value, key) {
											if (key != "<document>") {
												keyList.push(preKey + key);
											}
										});
									}
								}
							});
						}
						Standards.storage.forEach(keyList, function (key, index) {
							keyList[index] = key.replace(/<slash>/g, "/");
						});
						if (options.shallowKeyList) {
							let parentFolders = [];
							Standards.storage.forEach(keyList, function (key) {
								if (key.indexOf("/") > -1) {
									key = key.slice(0, key.indexOf("/"));
								}
								if (!parentFolders.includes(key)) {
									parentFolders.push(key);
								}
							});
							resolve(parentFolders);
						} else if (options.maxDepth) {
							if (options.maxDepth > 0) {
								let trimmedFolders = [];
								Standards.storage.forEach(keyList, function (key) {
									key = key.split("/").slice(0, options.maxDepth).join("/");
									if (!trimmedFolders.includes(key)) {
										trimmedFolders.push(key);
									}
								});
								resolve(trimmedFolders);
							} else {
								console.error("The maximum folder depth must be larger than 0.");
								resolve(keyList);
							}
						} else {
							resolve(keyList);
						}
					}).catch(function (error) {
						console.error("There was an error finding the information.");
						console.error(error);
						reject(error);
					});
				} else {  // if the provided location length is shallower than (or equal to) the default location
					let reference = Standards.storage.server.getReference(location);
					reference.collection("<collection>").get().then(function (collectionProbe) {
						if (collectionProbe.size > 0) {  // if there's sub-documents
							let listener = new Standards.storage.Listenable();
							listener.value = 1;
							listener.addEventListener("change", function (value) {
								if (value == 0) {  // once all items have been listed
									listener.removeEventListener("change", arguments.callee);
									Standards.storage.forEach(keyList, function (key, index) {
										keyList[index] = key.replace(/<slash>/g, "/");
									});
									if (options.shallowKeyList) {
										let parentFolders = [];
										Standards.storage.forEach(keyList, function (key) {
											if (key.indexOf("/") > -1) {
												key = key.slice(0, key.indexOf("/"));
											}
											if (!parentFolders.includes(key)) {
												parentFolders.push(key);
											}
										});
										resolve(parentFolders);
									} else if (options.maxDepth) {
										if (options.maxDepth > 0) {
											let trimmedFolders = [];
											Standards.storage.forEach(keyList, function (key) {
												key = key.split("/").slice(0, options.maxDepth).join("/");
												if (!trimmedFolders.includes(key)) {
													trimmedFolders.push(key);
												}
											});
											resolve(trimmedFolders);
										} else {
											console.error("The maximum folder depth must be larger than 0.");
											resolve(keyList);
										}
									} else {
										resolve(keyList);
									}
								}
							});
							/// when a new document is encountered, listener.value is incremented
							/// when a document's keys have been iterated, listener.value is decremented
							function exploreCollection(collection, path) {
								Standards.storage.forEach(collection, function (doc) {
									if (doc.exists) {
										listener.value++;
										doc.ref.collection("<collection>").get().then(function (subcollection) {
											if (subcollection.size > 0) {  // if there's sub-sub-documents
												exploreCollection(subcollection.docs, path + doc.id + "<slash>");
											}
											Standards.storage.forEach(doc.data(), function (value, key) {
												if (key != "<document>") {
													keyList.push(path + doc.id + "<slash>" + key);
												}
											});
											listener.value--;
										}).catch(function (error) {
											console.error("List retrieval failed.");
											console.error(error);
											reject(error);
										});
									}
								});
							}
							if (location.slice(-7) == "<slash>") {
								exploreCollection(collectionProbe.docs, "");
								reference.get().then(function (doc) {
									if (doc.exists && Object.keys(doc.data()).length > 1) {  // if the document has any field values
										Standards.storage.forEach(doc.data(), function (value, key) {
											if (key != "<document>") {
												keyList.push(key);
											}
										});
									}
									listener.value--;
								}).catch(function (error) {
									console.error("List retrieval failed.");  // Putting an extra error here allows origin tracing when the error is in Firebase.
									console.error(error);
									reject(error);
								});
							} else if (location.split("<slash>").length - 1 == defaultLength) {
								let locationKey = location.slice(location.lastIndexOf("<slash>") + 7);
								Standards.storage.forEach(collectionProbe.docs, function (doc) {
									if (doc.exists && doc.id.search(new RegExp("^" + locationKey + "(?:<slash>|$)")) > -1) {
										Standards.storage.forEach(doc.data(), function (value, key) {
											if (key != "<document>") {
												keyList.push(doc.id + "<slash>" + key);
											}
										});
									}
								});
								reference.get().then(function (doc) {
									if (doc.exists && Object.keys(doc.data()).includes(locationKey)) {  // if the document has the location's key
										keyList.push(locationKey);
									}
									listener.value--;
								}).catch(function (error) {
									console.error("List retrieval failed.");  // Putting an extra error here allows origin tracing when the error is in Firebase.
									console.error(error);
									reject(error);
								});
							} else if (location.includes("<slash>")) {
								Standards.storage.forEach(collectionProbe.docs, function (doc) {
									if (doc.id == location.slice(location.lastIndexOf("<slash>") + 7)) {  // if a doc ID matches the location key (only true <= 1 time)
										exploreCollection([doc], "");
									}
								});
								reference.get().then(function (doc) {
									if (doc.exists && Object.keys(doc.data()).includes(location.slice(location.lastIndexOf("<slash>") + 7))) {  // if doc has location's key
										keyList.push(location.slice(location.lastIndexOf("<slash>") + 7));
									}
									listener.value--;
								}).catch(function (error) {
									console.error("List retrieval failed.");  // Putting an extra error here allows origin tracing when the error is in Firebase.
									console.error(error);
									reject(error);
								});
							} else {
								Standards.storage.forEach(collectionProbe.docs, function (doc) {
									if (doc.exists && doc.id == location) {  // if a doc ID matches the location key (only true <= 1 time)
										exploreCollection([doc], "");
									}
								});
								listener.value--;
							}
						} else {  // if there's not sub-documents
							reference.get().then(function (doc) {
								if (doc.exists) {
									if (location.slice(-7) == "<slash>") {  // if getting the contents of a folder
										Standards.storage.forEach(doc.data(), function (value, key) {
											if (key != "<document>") {
												keyList.push(key);
											}
										});
									} else if (Object.keys(doc.data()).includes(location.slice(location.lastIndexOf("<slash>") + 7))) {  // if document has location's key
										keyList.push(location.slice(location.lastIndexOf("<slash>") + 7));
									}
									Standards.storage.forEach(keyList, function (key, index) {
										keyList[index] = key.replace(/<slash>/g, "/");
									});
									if (options.shallowKeyList) {
										let parentFolders = [];
										Standards.storage.forEach(keyList, function (key) {
											if (key.indexOf("/") > -1) {
												key = key.slice(0, key.indexOf("/"));
											}
											if (!parentFolders.includes(key)) {
												parentFolders.push(key);
											}
										});
										resolve(parentFolders);
									} else if (options.maxDepth) {
										if (options.maxDepth > 0) {
											let trimmedFolders = [];
											Standards.storage.forEach(keyList, function (key) {
												key = key.split("/").slice(0, options.maxDepth).join("/");
												if (!trimmedFolders.includes(key)) {
													trimmedFolders.push(key);
												}
											});
											resolve(trimmedFolders);
										} else {
											console.error("The maximum folder depth must be larger than 0.");
											resolve(keyList);
										}
									} else {
										resolve(keyList);
									}
								} else {
									console.warn("An attempt was made to access a non-existent document.");
									// keyList is empty and doesn't need to have "<slash>"s replaced
									if (options.shallowKeyList) {
										let parentFolders = [];
										Standards.storage.forEach(keyList, function (key) {
											if (key.indexOf("/") > -1) {
												key = key.slice(0, key.indexOf("/"));
											}
											if (!parentFolders.includes(key)) {
												parentFolders.push(key);
											}
										});
										resolve(parentFolders);
									} else if (options.maxDepth) {
										if (options.maxDepth > 0) {
											let trimmedFolders = [];
											Standards.storage.forEach(keyList, function (key) {
												key = key.split("/").slice(0, options.maxDepth).join("/");
												if (!trimmedFolders.includes(key)) {
													trimmedFolders.push(key);
												}
											});
											resolve(trimmedFolders);
										} else {
											console.error("The maximum folder depth must be larger than 0.");
											resolve(keyList);
										}
									} else {
										resolve(keyList);
									}
								}
							}).catch(function (error) {
								console.error("List retrieval failed.");  // Putting an extra error here allows origin tracing when the error is in Firebase.
								console.error(error);
								reject(error);
							});
						}
					}).catch(function (error) {
						console.error("There was an error finding the information.");
						console.error(error);
						reject(error);
					});
				}

			} else if (Standards.storage.server.locationType == "deep") {  // if every folder level is another nested document
				let reference = Standards.storage.server.getReference(location);
				reference.collection("<collection>").get().then(function (collectionProbe) {
					if (collectionProbe.size > 0) {  // if there's sub-documents
						if (location == "~" || location == "^") {
							Standards.storage.forEach(collectionProbe.docs, function (doc) {
								keyList.push(doc.id);
							});
							// none of the keys should have "<slash>"
							if (options.shallowKeyList) {
								let parentFolders = [];
								Standards.storage.forEach(keyList, function (key) {
									if (key.indexOf("/") > -1) {
										key = key.slice(0, key.indexOf("/"));
									}
									if (!parentFolders.includes(key)) {
										parentFolders.push(key);
									}
								});
								resolve(parentFolders);
							} else if (options.maxDepth) {
								if (options.maxDepth > 0) {
									let trimmedFolders = [];
									Standards.storage.forEach(keyList, function (key) {
										key = key.split("/").slice(0, options.maxDepth).join("/");
										if (!trimmedFolders.includes(key)) {
											trimmedFolders.push(key);
										}
									});
									resolve(trimmedFolders);
								} else {
									console.error("The maximum folder depth must be larger than 0.");
									resolve(keyList);
								}
							} else {
								resolve(keyList);
							}
						} else {
							let listener = new Standards.storage.Listenable();
							listener.value = 1;
							listener.addEventListener("change", function (value) {
								if (value == 0) {  // once all items have been listed
									listener.removeEventListener("change", arguments.callee);
									Standards.storage.forEach(keyList, function (key, index) {
										keyList[index] = key.replace(/<slash>/g, "/");
									});
									if (options.shallowKeyList) {
										let parentFolders = [];
										Standards.storage.forEach(keyList, function (key) {
											if (key.indexOf("/") > -1) {
												key = key.slice(0, key.indexOf("/"));
											}
											if (!parentFolders.includes(key)) {
												parentFolders.push(key);
											}
										});
										resolve(parentFolders);
									} else if (options.maxDepth) {
										if (options.maxDepth > 0) {
											let trimmedFolders = [];
											Standards.storage.forEach(keyList, function (key) {
												key = key.split("/").slice(0, options.maxDepth).join("/");
												if (!trimmedFolders.includes(key)) {
													trimmedFolders.push(key);
												}
											});
											resolve(trimmedFolders);
										} else {
											console.error("The maximum folder depth must be larger than 0.");
											resolve(keyList);
										}
									} else {
										resolve(keyList);
									}
								}
							});
							/// when a new document is encountered, listener.value is incremented
							/// when a document's keys have been iterated, listener.value is decremented
							function exploreCollection(collection, path) {
								Standards.storage.forEach(collection, function (doc) {
									if (doc.exists) {
										listener.value++;
										doc.ref.collection("<collection>").get().then(function (subcollection) {
											if (subcollection.size > 0) {  // if there's sub-sub-documents
												exploreCollection(subcollection.docs, path + doc.id + "<slash>");
											}
											Standards.storage.forEach(doc.data(), function (value, key) {
												if (key != "<document>") {
													keyList.push(path + doc.id + "<slash>" + key);
												}
											});
											listener.value--;
										}).catch(function (error) {
											console.error("List retrieval failed.");
											console.error(error);
											reject(error);
										});
									}
								});
							}
							if (location.slice(-7) == "<slash>") {
								exploreCollection(collectionProbe.docs, "");
								reference.get().then(function (doc) {
									if (doc.exists && Object.keys(doc.data()).length > 1) {  // if the document has any field values
										Standards.storage.forEach(doc.data(), function (value, key) {
											if (key != "<document>") {
												keyList.push(key);
											}
										});
									}
									listener.value--;
								}).catch(function (error) {
									console.error("List retrieval failed.");  // Putting an extra error here allows origin tracing when the error is in Firebase.
									console.error(error);
									reject(error);
								});
							} else {
								Standards.storage.forEach(collectionProbe.docs, function (doc) {
									if (doc.id == location.slice(location.lastIndexOf("<slash>") + 7)) {  // if a doc ID matches the location key (only true <= 1 time)
										exploreCollection([doc], "");
									}
								});
								reference.get().then(function (doc) {
									if (doc.exists && Object.keys(doc.data()).includes(location.slice(location.lastIndexOf("<slash>") + 7))) {  // if doc has location's key
										keyList.push(location.slice(location.lastIndexOf("<slash>") + 7));
									}
									listener.value--;
								}).catch(function (error) {
									console.error("List retrieval failed.");  // Putting an extra error here allows origin tracing when the error is in Firebase.
									console.error(error);
									reject(error);
								});
							}
						}
					} else {  // if there's not sub-documents
						reference.get().then(function (doc) {
							if (doc.exists) {
								if (location.slice(-7) == "<slash>") {  // if getting the contents of a folder
									Standards.storage.forEach(doc.data(), function (value, key) {
										if (key != "<document>") {
											keyList.push(key);
										}
									});
								} else if (Object.keys(doc.data()).includes(location.slice(location.lastIndexOf("<slash>") + 7))) {  // if document has the location's key
									keyList.push(location.slice(location.lastIndexOf("<slash>") + 7));
								}
								Standards.storage.forEach(keyList, function (key, index) {
									keyList[index] = key.replace(/<slash>/g, "/");
								});
								if (options.shallowKeyList) {
									let parentFolders = [];
									Standards.storage.forEach(keyList, function (key) {
										if (key.indexOf("/") > -1) {
											key = key.slice(0, key.indexOf("/"));
										}
										if (!parentFolders.includes(key)) {
											parentFolders.push(key);
										}
									});
									resolve(parentFolders);
								} else if (options.maxDepth) {
									if (options.maxDepth > 0) {
										let trimmedFolders = [];
										Standards.storage.forEach(keyList, function (key) {
											key = key.split("/").slice(0, options.maxDepth).join("/");
											if (!trimmedFolders.includes(key)) {
												trimmedFolders.push(key);
											}
										});
										resolve(trimmedFolders);
									} else {
										console.error("The maximum folder depth must be larger than 0.");
										resolve(keyList);
									}
								} else {
									resolve(keyList);
								}
							} else {
								console.warn("An attempt was made to access a non-existent document.");
								// keyList should be empty
								if (options.shallowKeyList) {
									let parentFolders = [];
									Standards.storage.forEach(keyList, function (key) {
										if (key.indexOf("/") > -1) {
											key = key.slice(0, key.indexOf("/"));
										}
										if (!parentFolders.includes(key)) {
											parentFolders.push(key);
										}
									});
									resolve(parentFolders);
								} else if (options.maxDepth) {
									if (options.maxDepth > 0) {
										let trimmedFolders = [];
										Standards.storage.forEach(keyList, function (key) {
											key = key.split("/").slice(0, options.maxDepth).join("/");
											if (!trimmedFolders.includes(key)) {
												trimmedFolders.push(key);
											}
										});
										resolve(trimmedFolders);
									} else {
										console.error("The maximum folder depth must be larger than 0.");
										resolve(keyList);
									}
								} else {
									resolve(keyList);
								}
							}
						}).catch(function (error) {
							console.error("List retrieval failed.");  // Putting an extra error here allows origin tracing when the error is in Firebase.
							console.error(error);
							reject(error);
						});
					}
				}).catch(function (error) {
					console.error("There was an error finding the information.");
					console.error(error);
					reject(error);
				});
			} else {
				alert("The action couldn't be completed.");
				console.error("An improper location type was given.");
				reject(new TypeError("An improper location type was given."));
			}
		});
	},
	move: function (oldPlace, newPlace, callback, options) {
		return new Promise(function (resolve, reject) {
			options = options || {};
			if (!Standards.storage.server.checkCompatibility(options.requireSignIn)) {
				reject(new Error("It wasn't possible to access the server."));
			}
			if (oldPlace == newPlace) {
				console.warn("The items are already in the desired location.");
				if (callback) {
					new Promise(function () {
						callback();
						resolve();
					}).catch(function (error) {
						console.error("There was a problem running the callback.");
						console.error(error);
						reject(error);
					});
				} else {
					resolve();
				}
			} else if (Standards.storage.getType(oldPlace) == "String" && Standards.storage.getType(newPlace) == "String") {
				if (oldPlace.slice(-1) == "/" || newPlace.slice(-1) == "/") {
					if (newPlace.slice(-1) != "/") {  //// ?
						newPlace += "/";
					}
					let remaining = new Standards.storage.Listenable();
					remaining.value = 0;
					remaining.addEventListener("set", function (value) {
						if (value == 0) {  // if there are no more items waiting to be moved
							remaining.removeEventListener("set", arguments.callee);
							if (callback) {
								new Promise(function () {
									callback();
									resolve();
								}).catch(function (error) {
									console.error("There was a problem running the callback.");
									console.error(error);
									reject(error);
								});
							} else {
								resolve();
							}
						}
					});
					Standards.storage.server.list(oldPlace).then(function (oldList) {
						if (oldPlace.slice(-1) == "/") {
							Standards.storage.forEach(oldList, function (key) {
								remaining.value++;
								Standards.storage.server.recall(oldPlace + key).then(function (info) {
									Standards.storage.server.store(newPlace + key, info).then(function () {
										Standards.storage.server.recall(newPlace + key).then(function (movedInfo) {  // failsafe
											/// checks whether the information was actually moved
											/// not essential but prevents premature deletion in strange circumstances
											if (movedInfo === info) {
												Standards.storage.server.forget(oldPlace + key).then(function () {
													remaining.value--;
												}).catch(function (error) {
													console.error("There was a problem deleting the moved information.");
													console.error(error);
													reject(error);
												});
											} else {
												console.error("The information in the newPlace doesn't match the information that was moved there.");
												reject(new Error("The information in the newPlace doesn't match the information that was moved there."));
											}
										}).catch(function (error) {
											console.error("There was a problem checking whether the information was actually moved.");
											console.error(error);
											reject(error);
										});
									}).catch(function (error) {
										console.error("There was a problem storing the information to move.");
										console.error(error);
										reject(error);
									});
								}).catch(function (error) {
									console.error("There was a problem recalling the information to move.");
									console.error(error);
									reject(error);
								});
							});
						} else {
							Standards.storage.forEach(oldList, function (key) {
								remaining.value++;
								if (!key.includes("/")) {
									Standards.storage.server.recall(oldPlace).then(function (info) {
										Standards.storage.server.store(newPlace + key, info).then(function () {
											Standards.storage.server.recall(newPlace + key).then(function (movedInfo) {  // failsafe
												/// checks whether the information was actually moved
												/// not essential but prevents premature deletion in strange circumstances
												if (movedInfo === info) {
													Standards.storage.server.forget(oldPlace).then(function () {
														remaining.value--;
													}).catch(function (error) {
														console.error("There was a problem deleting the moved information.");
														console.error(error);
														reject(error);
													});
												} else {
													console.error("The information in the newPlace doesn't match the information that was moved there.");
													reject(new Error("The information in the newPlace doesn't match the information that was moved there."));
												}
											}).catch(function (error) {
												console.error("There was a problem checking whether the information was actually moved.");
												console.error(error);
												reject(error);
											});
										}).catch(function (error) {
											console.error("There was a problem storing the information to move.");
											console.error(error);
											reject(error);
										});
									}).catch(function (error) {
										console.error("There was a problem recalling the information to move.");
										console.error(error);
										reject(error);
									});
								} else {
									Standards.storage.server.recall(oldPlace + key.slice(key.indexOf("/"))).then(function (info) {
										Standards.storage.server.store(newPlace + key, info).then(function () {
											Standards.storage.server.recall(newPlace + key).then(function (movedInfo) {  // failsafe
												/// checks whether the information was actually moved
												/// not essential but prevents premature deletion in strange circumstances
												if (movedInfo === info) {
													Standards.storage.server.forget(oldPlace + key.slice(key.indexOf("/"))).then(function () {
														remaining.value--;
													}).catch(function (error) {
														console.error("There was a problem deleting the moved information.");
														console.error(error);
														reject(error);
													});
												} else {
													console.error("The information in the newPlace doesn't match the information that was moved there.");
													reject(new Error("The information in the newPlace doesn't match the information that was moved there."));
												}
											}).catch(function (error) {
												console.error("There was a problem checking whether the information was actually moved.");
												console.error(error);
												reject(error);
											});
										}).catch(function (error) {
											console.error("There was a problem storing the information to move.");
											console.error(error);
											reject(error);
										});
									}).catch(function (error) {
										console.error("There was a problem recalling the information to move.");
										console.error(error);
										reject(error);
									});
								}
							});
						}
						remaining.value = remaining.value;  // runs the listener if there aren't any items
					}).catch(function (error) {
						console.error("There was a problem listing the information to move.");
						console.error(error);
						reject(error);
					});
				} else {  // if neither place is a folder
					Standards.storage.server.recall(oldPlace).then(function (info) {
						if (info instanceof Error) {
							console.error("No information was found to move.");
							reject();
						} else {
							Standards.storage.server.store(newPlace, info).then(function () {
								Standards.storage.server.recall(newPlace).then(function (movedInfo) {  // failsafe
									/// checks whether the information was actually moved
									/// not essential but prevents premature deletion in strange circumstances
									if (movedInfo === info) {
										Standards.storage.server.forget(oldPlace).then(function () {
											if (callback) {
												new Promise(function () {
													callback();
													resolve();
												}).catch(function (error) {
													console.error("There was a problem running the callback.");
													console.error(error);
													reject(error);
												});
											} else {
												resolve();
											}
										}).catch(function (error) {
											console.error("There was a problem deleting the moved information.");
											console.error(error);
											reject(error);
										});
									} else {
										console.error("The information in the newPlace doesn't match the information that was moved there.");
										reject(new Error("The information in the newPlace doesn't match the information that was moved there."));
									}
								}).catch(function (error) {
									console.error("There was a problem checking whether the information was actually moved.");
									console.error(error);
									reject(error);
								});
							}).catch(function (error) {
								console.error("There was a problem storing the information to move.");
								console.error(error);
								reject(error);
							});
						}
					}).catch(function (error) {
						console.error("There was a problem recalling the information to move.");
						console.error(error);
						reject(error);
					});
				}
			} else {
				if (Standards.storage.getType(oldPlace) == "String") {
					console.error("The newPlace to move to is not a string.");
					reject(new TypeError("The newPlace to move to is not a string."));
				} else {
					console.error("The oldPlace to move is not a string.");
					reject(new TypeError("The oldPlace to move is not a string."));
				}
			}
		});
	},
	mergeData: function (preferClient, keepMissing, clientData, serverData, options) {
		/**
		Merges provided data with data on the server
		This is meant to handle sets of data, not individual items
		Returns a Promise

		Arguments:
			preferClient = Required; A boolean or function specifying when conflicting data should be overwritten
				Function is passed the conflicting data values, client first, then server
				Function must return a boolean
				A resulting true causes the server information to be replaced by the client data
			keepMissing = Required; A function specifying whether data not found in the other location should be kept
				The first argument passed to the function is an object containing information about the data in question
					{ data: the data, location: the key, fromServer: whether the data is from the server (true or false) }
				Function must return a boolean
				A resulting true causes the outstanding data to be kept and copied to the location lacking that data
			clientData = Optional; The data or storage location to merge with the server data
				Providing a string causes the data to be interpreted as a client storage location where the data to merge can be found
				Providing an object currently results in an error
				Defaults to options.storageType.defaultLocation
			serverData = Optional; The server location to merge to
				Defaults to Standards.storage.server.defaultLocation
			options = Optional; Additional options
				requireSignIn: Whether it should be necessary for a user to be signed in to perform the action
					Default = true
				storageType: What type of client storage should be used ("local" or "session")
					Only used when clientData is a string (when a storage location to merge was provided)
					Default = "local"
				prepTasks: Tasks to be completed before the primary merging code
					Functions will run at execution time, and Promises are guaranteed to resolve before preferClient or keepMissing
					Accepts one task or an array of tasks
					Results of the functions or Promises are provided to preferClient and keepMissing as an additional array at the end
				ignoreInClient: A string or array of client keys that shouldn't be considered during merging
					Default = []
				ignoreInServer: A string or array of server keys that shouldn't be considered during merging
					Default = []
				maxDepth: The maximum folder depth used internally to gather values to be used in the provided functions
					Any further folder levels will appear as nested objects within the processing functions
					(A larger maxDepth will run the functions fewer times and have larger objects provided as arguments)
					This value applies to both the server storage and the client storage
					A number greater than the number of levels (or 0) will include all levels
					Default = 0 (all levels)  //// There would currently be an error if this value was allowed to run
					Example:
						maxDepth = 1
						All keys = ["a/a/a", "a/a/b", "a/a/c", "a/b/a", "a/b/b", "b/a/a", "b/a/b", "b/b/a", "b/c", "b/d"]
						Internal keys = ["a", "b"]
						Values provided to both preferClient and keepMissing
							{ a:{ a:val1, b:val2, c:val3 }, b:{ a:val4, b:val5 } }
							{ a:{ a:val6, b:val7 }, b:{ a:val8 }, c:val9, d:val10 }
		*/
		return new Promise(function (resolve, reject) {
			// accepts or sets the options
			options = options || {};
			options.storageType = options.storageType || "local";
			if (options.storageType != "local" && options.storageType != "session") {
				console.error("An invalid storage place was provided (" + options.storageType + ").");
				reject();
			}
			if (options.prepTasks) {
				if (["Function", "Promise"].includes(Standards.storage.getType(options.prepTasks))) {
					options.prepTasks = [options.prepTasks];
				} else if (Standards.storage.getType(options.prepTasks) != "Array") {
					console.error(new TypeError("The prepTasks option was an unrecognized type (" + Standards.storage.getType(options.prepTasks) + ")."));
					options.prepTasks = [];
				}
			} else {
				options.prepTasks = [];
			}
			if (options.ignoreInClient) {
				switch (Standards.storage.getType(options.ignoreInClient)) {
					case "String":
						options.ignoreInClient = [options.ignoreInClient];
						break;
					case "Array":
						// do nothing
						break;
					default:
						console.error("The ignoreInClient option was an unrecognized type (" + Standards.storage.getType(options.ignoreInClient) + ").");
						reject();
				}
			} else {
				options.ignoreInClient = [];
			}
			if (options.ignoreInServer) {
				switch (Standards.storage.getType(options.ignoreInServer)) {
					case "String":
						options.ignoreInServer = [options.ignoreInServer];
						break;
					case "Array":
						// do nothing
						break;
					default:
						console.error("The ignoreInServer option was an unrecognized type (" + Standards.storage.getType(options.ignoreInServer) + ").");
						reject();
				}
			} else {
				options.ignoreInServer = [];
			}
			// checks whether the server is accessible
			if (!Standards.storage.server.checkCompatibility(options.requireSignIn)) {
				reject(new Error("It wasn't possible to access the server."));
			}
			// checks whether a valid preferClient was provided
			if (["Boolean", "Function"].indexOf(Standards.storage.getType(preferClient)) == -1) {  // if preferClient isn't a boolean or a function
				console.error("preferClient needs to be a boolean or a function.");
				reject(new TypeError("preferClient was neither a boolean nor a function."));
			} else if (preferClient === true || preferClient === false) {
				preferClient = function () { return preferClient; };
			} else if (Standards.storage.getType(preferClient) == "Boolean") {
				console.error("A boolean was provided for preferClient, but it wasn't a literal true or false.");
				reject();
			}
			// checks whether a valid keepMissing was provided
			if (Standards.storage.getType(keepMissing) != "Function") {  // if keepMissing isn't a function
				console.error("keepMissing needs to be a function.");
				reject(new TypeError("keepMissing wasn't a function."));
			}
			// sets the clientData if necessary
			if (!clientData) {
				clientData = Standards.storage[options.storageType].defaultLocation;
			}
			// checks for a valid serverData
			if (serverData === undefined || serverData === null) {
				serverData = "";
			}
			if (Standards.storage.getType(serverData) != "String") {
				console.error("The provided serverData wasn't a string.");
				reject(new TypeError("serverData should be a string, undefined, or null."));
			}
			// merges the data according to the type of data provided
			let dataType = Standards.storage.getType(clientData);
			if (dataType == "String") {
				// makes sure the data is interpreted as referring to a folder
				if (clientData.slice(-1) != "/") {
					clientData += "/";
				}
				let storagePlace = Standards.storage[options.storageType];
				let promiseList = [];
				promiseList.push(Standards.storage.server.list(serverData, { maxDepth: options.maxDepth }));
				Standards.storage.forEach(options.prepTasks, function (task) {
					if (Standards.storage.getType(task) == "Function") {
						promiseList.push(task());
					} else {
						promiseList.push(task);
					}
				});
				Promise.all(promiseList).then(function (resolvedList) {
					let serverData = resolvedList[0];  // lists all of the stored server data
					let taskResults = resolvedList.slice(1);  // results of the prepTasks
					let remaining = new Standards.storage.Listenable();
					remaining.value = 1;
					remaining.addEventListener("set", function (value) {
						if (value == 0) {  // once all items have been successfully handled
							resolve();
						}
					});
					let localDataList = storagePlace.list(clientData, { maxDepth: options.maxDepth });
					serverData = serverData.map(key => key + "/");  //// This needs to be removed when key listing is improved
					localDataList = localDataList.map(key => key + "/");  //// This needs to be removed when key listing is improved
					options.ignoreInServer = options.ignoreInServer.map(key => key + "/");  //// This needs to be removed when key listing is improved
					options.ignoreInClient = options.ignoreInClient.map(key => key + "/");  //// This needs to be removed when key listing is improved
					// inspects all of the data stored on the server
					Standards.storage.forEach(serverData, function (key) {
						if (options.ignoreInServer.indexOf(key) == -1) {  // if the current item shouldn't be ignored
							remaining.value++;
							if (serverData != "" && serverData.slice(-1) != "/") {
								key = serverData + "/" + key;
							} else {
								key = serverData + key;
							}
							Standards.storage.server.recall(key, function (serverInfo) {
								if (localDataList.indexOf(key) == -1) {  // if the server has information not present in the client data
									if (keepMissing({ data: serverInfo, location: key, fromServer: true }, taskResults)) {  // if the server information should be kept and copied
										storagePlace.store(key, serverInfo);
										remaining.value--;
									} else {  // if the server information needs to be deleted
										Standards.storage.server.forget(key).then(function () {
											remaining.value--;
										}).catch(function (error) {
											console.error("Unwanted information on the server couldn't be deleted.");
											console.error(error);
											remaining.value--;
										});
									}
								} else if (serverInfo !== storagePlace.recall(key)) {  // if the server data isn't the same as the client data
									let localInfo = storagePlace.recall(key);
									if (preferClient(localInfo, serverInfo, taskResults)) {  // if the server data should be overwritten by the client data
										Standards.storage.server.store(key, localInfo).then(function () {
											remaining.value--;
										}).catch(function (error) {
											console.error("There was an error overwriting the server information.");
											console.error(error);
											reject(error);
											// remaining.value--;
										});
									} else {  // if the client data should be overwritten by the server data
										storagePlace.store(key, serverInfo);
										remaining.value--;
									}
								} else {  // if the server data and the client data is the same
									remaining.value--;
								}
							}).catch(function (error) {
								console.error("There was an error retrieving the server data.");
								console.error(error);
								reject(error);
								// remaining.value--;
							});
						}
					});
					// looks for any client data not present on the server
					Standards.storage.forEach(localDataList, function (key) {
						if (options.ignoreInClient.indexOf(key) == -1) {  // if the current item shouldn't be ignored
							if (serverData.indexOf(key) == -1) {  // if the client data has information not present on the server
								let localInfo = storagePlace.recall(key);
								if (keepMissing({ data: localInfo, location: key, fromServer: false }, taskResults)) {  // if the client data should be kept and copied
									remaining.value++;
									Standards.storage.server.store(key, localInfo).then(function () {
										remaining.value--;
									}).catch(function (error) {
										console.error("There was an error adding data to the server.");
										console.error(error);
										reject(error);
										// remaining.value--;
									});
								} else {  // if the client data should be deleted
									storagePlace.forget(key);
								}
							}
						}
					});
					remaining.value--;
				}).catch(function (error) {
					console.error("There was a problem listing the server information during merge.");
					console.error(error);
					reject(error);
				})
			} else if (dataType == "Object") {  //// This would be where the actual data was provided as an Object.
				console.error("This isn't supported yet.");
				reject();
			} else {
				console.error("The data provided was an incorrect type (" + dataType + ").");
				reject();
			}
		});
	}
};



if (Standards.storage.options.runAuthCode != false && typeof firebase != "undefined" && firebase.firestore) {
	firebase.auth().onAuthStateChanged(function (person) {  // listens for a change in authorization status (future onAuthStateChanged calls don't overwrite this one)
		if (person) {  // if the user is signed in
			if (document.getElementById("signIn")) {  // if there's a signIn button
				document.getElementById("signIn").style.display = "none";
			}
			if (document.getElementById("signUp")) {  // if there's a signUp button
				document.getElementById("signUp").style.display = "none";
			}
			if (document.getElementById("userSettings")) {  // if there's a userSettings button
				document.getElementById("userSettings").style.display = "inline-block";
			}
			if (document.getElementById("signOut")) {  // if there's a signOut button
				document.getElementById("signOut").style.display = "inline-block";
			}
			if (person.isAnonymous) {  // if a user is logged in anonymously
				window.addEventListener("beforeunload", function (event) {
					event.preventDefault();  // don't close the webpage yet
					Standards.storage.makeDialog("Exiting...");
					person.delete().then(function () {
						window.close();
					}).catch(function () {
						firebase.auth().signInAnonymously().then(function () {
							person.delete().then(function () {
								window.close();
							}).catch(function (error) {
								console.error("It wasn't possible to delete the anonymous user's account.");
								console.error(error);
								window.close();
							});
						}).catch(function (error) {
							console.error("There was a problem reauthenticating.");
							console.error(error);
							window.close();
						});
					});
				});
			}
			dispatchEvent(new Event("signed in"));
		} else {
			if (document.getElementById("signIn")) {  // if there's a signIn button
				document.getElementById("signIn").style.display = "inline-block";
			}
			if (document.getElementById("signUp")) {  // if there's a signUp button
				document.getElementById("signUp").style.display = "inline-block";
			}
			if (document.getElementById("userSettings")) {  // if there's a userSettings button
				document.getElementById("userSettings").style.display = "none";
			}
			if (document.getElementById("signOut")) {  // if there's a signOut button
				document.getElementById("signOut").style.display = "none";
			}
		}
		Standards.storage.server.user = person;
	});
}

if (!Standards.storage.options.hasOwnProperty("automation") || Standards.storage.options.automation == "full") {
	addEventListener("load", function () {
		// gives the login/user buttons functionality
		if (document.getElementById("signIn")) {  // if there's a signIn button
			document.getElementById("signIn").addEventListener("click", function () {
				Standards.storage.server.signIn(["google", "password"]);
			});
		}
		if (document.getElementById("signUp")) {  // if there's a signUp button
			document.getElementById("signUp").addEventListener("click", function () {
				Standards.storage.server.signUp(["google", "password"]);
			});
		}
		if (document.getElementById("userSettings")) {  // if there's a userSettings button
			document.getElementById("userSettings").addEventListener("click", function () {
				Standards.storage.makeDialog("You're currently signed in as " + Standards.storage.server.user.displayName +
					"<br>with the email " + Standards.storage.server.user.email + ".");
			});
		}
		if (document.getElementById("signOut")) {  // if there's a signOut button
			document.getElementById("signOut").addEventListener("click", Standards.storage.server.signOut);
		}
	});
}
