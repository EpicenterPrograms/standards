if (Standards) {
	if (!(Standards instanceof Object)) {
		var Standards = {};
		console.warn("Standards is not an object");
	}
} else {
	var Standards = {};
}
if (Standards.presentation) {
	if (!(Standards.presentation instanceof Object)) {
		Standards.presentation = {};
		console.warn("Standards.presentation is not an object");
	}
} else {
	Standards.presentation = {};
}
if (Standards.presentation.options) {
	if (!(Standards.presentation.options instanceof Object)) {
		Standards.presentation.options = {};
		console.warn("Standards.presentation.options is not an object");
	}
} else {
	Standards.presentation.options = {};
}

Standards.presentation.getType = function (item) {
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

Standards.presentation.slides = {};
Standards.presentation.slides.currentSlides = [];  // which slide a given slideshow is on
Standards.presentation.slides.next = function (identifier) {
	var viewFrame;
	var index;
	if (identifier) {
		switch (Standards.presentation.getType(identifier)) {
			case "String":
				viewFrame = document.getElementById(identifier);
				break;
			case "HTMLElement":
				viewFrame = identifier;
				break;
			case "HTMLCollection":
				viewFrame = identifier[0];
				break;
			case "NodeList":
				viewFrame = identifier[0];
				break;
			default:
				throw "The slides function referred to an item with an unknown type";
		}
	} else {
		if (document.getElementsByClassName("slides").length > 0) {
			viewFrame = document.getElementsByClassName("slides")[0];
		} else {
			throw 'There are no elements with the class of "slides".';
		}
	}
	let reverseIndex = document.getElementsByClassName("slides").length;
	while (reverseIndex--) {
		if (document.getElementsByClassName("slides")[reverseIndex] == viewFrame) {
			index = reverseIndex;
		}
	}
	if (Standards.presentation.slides.currentSlides[index] < viewFrame.children.length - 1) {
		viewFrame.children[Standards.presentation.slides.currentSlides[index]].style.left = "-100%";
		viewFrame.children[++Standards.presentation.slides.currentSlides[index]].style.left = "0%";
		viewFrame.setAttribute("data-current-slide", Standards.presentation.slides.currentSlides[index]);
	}
};
Standards.presentation.slides.previous = function (identifier) {
	var viewFrame;
	var index;
	if (identifier) {
		switch (Standards.presentation.getType(identifier)) {
			case "String":
				viewFrame = document.getElementById(identifier);
				break;
			case "HTMLElement":
				viewFrame = identifier;
				break;
			case "HTMLCollection":
				viewFrame = identifier[0];
				break;
			case "NodeList":
				viewFrame = identifier[0];
				break;
			default:
				throw "The slides function referred to an item with an unknown type";
		}
	} else {
		if (document.getElementsByClassName("slides").length > 0) {
			viewFrame = document.getElementsByClassName("slides")[0];
		} else {
			throw 'There are no elements with the class of "slides".';
		}
	}
	let reverseIndex = document.getElementsByClassName("slides").length;
	while (reverseIndex--) {
		if (document.getElementsByClassName("slides")[reverseIndex] == viewFrame) {
			index = reverseIndex;
		}
	}
	if (Standards.presentation.slides.currentSlides[index] > 0) {
		viewFrame.children[Standards.presentation.slides.currentSlides[index]].style.left = "100%";
		viewFrame.children[--Standards.presentation.slides.currentSlides[index]].style.left = "0%";
		viewFrame.setAttribute("data-current-slide", Standards.presentation.slides.currentSlides[index]);
	}
};
Standards.presentation.slides.goTo = function (identifier, slideNumber) {
	/**
	goes to a certain slide
	slides are numbered starting at 1
	*/
	var viewFrame;
	var index;
	if (identifier) {
		switch (Standards.presentation.getType(identifier)) {
			case "String":
				viewFrame = document.getElementById(identifier);
				break;
			case "HTMLElement":
				viewFrame = identifier;
				break;
			case "HTMLCollection":
				viewFrame = identifier[0];
				break;
			case "NodeList":
				viewFrame = identifier[0];
				break;
			default:
				throw "The slides function referred to an item with an unknown type";
		}
	} else {
		if (document.getElementsByClassName("slides").length > 0) {
			viewFrame = document.getElementsByClassName("slides")[0];
		} else {
			throw 'There are no elements with the class of "slides".';
		}
	}
	let reverseIndex = document.getElementsByClassName("slides").length;
	while (reverseIndex--) {
		if (document.getElementsByClassName("slides")[reverseIndex] == viewFrame) {
			index = reverseIndex;
		}
	}
	if (slideNumber > 0 && slideNumber <= document.getElementsByClassName("slides")[index].children.length) {
		Standards.presentation.slides.currentSlides[index] = slideNumber - 1;
		viewFrame.setAttribute("data-current-slide", slideNumber - 1);
	} else {
		throw "The desired slide is outside of the range of slides.";
	}
	let item;
	let initialTransition;  //// use this
	reverseIndex = document.getElementsByClassName("slides")[index].children.length;
	while (reverseIndex--) {
		item = document.getElementsByClassName("slides")[index].children[reverseIndex];
		item.style.transition = "0s";
		item.style.left = "-100%";
	}
	reverseIndex = document.getElementsByClassName("slides")[index].children.length;
	while (reverseIndex--) {
		document.getElementsByClassName("slides")[index].children[reverseIndex].style.left = "100%";
		if (slideNumber - 1 == reverseIndex) {
			document.getElementsByClassName("slides")[index].children[reverseIndex].style.left = "0%";
			break;
		}
	}
	setTimeout(function () {
		if (!viewFrame.className.includes("instant")) {
			reverseIndex = document.getElementsByClassName("slides")[index].children.length;
			while (reverseIndex--) {
				item = document.getElementsByClassName("slides")[index].children[reverseIndex];
				item.style.transition = "1s";
			}
		}
	}, 0);
};
Standards.presentation.slides.first = function (identifier) {
	/**
	goes to the first slide
	*/
	Standards.presentation.slides.goTo(identifier, 1);
};
Standards.presentation.slides.originalDimensions = [];
Standards.presentation.slides.toggleFullscreen = function (identifier) {
	/**
	toggles whether a slide is in fullscreen
	returns an array of the ratios of how much the width and height changed
	*/
	if (document.fullscreenElement !== undefined) {
		var prefix = "";
		var fullscreenElement = document.fullscreenElement;
	} else if (document.webkitFullscreenElement !== undefined) {
		var prefix = "webkit";
		var fullscreenElement = document.webkitFullscreenElement;
	} else if (document.mozFullScreenElement !== undefined) {
		var prefix = "moz";
		var fullscreenElement = document.mozFullScreenElement;
	} else if (document.msFullscreenElement !== undefined) {
		var prefix = "ms";
		var fullscreenElement = document.msFullscreenElement;
	} else {
		console.error("This browser doesn't support fullscreen mode.");
		return;
	}
	var viewFrame;
	if (fullscreenElement) {
		switch (prefix) {
			case "":
				document.exitFullscreen();
				break;
			case "webkit":
				document.webkitExitFullscreen();
				break;
			case "moz":
				document.mozCancelFullScreen();
				break;
			case "ms":
				document.msExitFullscreen();
				break;
		}
		return [Standards.presentation.slides.originalDimensions[0] / screen.width, Standards.presentation.slides.originalDimensions[1] / screen.height];
	} else {
		if (identifier) {
			switch (Standards.presentation.getType(identifier)) {
				case "String":
					viewFrame = document.getElementById(identifier);
					break;
				case "HTMLElement":
					viewFrame = identifier;
					break;
				case "HTMLCollection":
					viewFrame = identifier[0];
					break;
				case "NodeList":
					viewFrame = identifier[0];
					break;
				default:
					throw "The slides function referred to an item with an unknown type";
			}
		} else {
			if (document.getElementsByClassName("slides").length > 0) {
				viewFrame = document.getElementsByClassName("slides")[0];
			} else {
				throw 'There are no elements with the class of "slides".';
			}
		}
		let dimensions = [Number(window.getComputedStyle(viewFrame).width.slice(0, -2)), Number(window.getComputedStyle(viewFrame).height.slice(0, -2))];
		Standards.presentation.slides.originalDimensions = dimensions;
		switch (prefix) {
			case "":
				viewFrame.requestFullscreen();
				break;
			case "webkit":
				viewFrame.webkitRequestFullscreen();
				break;
			case "moz":
				viewFrame.mozRequestFullScreen();
				break;
			case "ms":
				viewFrame.msRequestFullscreen();
				break;
		}
		return [screen.width / dimensions[0], screen.height / dimensions[1]];
	}
};

window.addEventListener("load", function () {
	let slideshows = document.getElementsByClassName("slides");
	let reverseIndex = slideshows.length;
	while (reverseIndex--) {
		Standards.presentation.slides.currentSlides.push(0);
		slideshows[reverseIndex].setAttribute("data-current-slide", 0);
	}
});