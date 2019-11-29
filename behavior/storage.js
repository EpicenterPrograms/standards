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
		console.warn("Standards.game is not an object");
	}
} else {
	Standards.storage = {};
}


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
			throw "Client storage isn't supported.";
		} else {
			if (location === undefined && Standards.general.storage.session.defaultLocation != "") {
				location = Standards.general.storage.session.defaultLocation;
			} else if (Standards.general.getType(location) == "String") {
				if (location[0] == "/") {
					if (location != "/") {
						location = location.slice(1);
					}
				} else if (Standards.general.storage.session.defaultLocation == "") {
					throw "No default location is present.";
				} else if (location === "" || location === ".") {
					location = Standards.general.storage.session.defaultLocation;
				} else if (location.slice(0, 2) == "./") {
					if (Standards.general.storage.session.defaultLocation.slice(-1) == "/") {
						location = Standards.general.storage.session.defaultLocation + location.slice(2);
					} else {
						location = Standards.general.storage.session.defaultLocation + location.slice(1);
					}
				} else if (Standards.general.storage.session.defaultLocation == "/") {
					// do nothing
				} else {
					let prelocation = Standards.general.storage.session.defaultLocation.split("/");
					while (location.slice(0, 2) == "..") {
						prelocation.pop();
						location = location.slice(3);  // takes slashes into account
					}
					location = prelocation.join("/") + "/" + location;
				}
			} else {
				throw TypeError("The location given wasn't a String.");
			}
			function convert(item) {
				if (Standards.general.getType(item) === undefined) {
					item = "~~" + String(item);
				} else {
					switch (Standards.general.getType(item)) {
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
							item = "~" + Standards.general.getType(item) + "~" + String(item);
					}
				}
				return item;
			}
			if (location.slice(-1) == "/") {
				if (Standards.general.getType(information) == "Object") {
					if (location == "/") {
						Standards.general.forEach(information, function (value, key) {
							sessionStorage.setItem(key, convert(value));
						});
					} else {
						Standards.general.forEach(information, function (value, key) {
							sessionStorage.setItem(location + key, convert(value));
						});
					}
				} else {
					console.warn("The folder was converted into a key since the information wasn't an Object.");
					if (location != "/") {
						sessionStorage.setItem(location.slice(0, -1), convert(information));
					} else {
						throw "No storage key was provided.";
					}
				}
			} else if (location != "/") {
				sessionStorage.setItem(location, convert(information));
			} else {
				throw "No storage key was provided.";
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
			throw "Client storage isn't supported.";
		} else {
			if (location === undefined && Standards.general.storage.session.defaultLocation != "") {
				location = Standards.general.storage.session.defaultLocation;
			} else if (Standards.general.getType(location) == "String") {
				if (location[0] == "/") {
					if (location == "/") {
						throw ReferenceError("Root-level data retrieval isn't possible.");
					} else {
						location = location.slice(1);
					}
				} else if (Standards.general.storage.session.defaultLocation == "") {
					throw ReferenceError("No default location is present.");
				} else if (location === "" || location === ".") {
					location = Standards.general.storage.session.defaultLocation;
				} else if (location.slice(0, 2) == "./") {
					if (Standards.general.storage.session.defaultLocation.slice(-1) == "/") {
						location = Standards.general.storage.session.defaultLocation + location.slice(2);
					} else {
						location = Standards.general.storage.session.defaultLocation + location.slice(1);
					}
				} else if (Standards.general.storage.session.defaultLocation == "/") {
					// do nothing
				} else {
					let prelocation = Standards.general.storage.session.defaultLocation.split("/");
					while (location.slice(0, 2) == "..") {
						prelocation.pop();
						location = location.slice(3);  // takes slashes into account
					}
					location = prelocation.join("/") + "/" + location;
				}
			} else {
				throw TypeError("The location given wasn't a String.");
			}
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
			function convert(info) {
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
			if (information === null) {
				console.warn("The information couldn't be found.");
				return Error("The information couldn't be found.");
			} else if (Standards.general.getType(information) == "String") {
				return convert(information);
			} else if (Standards.general.getType(information) == "Object") {
				Standards.general.forEach(information, function (value, key) {
					information[key] = convert(value);
				});
				return information;
			} else {
				console.error("An error occurred while retrieving the information.");
				return convert(information);
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
			throw "Client storage isn't supported.";
		} else {
			if (location === undefined && Standards.general.storage.session.defaultLocation != "") {
				location = Standards.general.storage.session.defaultLocation;
			} else if (Standards.general.getType(location) == "String") {
				if (location[0] == "/") {
					if (location != "/") {
						location = location.slice(1);
					}
				} else if (Standards.general.storage.session.defaultLocation == "") {
					throw "No default location is present.";
				} else if (location === "" || location === ".") {
					location = Standards.general.storage.session.defaultLocation;
				} else if (location.slice(0, 2) == "./") {
					if (Standards.general.storage.session.defaultLocation.slice(-1) == "/") {
						location = Standards.general.storage.session.defaultLocation + location.slice(2);
					} else {
						location = Standards.general.storage.session.defaultLocation + location.slice(1);
					}
				} else if (Standards.general.storage.session.defaultLocation == "/") {
					// do nothing
				} else {
					let prelocation = Standards.general.storage.session.defaultLocation.split("/");
					while (location.slice(0, 2) == "..") {
						prelocation.pop();
						location = location.slice(3);  // takes slashes into account
					}
					location = prelocation.join("/") + "/" + location;
				}
			} else {
				throw TypeError("The location given wasn't a String.");
			}
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
	list: function (location) {
		/**
		lists the keys of everything in session storage
		non-native functions = getType
		*/
		if (typeof Storage == "undefined") {
			alert("Your browser doesn't support the Storage object.");
			throw "Client storage isn't supported.";
		} else {
			if (location === undefined && Standards.general.storage.session.defaultLocation != "") {
				location = Standards.general.storage.session.defaultLocation;
				if (location.slice(-1) != "/") {
					location += "/";
				}
				/// makes sure the list doesn't include the parent folder
				/// (The most likely desired behavior when not specifying a location is getting all children without the known parent folder.)
			} else if (Standards.general.getType(location) == "String") {
				if (location[0] == "/") {
					if (location != "/") {
						location = location.slice(1);
					}
				} else if (Standards.general.storage.session.defaultLocation == "") {
					throw "No default location is present.";
				} else if (location === "" || location === ".") {
					location = Standards.general.storage.session.defaultLocation;
				} else if (location.slice(0, 2) == "./") {
					if (Standards.general.storage.session.defaultLocation.slice(-1) == "/") {
						location = Standards.general.storage.session.defaultLocation + location.slice(2);
					} else {
						location = Standards.general.storage.session.defaultLocation + location.slice(1);
					}
				} else if (Standards.general.storage.session.defaultLocation == "/") {
					// do nothing
				} else {
					let prelocation = Standards.general.storage.session.defaultLocation.split("/");
					while (location.slice(0, 2) == "..") {
						prelocation.pop();
						location = location.slice(3);  // takes slashes into account
					}
					location = prelocation.join("/") + "/" + location;
				}
			} else {
				throw TypeError("The location given wasn't a String.");
			}
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
			return keyList;
		}
	},
	move: function (oldPlace, newPlace) {
		/**
		moves information in one place to another place
		non-native functions = getType, forEach
		*/
		if (typeof Storage == "undefined") {
			alert("Your browser doesn't support the Storage object.");
			throw "Client storage isn't supported.";
		} else if (oldPlace != newPlace && Standards.general.storage.session.recall(oldPlace) !== null) {
			if (newPlace.slice(-1) != "/") {
				newPlace += "/";
			}
			if (oldPlace.slice(-1) == "/") {
				Standards.general.forEach(Standards.general.storage.session.list(oldPlace), function (key) {
					Standards.general.storage.session.store(newPlace + key, Standards.general.storage.session.recall(oldPlace + key));
				});
				Standards.general.storage.session.forget(oldPlace);
			} else {
				Standards.general.forEach(Standards.general.storage.session.list(oldPlace), function (key) {
					key = key.split("/").slice(1).join("/");
					if (key == "") {
						Standards.general.storage.session.store(newPlace.slice(0, -1), Standards.general.storage.session.recall(oldPlace));
						Standards.general.storage.session.forget(oldPlace);
					} else {
						Standards.general.storage.session.store(newPlace + key, Standards.general.storage.session.recall(oldPlace + "/" + key));
						Standards.general.storage.session.forget(oldPlace + "/" + key);
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
			throw "Client storage isn't supported.";
		} else {
			if (location === undefined && Standards.general.storage.local.defaultLocation != "") {
				location = Standards.general.storage.local.defaultLocation;
			} else if (Standards.general.getType(location) == "String") {
				if (location[0] == "/") {
					if (location != "/") {
						location = location.slice(1);
					}
				} else if (Standards.general.storage.local.defaultLocation == "") {
					throw "No default location is present.";
				} else if (location === "" || location === ".") {
					location = Standards.general.storage.local.defaultLocation;
				} else if (location.slice(0, 2) == "./") {
					if (Standards.general.storage.local.defaultLocation.slice(-1) == "/") {
						location = Standards.general.storage.local.defaultLocation + location.slice(2);
					} else {
						location = Standards.general.storage.local.defaultLocation + location.slice(1);
					}
				} else if (Standards.general.storage.local.defaultLocation == "/") {
					// do nothing
				} else {
					let prelocation = Standards.general.storage.local.defaultLocation.split("/");
					while (location.slice(0, 2) == "..") {
						prelocation.pop();
						location = location.slice(3);  // takes slashes into account
					}
					location = prelocation.join("/") + "/" + location;
				}
			} else {
				throw TypeError("The location given wasn't a String.");
			}
			function convert(item) {
				if (Standards.general.getType(item) === undefined) {
					item = "~~" + String(item);
				} else {
					switch (Standards.general.getType(item)) {
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
							item = "~" + Standards.general.getType(item) + "~" + String(item);
					}
				}
				return item;
			}
			if (location.slice(-1) == "/") {
				if (Standards.general.getType(information) == "Object") {
					if (location == "/") {
						Standards.general.forEach(information, function (value, key) {
							localStorage.setItem(key, convert(value));
						});
					} else {
						Standards.general.forEach(information, function (value, key) {
							localStorage.setItem(location + key, convert(value));
						});
					}
				} else {
					console.warn("The folder was converted into a key since the information wasn't an Object.");
					if (location != "/") {
						localStorage.setItem(location.slice(0, -1), convert(information));
					} else {
						throw "No storage key was provided.";
					}
				}
			} else if (location != "/") {
				localStorage.setItem(location, convert(information));
			} else {
				throw "No storage key was provided.";
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
			throw "Client storage isn't supported.";
		} else {
			if (location === undefined && Standards.general.storage.local.defaultLocation != "") {
				location = Standards.general.storage.local.defaultLocation;
			} else if (Standards.general.getType(location) == "String") {
				if (location[0] == "/") {
					if (location == "/") {
						throw ReferenceError("Root-level data retrieval isn't possible.");
					} else {
						location = location.slice(1);
					}
				} else if (Standards.general.storage.local.defaultLocation == "") {
					throw ReferenceError("No default location is present.");
				} else if (location === "" || location === ".") {
					location = Standards.general.storage.local.defaultLocation;
				} else if (location.slice(0, 2) == "./") {
					if (Standards.general.storage.local.defaultLocation.slice(-1) == "/") {
						location = Standards.general.storage.local.defaultLocation + location.slice(2);
					} else {
						location = Standards.general.storage.local.defaultLocation + location.slice(1);
					}
				} else if (Standards.general.storage.local.defaultLocation == "/") {
					// do nothing
				} else {
					let prelocation = Standards.general.storage.local.defaultLocation.split("/");
					while (location.slice(0, 2) == "..") {
						prelocation.pop();
						location = location.slice(3);  // takes slashes into account
					}
					location = prelocation.join("/") + "/" + location;
				}
			} else {
				throw TypeError("The location given wasn't a String.");
			}
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
			function convert(info) {
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
			if (information === null) {
				console.warn("The information couldn't be found.");
				return Error("The information couldn't be found.");
			} else if (Standards.general.getType(information) == "String") {
				return convert(information);
			} else if (Standards.general.getType(information) == "Object") {
				Standards.general.forEach(information, function (value, key) {
					information[key] = convert(value);
				});
				return information;
			} else {
				console.error("An error occurred while retrieving the information.");
				return convert(information);
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
			throw "Client storage isn't supported.";
		} else {
			if (location === undefined && Standards.general.storage.local.defaultLocation != "") {
				location = Standards.general.storage.local.defaultLocation;
			} else if (Standards.general.getType(location) == "String") {
				if (location[0] == "/") {
					if (location != "/") {
						location = location.slice(1);
					}
				} else if (Standards.general.storage.local.defaultLocation == "") {
					throw "No default location is present.";
				} else if (location === "" || location === ".") {
					location = Standards.general.storage.local.defaultLocation;
				} else if (location.slice(0, 2) == "./") {
					if (Standards.general.storage.local.defaultLocation.slice(-1) == "/") {
						location = Standards.general.storage.local.defaultLocation + location.slice(2);
					} else {
						location = Standards.general.storage.local.defaultLocation + location.slice(1);
					}
				} else if (Standards.general.storage.local.defaultLocation == "/") {
					// do nothing
				} else {
					let prelocation = Standards.general.storage.local.defaultLocation.split("/");
					while (location.slice(0, 2) == "..") {
						prelocation.pop();
						location = location.slice(3);  // takes slashes into account
					}
					location = prelocation.join("/") + "/" + location;
				}
			} else {
				throw TypeError("The location given wasn't a String.");
			}
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
	list: function (location) {
		/**
		lists the keys of everything in local storage
		non-native functions = getType
		*/
		if (typeof Storage == "undefined") {
			alert("Your browser doesn't support the Storage object.");
			throw "Client storage isn't supported.";
		} else {
			if (location === undefined && Standards.general.storage.local.defaultLocation != "") {
				location = Standards.general.storage.local.defaultLocation;
				if (location.slice(-1) != "/") {
					location += "/";
				}
				/// makes sure the list doesn't include the parent folder
				/// (The most likely desired behavior when not specifying a location is getting all children without the known parent folder.)
			} else if (Standards.general.getType(location) == "String") {
				if (location[0] == "/") {
					if (location != "/") {
						location = location.slice(1);
					}
				} else if (Standards.general.storage.local.defaultLocation == "") {
					throw "No default location is present.";
				} else if (location === "" || location === ".") {
					location = Standards.general.storage.local.defaultLocation;
				} else if (location.slice(0, 2) == "./") {
					if (Standards.general.storage.local.defaultLocation.slice(-1) == "/") {
						location = Standards.general.storage.local.defaultLocation + location.slice(2);
					} else {
						location = Standards.general.storage.local.defaultLocation + location.slice(1);
					}
				} else if (Standards.general.storage.local.defaultLocation == "/") {
					// do nothing
				} else {
					let prelocation = Standards.general.storage.local.defaultLocation.split("/");
					while (location.slice(0, 2) == "..") {
						prelocation.pop();
						location = location.slice(3);  // takes slashes into account
					}
					location = prelocation.join("/") + "/" + location;
				}
			} else {
				throw TypeError("The location given wasn't a String.");
			}
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
			return keyList;
		}
	},
	move: function (oldPlace, newPlace) {
		/**
		moves information in one place to another place
		non-native functions = getType, forEach
		*/
		if (typeof Storage == "undefined") {
			alert("Your browser doesn't support the Storage object.");
			throw "Client storage isn't supported.";
		} else if (oldPlace != newPlace && Standards.general.storage.local.recall(oldPlace) !== null) {
			if (newPlace.slice(-1) != "/") {
				newPlace += "/";
			}
			if (oldPlace.slice(-1) == "/") {
				Standards.general.forEach(Standards.general.storage.local.list(oldPlace), function (key) {
					Standards.general.storage.local.store(newPlace + key, Standards.general.storage.local.recall(oldPlace + key));
				});
				Standards.general.storage.local.forget(oldPlace);
			} else {
				Standards.general.forEach(Standards.general.storage.local.list(oldPlace), function (key) {
					key = key.split("/").slice(1).join("/");
					if (key == "") {
						Standards.general.storage.local.store(newPlace.slice(0, -1), Standards.general.storage.local.recall(oldPlace));
						Standards.general.storage.local.forget(oldPlace);
					} else {
						Standards.general.storage.local.store(newPlace + key, Standards.general.storage.local.recall(oldPlace + "/" + key));
						Standards.general.storage.local.forget(oldPlace + "/" + key);
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
	checkCompatibility: function (shouldNotCheckUser) {
		if (Standards.general.storage.server.database === undefined) {
			Standards.general.makeDialog("There's no server to handle this action.");
			console.error("Firebase or Firestore doesn't exist.");
		}
		if (window.location.protocol != "http:" && window.location.protocol != "https:") {
			Standards.general.makeDialog("Access to the server isn't allowed from this URL.");
			console.error('The URL doesn\'t use the protocol "http" or "https".');
		}
		if (!shouldNotCheckUser && !Standards.general.storage.server.user) {
			Standards.general.makeDialog("That action isn't allowed without logging in.");
			console.warn("The action couldn't be completed because the user wasn't logged on.");
			return false;
		}
		return true;
	},
	locationType: "hybrid",  // shallow, hybrid, or deep
	formatLocation: function (location, ignoreLength) {
		/**
		formats the location
		the last section of the path should be the storage key
		preceding a location with a slash ("/") will allow location setting from the top of the user's directory
		preceding a location with a tilde ("~") will allow absolute location setting (not within a user's directory)
		ending a location with a slash ("/") indicates that a folder (not a key) is desired
		".." goes up a level from the default location
		ignoreLength = optional boolean; whether the length of the location should be ignored
			default: false
		non-native functions = getType
		*/

		// makes sure the default location is in the proper format
		if (Standards.general.storage.server.defaultLocation[0] == ".") {
			alert("An invalid default server storage location was provided");
			throw "An invalid default server storage location was provided";
		}
		if (Standards.general.storage.server.defaultLocation[0] == "~") {
			Standards.general.storage.server.defaultLocation = Standards.general.storage.server.defaultLocation.slice(1);
		} else if (Standards.general.storage.server.defaultLocation[0] == "/") {
			Standards.general.storage.server.defaultLocation = "users/" + Standards.general.storage.server.user.uid + Standards.general.storage.server.defaultLocation;
		}
		if (Standards.general.storage.server.defaultLocation.slice(-1) == "/") {
			Standards.general.storage.server.defaultLocation = Standards.general.storage.server.defaultLocation.slice(0, -1);
		}
		Standards.general.storage.server.defaultLocation = Standards.general.storage.server.defaultLocation.replace(/\//g, "<slash>");
		if (Standards.general.storage.server.defaultLocation.search(/^(?:(?:(?!<slash>).)+<slash>)*.+$/) == -1) {
			alert("The default server storage location has an improper path pattern.");
			throw "The default server storage location has an improper path pattern.";
		}

		// converts the location into an absolute file location
		if (location === undefined || location === "") {
			location = "~" + Standards.general.storage.server.defaultLocation + "/";
		} else if (location == ".") {
			location = "~" + Standards.general.storage.server.defaultLocation;
		}
		if (Standards.general.getType(location) == "String") {
			location = location.trim().replace(/\s*\/\s*/g, "<slash>");  // prevents undesireable whitespace and problems with slashes in document IDs
			if (location.slice(0, 8) == ".<slash>") {
				location = "~" + Standards.general.storage.server.defaultLocation + location.slice(1);
			}
			if (location[0] == "~") {
				location = location.slice(1);
			} else if (location.slice(0, 7) == "<slash>") {
				if (location == "<slash>") {
					location = "users<slash>" + Standards.general.storage.server.user.uid;
				} else {
					location = "users<slash>" + Standards.general.storage.server.user.uid + location;
				}
			} else {
				let prelocation = Standards.general.storage.server.defaultLocation.split("<slash>");
				while (location.slice(0, 2) == "..") {
					prelocation.pop();
					location = location.slice(2);
					if (location == "" || location == "<slash>") {
						break;
					} else if (location.search(/<slash>./) > -1) {
						location = location.slice(7);
					} else {
						throw "An invalid location pattern was provided.";
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
			throw "The location given wasn't a String.";
		}
		if (!ignoreLength && location.indexOf("<slash>") == -1) {
			throw "No key was provided.";
		} else if (location === "") {
			location = "~";
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
		let reference = Standards.general.storage.server.database;
		if (location === "~" || !location.includes("<slash>")) {
			return reference;
		}
		location = location.slice(0, location.lastIndexOf("<slash>"));
		if (Standards.general.storage.server.locationType == "shallow") {
			reference = reference.collection("<collection>").doc(location);
			if (shouldCreate) {
				reference.set({ "<document>": "exists" }, { merge: true });
			}
		} else if (Standards.general.storage.server.locationType == "hybrid") {
			let defaultFolders = Standards.general.storage.server.defaultLocation.split("<slash>").length;
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
		} else if (Standards.general.storage.server.locationType == "deep") {
			location.split("<slash>").forEach(function (place) {
				reference = reference.collection("<collection>").doc(place);
				if (shouldCreate) {
					reference.set({ "<document>": "exists" }, { merge: true });
				}
			});
		} else {
			throw "An improper location type was given.";
		}
		return reference;
	},
	signUp: function (methods) {
		return new Promise(function (resolve, reject) {
			if (!Standards.general.storage.server.checkCompatibility(true)) {
				reject();
			}
			if (methods === undefined) {
				methods = "anonymous";
			}
			if (Standards.general.getType(methods) == "Array") {
				let buttons = {};
				if (methods.includes("google")) {
					buttons.Google = function () {
						firebase.auth().signInWithRedirect(new firebase.auth.GoogleAuthProvider()).catch(function (error) {
							console.error("A problem occurred during sign-up.");
							console.error(error);
							Standards.general.makeDialog("A problem occurred during sign-up.");
						});
					};
				}
				if (methods.includes("password")) {
					buttons["Email &<br>password"] = function () {
						Standards.general.makeDialog(
							'Enter an email and secure password. The password must be at least 8 characters long and contain at least one letter, one capital, and one number.<br><input type="text" id="signUpEmailInput" placeholder="Email"><br><input type="password" id="signUpPasswordInput" placeholder="Password">',
							[
								"Sign up",
								function () {
									let email = document.getElementById("signUpEmailInput").value.trim();
									if (email.search(/.+@.+\..+/) > -1) {  // if a proper email is provided
										let password = document.getElementById("signUpPasswordInput").value.trim();
										if (password.length < 8) {  // if the password isn't long enough
											Standards.general.makeDialog(
												"The password isn't long enough.",
												["Try again", function () {
													Standards.general.storage.server.signUp(methods);
												}]
											);
										} else if (password.search(/\w/) == -1) {  // if the password doesn't have any letters
											Standards.general.makeDialog(
												"The password doesn't contain any letters.",
												["Try again", function () {
													Standards.general.storage.server.signUp(methods);
												}]
											);
										} else if (password == password.toLowerCase()) {  // if the password doesn't have any capital letters
											Standards.general.makeDialog(
												"The password doesn't contain any capital letters.",
												["Try again", function () {
													Standards.general.storage.server.signUp(methods);
												}]
											);
										} else if (password.search(/\d/) == -1) {  // if the password doesn't have any numbers
											Standards.general.makeDialog(
												"The password doesn't contain any numbers.",
												["Try again", function () {
													Standards.general.storage.server.signUp(methods);
												}]
											);
										} else {  // if the password passes
											firebase.auth().createUserWithEmailAndPassword(email, password).catch(function (error) {
												console.error("A problem occurred during sign-up.");
												console.error(error);
												Standards.general.makeDialog("A problem occurred during sign-up.");
											});
										}
									} else {
										Standards.general.makeDialog(
											"A properly formatted email wasn't provided.",
											["Try again", function () {
												Standards.general.storage.server.signUp(methods);
											}]
										);
									}
								}
							],
							["Cancel", reject]
						);
					};
				}
				Standards.general.makeDialog("Sign up with your prefered sign-in provider.", buttons).then(resolve).catch(reject);
			} else if (Standards.general.getType(methods) == "String") {
				switch (methods.toLowerCase()) {
					case "google":
						firebase.auth().signInWithRedirect(new firebase.auth.GoogleAuthProvider()).catch(function (error) {
							console.error("A problem occurred during sign-up.");
							console.error(error);
							Standards.general.makeDialog("A problem occurred during sign-up.");
						});
						break;
					case "password":
						Standards.general.makeDialog(
							'Enter an email and secure password. The password must be at least 8 characters long and contain at least one letter, one capital, and one number.<br><input type="text" id="signUpEmailInput" placeholder="Email"><br><input type="password" id="signUpPasswordInput" placeholder="Password">',
							[
								"Sign up",
								function () {
									let email = document.getElementById("signUpEmailInput").value.trim();
									if (email.search(/.+@.+\..+/) > -1) {  // if a proper email is provided
										let password = document.getElementById("signUpPasswordInput").value.trim();
										if (password.length < 8) {  // if the password isn't long enough
											Standards.general.makeDialog(
												"The password isn't long enough.",
												["Try again", function () {
													Standards.general.storage.server.signUp(methods);
												}]
											);
											reject();
										} else if (password.search(/\w/) == -1) {  // if the password doesn't have any letters
											Standards.general.makeDialog(
												"The password doesn't contain any letters.",
												["Try again", function () {
													Standards.general.storage.server.signUp(methods);
												}]
											);
											reject();
										} else if (password == password.toLowerCase()) {  // if the password doesn't have any capital letters
											Standards.general.makeDialog(
												"The password doesn't contain any capital letters.",
												["Try again", function () {
													Standards.general.storage.server.signUp(methods);
												}]
											);
											reject();
										} else if (password.search(/\d/) == -1) {  // if the password doesn't have any numbers
											Standards.general.makeDialog(
												"The password doesn't contain any numbers.",
												["Try again", function () {
													Standards.general.storage.server.signUp(methods);
												}]
											);
											reject();
										} else {  // if the password passes
											firebase.auth().createUserWithEmailAndPassword(email, password).then(resolve).catch(function (error) {
												console.error("A problem occurred during sign-up.");
												console.error(error);
												Standards.general.makeDialog("A problem occurred during sign-up.");
												reject();
											});
										}
									} else {
										Standards.general.makeDialog(
											"A properly formatted email wasn't provided.",
											["Try again", function () {
												Standards.general.storage.server.signUp(methods);
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
						Standards.general.makeDialog("An attempt was made to sign up with an incorrect method.");
						reject();
				}
			} else {
				console.error('The "methods" of sign-up was an incorrect type.');
				Standards.general.makeDialog("A problem occurred during sign-up.");
				reject();
			}
		});
	},
	signIn: function (methods) {
		return new Promise(function (resolve, reject) {
			if (!Standards.general.storage.server.checkCompatibility(true)) {
				reject();
			}
			if (methods === undefined) {
				methods = "anonymous";
			}
			switch (Standards.general.getType(methods)) {
				case "Array":
					let buttons = {};
					if (methods.includes("google")) {
						buttons.Google = function () {
							firebase.auth().signInWithRedirect(new firebase.auth.GoogleAuthProvider()).catch(function (error) {
								console.error("A problem occurred during sign-in.");
								console.error(error);
								Standards.general.makeDialog("A problem occurred during sign-in.");
							});
						};
					}
					if (methods.includes("password")) {
						buttons["Email &<br>password"] = function () {
							Standards.general.makeDialog(
								'Enter your email and password.<br><input type="text" id="signInEmailInput" placeholder="Email"><br><input type="password" id="signInPasswordInput" placeholder="Password">',
								[
									"Sign in",
									function () {
										firebase.auth().signInWithEmailAndPassword(
											document.getElementById("signInEmailInput").value.trim(), document.getElementById("signInPasswordInput").value.trim()
										).catch(function (error) {
											console.error("A problem occurred during sign-in.");
											console.error(error);
											Standards.general.makeDialog("A problem occurred during sign-in.");
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
								Standards.general.makeDialog("A problem occurred during sign-in.");
							});
						};
					}
					Standards.general.makeDialog("Sign in with your prefered sign-in provider.", buttons).then(resolve).catch(reject);
					break;
				case "String":
					switch (methods.toLowerCase()) {
						case "google":
							firebase.auth().signInWithRedirect(new firebase.auth.GoogleAuthProvider()).then(resolve).catch(function (error) {
								console.error("A problem occurred during sign-in.");
								console.error(error);
								Standards.general.makeDialog("A problem occurred during sign-in.");
								reject();
							});
							break;
						case "password":
							Standards.general.makeDialog(
								'Enter your email and password.<br><input type="text" id="signInEmailInput" placeholder="Email"><br><input type="password" id="signInPasswordInput" placeholder="Password">',
								[
									"Sign in",
									function () {
										firebase.auth().signInWithEmailAndPassword(
											document.getElementById("signInEmailInput").value.trim(), document.getElementById("signInPasswordInput").value.trim()
										).then(resolve).catch(function (error) {
											console.error("A problem occurred during sign-in.");
											console.error(error);
											Standards.general.makeDialog("A problem occurred during sign-in.");
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
								Standards.general.makeDialog("A problem occurred during sign-in.");
								reject();
							});
							break;
						default:
							console.error("The method of sign-in wasn't recognized.");
							Standards.general.makeDialog("An attempt was made to sign in with an incorrect method.");
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
						Standards.general.makeDialog("A problem occurred during sign-in.");
						reject();
					});
					break;
				default:
					console.error('The "methods" of sign-in was an incorrect type.');
					Standards.general.makeDialog("A problem occurred during sign-in.");
					reject();
			}
		});
	},
	signOut: function () {
		Standards.general.storage.server.checkCompatibility();
		Standards.general.makeDialog("Are you sure you want to log out?",
			["Yes", function () {
				firebase.auth().signOut();
			}],
			"No"
		);
	},
	mergeAccounts: function () {
		return new Promise(function (resolve, reject) {
			if (!Standards.general.storage.server.checkCompatibility()) {
				reject(new Error("It wasn't possible to access the server."));
			}
			//// do stuff
		});
	},
	store: function (location, item, callback) {
		return new Promise(function (resolve, reject) {
			if (!Standards.general.storage.server.checkCompatibility()) {
				reject(new Error("It wasn't possible to access the server."));
			}
			location = Standards.general.storage.server.formatLocation(location);
			let reference = Standards.general.storage.server.getReference(location, true);
			if (location.slice(-7) == "<slash>") {  // if storing a whole folder of items
				if (Standards.general.getType(item) == "Object") {
					reference.set(item, { merge: true }).then(function () {
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
						console.error("There was an error storing the information.");
						console.error(error);
						reject(error);
					});
				} else {
					console.error("Storing a folder requires an Object as the item to store.");
					reject(new TypeError("Storing a folder requires an Object as the item to store."));
				}
			} else {  // if storing a single key-value pair
				reference.set({
					[location.slice(location.lastIndexOf("<slash>") + 7)]: item
				}, { merge: true }).then(function () {
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
					console.error("There was an error storing the information.");  // Putting an extra error here allows origin tracing when the error is in Firebase.
					console.error(error);
					reject(error);
				});
			}
		});
	},
	recall: function (location, callback) {
		return new Promise(function (resolve, reject) {
			if (!Standards.general.storage.server.checkCompatibility()) {
				reject(new Error("It wasn't possible to access the server."));
			}
			location = Standards.general.storage.server.formatLocation(location);
			if (location.slice(-7) == "<slash>") {  // if retrieving a folder
				Standards.general.storage.server.getReference(location).get().then(function (doc) {
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
				Standards.general.storage.server.getReference(location).get().then(function (doc) {
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
	forget: function (location, callback) {
		return new Promise(function (resolve, reject) {
			if (!Standards.general.storage.server.checkCompatibility()) {
				reject(new Error("It wasn't possible to access the server."));
			}
			location = Standards.general.storage.server.formatLocation(location);
			if (location == "~") {
				console.error("Deleting all server information is forbidden.");
				reject(new Error("Deleting all server information is forbidden."));
			} else if (location == "users<slash>") {
				console.error("Deleting every user's information is forbidden.");
				reject(new Error("Deleting every user's information is forbidden."));
			}
			let reference = Standards.general.storage.server.getReference(location);
			if (Standards.general.storage.server.locationType == "shallow") {
				if (location.slice(-7) == "<slash>") {  // if deleting a whole folder
					location = location.slice(0, -7);
					Standards.general.storage.server.database.collection("<collection>").get().then(function (collection) {
						let keyList = [];
						Standards.general.forEach(collection.docs, function (subdoc) {
							if (subdoc.exists && subdoc.id.slice(0, location.length) == location) {
								keyList.push(subdoc.id);
							}
						});
						let remaining = new Standards.general.Listenable();
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
						Standards.general.forEach(keyList, function (id) {
							remaining.value++;
							Standards.general.storage.server.database.collection("<collection>").doc(id).delete().then(function () {
								remaining.value--;
							}).catch(function (error) {
								console.error("The information couldn't be deleted.");
								console.error(error);
								reject(error);
							});
						});
						remaining.value++;
						Standards.general.storage.server.database.delete().then(function () {  // deletes the document (which deletes all of the keys within)
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
					Standards.general.storage.server.database.collection("<collection>").get().then(function (collection) {
						let found = false;
						Standards.general.forEach(collection.docs, function (doc) {
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
			} else if (Standards.general.storage.server.locationType == "hybrid") {
				let defaultLength = Standards.general.storage.server.defaultLocation.split("<slash>").length;
				if (location.split("<slash>").length - 1 > defaultLength) {  // if the location extends into shallow folders
					let docLocation = location.split("<slash>").slice(0, defaultLength).join("<slash>") + "<slash>";
					let remainingLocation = location.split("<slash>").slice(defaultLength).join("<slash>");
					reference = Standards.general.storage.server.getReference(docLocation);
					if (remainingLocation.slice(-7) == "<slash>") {  // if deleting a whole folder
						remainingLocation = remainingLocation.slice(0, -7);
						reference.collection("<collection>").get().then(function (collection) {
							let keyList = [];
							Standards.general.forEach(collection.docs, function (subdoc) {
								if (subdoc.exists && subdoc.id.slice(0, remainingLocation.length) == remainingLocation) {
									keyList.push(subdoc.id);
								}
							});
							let remaining = new Standards.general.Listenable();
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
							Standards.general.forEach(keyList, function (id) {  // deletes all subdocuments
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
							Standards.general.forEach(collection.docs, function (doc) {
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
							let listener = new Standards.general.Listenable();
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
									Standards.general.forEach(collection, function (subdoc) {
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
			} else if (Standards.general.storage.server.locationType == "deep") {
				if (location.slice(-7) == "<slash>") {  // if deleting a whole folder
					reference.collection("<collection>").get().then(function (collectionProbe) {
						let listener = new Standards.general.Listenable();
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
								Standards.general.forEach(collection, function (subdoc) {
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
	list: function (location, callback) {
		return new Promise(function (resolve, reject) {
			if (!Standards.general.storage.server.checkCompatibility()) {
				reject(new Error("It wasn't possible to access the server."));
			}
			if (location === undefined) {
				location = "./";
				/// makes sure the list doesn't include the parent folder
				/// (The most likely desired behavior when not specifying a location is getting all children without the known parent folder.)
			}
			location = Standards.general.storage.server.formatLocation(location, true);
			let keyList = [];

			if (Standards.general.storage.server.locationType == "shallow") {  // if all documents are held in one collection
				Standards.general.storage.server.database.collection("<collection>").get().then(function (collection) {
					let preKey = "";  // holds the found file locations (document IDs)
					if (location == "~") {  // if trying to get all keys
						Standards.general.forEach(collection.docs, function (doc) {
							let key = doc.id.split("<slash>")[0];
							if (!keyList.includes(key)) {
								keyList.push(key);
							}
						});
						/// returns only the first folder level of everything at the top of the directory
					} else if (location.slice(-7) == "<slash>") {  // if getting the key names within a folder
						location = location.slice(0, -7);
						Standards.general.forEach(collection.docs, function (doc) {
							if (doc.exists && doc.id.search(new RegExp("^" + location + "(?:<slash>|$)")) > -1) {  // if beginning of document ID contains the file location
								if (doc.id.length > location.length) {
									preKey = doc.id.slice(location.length + 7) + "<slash>";
								} else {
									preKey = "";
								}
								Standards.general.forEach(doc.data(), function (value, key) {
									if (key != "<document>") {
										keyList.push(preKey + key);
									}
								});
							}
						});
					} else {  // if getting a key with the same name or keys within a folder (includes folder name in returned path)
						Standards.general.forEach(collection.docs, function (doc) {
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
									Standards.general.forEach(doc.data(), function (value, key) {
										if (key != "<document>") {
											keyList.push(preKey + key);
										}
									});
								}
							}
						});
					}
					Standards.general.forEach(keyList, function (key, index) {
						keyList[index] = key.replace(/<slash>/g, "/");
					});
					if (callback) {
						new Promise(function () {
							callback(keyList);
							resolve(keyList);
						}).catch(function (error) {
							console.error("There was a problem running the callback.");
							console.error(error);
							reject(error);
						});
					} else {
						resolve(keyList);
					}
				}).catch(function (error) {
					console.error("There was an error finding the information.");
					console.error(error);
					reject(error);
				});

			} else if (Standards.general.storage.server.locationType == "hybrid") {  // if the default location is "deep" and the modifier locations are "shallow"
				let defaultLength = Standards.general.storage.server.defaultLocation.split("<slash>").length;
				if (location == "~") {
					Standards.general.storage.server.database.collection("<collection>").get().then(function (collection) {
						Standards.general.forEach(collection.docs, function (doc) {
							let key = doc.id.split("<slash>")[0];
							if (!keyList.includes(key)) {
								keyList.push(key);
							}
						});
						/// returns only the first folder level of everything at the top of the directory
						// none of the keys should have "<slash>"
						if (callback) {
							new Promise(function () {
								callback(keyList);
								resolve(keyList);
							}).catch(function (error) {
								console.error("There was a problem running the callback.");
								console.error(error);
								reject(error);
							});
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
					Standards.general.storage.server.getReference(docLocation).collection("<collection>").get().then(function (collection) {
						let preKey = "";  // holds the found file locations (document IDs)
						if (remainingLocation.slice(-7) == "<slash>") {  // if getting the key names within a folder
							remainingLocation = remainingLocation.slice(0, -7);
							Standards.general.forEach(collection.docs, function (doc) {
								if (doc.exists && doc.id.search(new RegExp("^" + remainingLocation + "(?:<slash>|$)")) > -1) {  // if beginning of doc ID contains location
									if (doc.id.length > remainingLocation.length) {
										preKey = doc.id.slice(remainingLocation.length + 7) + "<slash>";
									} else {
										preKey = "";
									}
									Standards.general.forEach(doc.data(), function (value, key) {
										if (key != "<document>") {
											keyList.push(preKey + key);
										}
									});
								}
							});
						} else {  // if getting a key with the same name or keys within a folder (includes folder name in returned path)
							Standards.general.forEach(collection.docs, function (doc) {
								if (doc.exists) {
									if (doc.id == remainingLocation.split("<slash>").slice(0, -1).join("<slash>")) {  // if the document is one folder-level up
										if (doc.data().hasOwnProperty(remainingLocation.split("<slash>").slice(-1)[0])) {  // if document has key at the end of the location
											keyList.push(remainingLocation.split("<slash>").slice(-1)[0]);
										}
									} else if (doc.id.search(new RegExp("^" + remainingLocation + "(?:<slash>|$)")) > -1) { // if beginning of doc ID contains file location
										/// remainingLocation always contains "<slash>" at this point
										preKey = doc.id.slice(remainingLocation.lastIndexOf("<slash>") + 7) + "<slash>";
										Standards.general.forEach(doc.data(), function (value, key) {
											if (key != "<document>") {
												keyList.push(preKey + key);
											}
										});
									}
								}
							});
						}
						Standards.general.forEach(keyList, function (key, index) {
							keyList[index] = key.replace(/<slash>/g, "/");
						});
						if (callback) {
							new Promise(function () {
								callback(keyList);
								resolve(keyList);
							}).catch(function (error) {
								console.error("There was a problem running the callback.");
								console.error(error);
								reject(error);
							});
						} else {
							resolve(keyList);
						}
					}).catch(function (error) {
						console.error("There was an error finding the information.");
						console.error(error);
						reject(error);
					});
				} else {  // if the provided location length is shallower than (or equal to) the default location
					let reference = Standards.general.storage.server.getReference(location);
					reference.collection("<collection>").get().then(function (collectionProbe) {
						if (collectionProbe.size > 0) {  // if there's sub-documents
							let listener = new Standards.general.Listenable();
							listener.value = 1;
							listener.addEventListener("change", function (value) {
								if (value == 0) {  // once all items have been listed
									listener.removeEventListener("change", arguments.callee);
									Standards.general.forEach(keyList, function (key, index) {
										keyList[index] = key.replace(/<slash>/g, "/");
									});
									if (callback) {
										new Promise(function () {
											callback(keyList);
											resolve(keyList);
										}).catch(function (error) {
											console.error("There was a problem running the callback.");
											console.error(error);
											reject(error);
										});
									} else {
										resolve(keyList);
									}
								}
							});
							/// when a new document is encountered, listener.value is incremented
							/// when a document's keys have been iterated, listener.value is decremented
							function exploreCollection(collection, path) {
								Standards.general.forEach(collection, function (doc) {
									if (doc.exists) {
										listener.value++;
										doc.ref.collection("<collection>").get().then(function (subcollection) {
											if (subcollection.size > 0) {  // if there's sub-sub-documents
												exploreCollection(subcollection.docs, path + doc.id + "<slash>");
											}
											Standards.general.forEach(doc.data(), function (value, key) {
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
										Standards.general.forEach(doc.data(), function (value, key) {
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
								Standards.general.forEach(collectionProbe.docs, function (doc) {
									if (doc.exists && doc.id.search(new RegExp("^" + locationKey + "(?:<slash>|$)")) > -1) {
										Standards.general.forEach(doc.data(), function (value, key) {
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
								Standards.general.forEach(collectionProbe.docs, function (doc) {
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
								Standards.general.forEach(collectionProbe.docs, function (doc) {
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
										Standards.general.forEach(doc.data(), function (value, key) {
											if (key != "<document>") {
												keyList.push(key);
											}
										});
									} else if (Object.keys(doc.data()).includes(location.slice(location.lastIndexOf("<slash>") + 7))) {  // if document has location's key
										keyList.push(location.slice(location.lastIndexOf("<slash>") + 7));
									}
									Standards.general.forEach(keyList, function (key, index) {
										keyList[index] = key.replace(/<slash>/g, "/");
									});
									if (callback) {
										new Promise(function () {
											callback(keyList);
											resolve(keyList);
										}).catch(function (error) {
											console.error("There was a problem running the callback.");
											console.error(error);
											reject(error);
										});
									} else {
										resolve(keyList);
									}
								} else {
									console.warn("An attempt was made to access a non-existent document.");
									// keyList is empty and doesn't need to have "<slash>"s replaced
									if (callback) {
										new Promise(function () {
											callback(keyList);
											resolve(keyList);
										}).catch(function (error) {
											console.error("There was a problem running the callback.");
											console.error(error);
											reject(error);
										});
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

			} else if (Standards.general.storage.server.locationType == "deep") {  // if every folder level is another nested document
				let reference = Standards.general.storage.server.getReference(location);
				reference.collection("<collection>").get().then(function (collectionProbe) {
					if (collectionProbe.size > 0) {  // if there's sub-documents
						if (location == "~") {
							Standards.general.forEach(collectionProbe.docs, function (doc) {
								keyList.push(doc.id);
							});
							// none of the keys should have "<slash>"
							if (callback) {
								new Promise(function () {
									callback(keyList);
									resolve(keyList);
								}).catch(function (error) {
									console.error("There was a problem running the callback.");
									console.error(error);
									reject(error);
								});
							} else {
								resolve(keyList);
							}
						} else {
							let listener = new Standards.general.Listenable();
							listener.value = 1;
							listener.addEventListener("change", function (value) {
								if (value == 0) {  // once all items have been listed
									listener.removeEventListener("change", arguments.callee);
									Standards.general.forEach(keyList, function (key, index) {
										keyList[index] = key.replace(/<slash>/g, "/");
									});
									if (callback) {
										new Promise(function () {
											callback(keyList);
											resolve(keyList);
										}).catch(function (error) {
											console.error("There was a problem running the callback.");
											console.error(error);
											reject(error);
										});
									} else {
										resolve(keyList);
									}
								}
							});
							/// when a new document is encountered, listener.value is incremented
							/// when a document's keys have been iterated, listener.value is decremented
							function exploreCollection(collection, path) {
								Standards.general.forEach(collection, function (doc) {
									if (doc.exists) {
										listener.value++;
										doc.ref.collection("<collection>").get().then(function (subcollection) {
											if (subcollection.size > 0) {  // if there's sub-sub-documents
												exploreCollection(subcollection.docs, path + doc.id + "<slash>");
											}
											Standards.general.forEach(doc.data(), function (value, key) {
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
										Standards.general.forEach(doc.data(), function (value, key) {
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
								Standards.general.forEach(collectionProbe.docs, function (doc) {
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
									Standards.general.forEach(doc.data(), function (value, key) {
										if (key != "<document>") {
											keyList.push(key);
										}
									});
								} else if (Object.keys(doc.data()).includes(location.slice(location.lastIndexOf("<slash>") + 7))) {  // if document has the location's key
									keyList.push(location.slice(location.lastIndexOf("<slash>") + 7));
								}
								Standards.general.forEach(keyList, function (key, index) {
									keyList[index] = key.replace(/<slash>/g, "/");
								});
								if (callback) {
									new Promise(function () {
										callback(keyList);
										resolve(keyList);
									}).catch(function (error) {
										console.error("There was a problem running the callback.");
										console.error(error);
										reject(error);
									});
								} else {
									resolve(keyList);
								}
							} else {
								console.warn("An attempt was made to access a non-existent document.");
								// keyList should be empty
								if (callback) {
									new Promise(function () {
										callback(keyList);
										resolve(keyList);
									}).catch(function (error) {
										console.error("There was a problem running the callback.");
										console.error(error);
										reject(error);
									});
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
	move: function (oldPlace, newPlace, callback) {
		return new Promise(function (resolve, reject) {
			if (!Standards.general.storage.server.checkCompatibility()) {
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
			} else if (Standards.general.getType(oldPlace) == "String" && Standards.general.getType(newPlace) == "String") {
				if (oldPlace.slice(-1) == "/" || newPlace.slice(-1) == "/") {
					if (newPlace.slice(-1) != "/") {
						newPlace += "/";
					}
					let remaining = new Standards.general.Listenable();
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
					Standards.general.storage.server.list(oldPlace).then(function (oldList) {
						if (oldPlace.slice(-1) == "/") {
							Standards.general.forEach(oldList, function (key) {
								remaining.value++;
								Standards.general.storage.server.recall(oldPlace + key).then(function (info) {
									Standards.general.storage.server.store(newPlace + key, info).then(function () {
										Standards.general.storage.server.recall(newPlace + key).then(function (movedInfo) {  // failsafe
											/// checks whether the information was actually moved
											/// not essential but prevents premature deletion in strange circumstances
											if (movedInfo === info) {
												Standards.general.storage.server.forget(oldPlace + key).then(function () {
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
							Standards.general.forEach(oldList, function (key) {
								remaining.value++;
								if (!key.includes("/")) {
									Standards.general.storage.server.recall(oldPlace).then(function (info) {
										Standards.general.storage.server.store(newPlace + key, info).then(function () {
											Standards.general.storage.server.recall(newPlace + key).then(function (movedInfo) {  // failsafe
												/// checks whether the information was actually moved
												/// not essential but prevents premature deletion in strange circumstances
												if (movedInfo === info) {
													Standards.general.storage.server.forget(oldPlace).then(function () {
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
									Standards.general.storage.server.recall(oldPlace + key.slice(key.indexOf("/"))).then(function (info) {
										Standards.general.storage.server.store(newPlace + key, info).then(function () {
											Standards.general.storage.server.recall(newPlace + key).then(function (movedInfo) {  // failsafe
												/// checks whether the information was actually moved
												/// not essential but prevents premature deletion in strange circumstances
												if (movedInfo === info) {
													Standards.general.storage.server.forget(oldPlace + key.slice(key.indexOf("/"))).then(function () {
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
					Standards.general.storage.server.recall(oldPlace).then(function (info) {
						if (info instanceof Error) {
							console.error("No information was found to move.");
							reject();
						} else {
							Standards.general.storage.server.store(newPlace, info).then(function () {
								Standards.general.storage.server.recall(newPlace).then(function (movedInfo) {  // failsafe
									/// checks whether the information was actually moved
									/// not essential but prevents premature deletion in strange circumstances
									if (movedInfo === info) {
										Standards.general.storage.server.forget(oldPlace).then(function () {
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
				if (Standards.general.getType(oldPlace) == "String") {
					console.error("The newPlace to move to is not a string.");
					reject(new TypeError("The newPlace to move to is not a string."));
				} else {
					console.error("The oldPlace to move is not a string.");
					reject(new TypeError("The oldPlace to move is not a string."));
				}
			}
		});
	}
};
