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

Standards.game.timers = {};  // holds intervals and timeouts

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
			if (type && type.constructor === String && type.search(/[^A-Za-z0-9.()]/) === -1 && item instanceof eval(type)) {
				return type;
			}
		}
	}
	if (item === undefined) {  // if it's undefined
		return "undefined";
	} else if (item === null) {  // if it's null
		return "null";
	} else if (item.constructor === Boolean) {  // if it's a boolean
		return "Boolean";
	} else if (item.constructor === Number && isNaN(item)) {  // if it's not a number
		return "NaN";
	} else if (item.constructor === Number) {  // if it is a number
		return "Number";
	} else if (item.constructor === String) {  // if it's a string
		return "String";
	} else if (Array.isArray(item) || item instanceof Array) {  // if it's an array
		return "Array";
	} else if (typeof item === "function") {  // if it's a function
		return "Function";
	} else if (item instanceof RegExp) {  // if it's a regular expression
		return "RegExp";
	} else if (item.constructor.toString().search(/function HTML\w*Element\(\) \{ \[native code\] \}/) > -1) {  // if it's an HTML element
		return "HTMLElement";
	} else if (item instanceof HTMLCollection) {  // if it's an HTMLCollection
		return "HTMLCollection";
	} else if (item instanceof CSSRuleList) {  // if it's a CSSRuleList
		return "CSSRuleList";
	} else if (item instanceof Date) {  // if it's a Date object
		return "Date";
	} else if (item instanceof DOMStringMap) {  // if it's a DOMStringMap
		return "DOMStringMap";
	} else if (item instanceof NodeList) {  // if it's a NodeList
		return "NodeList";
	} else if (item instanceof Object) {  // if it's a regular object
		return "Object";
	} else {  // if it's an enigma
		console.error(item + " has an unknown type");
		return undefined;
	}
};

Standards.game.refreshInterval = Standards.game.refreshInterval || 15;

Standards.game.setRefresh = function (time) {
	/**

	*/
	if (Standards.game.getType(time) == "Number") {
		Standards.game.refreshInterval = time;
	} else {
		throw "An incorrect type was given for the refresh interval.";
	}
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
		options = optional; an object ({}) with various optional parameters setting different aspects of the character
			id: an ID for the character
			classes: a list of classes for the character
				can be an array or space-separated string of classes
			movementUnit: the unit of movement for the character, e.g. "px", "em", "vw", ...
	non-native functions: getType
	*/

	var character = this;  // necessary for accessing this within a function

	if (source) {
		if (Standards.game.getType(source) != "String" && Standards.game.getType(source) != "HTMLElement") {
			throw "The type of character isn't a string or an HTML element.";
		}
	} else {
		source = "happy-face";
	}
	options = options || {};
	if (Standards.game.getType(source) == "HTMLElement") {  // if it's an HTML element
		this.body = source;
	} else if (source.includes(".")) {
		this.body = document.createElement("img");
		this.body.src = source;
		this.body.style.width = "2em";
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
			this.body.className = this.body.className == "" ? list : this.body.className + " " + list;
		} else {
			console.warn("The extra classes of the face maker are of an incorrect type.");
		}
	}

	this.xPosition = 0;
	this.yPosition = 0;
	this.movementUnit = options.movementUnit || "%";

	this.move = function (specs) {
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
		if (specs.stopType === undefined) {
			specs.stopType = "box";
		} else if (!["time", "distance", "function", "xBounding", "yBounding", "box", "point"].some(function (type) {
			specs.stopType == type;
		})) {
			throw "An inproper type of stop was provided.";
		}

		function moveOneFrame() {
			character.xPosition += specs.speed * Math.cos(specs.direction);
			character.body.style.left = character.xPosition + character.movementUnit;
			character.yPosition -= specs.speed * Math.sin(specs.direction);
			character.body.style.top = character.yPosition + character.movementUnit;
		};

		var mover;
		switch (specs.stopType) {
			case "time":
				console.warn("This type of stop isn't supported yet.");
				break;
			case "distance":
				console.warn("This type of stop isn't supported yet.");
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
					if (specs.stopPlace >= character.xPosition) {
						mover = setInterval(function () {
							if (character.xPosition > specs.stopPlace) {
								clearInterval(mover);
							} else {
								moveOneFrame();
							}
						}, Standards.game.refreshInterval);
					} else {
						mover = setInterval(function () {
							if (character.xPosition <= specs.stopPlace) {
								clearInterval(mover);
							} else {
								moveOneFrame();
							}
						}, Standards.game.refreshInterval);
					}
				} else if (Standards.game.getType(specs.stopPlace) == "Array") {
					if (specs.stopPlace.length == 1) {
						if (specs.stopPlace[0] >= character.xPosition) {
							mover = setInterval(function () {
								if (character.xPosition > specs.stopPlace[0]) {
									clearInterval(mover);
								} else {
									moveOneFrame();
								}
							}, Standards.game.refreshInterval);
						} else {
							mover = setInterval(function () {
								if (character.xPosition <= specs.stopPlace[0]) {
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
							if (character.xPosition <= specs.stopPlace[0] || character.xPosition >= specs.stopPlace[1]) {
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
					if (specs.stopPlace >= character.yPosition) {
						mover = setInterval(function () {
							if (character.yPosition > specs.stopPlace) {
								clearInterval(mover);
							} else {
								moveOneFrame();
							}
						}, Standards.game.refreshInterval);
					} else {
						mover = setInterval(function () {
							if (character.yPosition <= specs.stopPlace) {
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
						if (specs.stopPlace[0] >= character.yPosition) {
							mover = setInterval(function () {
								if (character.yPosition > specs.stopPlace[0]) {
									clearInterval(mover);
								} else {
									moveOneFrame();
								}
							}, Standards.game.refreshInterval);
						} else {
							mover = setInterval(function () {
								if (character.yPosition <= specs.stopPlace[0]) {
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
							if (character.yPosition <= specs.stopPlace[0] || character.yPosition >= specs.stopPlace[1]) {
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
						character.xPosition <= specs.stopPlace[0] ||
						character.xPosition >= specs.stopPlace[1] ||
						character.yPosition <= specs.stopPlace[2] ||
						character.yPosition >= specs.stopPlace[3]
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

	this.goTo = function (x, y) {
		if (Standards.game.getType(x) != "Number" || Standards.game.getType(y) != "Number") {
			throw "At least one of the given coordinates wasn't a number.";
		}
		character.xPosition = x;
		character.yPosition = y;
		character.body.style.left = x + character.movementUnit;
		character.body.style.top = y + character.movementUnit;
	};

	this.moveLeft = function (distance) {
		if (document.body.contains(character.body)) {
			distance = distance===undefined ? 1 : distance;
			character.xPosition -= distance;
			character.body.style.left = character.xPosition + character.movementUnit;
		}
	};
	this.moveRight = function (distance) {
		if (document.body.contains(character.body)) {
			distance = distance === undefined ? 1 : distance;
			character.xPosition += distance;
			character.body.style.left = character.xPosition + character.movementUnit;
		}
	};
	this.moveUp = function (distance) {
		if (document.body.contains(character.body)) {
			distance = distance === undefined ? 1 : distance;
			character.yPosition -= distance;
			character.body.style.top = character.yPosition + character.movementUnit;
		}
	};
	this.moveDown = function (distance) {
		if (document.body.contains(character.body)) {
			distance = distance === undefined ? 1 : distance;
			character.yPosition += distance;
			character.body.style.top = character.yPosition + character.movementUnit;
		}
	};

	this.timers = {};
	this.actions = {};

	this.startAction = function (name, action, delay) {
		delay = delay || Standards.game.refreshInterval;
		var runTimes = 0;
		character.actions[name] = setInterval(function () {
			action.call(character, runTimes++);  // using .call on the function allows setting "character" as the "this" value
		}, delay);
	};
	this.stopAction = function (name) {
		clearInterval(character.actions[name]);
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
		var minX = options.minX === undefined ? 0 : options.minX;
		if (options.maxX !== undefined) {
			var maxX = options.maxX;
		} else if (character.movementUnit == "%") {
			var maxX = 100;
		} else if (character.movementUnit == "em") {
			var maxX = document.body.clientWidth / 16;
		} else if (character.movementUnit == "px") {
			var maxX = document.body.clientWidth;
		} else {
			throw "No maximum x-position could be determined.";
		}
		var minY = options.minY === undefined ? 0 : options.minY;
		if (options.maxY !== undefined) {
			var maxY = options.maxY;
		} else if (character.movementUnit == "%") {
			var maxY = 100;
		} else if (character.movementUnit == "em") {
			var maxY = document.body.clientHeight / 16;
		} else if (character.movementUnit == "px") {
			var maxY = document.body.clientHeight;
		} else {
			throw "No maximum y-position could be determined.";
		}

		// sets the movement distances
		var maxDistance = options.maxDistance || 25;
		if (character.xPosition > maxX) {
			var xMovement = Math.floor(Math.random() * (maxDistance-1)) - maxDistance;
		} else if (character.xPosition < minX) {
			var xMovement = Math.floor(Math.random() * (maxDistance+1));
		} else {
			var xMovement = Math.floor(Math.random() * (2*maxDistance+1)) - maxDistance;
		}
		if (character.yPosition > maxY) {
			var yMovement = Math.floor(Math.random() * (maxDistance-1)) - maxDistance;
		} else if (character.yPosition < minY) {
			var yMovement = Math.floor(Math.random() * (maxDistance+1));
		} else {
			var yMovement = Math.floor(Math.random() * (2*maxDistance+1)) - maxDistance;
		}

		// starts movement
		var duration = options.duration === undefined ? 1500 : options.duration;
		var totalRunTimes = Math.round(duration / Standards.game.refreshInterval);
		var currentRunTime = 0;
		var interval = setInterval(function () {
			character.moveRight(xMovement / totalRunTimes);
			character.moveDown(yMovement / totalRunTimes);
			if (++currentRunTime > totalRunTimes) {
				clearInterval(interval);
			}
		}, Standards.game.refreshInterval);
	};
};

Standards.game.startAction = function (name, action, delay) {

};
Standards.game.stopAction = function (name) {

};

Standards.game.repeatAction = function (times, action, delay) {
	/**
	allows an action to be repeated a certain number of times at a certain rate
	arguments:
		action = required; the function to be run
			the times run is provided as an argument
				(the first time is 0)
		times = required; the number of times the function should be run
		delay = optional; the number of miliseconds separating each running of the function
			default: Standards.game.refreshInterval
	non-native functions: none
	*/
	if (times < 1) {
		throw "The times to repeat is less than one.";
	}
	delay = delay || Standards.game.refreshInterval;
	let runTimes = 0;
	let interval = setInterval(function () {
		action(runTimes++);
		if (runTimes >= times) {
			clearInterval(interval);
		}
	}, delay);
};