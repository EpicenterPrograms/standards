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
	} else if (item instanceof RegExp) {  // if it's a regular expression
		return "RegExp";
	} else if (item.constructor.toString().search(/function HTML\w*Element\(\) \{ \[native code\] \}/) > -1) {  // if it's an HTML element
		return "HTMLElement";
	} else if (item instanceof HTMLCollection) {  // if it's an HTMLCollection
		return "HTMLCollection";
	} else if (item instanceof CSSRuleList) {  // if it's a CSSRuleList
		return "CSSRuleList";
	} else if (item instanceof NodeList) {  // if it's a NodeList
		return "NodeList";
	} else if (typeof item === "function") {  // if it's a function
		return "Function";
	} else if (item instanceof Object) {  // if it's a regular object
		return "Object";
	} else {  // if it's an enigma
		console.error(item + " has an unknown type");
		return undefined;
	}
};

Standards.presentation.slides = {};
Standards.presentation.slides.currentSlides = [];
Standards.presentation.slides.next = function (identifier) {
	var viewFrame;
	var index;
	if (identifier) {
		switch (Standards.presentation.getType(identifier)) {
			case "string":
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
	}
};
Standards.presentation.slides.previous = function (identifier) {
	var viewFrame;
	var index;
	if (identifier) {
		switch (Standards.presentation.getType(identifier)) {
			case "string":
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
	}
};
Standards.presentation.slides.first = function (identifier) {

};
Standards.presentation.slides.goTo = function (identifier, slideNumber) {
	var viewFrame;
	var index;
	if (identifier) {
		switch (Standards.presentation.getType(identifier)) {
			case "string":
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
		reverseIndex = document.getElementsByClassName("slides")[index].children.length;
		while (reverseIndex--) {
			item = document.getElementsByClassName("slides")[index].children[reverseIndex];
			item.style.transition = "1s";
		}
	}, 0);
};

window.addEventListener("load", function () {
	let reverseIndex = document.getElementsByClassName("slides").length;
	while (reverseIndex--) {
		Standards.presentation.slides.currentSlides.push(0);
	}
});