if (Standards) {
	if (!(Standards instanceof Object)) {
		var Standards = {};
		console.warn("Standards is not an object");
	}
} else {
	var Standards = {};
}
if (Standards.game) {
	if (!(Standards.game instanceof Object)) {
		Standards.game = {};
		console.warn("Standards.game is not an object");
	}
} else {
	Standards.game = {};
}
if (Standards.game.options) {
	if (!(Standards.game.options instanceof Object)) {
		Standards.game.options = {};
		console.warn("Standards.game.options is not an object");
	}
} else {
	Standards.game.options = {};
}

Standards.game.getType = function (item) {
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
			if (type && type.constructor === String && type.search(/[^\w.()]/) === -1 && item instanceof eval(type)) {  //// expand this for errors
				return type;
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
	} else if (item instanceof Standards.game.Character) {  // if it's a Character
		return "Character";
	} else if (item.constructor.toString().search(/function HTML\w*Element\(\) \{ \[native code\] \}/) > -1) {  // if it's an HTML element
		return "HTMLElement";
	} else {
		let match = item.constructor.toString().match(/^function (\w+)\(\)/);
		if (match === null) {
			console.error(TypeError("The item has an unknown type."));
			return undefined;
		} else {
			return match[1];
		}
	}
};

Standards.game.forEach = function (list, doStuff, shouldCopy) {
	/**
	does stuff for every item of an iterable list (or object)
	arguments:
		list = the iterable to go through
		doStuff = a function to be run for every item in the list
			arguments put in the function:
				if an iterable list (Array, HTMLCollection, String, ...): item, index, list
				if an object/dictionary: value, key, object, itemIndex
				if a number: number-index, index, number
			can return "break" to stop execution of the function
		shouldCopy = a copy should be worked with
			doesn't alter the original list
	non-native functions = getType
	*/
	if (Standards.general.getType(doStuff) != "Function") {
		throw "The second arument provided in Standards.general.forEach (" + doStuff + ") isn't a function.";
	}
	let index = 0;
	let returnValue;
	if (Standards.general.getType(list) == "Object") {
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
	} else if (Standards.general.getType(list[Symbol.iterator]) == "Function" || list instanceof HTMLCollection) {
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
	} else if (Standards.general.getType(list) == "Number") {
		while (index < list) {
			returnValue = doStuff(list - index, index, list);
			if (returnValue == "break") {
				break;
			} else {
				index++;
			}
		}
	} else {
		throw "The item provided (" + list + ") isn't iterable.";
	}
	//// add a function type option
};

Standards.game.shuffledArray = function (arr) {
	/**
	randomly shuffles an array based on the Fisher-Yates algorithm
	*/
	let newArr = [...arr];  // Create a copy of the original array
	for (let i = newArr.length - 1; i > 0; i--) {
		let j = Math.floor(Math.random() * (i + 1));  // Random index from 0 to i
		[newArr[i], newArr[j]] = [newArr[j], newArr[i]];  // Swap elements
	}
	return newArr;
}

/*
Object.defineProperty(Standards.game, "refreshInterval", {
	set: function () {
		//// set the refresh interval
	}
});
*/

Standards.game.refreshInterval = Standards.game.refreshInterval || 15;
Standards.game.lengthUnit = Standards.game.lengthUnit || "100";

Standards.game.lengthPixels = .8;
Standards.game.displayWidth = 180;
Standards.game.displayHeight = 100;

Standards.game.setRefresh = function (time) {
	/**
	sets how many milliseconds should pass before executing behavior for the next frame
	*/
	if (Standards.game.getType(time) == "Number") {
		Standards.game.refreshInterval = time;
	} else {
		throw "An incorrect type was given for the refresh interval.";
	}
};

Standards.game.toPixels = function (number) {
	/**
	converts a length given in standard units into pixels
	*/
	if (Standards.game.getType(number) != "Number") {
		throw "The given length isn't a number.";
	}
	switch (Standards.game.lengthUnit) {
		case "100":
		case 100:
			return number * Standards.game.lengthPixels;
		case "px":
			return number;
		case "em":
		case "rem":
			return number * 16;
		case "%":   ////
		case "vw":  ////
		case "vh":  ////
		default:
			throw "The standard length unit isn't a recognized value.";
	}
};

Standards.game.toLengthStandard = function (number) {
	/**
	converts pixels into standard units
	*/
	switch (Standards.game.lengthUnit) {
		case "100":
		case 100:
			return number / Standards.game.lengthPixels;
		case "px":
			return number;
		case "em":
		case "rem":
			return number / 16;
		case "%":   ////
		case "vw":  ////
		case "vh":  ////
		default:
			throw "The standard length unit isn't a recognized value.";
	}
};

Standards.game.setDisplayDimensions = function (x, y) {
	/**
	sets the display dimensions
	arguments:
		x = the number of pixels for the width
		y = the number of pixels for the height
	*/
	switch (Standards.game.lengthUnit) {
		case "100":
		case 100:
			Standards.game.lengthPixels = y / 100;
			Standards.game.displayWidth = x / y * 100;
			Standards.game.displayHeight = 100;
			break;
		case "px":
			Standards.game.lengthPixels = 1;
			Standards.game.displayWidth = x;
			Standards.game.displayHeight = y;
			break;
		case "em":
			Standards.game.lengthPixels = 16;
			Standards.game.displayWidth = x / 16;
			Standards.game.displayHeight = y / 16;
			break;
		case "%":
			Standards.game.displayWidth = 100;
			Standards.game.displayHeight = 100;
			break;
		case "vw":
			Standards.game.lengthPixels = x / 100;
			Standards.game.displayWidth = 100 - (screen.width - x) / 100;
			Standards.game.displayHeight = y / x * (100 - (screen.width - x) / 100);
			break;
		case "vh":
			Standards.game.lengthPixels = y / 100;
			Standards.game.displayHeight = 100 - (screen.height - y) / 100;
			Standards.game.displayWidth = x / y * (100 - (screen.height - y) / 100);
			break;
	}
}

Standards.game.updateScaling = function (x, y) {
	/**
	updates the scaling
	(makes sure everything is the correct size when the display size is changed)
	arguments:
		x = the x-change multiplier
		y = the y-change multiplier
	*/
	/*  ////
	if (Standards.game.lengthUnit == "100" || Standards.game.lengthUnit == 100) {
		let oldWidth = Standards.game.displayWidth;
		let oldContainerValues = JSON.parse(JSON.stringify(Standards.game.container.getBoundingClientRect()));
		console.log(JSON.stringify(oldContainerValues));
		Standards.game.setDisplayDimensions(Standards.game.displayWidth * Standards.game.lengthPixels * x, Standards.game.displayHeight * Standards.game.lengthPixels * y);
		if (Standards.game.container.className.includes("slides")) {
			Standards.game.forEach(Standards.game.container.children, function (slide) {
				Standards.game.forEach(slide.children, function (child) {
					let oldDimensions = child.getBoundingClientRect();
					let newContainerValues = Standards.game.container.getBoundingClientRect();
					if (oldStyle.width != "auto") {  // if the width isn't "auto"
						child.style.width = Number(oldDimensions.width.slice(0,-2)) * y + "px";
						//// console.log(child.tagName + " = auto");
					} else {
						//// console.log(child.tagName + " = not auto");
					}
					if (oldStyle.height != "auto") {  // if the height isn't "auto"
						child.style.height = Number(oldDimensions.height.slice(0,-2)) * y + "px";
					}
					child.style.left = newContainerValues.left + (oldDimensions.left - oldContainerValues.left) * x + "px";
					child.style.top = newContainerValues.top + (oldDimensions.top - oldContainerValues.top) * y + "px";
				});
			});
		} else {
			Standards.game.forEach(Standards.game.container.children, function (child) {
				let oldStyle = window.getComputedStyle(child);
				child.style.width = Number(oldStyle.width.slice(0,-2)) * y + "px";
				child.style.height = Number(oldStyle.height.slice(0,-2)) * y + "px";
				child.style.left = Number(oldStyle.left.slice(0,-2)) * x + "px";
				child.style.top = Number(oldStyle.top.slice(0,-2)) * y + "px";
			});
		}
		Standards.game.Character.instances.forEach(function (character) {
			character.width += 0;
			character.height += 0;
			character.position.x = character.position.x / oldWidth * Standards.game.displayWidth;
			character.position.y += 0;
		});
	} else {
		Standards.game.setDisplayDimensions(Standards.game.displayWidth * x, Standards.game.displayHeight * y);
		Standards.game.Character.instances.forEach(function (character) {
			character.width *= y;  // This is the same to make sure things aren't stretched awkwardly.
			character.height *= y;
			character.position.x *= x;
			character.position.y *= y;
		});
	}
	*/
};

(function () {
	var container;
	Object.defineProperty(Standards.game, "container", {
		get: function () {
			return container;
		},
		set: function (candidate) {
			if (Standards.game.getType(candidate) == "String") {
				if (document.readyState == "complete") {
					container = document.getElementById(candidate);
					let x = Number(window.getComputedStyle(container).width.slice(0, -2));
					let y = Number(window.getComputedStyle(container).height.slice(0, -2));
					let originalDimensions = [x, y];
					Standards.game.setDisplayDimensions(x, y);
				} else {
					window.addEventListener("load", function () {
						container = document.getElementById(candidate);
						let x = Number(window.getComputedStyle(container).width.slice(0, -2));
						let y = Number(window.getComputedStyle(container).height.slice(0, -2));
						let originalDimensions = [x, y];
						Standards.game.setDisplayDimensions(x, y);
					});
				}
			} else if (Standards.game.getType(candidate) = "HTMLElement") {  //// something can be wrong here even after onLoad
				container = candidate;
				let x = Number(window.getComputedStyle(container).width.slice(0, -2));
				let y = Number(window.getComputedStyle(container).height.slice(0, -2));
				let originalDimensions = [x, y];
				Standards.game.setDisplayDimensions(x, y);
			} else {
				throw "The container isn't an ID string or an HTML element.";
			}
			/*  ////
			container.addEventListener("fullscreenchange", function () {
				if (document.fullscreenElement === null) {  // if the container is not in full-screen mode
					Standards.game.updateScaling(x / screen.width, y / screen.height);
				} else {
					Standards.game.updateScaling(screen.width / x, screen.height / y);
				}
			});
			container.addEventListener("webkitfullscreenchange", function () {
				if (document.webkitFullscreenElement === null) {
					Standards.game.updateScaling(x / screen.width, y / screen.height);
				} else {
					Standards.game.updateScaling(screen.width / x, screen.height / y);
				}
			});
			container.addEventListener("mozfullscreenchange", function () {
				if (document.mozFullScreenElement === null) {
					Standards.game.updateScaling(x / screen.width, y / screen.height);
				} else {
					Standards.game.updateScaling(screen.width / x, screen.height / y);
				}
			});
			container.addEventListener("msfullscreenchange", function () {
				if (document.msFullscreenElement === null) {
					Standards.game.updateScaling(x / screen.width, y / screen.height);
				} else {
					Standards.game.updateScaling(screen.width / x, screen.height / y);
				}
			});
			*/
		}
	});
})();

Standards.game.animations = {};
Standards.game.animations.queue = [];
Standards.game.animations.add = function (duration, doStuff) {
	/**
	arguments:
		duration = required; how long you want an action to last
			units are in milliseconds
			can be a string of an event to signal the end
		doStuff = required; the stuff you want to be done (a function)
			the index+1 of the frame number is provided as an agument to the function
	*/
	if (Standards.game.getType(duration) == "String") {
		Standards.game.animations.queue.push({ fn: doStuff, waitFor: duration });
	} else if (Standards.game.getType(duration) == "Number") {
		if (duration < 0) {
			throw "Actions can't be done in the past.";
		}
		let frames = Math.round(duration / Standards.game.refreshInterval + 1);  // This is the number of frames it will take to complete the action.
		let index = 0;
		while (index < frames) {
			Standards.game.animations.queue.push({ fn: doStuff, args: [++index] });
		}
	} else {
		throw "An improper type of duration was given.";
	}
};
Standards.game.animations.run = function () {
	/**
	runs the queued animations
	*/
	Standards.game.animations.loop = setInterval(function () {
		if (Standards.game.animations.queue.length > 0) {
			if (Standards.game.animations.queue[0].waitFor) {
				let signal = Standards.game.animations.queue[0].waitFor;
				clearInterval(Standards.game.animations.loop);
				window.addEventListener(signal, function () {
					window.removeEventListener(signal, arguments.callee);
					Standards.game.animations.queue.shift();
					Standards.game.animations.run();
				});
				Standards.game.animations.queue[0].fn.apply(window, Standards.game.animations.queue[0].args);
			} else {
				Standards.game.animations.queue[0].fn.apply(window, Standards.game.animations.queue[0].args);
				Standards.game.animations.queue.shift();
			}
		} else {
			clearInterval(Standards.game.animations.loop);
			Standards.game.animations.loop = undefined;
		}
	}, Standards.game.refreshInterval);
	/*  //// This is supposed to support freezing.
	if (Standards.game.animations.loop === undefined || Standards.game.animations.loop == "frozen") {
		let frozen = Standards.game.animations.loop == "frozen";
		Standards.game.animations.loop = setInterval(function () {
			if (Standards.game.animations.queue.length > 1) {
				if (Standards.game.animations.queue[1].waitFor) {
					clearInterval(Standards.game.animations.loop);
					window.addEventListener(Standards.game.animations.queue[1].waitFor, function () {
						if (Standards.game.animations.loop != "frozen") {
							window.removeEventListener(Standards.game.animations.queue[1].waitFor, arguments.callee);
							Standards.game.animations.queue.shift();
							Standards.game.animations.loop = undefined;
							Standards.game.animations.run();
						} else {
							Standards.game.animations.loop = Standards.game.animations.queue[1].waitFor;
						}
					});
					if (!frozen) {
						Standards.game.animations.queue[0].fn.apply(window, Standards.game.animations.queue[0].args);
					}
				} else {
					Standards.game.animations.queue[0].fn.apply(window, Standards.game.animations.queue[0].args);
					Standards.game.animations.queue.shift();
				}
			} else {
				Standards.game.animations.queue[0].fn.apply(window, Standards.game.animations.queue[0].args);
				Standards.game.animations.queue.shift();
				clearInterval(Standards.game.animations.loop);
				Standards.game.animations.loop = undefined;
			}
		}, Standards.game.refreshInterval);
	} else {
		window.dispatchEvent(new Event(Standards.game.animations.loop));
	}
	*/
};
Standards.game.animations.freeze = function () {
	clearInterval(Standards.game.animations.loop);
	Standards.game.animations.loop = "frozen";
};
Standards.game.animations.clear = function () {
	clearInterval(Standards.game.animations.loop);
	Standards.game.animations.loop = undefined;
	Standards.game.animations.queue = [];
};
Standards.game.animations.wait = function (time) {
	Standards.game.animations.add(time, function () { });
};

Standards.game.Speaker = function (specs) {
	/**
	creates a speaker that can say typed words
	non-native functions = none
	*/
	var speaker = this;
	var talker = window.speechSynthesis;
	var voiceNumber = 0;
	var speech = new SpeechSynthesisUtterance();

	this.voices;
	this.speaking = false;
	/// These properties are initially -1 for some reason even though that's not a valid value, and it sounds like 1.
	speech.volume = 1;
	speech.pitch = 1;
	speech.rate = 1;
	if (specs && specs.constructor === Object) {
		for (let key in specs) {
			switch (key) {
				case "volume":
					speech.volume = specs.volume;
					break;
				case "pitch":
					speech.pitch = specs.pitch;
					break;
				case "rate":
					speech.rate = specs.rate;
					break;
				case "voiceNumber":
					voiceNumber = specs.voiceNumber;
					break;
			}
		}
	}

	talker.addEventListener("voiceschanged", function () {
		speaker.voices = talker.getVoices();
	});
	speech.addEventListener("error", function (error) {
		console.error("The speaker has become dumb.");
		console.error(error);
	});

	Object.defineProperty(speaker, "voiceNumber", {  ////
		get: function () {
			return voiceNumber;
		},
		set: function (value) {
			//// speech.voice = speaker.voices[value];
			voiceNumber = value;
		}
	});
	Object.defineProperty(speaker, "pitch", {
		get: function () {
			return speech.pitch;
		},
		set: function (value) {  // can be 0-2    defaut = 1
			speech.pitch = value;
		}
	});
	Object.defineProperty(speaker, "rate", {
		get: function () {
			return speech.rate;
		},
		set: function (value) {  // can be 0.1-10    default = 1
			speech.rate = value;
		}
	});
	Object.defineProperty(speaker, "volume", {
		get: function () {
			return speech.volume;
		},
		set: function (value) {  // can be 0-1    default = 1
			speech.volume = value;
		}
	});

	this.speak = function (content) {
		return new Promise(function (resolve) {
			speaker.speaking = true;
			speech.text = content;
			if (speaker.voices) {
				speech.voice = speaker.voices[speaker.voiceNumber];
			}
			speech.addEventListener("end", function () {
				speaker.speaking = false;
				speech.removeEventListener("end", arguments.callee);
				resolve();
			});
			talker.speak(speech);
		});
	};

	this.shush = function (time) {
		time = time == undefined ? 0 : time;
		return new Promise(function (resolve) {
			if (time == 0) {
				talker.cancel();
				speaker.speaking = false;
				resolve();
			} else {
				setTimeout(function () {
					talker.cancel();
					speaker.speaking = false;
					resolve();
				}, time);
			}
		});
	};
};

Standards.game.Character = function (source, options) {
	/**
	makes a character
	arguments:
		source = optional; a URL, file location, or class to be used for the character's appearance
			a class ending in "-face" will be optimized for creating a face
			built-in faces are "happy-face", "sad-face", "angry-face", "alien-face", and "robot-face"
				built-in faces are only styled if the game standard stylesheet is included
			a source containing a "." will be interpreted as an src attribute to an image
			default: "happy-face"
		options = optional; an object ({}) with various optional parameters setting different aspects of the character
			id: an ID for the character
			classes: a list of classes for the character
				can be an array or space-separated string of classes
			movementUnit: the unit of movement for the character, e.g. "%", "px", "em", "vw", ...

	troubleshooting:
		can't redefine width property = you inserted the same character into something twice
		the given length isn't a number / no width = you didn't insert the character

	non-native functions: getType
	*/

	var character = this;  // necessary for accessing this within a function

	if (source) {
		if (!["String", "HTMLElement", "Array"].includes(Standards.game.getType(source))) {
			throw "The type of character isn't a string or an HTML element.";
		}
	} else {
		source = "happy-face";
	}
	options = options || {};
	if (Standards.game.getType(source) == "HTMLElement") {  // if it's an HTML element
		this.body = source;
		this.body.className = "character";
	} else if (Standards.game.getType(source) == "Array") {
		this.body = document.createElement("div");  // acts as a filler
	} else if (source.includes(".")) {
		this.body = document.createElement("img");
		this.body.src = source;
		this.body.className = "character";
	} else {
		if (source.split("-")[source.split("-").length - 1] == "face") {
			this.body = document.createElement("div");
			this.body.className = source;
			let leftEye = document.createElement("div"),
				rightEye = document.createElement("div"),
				mouth = document.createElement("div");
			leftEye.className = "face-left-eye";
			rightEye.className = "face-right-eye";
			mouth.className = "face-mouth";
			this.body.appendChild(leftEye);
			this.body.appendChild(rightEye);
			this.body.appendChild(mouth);
		} else {
			this.body = document.createElement("div");
		}
	}
	if (options.id) {
		this.body.id = options.id;
	}
	if (options.classes) {
		if (Standards.game.getType(options.classes) == "Array" || Standards.game.getType(options.classes) == "String") {
			let list;
			if (Standards.game.getType(options.classes) == "String") {
				list = options.classes;
			} else {
				list = options.classes.join(" ");
			}
			this.body.className = this.body.className + " " + list;
		} else {
			console.warn("The extra classes of the face maker are of an incorrect type.");
		}
	}

	this.movementUnit = options.movementUnit || "%" || Standards.game.lengthUnit;  ////

	if (Standards.game.getType(source) == "Array") {
		this.position = {
			internalX: source[0],
			get x() {
				return this.internalX;
			},
			set x(value) {
				this.internalX = value;
			},
			internalY: source[1],
			get y() {
				return this.internalY;
			},
			set y(value) {
				this.internalY = value;
			}
		};
	} else {
		this.position = {
			internalX: 0,
			get x() {
				return this.internalX;
			},
			set x(value) {
				this.internalX = value;
				character.body.style.left = Standards.game.toPixels(value - character.width / 2) + "px";
			},
			internalY: 0,
			get y() {
				return this.internalY;
			},
			set y(value) {
				this.internalY = value;
				character.body.style.top = Standards.game.toPixels(value - character.height / 2) + "px";
			}
		};
	}
	this.velocity = { x: 0, y: 0 };
	this.acceleration = { x: 0, y: 0 };

	this.insertBodyInto = function (container, onLoad) {
		if (container.className.includes("slides") && container.hasAttribute("data-current-slide")) {
			container.children[container.getAttribute("data-current-slide")].appendChild(character.body);
		} else {
			container.appendChild(character.body);
		}
		let width, height;
		Object.defineProperty(character, "width", {
			get: function () {
				return width;
			},
			set: function (value) {
				width = value;
				character.body.style.width = Standards.game.toPixels(value) + "px";
			}
		});
		Object.defineProperty(character, "height", {
			get: function () {
				return height;
			},
			set: function (value) {
				height = value;
				character.body.style.height = Standards.game.toPixels(value) + "px";
			}
		});
		if (character.body.nodeName == "IMG") {
			character.body.addEventListener("load", function () {
				width = Standards.game.toLengthStandard(character.body.width);
				height = Standards.game.toLengthStandard(character.body.height);
				if (Standards.game.getType(onLoad) == "Function") {
					onLoad.call(character);
				}
				character.body.removeEventListener("load", arguments.callee);
			});
		} else {
			switch (Standards.game.lengthUnit) {
				case "100":
				case 100:
					width = Number(window.getComputedStyle(character.body).width.slice(0, -2)) / Standards.game.lengthPixels;
					height = Number(window.getComputedStyle(character.body).height.slice(0, -2)) / Standards.game.lengthPixels;
					break;
				case "%":
					width = Number(window.getComputedStyle(character.body).width.slice(0, -2)) / Number(window.getComputedStyle(container).width.slice(0, -2)) * 100;
					height = Number(window.getComputedStyle(character.body).height.slice(0, -2)) / Number(window.getComputedStyle(container).height.slice(0, -2)) * 100;
					break;
				case "em":
					width = Number(window.getComputedStyle(character.body).width.slice(0, -2)) / 16;
					height = Number(window.getComputedStyle(character.body).height.slice(0, -2)) / 16;
					break;
				case "px":
					width = Number(window.getComputedStyle(character.body).width.slice(0, -2));
					height = Number(window.getComputedStyle(character.body).height.slice(0, -2));
					break;
				case "vw":  ////
				case "vh":  ////
				default:
					throw "The standard length unit isn't a recognized value.";
			}
			if (Standards.game.getType(onLoad) == "Function") {
				onLoad.call(character);
			}
		}
	};
	this.insertBodyAt = function (x, y, container) {
		function insertTheBody() {
			container = container || Standards.game.container;
			if (container.className.includes("slides") && container.hasAttribute("data-current-slide")) {
				container.children[container.getAttribute("data-current-slide")].appendChild(character.body);
			} else {
				container.appendChild(character.body);
			}
			let width, height;
			Object.defineProperty(character, "width", {
				get: function () {
					return width;
				},
				set: function (value) {
					width = value;
					character.body.style.width = Standards.game.toPixels(value) + "px";
				}
			});
			Object.defineProperty(character, "height", {
				get: function () {
					return height;
				},
				set: function (value) {
					height = value;
					character.body.style.height = Standards.game.toPixels(value) + "px";
				}
			});
			if (character.body.nodeName == "IMG") {
				character.body.addEventListener("load", function () {
					width = Standards.game.toLengthStandard(character.body.width);
					height = Standards.game.toLengthStandard(character.body.height);
					character.position.x = x;
					character.position.y = y;
					character.body.removeEventListener("load", arguments.callee);
				});
			} else {
				switch (Standards.game.lengthUnit) {
					case "100":
					case 100:
						width = Number(window.getComputedStyle(character.body).width.slice(0, -2)) / Standards.game.lengthPixels;
						height = Number(window.getComputedStyle(character.body).height.slice(0, -2)) / Standards.game.lengthPixels;
						break;
					case "%":
						width = Number(window.getComputedStyle(character.body).width.slice(0, -2)) / Number(window.getComputedStyle(container).width.slice(0, -2)) * 100;
						height = Number(window.getComputedStyle(character.body).height.slice(0, -2)) / Number(window.getComputedStyle(container).height.slice(0, -2)) * 100;
						break;
					case "em":
						width = Number(window.getComputedStyle(character.body).width.slice(0, -2)) / 16;
						height = Number(window.getComputedStyle(character.body).height.slice(0, -2)) / 16;
						break;
					case "px":
						width = Number(window.getComputedStyle(character.body).width.slice(0, -2));
						height = Number(window.getComputedStyle(character.body).height.slice(0, -2));
						break;
					case "vw":  ////
					case "vh":  ////
					default:
						throw "The standard length unit isn't a recognized value.";
				}
				character.position.x = x;
				character.position.y = y;
			}
		}
		if (document.readyState == "complete") {
			insertTheBody();
		} else {
			window.addEventListener("load", function () {
				insertTheBody();
			});
		}
	};

	this.goTo = function (x, y, addToQueue) {
		if (Standards.game.getType(x) != "Number" || Standards.game.getType(y) != "Number") {
			throw "At least one of the given coordinates wasn't a number.";
		}
		if (addToQueue) {
			Standards.game.animations.add(0, function () {
				character.position.x = x;
				character.position.y = y;
			});
		} else {
			character.position.x = x;
			character.position.y = y;
		}
	};

	this.setVelocity = function (arg1, arg2, type) {
		/**
		sets the character's velocity
		units of magnitude are in game units per second (or thousandths of a game unit per millisecond)
		arguments:
			arg1 = required; either the total magnitude of the velocity or just its x-component
			arg2 = required; either the direction of the velocity (in degrees) or the y-component
				(possible values are stated respective to arg1)
				0 degrees is pointing right
			type = optional; how the direction is determined
				"xy": the combined values of x- and y-magnitudes
					the first argument is the x-magnitude, and the second argument is the y-magnitude
				"degrees": degrees of a circle
					the first argument is the total magnitude, and the second argument is the degrees
				"radians": radians of a circle
					the first argument is the total magnitude, and the second argument is the radians
				default: "degrees"
		*/
		type = type || "degrees";
		if (type == "xy") {
			character.velocity.x = arg1;
			character.velocity.y = arg2;
		} else {
			if (type == "degrees") {
				arg2 = arg2 * Math.PI / 180;  // converts degrees to radians
			}
			character.velocity.x = arg1 * Math.cos(arg2);
			character.velocity.y = arg1 * Math.sin(-arg2);  // This needs a negative because the y-axis is lowest at the top (causing clockwise rotation).
		}
	};

	this.setAcceleration = function (arg1, arg2, type) {
		/**
		sets the character's acceleration
		units of magnitude are in game units per second (or thousandths of a game unit per millisecond)
		arguments:
			arg1 = required; either the total magnitude of the acceleration or just its x-component
			arg2 = required; either the direction of the acceleration (in degrees) or the y-component
				(possible values are stated respective to arg1)
				0 degrees is pointing right
			type = optional; how the direction is determined
				"xy": the combined values of x- and y-magnitudes
					the first argument is the x-magnitude, and the second argument is the y-magnitude
				"degrees": degrees of a circle
					the first argument is the total magnitude, and the second argument is the degrees
				"radians": radians of a circle
					the first argument is the total magnitude, and the second argument is the radians
				default: "degrees"
		*/
		type = type || "degrees";
		if (type == "xy") {
			character.acceleration.x = arg1;
			character.acceleration.y = arg2;
		} else {
			if (type == "degrees") {
				arg2 = arg2 * Math.PI / 180;  // converts degrees to radians
			}
			character.acceleration.x = arg1 * Math.cos(arg2);
			character.acceleration.y = arg1 * Math.sin(-arg2);  // This needs a negative because the y-axis is lowest at the top (causing clockwise rotation).
		}
	};

	this.approach = function (place, speed) {
		/**
		causes the character to approach a place or thing
		(points the velocity towards the center of a location)

		arguments:
			place = where the character should be going
				can be a 2-item array for coordinates, an HTML element, or a Character
			speed = how fast the character should approach
			    can be any number
				negative numbers will make the character move in the opposite direction
		*/
		if (Standards.game.getType(speed) == "Number") {
			let xDisplacement = 0;
			let yDisplacement = 0;
			let hypotenuse = 0;
			let angle = 0;
			switch (Standards.game.getType(place)) {
				case "Array":
					xDisplacement = place[0] - character.position.x;
					yDisplacement = place[1] - character.position.y;
					hypotenuse = (xDisplacement ** 2 + yDisplacement ** 2) ** .5;
					angle = Math.sin(-yDisplacement / hypotenuse);  // yDisplacement needs to be negative because HTML flips the y-axis
					if (xDisplacement < 0) {  // trigonometric values can only point to the right without this (-1 < angle < 1)
						character.setVelocity(speed, -(angle + Math.PI), "radians");
					} else {
						character.setVelocity(speed, angle, "radians");
                    }
					break;
				case "String":
					place = document.getElementById(place);
				case "HTMLElement":
					console.error("This place isn't supported yet.");  ////
					/*
					xDisplacement = place.position.x - character.position.x;
					yDisplacement = place.position.y - character.position.y;
					hypotenuse = (xDisplacement ** 2 + yDisplacement ** 2) ** .5;
					angle = Math.sin(-yDisplacement / hypotenuse);  // yDisplacement needs to be negative because HTML flips the y-axis
					if (xDisplacement < 0) {  // trigonometric values can only point to the right without this (-1 < angle < 1)
						character.setVelocity(speed, -(angle + Math.PI), "radians");
					} else {
						character.setVelocity(speed, angle, "radians");
					}
					*/
					break;
				case "Character":
					xDisplacement = place.position.x - character.position.x;
					yDisplacement = place.position.y - character.position.y;
					hypotenuse = (xDisplacement ** 2 + yDisplacement ** 2) ** .5;
					angle = Math.sin(-yDisplacement / hypotenuse);  // yDisplacement needs to be negative because HTML flips the y-axis
					if (xDisplacement < 0) {  // trigonometric values can only point to the right without this (-1 < angle < 1)
						character.setVelocity(speed, -(angle + Math.PI), "radians");
					} else {
						character.setVelocity(speed, angle, "radians");
					}
					break;
				case "undefined":
					console.error("The place to approach doesn't exist.");
					break;
				default:
					console.error("The place to approach is of an incorrect type.");
			}
		} else {
			console.error("The provided speed needs to be a number.");
        }
	};

	this.actionQueue = [];

	this.oldMove = function (specs) {
		/**

		*/
		specs = specs || {};
		if (specs.speed === undefined) {
			specs.speed = 0;
		} else if (Standards.game.getType(specs.speed) != "Number") {
			throw "The provided speed isn't a number.";
		}
		if (specs.direction === undefined) {
			specs.direction = 0;
		} else if (Standards.game.getType(specs.direction) != "Number") {
			throw "The provided direction isn't a number";
		}
		if (specs.directionUnit === undefined) {
			specs.directionUnit = "degrees";
		} else if (specs.directionUnit != "degrees" && specs.directionUnit != "radians") {
			throw "An improper unit of direction was provided.";
		}
		if (specs.directionUnit == "degrees") {
			specs.direction = specs.direction / 180 * Math.PI;
		}
		if (specs.path === undefined) {
			specs.path = "linear";
		} else if (specs.path != "linear" && specs.path != "circular") {
			throw "An improper path was provided.";
		}
		if (specs.radius === undefined) {
			specs.radius = 10;
		} else if (Standards.game.getType(specs.radius) != "Number") {
			throw "The provided radius isn't a number";
		}
		if (specs.stopType === undefined) {
			specs.stopType = "box";
		} else if (!["time", "distance", "function", "xBounding", "yBounding", "box", "point"].some(function (type) {
			return specs.stopType == type;
		})) {
			throw "An inproper type of stop was provided.";
		}

		if (specs.path == "linear") {
			if (character.movementUnit == "%") {
				var rightwardMovement = specs.speed * Math.cos(specs.direction);
				let parent = window.getComputedStyle(character.body.parentNode);
				let pixels = Number(parent.width.slice(0, -2)) * specs.speed;
				var upwardMovement = pixels / Number(parent.height.slice(0, -2)) * Math.sin(specs.direction);
			} else {
				var rightwardMovement = specs.speed * Math.cos(specs.direction);
				var upwardMovement = specs.speed * Math.sin(specs.direction);
			}
			function moveOneFrame() {
				character.position.x += rightwardMovement;
				character.position.y -= upwardMovement;
			};
		} else if (specs.path == "circular") {
			let directionChange = specs.speed / specs.radius;
			let parent = window.getComputedStyle(character.body.parentNode);
			function moveOneFrame() {
				specs.direction += directionChange;
				if (character.movementUnit == "%") {
					var rightwardMovement = specs.speed * Math.cos(specs.direction);
					let pixels = Number(parent.width.slice(0, -2)) * specs.speed;
					var upwardMovement = pixels / Number(parent.height.slice(0, -2)) * Math.sin(specs.direction);
				} else {
					var rightwardMovement = specs.speed * Math.cos(specs.direction);
					var upwardMovement = specs.speed * Math.sin(specs.direction);
				}
				character.position.x += rightwardMovement;
				character.position.y -= upwardMovement;
			};
		}

		var mover;
		switch (specs.stopType) {
			case "time":
				if (Standards.game.getType(specs.stopPlace) == "Number") {
					let elapsedTime = 0;
					mover = setInterval(function () {
						if (elapsedTime >= specs.stopPlace) {
							clearInterval(mover);
						} else {
							moveOneFrame();
						}
						elapsedTime += Standards.game.refreshInterval;
					}, Standards.game.refreshInterval);
				} else {
					throw "The provided type of the stop place is incorrect.";
				}
				break;
			case "distance":
				if (Standards.game.getType(specs.stopPlace) == "Number") {
					let elapsedDistance = 0;
					mover = setInterval(function () {
						if (elapsedDistance >= specs.stopPlace) {
							clearInterval(mover);
						} else {
							moveOneFrame();
						}
						elapsedDistance += specs.speed;
					}, Standards.game.refreshInterval);
				} else {
					throw "The provided type of the stop place is incorrect.";
				}
				break;
			case "function":
				if (Standards.game.getType(specs.stopPlace) == "Function") {
					mover = setInterval(function () {
						if (!specs.stopPlace.call(character)) {
							clearInterval(mover);
						} else {
							moveOneFrame();
						}
					}, Standards.game.refreshInterval);
				} else {
					throw "The provided type of the stop place is incorrect.";
				}
				break;
			case "xBounding":
				if (!specs.stopPlace) {
					specs.stopPlace = [0, 100];
				}
				if (Standards.game.getType(specs.stopPlace) == "Number") {
					if (specs.stopPlace >= character.position.x) {
						mover = setInterval(function () {
							if (character.position.x > specs.stopPlace) {
								clearInterval(mover);
							} else {
								moveOneFrame();
							}
						}, Standards.game.refreshInterval);
					} else {
						mover = setInterval(function () {
							if (character.position.x <= specs.stopPlace) {
								clearInterval(mover);
							} else {
								moveOneFrame();
							}
						}, Standards.game.refreshInterval);
					}
				} else if (Standards.game.getType(specs.stopPlace) == "Array") {
					if (specs.stopPlace.length == 1) {
						if (specs.stopPlace[0] >= character.position.x) {
							mover = setInterval(function () {
								if (character.position.x > specs.stopPlace[0]) {
									clearInterval(mover);
								} else {
									moveOneFrame();
								}
							}, Standards.game.refreshInterval);
						} else {
							mover = setInterval(function () {
								if (character.position.x <= specs.stopPlace[0]) {
									clearInterval(mover);
								} else {
									moveOneFrame();
								}
							}, Standards.game.refreshInterval);
						}
					} else if (specs.stopPlace.length == 2) {
						if (specs.stopPlace[0] > specs.stopPlace[1]) {
							specs.stopPlace = [specs.stopPlace[1], specs.stopPlace[0]];
						}
						mover = setInterval(function () {
							if (character.position.x <= specs.stopPlace[0] || character.position.x >= specs.stopPlace[1]) {
								clearInterval(mover);
							} else {
								moveOneFrame();
							}
						}, Standards.game.refreshInterval);
					} else {
						throw "The array of bounding x-values has an incorrect length.";
					}
				} else {
					throw "The provided type of the stop place is incorrect.";
				}
				break;
			case "yBounding":
				if (!specs.stopPlace) {
					specs.stopPlace = [0, 100];
				}
				if (Standards.game.getType(specs.stopPlace) == "Number") {
					if (specs.stopPlace >= character.position.y) {
						mover = setInterval(function () {
							if (character.position.y > specs.stopPlace) {
								clearInterval(mover);
							} else {
								moveOneFrame();
							}
						}, Standards.game.refreshInterval);
					} else {
						mover = setInterval(function () {
							if (character.position.y <= specs.stopPlace) {
								clearInterval(mover);
							} else {
								moveOneFrame();
							}
						}, Standards.game.refreshInterval);
					}
				} else if (Standards.game.getType(specs.stopPlace) == "Array") {
					if (Standards.game.getType(specs.stopPlace[0]) != "Number" || Standards.game.getType(specs.stopPlace[1]) != "Number") {
						throw "At least one item of the bounding array isn't a number.";
					}
					if (specs.stopPlace.length == 1) {
						if (specs.stopPlace[0] >= character.position.y) {
							mover = setInterval(function () {
								if (character.position.y > specs.stopPlace[0]) {
									clearInterval(mover);
								} else {
									moveOneFrame();
								}
							}, Standards.game.refreshInterval);
						} else {
							mover = setInterval(function () {
								if (character.position.y <= specs.stopPlace[0]) {
									clearInterval(mover);
								} else {
									moveOneFrame();
								}
							}, Standards.game.refreshInterval);
						}
					} else if (specs.stopPlace.length == 2) {
						if (specs.stopPlace[0] > specs.stopPlace[1]) {
							specs.stopPlace = [specs.stopPlace[1], specs.stopPlace[0]];
						}
						mover = setInterval(function () {
							if (character.position.y <= specs.stopPlace[0] || character.position.y >= specs.stopPlace[1]) {
								clearInterval(mover);
							} else {
								moveOneFrame();
							}
						}, Standards.game.refreshInterval);
					} else {
						throw "The array of bounding y-values has an incorrect length.";
					}
				} else {
					throw "The provided type of the stop place is incorrect.";
				}
				break;
			case "box":
				if (!specs.stopPlace) {
					specs.stopPlace = [0, 100, 0, 100];
				}
				if (Standards.game.getType(specs.stopPlace) != "Array") {
					throw "The provided type of stop place is incorrect.";
				} else if (specs.stopPlace.length != 4) {
					throw "The array of bounding values is of an incorrect length";
				} else if (!specs.stopPlace.every(function (number) {
					return Standards.game.getType(number) == "Number";
				})) {
					throw "At least one value of the bounding array isn't a number.";
				}
				if (specs.stopPlace[0] > specs.stopPlace[1]) {
					specs.stopPlace = [specs.stopPlace[1], specs.stopPlace[0], specs.stopPlace[2], specs.stopPlace[3]];
				}
				if (specs.stopPlace[2] > specs.stopPlace[3]) {
					specs.stopPlace = [specs.stopPlace[0], specs.stopPlace[1], specs.stopPlace[3], specs.stopPlace[2]];
				}
				mover = setInterval(function () {
					if (
						character.position.x <= specs.stopPlace[0] ||
						character.position.x >= specs.stopPlace[1] ||
						character.position.y <= specs.stopPlace[2] ||
						character.position.y >= specs.stopPlace[3]
					) {
						clearInterval(mover);
					} else {
						moveOneFrame();
					}
				}, Standards.game.refreshInterval);
				break;
			case "point":
				console.warn("This type of stop isn't supported yet.");
				break;
		}
	};

	this.timers = {};
	this.actions = {};

	this.startAction = function (name, action, delay) {
		if (Standards.game.getType(name) != "String") {
			console.error("The name of the action isn't a string.");
		} else if (Standards.game.getType(action) != "Function") {
			console.error("The provided action isn't a function.");
		} else {
			delay = delay || Standards.game.refreshInterval;
			var runTimes = 0;
			action.call(character, runTimes++);  // using .call on the function allows setting "character" as the "this" value
			character.actions[name] = setInterval(function () {
				action.call(character, runTimes++);
			}, delay);
		}
	};
	this.stopAction = function (name) {
		clearInterval(character.actions[name]);
		character.actions[name] = undefined;
	};

	this.moveRandomly = function (options) {
		/**
		allows movement in a random direction at a random speed
		possible options:
			minX = the minimum allowable x-position
			maxX = the maximum allowable x-position
			minY = the minimum allowable y-position
			maxY = the maximum allowable y-position
			maxDistance = the maximum travel distance
			duration = the duration of the movement
		non-native functions: none
		*/
		
		// sets the boundaries of the movement area
		options = options || {};
		var minX = options.minX === undefined ? 5 : options.minX;
		if (options.maxX !== undefined) {
			var maxX = options.maxX;
		} else if (character.movementUnit == "%") {
			var maxX = 95;
		} else if (character.movementUnit == "em") {
			var maxX = document.body.clientWidth / 16;
		} else if (character.movementUnit == "px") {
			var maxX = document.body.clientWidth;
		} else {
			throw "No maximum x-position could be determined.";
		}
		var minY = options.minY === undefined ? 5 : options.minY;
		if (options.maxY !== undefined) {
			var maxY = options.maxY;
		} else if (character.movementUnit == "%") {
			var maxY = 95;
		} else if (character.movementUnit == "em") {
			var maxY = document.body.clientHeight / 16;
		} else if (character.movementUnit == "px") {
			var maxY = document.body.clientHeight;
		} else {
			throw "No maximum y-position could be determined.";
		}
		
		// starts movement
		var maxDistance = options.maxDistance || 30;
		var duration = options.duration === undefined ? 1500 : options.duration;
		var totalRunTimes = Math.round(duration / Standards.game.refreshInterval);
		var currentRunTime = 0;
		var path = Math.floor(Math.random()*3)==0 ? "circular" : "linear";
		if (character.position.x < minX) {
			character.oldMove({ speed: Math.random()*maxDistance/totalRunTimes, direction: Math.random()*90-45, path: path, stopType: "time", stopPlace: duration });
		} else if (character.position.x > maxX) {
			character.oldMove({ speed: Math.random()*maxDistance/totalRunTimes, direction: Math.random()*90+135, path: path, stopType: "time", stopPlace: duration });
		} else if (character.position.y < minY) {
			character.oldMove({ speed: Math.random()*maxDistance/totalRunTimes, direction: Math.random()*-90-45, path: path, stopType: "time", stopPlace: duration });
		} else if (character.position.y > maxY) {
			character.oldMove({ speed: Math.random()*maxDistance/totalRunTimes, direction: Math.random()*90+45, path: path, stopType: "time", stopPlace: duration });
		} else {
			character.oldMove({ speed: Math.random()*maxDistance/totalRunTimes, direction: Math.random()*360, path: path, stopType: "time", stopPlace: duration });
		}
	};

	this.moveOneFrame = function () {
		character.position.x = character.position.x + character.velocity.x / 1000 * Standards.game.refreshInterval;
		character.position.y = character.position.y + character.velocity.y / 1000 * Standards.game.refreshInterval;
		character.velocity.x = character.velocity.x + character.acceleration.x / 1000 * Standards.game.refreshInterval;
		character.velocity.y = character.velocity.y + character.acceleration.y / 1000 * Standards.game.refreshInterval;
		/// changes to positions and velocities are done in units per second
	};

	this.move = function (time, shouldRun) {
		Standards.game.animations.add(time, character.moveOneFrame);
		shouldRun = shouldRun === undefined ? true : shouldRun;
		if (shouldRun) {
			Standards.game.animations.run();
		}
	};

	this.speak = function (speech, options = {}) {
		/**
		allows a character to speak
		*/
		if (!options.type) {
			options.type = "text";
		}
		if (options.runImmediately === undefined) {
			options.runImmediately = true;
		}
		if (Standards.game.getType(options.type) != "String") {
			console.error("The manner of speaking had an incorrect data type.");
		} else if (options.type == "text" || options.type == "voicedText") {
			// creates the elements for the speech bubble
			let speechBubble = document.createElement("div");
			let speechTriangle = document.createElement("div");
			speechBubble.className = "speech-bubble";
			speechTriangle.className = "speech-triangle";
			speechBubble.textContent = speech;
			// sets the time of display for the speech bubble
			let displayTime = speech.length ** .5 * 500;  ////
			// displays the speech bubble
			if (options.runImmediately) {
				if (Standards.game.container.className.includes("slides") && Standards.game.container.hasAttribute("data-current-slide")) {  // if the game container is a slideshow
					let currentSlide = Standards.game.container.children[Standards.game.container.getAttribute("data-current-slide")];
					// positions the speech bubble
					speechBubble.style.bottom = Standards.game.toPixels(100 - character.position.y + character.height / 2 + 10) + "px";
					speechBubble.style.left = Standards.game.toPixels(character.position.x - character.width / 2) + "px";
					speechTriangle.style.top = Standards.game.toPixels(character.position.y - character.height / 2 - 10) - 1 + "px";
					speechTriangle.style.left = Standards.game.toPixels(character.position.x - 1) + "px";
					// adds the speech bubble
					currentSlide.appendChild(speechBubble);
					currentSlide.appendChild(speechTriangle);
					setTimeout(function () {
						// removes the speech bubble
						/*  ////
						currentSlide.removeChild(speechBubble);
						currentSlide.removeChild(speechTriangle);
						*/
						speechBubble.parentNode.removeChild(speechBubble);
						speechTriangle.parentNode.removeChild(speechTriangle);
						window.dispatchEvent(new Event("finishedSpeaking"));
					}, displayTime);
				} else {
					// positions the speech bubble
					speechBubble.style.bottom = Standards.game.toPixels(100 - character.position.y + character.height / 2 + 10) + "px";
					speechBubble.style.left = Standards.game.toPixels(character.position.x - character.width / 2) + "px";
					speechTriangle.style.top = Standards.game.toPixels(character.position.y - character.height / 2 - 10) - 1 + "px";
					speechTriangle.style.left = Standards.game.toPixels(character.position.x - 1) + "px";
					// adds the speech bubble
					Standards.game.container.appendChild(speechBubble);
					Standards.game.container.appendChild(speechTriangle);
					setTimeout(function () {
						// removes the speech bubble
						/*  ////
						Standards.game.container.removeChild(speechBubble);
						Standards.game.container.removeChild(speechTriangle);
						*/
						speechBubble.parentNode.removeChild(speechBubble);
						speechTriangle.parentNode.removeChild(speechTriangle);
						window.dispatchEvent(new Event("finishedSpeaking"));
					}, displayTime);
				}
				if (options.type == "voicedText") {
					new Standards.game.Speaker().speak(speech);
				}
			} else {
				if (Standards.game.container.className.includes("slides") && Standards.game.container.hasAttribute("data-current-slide")) {  // if the game container is a slideshow
					let currentSlide = Standards.game.container.children[Standards.game.container.getAttribute("data-current-slide")];
					Standards.game.animations.add(0, function () {
						// positions the speech bubble
						speechBubble.style.bottom = Standards.game.toPixels(100 - character.position.y + character.height / 2 + 10) + "px";
						speechBubble.style.left = Standards.game.toPixels(character.position.x - character.width / 2) + "px";
						speechTriangle.style.top = Standards.game.toPixels(character.position.y - character.height / 2 - 10) - 1 + "px";
						speechTriangle.style.left = Standards.game.toPixels(character.position.x - 1) + "px";
						// adds the speech bubble
						currentSlide.appendChild(speechBubble);
						currentSlide.appendChild(speechTriangle);
						setTimeout(function () {
							// removes the speech bubble
							/*  ////
							currentSlide.removeChild(speechBubble);
							currentSlide.removeChild(speechTriangle);
							*/
							speechBubble.parentNode.removeChild(speechBubble);
							speechTriangle.parentNode.removeChild(speechTriangle);
							window.dispatchEvent(new Event("finishedSpeaking"));
						}, displayTime);
						if (options.type == "voicedText") {
							new Standards.game.Speaker().speak(speech);
						}
					});
				} else {
					Standards.game.animations.add(0, function () {
						// positions the speech bubble
						speechBubble.style.bottom = Standards.game.toPixels(100 - character.position.y + character.height / 2 + 10) + "px";
						speechBubble.style.left = Standards.game.toPixels(character.position.x - character.width / 2) + "px";
						speechTriangle.style.top = Standards.game.toPixels(character.position.y - character.height / 2 - 10) - 1 + "px";
						speechTriangle.style.left = Standards.game.toPixels(character.position.x - 1) + "px";
						// adds the speech bubble
						Standards.game.container.appendChild(speechBubble);
						Standards.game.container.appendChild(speechTriangle);
						setTimeout(function () {
							// removes the speech bubble
							/*  ////
							Standards.game.container.removeChild(speechBubble);
							Standards.game.container.removeChild(speechTriangle);
							*/
							speechBubble.parentNode.removeChild(speechBubble);
							speechTriangle.parentNode.removeChild(speechTriangle);
							window.dispatchEvent(new Event("finishedSpeaking"));
						}, displayTime);
						if (options.type == "voicedText") {
							new Standards.game.Speaker().speak(speech);
						}
					});
				}
			}
		} else if (options.type == "voice") {
			console.error("This isn't supported yet.");  ////
		} else if (option.type == "audio") {
			console.error("This isn't supported yet.");  ////
		} else {
			console.error("An invalid type of speech was chosen.");
		}
	};
	this.flip = function (y, x, runImmediately) {
		/**
		flips the character's body
		arguments:
			y = optional; whether to flip on the y-axis
				default: true
			x = optional; whether to flip on the x-axis
				default: false
			runImmediately = optional; whether the flip should be done right away (not added to the queue)
				default: false
		*/
		/*  //// This works but overrides something I need.
		if (y === undefined) {
			y = true;
		}
		function doFlipping() {
			let scaling;
			// determines the original scaling
			if (character.body.style.transform && character.body.style.transform.search(/scale\(-?\d+, ?-?\d+\)/) > -1) {
				scaling = character.body.style.transform.match(/scale\((-?\d+), ?(-?\d+)\)/);
				scaling = [Number(scaling[1]), Number(scaling[2])];
			} else if (character.body.style.oTransform && character.body.style.oTransform.search(/scale\(-?\d+, ?-?\d+\)/) > -1) {
				scaling = character.body.style.oTransform.match(/scale\((-?\d+), ?(-?\d+)\)/);
				scaling = [Number(scaling[1]), Number(scaling[2])];
			} else if (character.body.style.msTransform && character.body.style.msTransform.search(/scale\(-?\d+, ?-?\d+\)/) > -1) {
				scaling = character.body.style.msTransform.match(/scale\((-?\d+), ?(-?\d+)\)/);
				scaling = [Number(scaling[1]), Number(scaling[2])];
			} else if (character.body.style.mozTransform && character.body.style.mozTransform.search(/scale\(-?\d+, ?-?\d+\)/) > -1) {
				scaling = character.body.style.mozTransform.match(/scale\((-?\d+), ?(-?\d+)\)/);
				scaling = [Number(scaling[1]), Number(scaling[2])];
			} else if (character.body.style.webkitTransform && character.body.style.webkitTransform.search(/scale\(-?\d+, ?-?\d+\)/) > -1) {
				scaling = character.body.style.webkitTransform.match(/scale\((-?\d+), ?(-?\d+)\)/);
				scaling = [Number(scaling[1]), Number(scaling[2])];
			} else {
				scaling = [1, 1];
			}
			// flips the character
			if (y && x) {
				character.body.style.oTransform = "scale(" + scaling[0] * -1 + ", " + scaling[1] * -1 + ")";
				character.body.style.msTransform = "scale(" + scaling[0] * -1 + ", " + scaling[1] * -1 + ")";
				character.body.style.mozTransform = "scale(" + scaling[0] * -1 + ", " + scaling[1] * -1 + ")";
				character.body.style.webkitTransform = "scale(" + scaling[0] * -1 + ", " + scaling[1] * -1 + ")";
				character.body.style.transform = "scale(" + scaling[0] * -1 + ", " + scaling[1] * -1 + ")";
			} else if (y) {
				character.body.style.oTransform = "scale(" + scaling[0] * -1 + ", " + scaling[1] + ")";
				character.body.style.msTransform = "scale(" + scaling[0] * -1 + ", " + scaling[1] + ")";
				character.body.style.mozTransform = "scale(" + scaling[0] * -1 + ", " + scaling[1] + ")";
				character.body.style.webkitTransform = "scale(" + scaling[0] * -1 + ", " + scaling[1] + ")";
				character.body.style.transform = "scale(" + scaling[0] * -1 + ", " + scaling[1] + ")";
			} else if (x) {
				character.body.style.oTransform = "scale(" + scaling[0] + ", " + scaling[1] * -1 + ")";
				character.body.style.msTransform = "scale(" + scaling[0] + ", " + scaling[1] * -1 + ")";
				character.body.style.mozTransform = "scale(" + scaling[0] + ", " + scaling[1] * -1 + ")";
				character.body.style.webkitTransform = "scale(" + scaling[0] + ", " + scaling[1] * -1 + ")";
				character.body.style.transform = "scale(" + scaling[0] + ", " + scaling[1] * -1 + ")";
			}
		}
		if (runImmediately) {
			doFlipping();
		} else {
			Standards.game.animations.add(0, doFlipping);
		}
		*/
	};
	this.rotate = function (degrees) {
		/**
		rotates the character
		*/
		Standards.game.animations.add(0, function () {

		});
	};

	this.removeBody = function () {
		/**
		removes the character's body
		*/
		character.body.parentNode.removeChild(character.body);
	}
	this.exists = true;
	this.ceaseToExist = function () {
		/**
		removes the character from the game
		*/
		character.removeBody();
		Standards.game.Character.instances.splice(Standards.game.Character.instances.indexOf(character), 1);
		character.exists = false;
	}

	Standards.game.Character.instances.push(this);
};
Standards.game.Character.instances = [];

Standards.game.getDistance = function (thing1, thing2) {
	switch (Standards.game.getType(thing1)) {
		case "Array":
			switch (Standards.game.getType(thing2)) {
				case "Array":
					return ((thing2[0] - thing1[0]) ** 2 + (thing2[1] - thing1[1]) ** 2) ** .5;
				case "String":
					thing1 = document.getElementById(thing1);
				case "HTMLElement":
					console.error("Calculating the distance from this thing isn't supported yet.");  ////
					break;
				case "Character":
					return ((thing2.position.x - thing1[0]) ** 2 + (thing2.position.y - thing1[1]) ** 2) ** .5;
				default:
					console.error("The thing you're trying to calculate the distance from is of an incorrect type.");
			}
			break;
		case "String":
			thing1 = document.getElementById(thing1);
		case "HTMLElement":
			console.error("Calculating the distance from this thing isn't supported yet.");  ////
			break;
		case "Character":
			switch (Standards.game.getType(thing2)) {
				case "Array":
					return ((thing2[0] - thing1.position.x) ** 2 + (thing2[1] - thing1.position.y) ** 2) ** .5;
				case "String":
					thing1 = document.getElementById(thing1);
				case "HTMLElement":
					console.error("Calculating the distance from this thing isn't supported yet.");  ////
					break;
				case "Character":
					return ((thing2.position.x - thing1.position.x) ** 2 + (thing2.position.y - thing1.position.y) ** 2) ** .5;
				default:
					console.error("The thing you're trying to calculate the distance from is of an incorrect type.");
			}
			break;
		default:
			console.error("The thing you're trying to calculate the distance from is of an incorrect type.");
    }
};
