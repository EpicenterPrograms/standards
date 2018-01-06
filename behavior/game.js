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

Standards.game.Character = function (source, options) {
	/**
	makes a character
	arguments:
		source = optional; a URL, file location, or class to be used for the character's appearance
			a class ending in "-face" will be optimized for creating a face
			built-in faces are "happy-face", "sad-face", "angry-face", "alien-face", and "robot-face"
			a source containing a "." will be interpreted as an src attribute to an image
		options = optional; an object ({}) with various optional parameters setting different aspects of the character
			id: an ID for the character
			classes: a list of classes for the character
				can be an array or space-separated string of classes
			movementUnit: the unit of movement for the character, e.g. "px", "em", "vw", ...
	non-native functions: none
	*/

	var character = this;  // necessary for accessing this within a function

	if (source) {
		if (typeof source != "string" && source.constructor.toString().search(/HTML.*Element/) == -1) {
			throw "The type of character isn't a string or an HTML element.";
		}
	} else {
		source = "happy-face";
	}
	options = options || {};
	if (source.constructor.toString().search(/HTML.*Element/) > -1) {  // if it's an HTML element
		this.HTMLElement = source;
	} else if (source.includes(".")) {
		this.HTMLElement = document.createElement("img");
		this.HTMLElement.src = source;
		this.HTMLElement.style.width = "2em";
	} else {
		if (source.split("-")[source.split("-").length - 1] == "face") {
			this.HTMLElement = document.createElement("div");
			this.HTMLElement.className = source;
			let leftEye = document.createElement("div"),
				rightEye = document.createElement("div"),
				mouth = document.createElement("div");
			leftEye.className = "face-left-eye";
			rightEye.className = "face-right-eye";
			mouth.className = "face-mouth";
			this.HTMLElement.appendChild(leftEye);
			this.HTMLElement.appendChild(rightEye);
			this.HTMLElement.appendChild(mouth);
		} else {
			this.HTMLElement = document.createElement("div");
		}
	}
	if (options.id) {
		this.HTMLElement.id = options.id;
	}
	if (options.classes) {
		if (options.classes instanceof Array || typeof options.classes == "string") {
			let list;
			if (extraClasses instanceof Array) {
				list = options.classes.join(" ");
			} else {
				list = options.classes;
			}
			this.HTMLElement.className = this.HTMLElement.className=="" ? list : this.HTMLElement.className + " " + list;
		} else {
			console.warn("The extra classes of the face maker are of an incorrect type.");
		}
	}

	this.xPosition = 0;
	this.yPosition = 0;
	this.movementUnit = options.movementUnit || "%";

	this.moveLeft = function (distance) {
		if (document.body.contains(character.HTMLElement)) {
			distance = distance===undefined ? 1 : distance;
			character.xPosition -= distance;
			character.HTMLElement.style.left = character.xPosition + character.movementUnit;
		}
	};
	this.moveRight = function (distance) {
		if (document.body.contains(character.HTMLElement)) {
			distance = distance === undefined ? 1 : distance;
			character.xPosition += distance;
			character.HTMLElement.style.left = character.xPosition + character.movementUnit;
		}
	};
	this.moveUp = function (distance) {
		if (document.body.contains(character.HTMLElement)) {
			distance = distance === undefined ? 1 : distance;
			character.yPosition -= distance;
			character.HTMLElement.style.top = character.yPosition + character.movementUnit;
		}
	};
	this.moveDown = function (distance) {
		if (document.body.contains(character.HTMLElement)) {
			distance = distance === undefined ? 1 : distance;
			character.yPosition += distance;
			character.HTMLElement.style.top = character.yPosition + character.movementUnit;
		}
	};

	this.timers = {};

	this.startAction = function (name, action, delay) {
		delay = delay || 15;
		var runTimes = 0;
		character[name] = setInterval(function () {
			action.call(character, runTimes++);  // using .call on the function allows setting "character" as the "this" value
		}, delay);
	};
	this.stopAction = function (name) {
		clearInterval(character[name]);
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
			movementInterval = the amount of time between each iteration of movement
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
		var movementInterval = options.movementInterval || 15;
		var duration = options.duration === undefined ? 1500 : options.duration;
		var totalRunTimes = Math.round(duration / movementInterval);
		var currentRunTime = 0;
		var interval = setInterval(function () {
			character.moveRight(xMovement / totalRunTimes);
			character.moveDown(yMovement / totalRunTimes);
			if (++currentRunTime > totalRunTimes) {
				clearInterval(interval);
			}
		}, movementInterval);
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
			default: 15
	non-native functions: none
	*/
	if (times < 1) {
		throw "The times to repeat is less than one.";
	}
	delay = delay || 15;
	let runTimes = 0;
	let interval = setInterval(function () {
		action(runTimes++);
		if (runTimes >= times) {
			clearInterval(interval);
		}
	}, delay);
};