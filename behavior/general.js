if (typeof Standards !== "undefined") {
	if (Standards.constructor !== Object) {
		var Standards = {};
		console.warn("Standards is not an Object");
	}
} else {
	var Standards = {};
}
if (typeof Standards.general !== "undefined") {
	if (Standards.general.constructor !== Object) {
		Standards.general = {};
		console.warn("Standards.general is not an Object");
	}
} else {
	Standards.general = {};
}
if (typeof Standards.general.options !== "undefined") {
	if (Standards.general.options.constructor !== Object) {
		Standards.general.options = {};
		console.warn("Standards.general.options is not an Object");
	}
} else {
	Standards.general.options = {};
}
/**
allows specifications to be added if the variable is already present
(otherwise uses default values and settings)
valid options =
	"automation": "none", "basic", "full"
		runs a corresponding amount of code after defining everything
		default = "full"
	"console": "default", "recorded"
		whether information printed to the console should be stored in a console.messages array
		note: enabling complicates (but doesn't prevent) line number tracing
		default = "default"
*/

/*
if (Standards.general.options.console == "recorded") {
	console.messages = [];
	let oldConsole = {};
	oldConsole.log = console.log;
	oldConsole.warn = console.warn;
	oldConsole.error = console.error;
	oldConsole.info = console.info;
	oldConsole.clear = console.clear;
	console.log = function (message) {
		oldConsole.log(new Error().stack.match(/at (?!console\.).+\/([^\n)]+)/)[1]);
		oldConsole.log(message);
		let msg = "Log at " + new Error().stack.match(/at (?!console\.).+\/([^\n)]+)/)[1] + " {\n";
		if (message instanceof Array) {
			msg += "\t[\n\t\t" + message.join("\n\t\t") + "\n\t]";
		} else if (message instanceof Object) {
			msg += "\t{\n";
			for (const key in message) {
				msg += "\t\t";
				if (message[key] === undefined) {
					msg += key + ": undefined\n";
				} else if (message[key] === null) {
					msg += key + ": null\n";
				} else if (message[key].toString) {
					msg += key + ": " + message[key].toString().replace(/\r\n/g, "\n") + "\n";
				} else {
					msg += key + ": " + message[key] + "\n";
				}
			}
			msg += "\t}";
		} else {
			msg += "\t" + message;
		}
		msg += "\n}";
		console.messages.push(msg);
		window.dispatchEvent(new Event("console written"));
	};
	console.warn = function (message) {
		oldConsole.warn(message);
		console.messages.push("Warning at " + new Error().stack.match(/at (?!console\.).+\/([^\n]+)/)[1] + " {\n\t" + message + "\n}");
		window.dispatchEvent(new Event("console written"));
	};
	console.error = function (message) {
		oldConsole.error(message);
		if (message instanceof Error && message.error) {
			console.messages.push("Error at " + new Error().stack.match(/at (?!console\.).+\/([^\n]+)/)[1] + " {\n\t" + message.error.stack.replace(/    /g, "\t\t") + "\n}");
		} else {
			console.messages.push("Error at " + new Error().stack.match(/at (?!console\.).+\/([^\n]+)/)[1] + " {\n\t" + message + "\n}");
		}
		window.dispatchEvent(new Event("console written"));
	};
	console.info = function (message) {
		oldConsole.info(new Error().stack.match(/at (?!console\.)([^\n]+)/)[1]);
		oldConsole.info(message);
		console.messages.push("Info at " + new Error().stack.match(/at (?!console\.).+\/([^\n]+)/)[1] + " {\n\t" + message + "\n}");
		window.dispatchEvent(new Event("console written"));
	};
	console.clear = function () {
		oldConsole.clear();
		console.messages = [];
		window.dispatchEvent(new Event("console cleared"));
	};
}
window.addEventListener("error", function (error) {
	if (error.error === null) {
		console.messages.push("Error {\n\tScript execution failed in an artificial context. Check \"eval\" or instances of \"call\" and \"apply\" methods.\n}");
	} else {
		console.messages.push("Error {\n\t" + error.error.stack.replace(/    /g, "\t\t") + "\n}");
	}
	window.dispatchEvent(new Event("console written"));
});
*/

Standards.general.help = function (item, part) {
	/**
	This prints out the source code of what you want to learn about
	which also includes my comments on usage.
	The part allows you pick a part of documentation.
		"all", "docstring", "function", or "non-natives"
	non-native functions = none
	*/
	if (Standards.general.getType(item) == "Function") {
		part = part || "docstring";
		let content = item.toString();
		switch (part) {
			case "docstring":
				if (content.indexOf("/**") > -1) {
					content = content.slice(0, content.indexOf("*/"));
				} else {
					content = "No docstring present."
				}
				break;
			case "function":
				if (content.indexOf("/**") > -1) {
					content = content.slice(0, content.indexOf("/**")) + content.slice(content.indexOf("*/") + 2);
				}
				break;
			case "non-natives":
				if (content.search(/non-native functions/i) > -1) {
					content = content.slice(content.toLowerCase().lastIndexOf("non-native functions", content.indexOf("*/")), content.indexOf("*/"));
					if (content.includes("=")) {
						content = content.slice(content.indexOf("=") + 2, content.indexOf("\n"));
					} else if (content.includes(":")) {
						content = content.slice(content.indexOf(":") + 2, content.indexOf("\n"));
					} else {
						console.warn("There's not a clear beginning to the non-native functions.");
					}
				} else {
					content = 'A "non-native functions" indication isn\'t present.'
				}
		}
		console.info(content);
		return content;
	} else {
		if (Standards.general.getType(item) == "undefined" || Standards.general.getType(item) == "null") {
			console.error("The item is undefined or null.");
		} else {
			console.warn("The item provided wasn't a function.");
			console.info(item.toString());
			return item.toString();
		}
	}
};

Standards.general.finished = false;  // for keeping track of whether this script is finished running

Standards.general.identifier = 1;  // for anything that may need to have specific targeting

Standards.general.makeToneGenerator = function (makeDialog, affirmativeCallback, negativeCallback) {
	/**
	makes an audio context for creating tones
	This can't be done without user input.
	Safari doesn't seem to like any type of AudioContext even though recent versions are supposed to support it with "webkit".
	Only one audio context can be created since you'd otherwise max out at around 6.
	arguments:
		makeDialog = optional; whether a dialog box should appear asking permission to make the audio context
		affirmativeCallback = optional; a function to run once the tone generator has been created
		negativeCallback = optional; a function to be run if permission to make tones is denied
	non-native functions: makeDialog
	*/  // Standards.general.audio.close() can get rid of the instance.
	return new Promise(function (resolve, reject) {
		if (makeDialog) {
			Standards.general.makeDialog("Do you want to enable tone generation?", ["Yes", function () {
				if (window.AudioContext) {
					Standards.general.audio = new window.AudioContext();
				} else if (window.webkitAudioContext) {
					Standards.general.audio = new window.webkitAudioContext();
				} else {
					console.error("Your browser doesn't support audio contexts.");
					reject(Error("Your browser doesn't support audio contexts."));
				}
				window.dispatchEvent(new Event("AudioContext created"));
				if (affirmativeCallback) {
					affirmativeCallback();
				}
				resolve();
			}], ["No", function () {
				if (negativeCallback) {
					negativeCallback();
				}
				reject();
			}]);
		} else {
			if (window.AudioContext) {
				Standards.general.audio = new window.AudioContext();
			} else if (window.webkitAudioContext) {
				Standards.general.audio = new window.webkitAudioContext();
			} else {
				console.error("Your browser doesn't support audio contexts.");
				reject(Error("Your browser doesn't support audio contexts."));
			}
			window.dispatchEvent(new Event("AudioContext created"));
			if (affirmativeCallback) {
				affirmativeCallback();
			}
			resolve();
		}
	});
};

if (typeof Standards.general.queue !== "undefined") {
	if (Standards.general.queue.constructor !== Object) {
		Standards.general.queue = {};
		console.warn("Standards.general.queue is not an Object");
	}
} else {
	Standards.general.queue = {};
};
if (typeof Standards.general.queue.list !== "undefined") {
	if (Standards.general.queue.list.constructor === Array) {
		Standards.general.queue.list.forEach(function (item, index) {
			if (item.constructor === Object) {
				Standards.general.queue.list.splice(index, 1);
				console.warn("The item at the index of " + index + " in Standards.general.queue.list is not an Object.");
			}
		});
	} else {
		Standards.general.queue.list = [];
		console.warn("Standards.general.queue.list is not an Array");
	}
} else {
	Standards.general.queue.list = [];
};
/**
establishes a list of functions to be run once the page and this script has loaded
each item should be an object with a "runOrder" property and a "function" property
an "arguments" property can also be added and should consist of an array of the arguments to be run in the function
runOrder options:
	"first" = will run first (or after preceeding functions with the "first" option)
	"later" = will run some time in the middle
	"last" = will run last (or before following functions with the "last" option)
functions can be run in a more specific order by searching for a certain function
all functions in this script that make use of Standards.general.queue have a "first" runOrder
example usage:
	var Standards = {};
	Standards.general.queue = [{"runOrder":"first", "function":pageJump, "arguments":["divID"]}];
*/
Standards.general.queue.run = function () {
	/**
	runs the functions in the queue
	non-native functions = none
	*/
	if (Standards.general.finished) {
		if (typeof Standards.general.queue.list[0].function == "string") {
			throw 'The value of "function" must not be a string.';
		}
		let returnValue = Standards.general.queue.list[0].function.apply(window, Standards.general.queue.list[0].arguments);
		Standards.general.queue.list.pop();
		return returnValue;
	} else {
		Standards.general.queue.list.forEach(function (fn) {
			if (typeof fn.function == "string") {
				throw 'The value of "function" must not be a string.';
			}
			if (fn.runOrder == "first") {
				fn.function.apply(window, fn.arguments);
			}
		});
		Standards.general.queue.list.forEach(function (fn) {
			if (fn.runOrder == "later") {
				setTimeout(function () {  // These timeouts allow the page to update between timings. (Especially useful with HTML modifications and listeners.)
					fn.function.apply(window, fn.arguments);
				}, 0);
			}
		});
		Standards.general.queue.list.forEach(function (fn, index) {
			if (fn.runOrder == "last") {
				setTimeout(function () {
					fn.function.apply(window, fn.arguments);
				}, 0);
			} else if (!(fn.runOrder == "first" || fn.runOrder == "later")) {
				console.warn("The item at the index of " + index + " in Standards.general.queue.list wasn't run because it doesn't have a valid runOrder.");
			}
		});
		setTimeout(function () {
			Standards.general.queue.list = [];
			/// The items in Standards.general.queue.list can't be deleted as they're run because Array.forEach() doesn't copy things like my .forEach() function does.
			/// (Only every other item would be run because an item would be skipped every time the preceding item was deleted.)
			Standards.general.finished = true;
			window.dispatchEvent(new Event("finished"));  // This can't be CustomEvent or else it won't work on any version of Internet Explorer.
		}, 0);
	}
};
Standards.general.queue.add = function (object) {
	/**
	adds an item to the queue
	non-native functions = Standards.general.queue.run()
	(Standards.general.finished also isn't native)
	*/
	Standards.general.queue.list.push(object);
	if (Standards.general.finished) {
		return Standards.general.queue.run();
	}
};

Standards.general.Sound = function (specs) {
	/**
	creates tones which can be modified in certain way
	frequency = frequency of the primary tone/wave
	volume = the current volume
		starts at 0
		can never be greater than 1
	maxVolume = the maximum volume
		defaults to 1
	waveform = waveform of primary wave
		"sine", "square", "sawtooth", or "triangle"
		defaults to "sine"
	modulation = frequency of modulating wave = how often the primary wave is modified
	hertzChange = the frequency change of the primary wave upon modulation
		the hertzChange acts in both directions
		example: 440 waveform & 220 hertzChange = 220-660 frequency
	changeWave = waveform of the modulating wave
	playing (shouldn't be changed) = whether a sound is being played
	times for all subfunctions are in milliseconds
	*/
	var sound = this;
	var osc1;
	var osc2;
	var gain1;
	var gain2;
	var playQueue = [];

	function setValues(time, shouldSetPlaying) {
		time = time === undefined ? 0 : time;
		shouldSetPlaying = shouldSetPlaying === undefined ? true : shouldSetPlaying;
		if (time > 0) {
			if (shouldSetPlaying) {
				setTimeout(function () {
					sound.playing = sound.volume == 0 ? false : true;
				}, time);
			}
			time /= 1000;  // ramps use time in seconds
			if (sound.volume == 0) {
				gain1.gain.exponentialRampToValueAtTime(.0001, Standards.general.audio.currentTime + time);  // exponential ramping doesn't work with 0s
				setTimeout(function () {
					gain1.gain.setValueAtTime(0, Standards.general.audio.currentTime);
				}, time * 1000);
			} else {
				gain1.gain.exponentialRampToValueAtTime(Math.pow(10, sound.volume) / 10, Standards.general.audio.currentTime + time);
			}
			osc1.frequency.linearRampToValueAtTime(sound.frequency, Standards.general.audio.currentTime + time);
			gain2.gain.linearRampToValueAtTime(sound.hertzChange, Standards.general.audio.currentTime + time);
			osc2.frequency.linearRampToValueAtTime(sound.modulation, Standards.general.audio.currentTime + time);;
			//// The second set of transitions are linear because I want them to be able to have values of 0?
		} else if (time == 0) {
			if (sound.volume == 0) {
				gain1.gain.setValueAtTime(0, Standards.general.audio.currentTime);
			} else {
				gain1.gain.setValueAtTime(Math.pow(10, sound.volume) / 10, Standards.general.audio.currentTime);
			}
			osc1.frequency.setValueAtTime(sound.frequency, Standards.general.audio.currentTime);
			gain2.gain.setValueAtTime(sound.hertzChange, Standards.general.audio.currentTime);
			osc2.frequency.setValueAtTime(sound.modulation, Standards.general.audio.currentTime);
			if (shouldSetPlaying) {
				sound.playing = sound.volume == 0 ? false : true;
			}
		} else if (time < 0) {
			console.error("It's impossible to travel back in time and change values.");
		} else {
			console.error("An invalid time was used.");
		}
		osc1.type = sound.waveform;
		osc2.type = sound.changeWave;
	}

	this.identifier = Standards.general.identifier++;
	this.frequency = 440;
	this.volume = 0;
	this.maxVolume = 1;
	this.waveform = "sine";
	this.modulation = 0;
	this.hertzChange = 0;
	this.changeWave = "sine";
	for (var spec in specs) {
		this[spec] = specs[spec];
	}
	this.playing = false;
	function initialize() {
		if (Standards.general.audio === undefined) {
			window.addEventListener("AudioContext created", function () {
				initialize();
				window.removeEventListener("AudioContext created", arguments.callee);
			});
		} else {
			osc1 = Standards.general.audio.createOscillator();
			osc2 = Standards.general.audio.createOscillator();
			gain1 = Standards.general.audio.createGain();
			gain2 = Standards.general.audio.createGain();
			setValues();
			gain1.connect(Standards.general.audio.destination);
			osc1.connect(gain1);
			gain2.connect(osc1.frequency);
			osc2.connect(gain2);
			osc1.start();
			osc2.start();
		}
	}
	initialize();

	function tryAgain(fn, args) {
		if (window.AudioContext) {
			Standards.general.audio = new window.AudioContext();
		} else if (window.webkitAudioContext) {
			Standards.general.audio = new window.webkitAudioContext();
		} else {
			console.error("Your browser doesn't support audio contexts.");
			return false;
		}
		window.dispatchEvent(new Event("AudioContext created"));
		fn.apply(window, args);
		return true;
	}

	this.start = function (time, volume, shouldSetPlaying) {
		/**
		starts/unmutes the tone
		*/
		return new Promise(function (resolve, reject) {
			if (Standards.general.audio === undefined) {
				if (tryAgain(sound.start, [time, volume, shouldSetPlaying])) {
					resolve();
				} else {
					console.error("No AudioContext exists.");
					reject(Error("No AudioContext exists."));
				}
			} else {
				shouldSetPlaying = shouldSetPlaying === undefined ? true : shouldSetPlaying;
				if (shouldSetPlaying) {
					sound.playing = true;
				}
				time = time === undefined ? 0 : time;
				gain1.gain.setValueAtTime(sound.volume + .0001, Standards.general.audio.currentTime);
				sound.volume = volume || sound.maxVolume;
				if (sound.volume <= 0) {
					gain1.gain.exponentialRampToValueAtTime(.0001, Standards.general.audio.currentTime + time / 1000);
					setTimeout(function () {
						gain1.gain.setValueAtTime(0, Standards.general.audio.currentTime);
						resolve();
					}, time);
				} else {
					gain1.gain.exponentialRampToValueAtTime(Math.pow(42, sound.volume) / 42, Standards.general.audio.currentTime + time / 1000);
					setTimeout(function () {
						resolve();
					}, time);
				}
			}
		});
	};
	this.stop = function (time, shouldSetPlaying) {
		/**
		stops/mutes the tone
		*/
		return new Promise(function (resolve, reject) {
			if (Standards.general.audio === undefined) {
				if (tryAgain(sound.stop, [time, shouldSetPlaying])) {
					resolve();
				} else {
					console.error("No AudioContext exists.");
					reject(Error("No AudioContext exists."));
				}
			} else {
				time = time === undefined ? 0 : time;
				shouldSetPlaying = shouldSetPlaying === undefined ? true : shouldSetPlaying;
				gain1.gain.exponentialRampToValueAtTime(.0001, Standards.general.audio.currentTime + time / 1000);
				setTimeout(function () {
					gain1.gain.setValueAtTime(0, Standards.general.audio.currentTime);
					sound.volume = 0;
					if (shouldSetPlaying) {
						sound.playing = false;
						window.dispatchEvent(new Event(sound.identifier + "StoppedPlaying"));
					}
					resolve();
				}, time);
			}
		});
	};
	this.change = function (property, value, time, shouldSetPlaying) {
		/**
		changes a property of the tone
		*/
		return new Promise(function (resolve, reject) {
			if (Standards.general.audio === undefined) {
				if (tryAgain(sound.change, [property, value, time, shouldSetPlaying])) {
					resolve();
				} else {
					console.error("No AudioContext exists.");
					reject(Error("No AudioContext exists."));
				}
			} else {
				time = time === undefined ? 0 : time;
				sound[property] = value;
				setValues(time, shouldSetPlaying);
				setTimeout(function () {
					resolve();
				}, time);
			}
		});
	};
	this.play = function (noteString, newDefaults, callback) {
		/**
		plays a song based on notes you put in a string
		modifiable defaults:
			volume = sound.maxVolume
			attack = 50
			noteLength = 200
			decay = 50
			spacing = 0
			key = "C"
		*/
		if (Standards.general.audio === undefined) {
			return new Promise(function (resolve, reject) {
				if (tryAgain(sound.play, [noteString, newDefaults, callback])) {
					resolve();
				} else {
					console.error("No AudioContext exists.");
					reject(Error("No AudioContext exists."));
				}
			});
		} else if (sound.playing) {
			playQueue.push([noteString, newDefaults, callback]);
			if (playQueue.length == 1) {
				window.addEventListener(sound.identifier + "StoppedPlaying", function () {
					sound.play(playQueue[0][0], playQueue[0][1], playQueue[0][2]);
					window.removeEventListener(sound.identifier + "StoppedPlaying", arguments.callee);
				});
			}
		} else if (arguments.length > 0) {
			return new Promise(function (resolve) {
				if (playQueue.length > 0) {
					playQueue.splice(0, 1);
				}
				if (playQueue.length > 0) {
					window.addEventListener(sound.identifier + "StoppedPlaying", function () {
						sound.play(playQueue[0][0], playQueue[0][1], playQueue[0][2]);
						window.removeEventListener(sound.identifier + "StoppedPlaying", arguments.callee);
					});
				}
				noteString = noteString.trim().replace(/([A-G]{1}(?:#|N|b)?)|[a-g]/g, function (foundNote, properNote) {
					// makes sure the string is formatted correctly even when people want to be lazy
					if (foundNote == properNote) {
						return properNote;
					} else {
						return foundNote.toUpperCase();
					}
				});
				var defaults = {
					volume: sound.maxVolume,
					attack: 50,
					noteLength: 200,
					decay: 50,
					spacing: 0,
					key: "C"
				};
				if (newDefaults != null) {
					for (var item in newDefaults) {
						if (defaults.hasOwnProperty(item)) {
							defaults[item] = newDefaults[item];
						}
					}
				}
				function format(index) {
					if (index < noteString.length) {
						let note = noteString.slice(index).match(/[A-G]{1}(?:#|N|b)?\d*/);
						// matches one letter A-G
						// maybe followed by # or N or b
						// maybe followed by any length of numbers
						/// maybe followed by the letter "s" which would have to be followed by a letter A-G
						if (note == null) {
							//// make a way for people to just put frequencies
							console.error("An attempt was made to play an invalid note.");
							return null;
						} else {
							note = note[0];
							let original = note;
							if (note.search(/#|N|b/) == -1) {  // if there's not a sharp, natural, or flat indication
								switch (defaults.key) {
									case "Ab":
										if (note[0] == "D") {
											note = note[0] + "b" + note.slice(1);
										}
									case "Eb":
										if (note[0] == "A") {
											note = note[0] + "b" + note.slice(1);
										}
									case "Bb":
										if (note[0] == "E") {
											note = note[0] + "b" + note.slice(1);
										}
									case "F":
										if (note[0] == "B") {
											note = note[0] + "b" + note.slice(1);
										}
									case "C":
										if (note.search(/#|N|b/) == -1) {
											note = note[0] + "N" + note.slice(1);
										}
										break;
									case "E":
										if (note[0] == "D") {
											note = note[0] + "#" + note.slice(1);
										}
									case "A":
										if (note[0] == "G") {
											note = note[0] + "#" + note.slice(1);
										}
									case "D":
										if (note[0] == "C") {
											note = note[0] + "#" + note.slice(1);
										}
									case "G":
										if (note[0] == "F") {
											note = note[0] + "#" + note.slice(1);
										} else if (note.search(/#|N|b/) == -1) {
											note = note[0] + "N" + note.slice(1);
										}
										break;
									default:
										console.warn(defaults.key + " is not a valid musical key");
										note = note[0] + "N" + note.slice(1);
								}
							}
							if (note.search(/\d/) == -1) {
								note = note.slice(0, 2) + "4" + note.slice(2);
							}
							return { formatted: note, original: original };
						}
					} else {
						console.error("The provided index exceeded the length of the string.");
						return undefined;
					}
				}
				function noteToFrequency(note) {
					switch (note) {
						case "CN3":
						case "B#2":
							return 130.81;
						case "C#3":
						case "Db3":
							return 138.59;
						case "DN3":
							return 146.83;
						case "Eb3":
						case "D#3":
							return 155.56;
						case "EN3":
						case "Fb3":
							return 164.81;
						case "FN3":
						case "E#3":
							return 174.61;
						case "F#3":
						case "Gb3":
							return 185.00;
						case "GN3":
							return 196.00;
						case "Ab3":
						case "G#3":
							return 207.65;
						case "AN3":
							return 220.00;
						case "Bb3":
						case "A#3":
							return 233.08;
						case "BN3":
						case "Cb4":
							return 246.94;
						case "CN4":
						case "B#3":
							return 261.63;  // This is just about as low as you can expect people to hear.
						case "C#4":
						case "Db4":
							return 277.18;
						case "DN4":
							return 293.66;
						case "Eb4":
						case "D#4":
							return 311.13;
						case "EN4":
						case "Fb4":
							return 329.63;
						case "FN4":
						case "E#4":
							return 349.23;
						case "F#4":
						case "Gb4":
							return 369.99;
						case "GN4":
							return 392.00;
						case "Ab4":
						case "G#4":
							return 415.30;
						case "AN4":
							return 440.00;
						case "Bb4":
						case "A#4":
							return 466.16;
						case "BN4":
						case "Cb5":
							return 493.88;
						case "CN5":
						case "B#4":
							return 523.25;
						case "C#5":
						case "Db5":
							return 554.37;
						case "DN5":
							return 587.33;
						case "Eb5":
						case "D#5":
							return 622.25;
						case "EN5":
						case "Fb5":
							return 659.25;
						case "FN5":
						case "E#5":
							return 698.46;
						case "F#5":
						case "Gb5":
							return 739.99;
						case "GN5":
							return 783.99;
						case "Ab5":
						case "G#5":
							return 830.61;
						case "AN5":
							return 880.00;
						case "Bb5":
						case "A#5":
							return 932.33;
						case "BN5":
						case "Cb6":
							return 987.77;
						case "CN6":
						case "B#5":
							return 1046.50;
						case "C#6":
						case "Db6":
							return 1108.73;
						case "DN6":
							return 1174.66;
						case "Eb6":
						case "D#6":
							return 1244.51;
						case "EN6":
						case "Fb6":
							return 1318.51;
						case "FN6":
						case "E#6":
							return 1396.91;
						case "F#6":
						case "Gb6":
							return 1479.98;
						case "GN6":
							return 1567.98;
						case "Ab6":
						case "G#6":
							return 1661.22;
						case "AN6":
							return 1760.00;
						case "Bb6":
						case "A#6":
							return 1864.66;
						case "BN6":
						case "Cb7":
							return 1975.53;
						case "CN7":
						case "B#6":
							return 2093.00;
						default:
							console.warn("The note " + note + " wasn't recognized and couldn't be assigned a frequency.");
					}
				}
				function interpret(index) {
					index = index === undefined ? 0 : index;
					if (index < noteString.length) {
						note = format(index);
						if (note == undefined) {
							// This should never happen.
						} else if (note == null) {
							interpret(index + 1);
						} else {
							sound.change("frequency", noteToFrequency(note.formatted), 0, false);
							sound.start(defaults.attack, defaults.volume, false);
							if (noteString[index + note.original.length]) {  // if there's anything after this note
								let originalLength = note.original.length,
									afterNote = "",
									duration = defaults.noteLength,
									slur = 0,
									rest = defaults.spacing;
								if (noteString[index + originalLength] == "-" || noteString[index + originalLength] == " " || noteString[index + originalLength] == "s") {
									afterNote = noteString.slice(index + originalLength).match(/-*(?:s*| *)?/)[0];
									if (afterNote.search(/-/) > -1) {  // if there's any hyphens following the note
										duration *= afterNote.match(/-/g).length + 1;
									}
									if (afterNote.search(/s/) > -1) {  // if there's any "s"s following the note
										slur = afterNote.match(/s/g).length * (defaults.attack + defaults.noteLength + defaults.decay);
									}
									if (afterNote.search(/ /) > -1) {  // if there's any spaces following the note
										rest += defaults.attack + defaults.noteLength + defaults.decay;
										rest *= afterNote.match(/ /g).length;
									}
								}
								setTimeout(function () {
									if (slur == 0) {
										sound.stop(defaults.decay, false);
										setTimeout(function () {
											interpret(index + originalLength + afterNote.length);
										}, defaults.decay + rest);
									} else {
										sound.change("frequency", noteToFrequency(format(index + originalLength + afterNote.length).formatted), defaults.decay + slur, false);
										setTimeout(function () {
											interpret(index + originalLength + afterNote.length);
										}, defaults.decay + slur);
									}
								}, defaults.attack + duration);
							} else {
								setTimeout(function () {
									sound.stop(defaults.decay, false);
									setTimeout(function () {  // makes sure the finishing block of code is called
										interpret(index + note.original.length);
									}, defaults.decay);
								}, defaults.attack + defaults.noteLength);
							}
						}
					} else {  // called when the song is finished
						sound.playing = false;
						window.dispatchEvent(new Event(sound.identifier + "StoppedPlaying"));
						if (callback) {
							callback();
						}
						resolve();
					}
				}
				sound.playing = true;
				interpret();
			});
		} else {  // when you inevitably use Sound.play() instead of Sound.start() like you should have
			sound.start();
			console.warn("Sound.play() was called without any parameters.\nSound.start() was used instead.");
		}
	};
	this.destroy = function (time) {  // gets rid of the tone (can't be used again)
		return new Promise(function (resolve, reject) {
			if (Standards.general.audio === undefined) {
				if (tryAgain(sound.destroy, [time])) {
					resolve();
				} else {
					console.error("No AudioContext exists.");
					reject(Error("No AudioContext exists."));
				}
			} else {
				time = time === undefined ? 0 : time;
				gain1.gain.exponentialRampToValueAtTime(.0001, Standards.general.audio.currentTime + time / 1000);
				setTimeout(function () {
					sound.playing = false;
					osc1.stop();
					osc2.stop();
					osc2.disconnect(gain2);
					gain2.disconnect(osc1.frequency);
					osc1.disconnect(gain1);
					gain1.disconnect(Standards.general.audio.destination);
					resolve();
				}, time);
			}
		});
	};
};

Standards.general.Speaker = function (specs) {
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
				resolve();
			} else {
				setTimeout(function () {
					talker.cancel();
					resolve();
				}, time);
			}
		});
	};
};

Standards.general.Listenable = function () {
	/**
	creates an object which has a "value" property which can be listened to
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


if (!Array.prototype.includes) {
	Array.prototype.includes = function (searchItem, index) {
		/**
		creates the Array.includes() function if it doesn't already exist
		usage of this doesn't count as non-native function
		because it is native in modern browsers
		and this works the exact same way
		(with the exception of helpful warnings)
		non-native functions = none
		*/
		index = index || 0;
		if (index < this.length) {
			if (index < 0) {
				if (this.length + index < 0) {
					console.warn("Index precedes start of array");
					index = 0;
				} else {
					index = this.length + index;
				}
			}
		} else {
			console.warn("Array length exceeded");
			return false;
		}
		if (this.slice(index).indexOf(searchItem) > -1) {
			return true;
		} else {
			return false;
		}
	};
};

if (!String.prototype.includes) {
	String.prototype.includes = function (searchItem, index) {
		/**
		creates the String.includes() function if it doesn't already exist
		usage of this doesn't count as non-native function
		because it is native in modern browsers
		and this works the exact same way
		(with the exception of helpful warnings)
		non-native functions = none
		*/
		index = index || 0;
		if (index < this.length) {
			if (index < 0) {
				if (this.length + index < 0) {
					console.warn("Index precedes start of string");
					index = 0;
				} else {
					index = this.length + index;
				}
			}
		} else {
			console.warn("String length exceeded");
			return false;
		}
		if (this.slice(index).indexOf(searchItem) > -1) {
			return true;
		} else {
			return false;
		}
	};
};

if (!Array.prototype.every) {
	Array.prototype.every = function (callbackfn, thisArg) {
		'use strict';
		/**
		creates Array.every if it doesn't already exist
		This has been copied from MDN.
		usage of this doesn't count as non-native function
		because it is native in modern browsers
		and this works the exact same way
		non-native functions = none
		*/

		var T, k;

		if (this == null) {
			throw new TypeError('this is null or not defined');
		}

		//  1. Let O be the result of calling ToObject passing the this 
		//     value as the argument.
		var O = Object(this);

		//  2. Let lenValue be the result of calling the Get internal method
		//     of O with the argument "length".
		//  3. Let len be ToUint32(lenValue).
		var len = O.length >>> 0;

		//  4. If IsCallable(callbackfn) is false, throw a TypeError exception.
		if (typeof callbackfn !== 'function') {
			throw new TypeError();
		}

		//  5. If thisArg was supplied, let T be thisArg; else let T be undefined.
		if (arguments.length > 1) {
			T = thisArg;
		}

		//  6. Let k be 0.
		k = 0;

		//  7. Repeat, while k < len
		while (k < len) {

			var kValue;

			//  a. Let Pk be ToString(k).
			//    This is implicit for LHS operands of the in operator
			//  b. Let kPresent be the result of calling the HasProperty internal 
			//     method of O with argument Pk.
			//     This step can be combined with c
			//  c. If kPresent is true, then
			if (k in O) {

				//  i. Let kValue be the result of calling the Get internal method
				//     of O with argument Pk.
				kValue = O[k];

				//  ii. Let testResult be the result of calling the Call internal method
				//      of callbackfn with T as the this value and argument list 
				//      containing kValue, k, and O.
				var testResult = callbackfn.call(T, kValue, k, O);

				//  iii. If ToBoolean(testResult) is false, return false.
				if (!testResult) {
					return false;
				}
			}
			k++;
		}
		return true;
	};
}

/*
String.prototype.forEach = function (doStuff) {
	/**
	.forEach() for strings
	iterates through each character
	doStuff can return a value of "break" to break out of the loop
	non-native functions = none
	*
	var string = "";
	for (var index=0; index<this.length; index++) {  // I'm not sure this is necessary (as opposed to string = this)
		string += this[index];
	}
	for (index=0; index<string.length; index++) {
		var returnValue = doStuff(string[index], index, string) || "";
		if (typeof returnValue == "string" && returnValue.toLowerCase() == "break") {
			break;
		}
	}
};
*/

String.prototype.format = function () {
	/**
	inserts specified items at a location indicated by an index number within curly braces
	takes an indefinite number of arguments
	example:
		"{0}'m super {2}. {0}'ve always been this {1}.".format("I", "cool", "awesome");
		"I'm super awesome. I've always been this cool."
	non-native functions = none
	*/
	var args = arguments;  // If "arguments" was used in place of "args", if would return the values of the inner function arguments.
	return this.replace(/{(\d+)}/g, function (match, number) {  // These function variables represent the match found and the number inside.
		return (typeof args[number] != "undefined") ? args[number] : match;  // only replaces things if there's something to replace it with
	});
};

String.prototype.splice = function (start, length, replacement) {
	/**
	acts like Array.splice() except that
	the value is returned instead of implemented
	because JavaScript is dumb and won't let me do that
	non-native functions = none
	*/
	replacement = replacement === undefined ? "" : replacement;
	return this.slice(0, start) + replacement + this.slice(start + length);
};

String.prototype.keepOnly = function (searchValue, replacement) {
	/**
	keeps only the parts of the string satisfying the search value
	the search value needs to be a regular expression with the global flag set
	a replacement value can be provided for replacement instead of deletion
	//// This doesn't yet work without the global flag set.
	non-native functions = getType
	*/
	if (searchValue === undefined) {
		console.warn("No value was provided to be kept.");
		return "";
	} else if (Standards.general.getType(searchValue) == "String") {
		searchValue = new RegExp(searchValue);
	} else if (Standards.general.getType(searchValue) == "RegExp") {
		searchValue = searchValue.toString();
		let flagIndex = searchValue.search(/\/[gimuy]+(?!\/)/);
		if (flagIndex > -1) {
			searchValue = new RegExp("(" + searchValue.slice(1, flagIndex) + ")|.", searchValue.slice(flagIndex + 1));
		} else {
			searchValue = new RegExp("(" + searchValue.slice(1, -1) + ")|.");
		}
	} else {
		console.error("Invalid searchValue type");
		return undefined;
	}
	replacement = replacement === undefined ? "" : replacement;
	return this.replace(searchValue, function (match, validMatch) {
		return validMatch === undefined ? replacement : validMatch;
	});
};

Array.prototype.move = function (currentIndex, newIndex) {
	/**
	moves an item from one index to another
	if no new index is specified, the item is placed at the end of the array
	non-native functions = none
	*/
	newIndex = newIndex === undefined ? this.length : newIndex;
	this.splice(newIndex, 0, this.splice(currentIndex, 1)[0]);
	return this;
};

Array.prototype.remove = function (item, where) {
	/**
	removes an item from an array
	arguments:
		item = required; the item to remove
		where = optional; where / how many items to remove
			can be a string indication or a boolean of whether all should be deleted
			possibilities:
				"all" = delete all instances
				"first" = delete the first instance
				"last" = delete the last instance
				true = delete all instances
				false = delete the first instance
			default: "all"
	non-native functions: none
	*/
	where = where === undefined ? "all" : where;
	if (where == "all" || where === true) {
		while (this.includes(item)) {
			this.splice(this.indexOf(item), 1);
		}
	} else if (where == "first" || where === false) {
		this.splice(this.indexOf(item), 1);
	} else if (where == "last") {
		this.splice(this.lastIndexOf(item), 1);
	} else {
		console.error("The provided location of removal isn't valid.");
	}
};

Standards.general.onLoad = function (doStuff) {
	/**
	does whatever the argument of the function says after the page loads and this script finishes running
	non-native functions = none
	*/
	return window.addEventListener("finished", doStuff);  // There's no () after doStuff because it would run right away (not when the page loads).
};

Standards.general.getId = function (item, ID) {
	/**
	gets an element by ID
	if the ID is preceeded by an HTMLElement,
	the search can be done even if the element isn't in the document
	non-native functions = getType
	*/
	if (Standards.general.getType(item) == "String") {  // for regular searching
		return document.getElementById(item);
	} else if (Standards.general.getType(item) == "HTMLElement") {  // for searching in an element that isn't in the document
		return item.querySelector("#" + ID);
	} else {
		throw "An improper agument was given.";
	}
};

Standards.general.getTag = function (tag) {
	/**
	gets all of the elements made by a certain tag
	non-native functions = none
	*/
	return document.getElementsByTagName(tag);
};

Standards.general.getClass = function (name) {
	/**
	gets elements with a certain class
	non-native functions = none
	*/
	return document.getElementsByClassName(name);
};

Standards.general.getName = function (name, specific) {
	/**
	gets the elements with a certain name
	If "specific" is present and set to true, the result will be specific.
	The way the function is specific depends on what type of elements are obtained.
		inputs:
			radio buttons return the value of the selected button
			checkboxes return a list of the checked boxes
	non-native functions = none
	*/
	let elements = document.getElementsByName(name);
	if (specific) {
		if (elements[0].nodeName == "INPUT") {
			if (elements[0].type == "radio") {
				for (let index = 0; index < elements.length; index++) {
					if (elements[index].checked) {
						return elements[index];
					}
				}
				return null;
			} else if (elements[0].type == "checkbox") {
				let list = [];
				for (let index = 0; index < elements.length; index++) {
					if (elements[index].checked) {
						list.push(elements[index]);
					}
				}
				return list;
			}
		}
		console.warn("The items retrieved with the name " + name + " don't use the \"specific\" argument.");
	}
	return elements;
};

Standards.general.getType = function (item) {
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

Standards.general.insertBefore = function (insertion, place) {
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
};

Standards.general.insertAfter = function (insertion, place) {
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
};

Standards.general.removeSelf = function (item) {
	/**
	removes the given item
	(most relavent for HTML elements)
	non-native functions = getType
	*/
	switch (Standards.general.getType(item)) {
		case "HTMLElement":
			item.parentNode.removeChild(item);
			break;
		default:
			console.error("This type of removal isn't supported.");
	}
};

Standards.general.getEnd = function (iterable, index) {
	/**
	gets the end of an iterable item
	arguments:
		iterable = required; the iterable item
		index = optional; which item at the end you want
			positive numbers start counting from the end at 0
			negative numbers start counting from the end at -1
			(0 == -1)
			default: -1
	non-native functions: getType
	*/
	if (Standards.general.getType(iterable[Symbol.iterator]) == "Function") {
		index = index || -1;
		if (index >= 0) {
			return iterable[iterable.length - 1 - index];
		} else {
			return iterable[iterable.length + index];
		}
	} else {
		throw "The provided item isn't iterable.";
	}
};
Standards.general.getLast = Standards.general.getEnd;

Standards.general.itemAt = function (iterable, index) {
	/**
	gets the item at a given index (or key)
	supports negative indices
	arguments:
		iterable = required; the iterable item
		index = required; which item at the end you want
			positive numbers start counting from the beginning at 0
			negative numbers start counting from the end at -1
	non-native functions: getType
	*/
	if (iterable === undefined) {
		throw new Error("No item was provided.");
	} else if (Standards.general.getType(iterable) == "Object" && Standards.general.getType(index) == "String") {
		return iterable[index];
	} else if (Standards.general.getType(iterable[Symbol.iterator]) == "Function") {
		index = index || -1;
		if (index >= 0) {
			return iterable[index];
		} else {
			return iterable[iterable.length + index];
		}
	} else {
		throw new TypeError("The provided item isn't iterable.");
	}
};

Standards.general.toArray = function () {
	/**
	returns an array made from any number of elements with an index and length
	non-native functions = none
	*/
	var index1 = 0,
		index2,
		returnList = [];
	for (index1; index1 < arguments.length; index1++) {
		if (arguments[index1] === undefined || arguments[index1] === null || arguments[index1] === []) {
			// skip the item
		} else if (typeof arguments[index1][Symbol.iterator] == "function") {
			for (index2 = 0; index2 < arguments[index1].length; index2++) {
				returnList.push(arguments[index1][index2]);
			}
		} else {
			returnList.push(arguments[index1]);
		}
	}
	return returnList;
};

Standards.general.toObject = function () {
	/**

	*/

};

Standards.general.forEach = function (list, doStuff, shouldCopy) {
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

Standards.general.compare = function (iterable1, iterable2) {
	/**
	determines how alike two iterable items are
	returns the number of changes needed to make the items the same (the Levenshtein distance)
	higher number = less alike
	non-native functions = getType
	*/
	if (Standards.general.getType(iterable1[Symbol.iterator]) == "Function" && Standards.general.getType(iterable2[Symbol.iterator]) == "Function") {
		// establishes a 2 dimensional matrix
		let matrix = [[0]];
		for (let index = 1; index <= iterable1.length; index++) {
			matrix.push([index]);
		}
		for (let index = 1; index <= iterable2.length; index++) {
			matrix[0][index] = index;
		}
		// goes through (and fills) every item in the matrix
		let sc;  // substitution cost
		for (let y = 1; y <= iterable2.length; y++) {
			for (let x = 1; x <= iterable1.length; x++) {
				if (iterable1[x - 1] == iterable2[y - 1]) {  // if the iterables are the same at the current indices
					sc = 0;
				} else {
					sc = 1;
				}
				// fills the current item with the number of changes needed in the most efficient method of modification
				matrix[x][y] = Math.min(
					matrix[x - 1][y] + 1,      // if a deletion is used
					matrix[x][y - 1] + 1,      // if an insertion is used
					matrix[x - 1][y - 1] + sc  // if a substitution is used
				);
			}
		}
		// returns the last item of the matrix
		return matrix[iterable1.length][iterable2.length];
	} else {
		console.error("At least one of the items to be compared isn't iterable.");
	}
};

Standards.general.listen = function (item, event, behavior, options) {
	/**
	adds an event listener to the item
	waiting for an element to load is unnecessary if the item is a string (of an ID)
	arguments:
		item = required*; what will be listening
			* not required if listening to a key press
			when an element or an ID which can be converted into an element:
				the element to put the listener onto
				the triggering event is passed to the function
				when listening for keypresses, keys pressed can be accessed with event.keys
			when an array:
				a list of items for which the same listener should be applied
			vv deprecated; only applies to "Enter" and ["Enter"] now
			when an array or special string value:
				the key or array of keys of interest
				keys are designated by the "key" property of a KeyboardEvent object
				puts the event listener on the document object
					elements in use can be found with document.activeElement
				special values:
					"letter" = all capital and lowercase letters
					"number" = a key that produces a number
					"character" = any key that produces a character (includes whitespace characters)
					"any" = when any key is pressed
				**IMPORTANT**: IDs corresponding to any of the special values will be processed this way instead of the HTMLElement way
			^^ deprecated
		event = required; the event(s) being listened for
			if a string, the event to be used in the listener
			if an array, a list of events to listen for with everything else the same
		behavior = required; what to do when the event is triggered
			if the event is "hover", behavior needs to be an array with two functions, the first for hovering and the second for not hovering
		options = optional; various specifications for the listener
			can instead be whether the event listener should only be triggered once
			possibilities:
				runOrder = when the listener is run in the queue
					default: "later"
				listenOnce = whether the listener should be removed after being called
					default: false
					the events "keyhold", "mousehold", and "touchhold" can't be listened for once or have the listeners removed  ////////////////////
				allowDefault = whether the default action of the key press should be allowed
					default: true
				recheckTime = the number of milliseconds before status is checked again
					specifying recheckTime but not triggerTime causes triggerTime to be equal to recheckTime
					default: 15
				triggerTime = the number of milliseconds before the behavior is called once
					if the trigger time is less than or equal to the recheckTime, the behavior will be executed at every recheckTime
					default: 300
			default = { listenOnce: false, allowDefault: true, recheckTime: 15, triggerTime: 300 }
	non-native functions = getType(), forEach(), Standards.general.queue.add()
	*/
	if (item == "Enter") {  //// legacy compatibility
		item == ["Enter"];
	}
	if (Standards.general.getType(item) == "Array" && item != ["Enter"]) {
		Standards.general.forEach(item, function (i) {
			Standards.general.listen(i, event, behavior, options);
		});
		return;
	}
	if (Standards.general.getType(event) == "Array") {
		Standards.general.forEach(event, function (e) {
			Standards.general.listen(item, e, behavior, options);
		});
		return;
	}

	switch (Standards.general.getType(options)) {
		case "Boolean":
			options = { listenOnce: options, allowDefault: true, recheckTime: 15 };
			break;
		case "Object":
			if (!options.hasOwnProperty("runOrder") || Standards.general.getType(options.runOrder) != "String") {
				options.runOrder = "later";
			}
			if (!options.hasOwnProperty("listenOnce") || Standards.general.getType(options.listenOnce) != "Boolean") {
				options.listenOnce = false;
			}
			if (!options.hasOwnProperty("allowDefault") || Standards.general.getType(options.allowDefault) != "Boolean") {
				options.allowDefault = true;
			}
			if (options.hasOwnProperty("recheckTime") && !options.hasOwnProperty("triggerTime")) {
				if (Standards.general.getType(options.recheckTime) == "Number" && options.recheckTime != Infinity) {
					options.triggerTime = options.recheckTime;
				} else {
					console.warn(options.recheckTime + " isn't a proper recheckTime.");
				}
			}
			if (!options.hasOwnProperty("recheckTime") || Standards.general.getType(options.recheckTime) != "Number" || options.recheckTime == Infinity) {
				options.recheckTime = 15;
			}
			if (!options.hasOwnProperty("triggerTime") || Standards.general.getType(options.triggerTime) != "Number" || options.triggerTime == Infinity) {
				options.triggerTime = 300;
			}
			if (options.triggerTime < options.recheckTime) {
				options.triggerTime = options.recheckTime;
			}
			break;
		default:
			options = { runOrder: "later", listenOnce: false, allowDefault: true, recheckTime: 15, triggerTime: 300 };
	}

	if (event === "load") {
		// makes sure the listener is made before everything has finished loading
		if (Standards.general.getType(behavior) == "Function") {
			if (options.listenOnce) {
				if (options.allowDefault) {
					item.addEventListener(event, function (action) {
						behavior.call(this, action);
						item.removeEventListener(event, arguments.callee);
					});
				} else {
					item.addEventListener(event, function (action) {
						action.preventDefault();
						behavior.call(this, action);
						item.removeEventListener(event, arguments.callee);
					});
				}
			} else {
				if (options.allowDefault) {
					item.addEventListener(event, behavior);
				} else {
					item.addEventListener(event, function (action) {
						action.preventDefault();
						behavior.call(this, action);
					});
				}
			}
		} else {
			console.error("The listener must have a function as its third argument.");
		}
	}

	Standards.general.queue.add({
		runOrder: options.runOrder,
		function: function (item, event, behavior, options) {
			if (Standards.general.getType(event) == "String") {
				//// event = event.toLowerCase();  //// this is a terrible idea
			} else {
				console.error(new TypeError(event + " is not a proper event."));
			}
			if (!event.includes("key")) {
				switch (Standards.general.getType(item)) {
					case "String":
						if (document.getElementById(item) === null) {  // if the ID wasn't found
							console.error(new ReferenceError('The ID "' + item + '" wasn\'t found in the document.'));
						} else {
							item = document.getElementById(item);
						}
						break;
					case "Function":
						item = item();
						break;
					case "Window":
					case "HTMLDocument":
					case "HTMLElement":
						// do nothing
						break;
					default:
						if (!event.includes("key")) {
							console.error(new TypeError("The item to listen to (" + item + ") is of an improper type (" + Standards.general.getType(item) + ")."));
						}
				}
			}
			switch (event) {
				case "hover":
					if (Standards.general.getType(behavior) == "Array") {
						if (Standards.general.getType(behavior[0]) == "String" || Standards.general.getType(behavior[1]) == "String") {
							console.error('The value of "function" must not be a string.');
						}
						item.addEventListener("mouseenter", behavior[0]);
						item.addEventListener("mouseleave", behavior[1]);
					} else {
						console.error('Trying to listen for the event "hover" without a second function isn\'t supported yet.');
					}
					break;
				case "keydown":
				case "keyhold":
				case "keyup":
					if (item == "letter") {
						item = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcbdefghijklmnopqrstuvwxyz".split();
					} else if (item == "number") {
						item = "0123456789".split();
					} else if (item == "character") {
						item = "~!@#$%^&*()_+QWERTYUIOP{}|ASDFGHJKL:\"ZXCVBNM<>?`1234567890-=qwertyuiop[]\\asdfghjkl;'zxcvbnm,./ ".split();
						item.push("Enter");
						item.push("Tab");
					} else if (Standards.general.getType(item) == "String") {
						if (document.getElementById(item)) {
							item = document.getElementById(item);
						} else {
							console.error('There\'s no element with the ID "' + item + '"');
							break;
						}
					}
					if (Standards.general.getType(item) == "HTMLElement") {
						if (event == "keyhold") {
							let activeKeys = [];
							if (options.allowDefault) {
								if (options.recheckTime == options.triggerTime) {
									item.addEventListener("keydown", function (action) {
										if (item.includes(action.key) && !activeKeys.includes(action.key)) {
											activeKeys.push(action.key);
											if (activeKeys.length == 1) {
												recurrenceLoop = setInterval(function () {
													behavior(activeKeys);
												}, options.recheckTime);
											}
										}
									});
									item.addEventListener("keyup", function (action) {
										if (item.includes(action.key)) {
											activeKeys.splice(activeKeys.indexOf(action.key), 1);
											if (activeKeys.length == 0) {
												clearInterval(recurrenceLoop);
											}
										}
									});
								} else {
									console.error("Setting a keyhold trigger time isn't supported yet.");  ////
								}
							} else {
								if (options.recheckTime == options.triggerTime) {
									item.addEventListener("keydown", function (action) {
										if (item.includes(action.key)) {
											action.preventDefault();
											if (!activeKeys.includes(action.key)) {
												activeKeys.push(action.key);
												if (activeKeys.length == 1) {
													recurrenceLoop = setInterval(function () {
														behavior(activeKeys);
													}, options.recheckTime);
												}
											}
										}
									});
									item.addEventListener("keyup", function (action) {
										if (item.includes(action.key)) {
											action.preventDefault();
											activeKeys.splice(activeKeys.indexOf(action.key), 1);
											if (activeKeys.length == 0) {
												clearInterval(recurrenceLoop);
											}
										}
									});
								} else {
									console.error("Setting a keyhold trigger time isn't supported yet.");  ////
								}
							}
						} else {
							if (options.listenOnce) {
								if (options.allowDefault) {
									item.addEventListener(event, function (action) {
										behavior.call(this, action);
										item.removeEventListener(event, arguments.callee);
									});
								} else {
									item.addEventListener(event, function (action) {
										action.preventDefault();
										behavior.call(this, action);
										item.removeEventListener(event, arguments.callee);
									});
								}
							} else {
								if (options.allowDefault) {
									item.addEventListener(event, behavior);
								} else {
									item.addEventListener(event, function (action) {
										action.preventDefault();
										behavior.call(this, action);
									});
								}
							}
						}
					} else if (event == "keydown") {
						if (Standards.general.getType(item) == "Array") {
							if (options.allowDefault) {
								document.addEventListener("keydown", function (event) {
									if (item.includes(event.key)) {
										behavior(event);
									}
								});
							} else {
								document.addEventListener("keydown", function (action) {
									if (item.includes(action.key)) {
										action.preventDefault();
										behavior(action);
									}
								});
							}
						} else if (Standards.general.getType(item) == "String") {
							if (item == "any") {
								if (options.allowDefault) {
									document.addEventListener("keydown", behavior);
								} else {
									document.addEventListener("keydown", function (action) {
										action.preventDefault();
										behavior(action);
									});
								}
							} else {
								if (options.allowDefault) {
									document.addEventListener("keydown", function (action) {
										if (action.key == item) {
											behavior(action);
										}
									});
								} else {
									document.addEventListener("keydown", function (action) {
										if (action.key == item) {
											action.preventDefault();
											behavior(action);
										}
									});
								}
							}
						} else {
							console.error("The key type " + Standards.general.getType(item) + " isn't valid.");
						}
					} else if (event == "keyhold") {
						let recurrenceLoop;
						if (item == "any") {
							let activeKeys = [];
							if (options.allowDefault) {
								if (options.recheckTime == options.triggerTime) {
									document.addEventListener("keydown", function (action) {
										if (!activeKeys.includes(action.key)) {
											activeKeys.push(action.key);
											if (activeKeys.length == 1) {
												recurrenceLoop = setInterval(function () {
													behavior(activeKeys);
												}, options.recheckTime);
											}
										}
									});
									document.addEventListener("keyup", function (action) {
										activeKeys.splice(activeKeys.indexOf(action.key), 1);
										if (activeKeys.length == 0) {
											clearInterval(recurrenceLoop);
										}
									});
								} else {
									console.error("Setting a keyhold trigger time isn't supported yet.");  ////
								}
							} else {
								if (options.recheckTime == options.triggerTime) {
									document.addEventListener("keydown", function (action) {
										action.preventDefault();
										if (!activeKeys.includes(action.key)) {
											activeKeys.push(action.key);
											if (activeKeys.length == 1) {
												recurrenceLoop = setInterval(function () {
													behavior(activeKeys);
												}, options.recheckTime);
											}
										}
									});
									document.addEventListener("keyup", function (action) {
										action.preventDefault();
										activeKeys.splice(activeKeys.indexOf(action.key), 1);
										if (activeKeys.length == 0) {
											clearInterval(recurrenceLoop);
										}
									});
								} else {
									console.error("Setting a keyhold trigger time isn't supported yet.");  ////
								}
							}
						} else if (Standards.general.getType(item) == "Array") {
							let activeKeys = [];
							if (options.allowDefault) {
								if (options.recheckTime == options.triggerTime) {
									document.addEventListener("keydown", function (action) {
										if (item.includes(action.key) && !activeKeys.includes(action.key)) {
											activeKeys.push(action.key);
											if (activeKeys.length == 1) {
												recurrenceLoop = setInterval(function () {
													behavior(activeKeys);
												}, options.recheckTime);
											}
										}
									});
									document.addEventListener("keyup", function (action) {
										if (item.includes(action.key)) {
											activeKeys.splice(activeKeys.indexOf(action.key), 1);
											if (activeKeys.length == 0) {
												clearInterval(recurrenceLoop);
											}
										}
									});
								} else {
									console.error("Setting a keyhold trigger time isn't supported yet.");  ////
								}
							} else {
								if (options.recheckTime == options.triggerTime) {
									document.addEventListener("keydown", function (action) {
										if (item.includes(action.key)) {
											action.preventDefault();
											if (!activeKeys.includes(action.key)) {
												activeKeys.push(action.key);
												if (activeKeys.length == 1) {
													recurrenceLoop = setInterval(function () {
														behavior(activeKeys);
													}, options.recheckTime);
												}
											}
										}
									});
									document.addEventListener("keyup", function (action) {
										if (item.includes(action.key)) {
											action.preventDefault();
											activeKeys.splice(activeKeys.indexOf(action.key), 1);
											if (activeKeys.length == 0) {
												clearInterval(recurrenceLoop);
											}
										}
									});
								} else {
									console.error("Setting a keyhold trigger time isn't supported yet.");  ////
								}
							}
						} else if (Standards.general.getType(item) == "String") {  //// This is no longer supported.
							let keyActive = false;
							if (options.allowDefault) {
								if (options.recheckTime == options.triggerTime) {
									document.addEventListener("keydown", function (action) {
										if (action.key == item && !keyActive) {
											keyActive = true;
											recurrenceLoop = setInterval(behavior, options.recheckTime);
										}
									});
									document.addEventListener("keyup", function (action) {
										if (action.key == item) {
											keyActive = false;
											clearInterval(recurrenceLoop);
										}
									});
								} else {
									console.error("Setting a keyhold trigger time isn't supported yet.");  ////
								}
							} else {
								if (options.recheckTime == options.triggerTime) {
									document.addEventListener("keydown", function (action) {
										if (action.key == item) {
											action.preventDefault();
											if (!keyActive) {
												keyActive = true;
												recurrenceLoop = setInterval(behavior, options.recheckTime);
											}
										}
									});
									document.addEventListener("keyup", function (action) {
										if (action.key == item) {
											action.preventDefault();
											keyActive = false;
											clearInterval(recurrenceLoop);
										}
									});
								} else {
									console.error("Setting a keyhold trigger time isn't supported yet.");  ////
								}
							}
						} else {
							console.error("The key type " + Standards.general.getType(item) + " isn't valid.");
						}
					} else {  // keyup
						if (Standards.general.getType(item) == "Array") {
							if (options.allowDefault) {
								document.addEventListener("keyup", function (action) {
									if (item.includes(action.key)) {
										behavior(action);
									}
								});
							} else {
								document.addEventListener("keyup", function (action) {
									if (item.includes(action.key)) {
										action.preventDefault();
										behavior(action);
									}
								});
							}
						} else if (Standards.general.getType(item) == "String") {
							if (item == "any") {
								if (options.allowDefault) {
									document.addEventListener("keyup", behavior);
								} else {
									document.addEventListener("keyup", function (action) {
										action.preventDefault();
										behavior(action);
									});
								}
							} else {
								if (options.allowDefault) {
									document.addEventListener("keyup", function (action) {
										if (action.key == item) {
											behavior(action);
										}
									});
								} else {
									document.addEventListener("keyup", function (action) {
										if (action.key == item) {
											action.preventDefault();
											behavior(action);
										}
									});
								}
							}
						} else {
							console.error("The key type " + Standards.general.getType(item) + " isn't valid.");
						}
					}
					break;
				case "mousehold":
					if (options.allowDefault) {
						let recurrenceLoop,
							mouseDown = false;
						if (options.triggerTime == options.recheckTime) {
							item.addEventListener("mousedown", function () {
								if (!mouseDown) {
									recurrenceLoop = setInterval(behavior, options.recheckTime);
								}
							});
							item.addEventListener("mouseup", function () {
								clearInterval(recurrenceLoop);
							});
						} else {
							let runTimes = 0;
							item.addEventListener("mousedown", function () {
								if (!mouseDown) {
									recurrenceLoop = setInterval(function () {
										if (++runTimes == Math.round(options.triggerTime / options.recheckTime)) {
											behavior();
										}
									}, options.recheckTime);
								}
							});
							item.addEventListener("mouseup", function () {
								clearInterval(recurrenceLoop);
								runTimes = 0;
							});
						}
					} else {
						let recurrenceLoop,
							mouseDown = false;
						if (options.triggerTime == options.recheckTime) {
							item.addEventListener("mousedown", function (action) {
								action.preventDefault();
								if (!mouseDown) {
									recurrenceLoop = setInterval(behavior, options.recheckTime);
								}
							});
							item.addEventListener("mouseup", function (action) {
								action.preventDefault();
								clearInterval(recurrenceLoop);
							});
						} else {
							let runTimes = 0;
							item.addEventListener("mousedown", function (action) {
								action.preventDefault();
								if (!mouseDown) {
									recurrenceLoop = setInterval(function () {
										if (++runTimes == Math.round(options.triggerTime / options.recheckTime)) {
											behavior();
										}
									}, options.recheckTime);
								}
							});
							item.addEventListener("mouseup", function (action) {
								action.preventDefault();
								clearInterval(recurrenceLoop);
								runTimes = 0;
							});
						}
					}
					break;
				case "touchhold":
					if (options.allowDefault) {
						let recurrenceLoop,
							mouseDown = false,
							movement = false;
						if (options.triggerTime == options.recheckTime) {
							item.addEventListener("touchstart", function () {
								if (!mouseDown) {
									recurrenceLoop = setInterval(behavior, options.recheckTime);
								}
							});
							item.addEventListener("touchmove", function () {
								clearInterval(recurrenceLoop);
								movement = true;
							});
							item.addEventListener("touchend", function () {
								if (!movement) {
									clearInterval(recurrenceLoop);
								} else {
									movement = false;
								}
							});
						} else {
							let runTimes = 0;
							item.addEventListener("touchstart", function () {
								if (!mouseDown) {
									recurrenceLoop = setInterval(function () {
										if (++runTimes == Math.round(options.triggerTime / options.recheckTime)) {
											behavior();
										}
									}, options.recheckTime);
								}
							});
							item.addEventListener("touchmove", function () {
								clearInterval(recurrenceLoop);
								runTimes = 0;
								movement = true;
							});
							item.addEventListener("touchend", function () {
								if (!movement) {
									clearInterval(recurrenceLoop);
									runTimes = 0;
								} else {
									movement = false;
								}
							});
						}
					} else {
						let recurrenceLoop,
							mouseDown = false,
							movement = false;
						if (options.triggerTime == options.recheckTime) {
							item.addEventListener("touchstart", function (action) {
								action.preventDefault();
								if (!mouseDown) {
									recurrenceLoop = setInterval(behavior, options.recheckTime);
								}
							});
							item.addEventListener("touchmove", function (action) {
								action.preventDefault();
								clearInterval(recurrenceLoop);
								movement = true;
							});
							item.addEventListener("touchend", function (action) {
								action.preventDefault();  // This prevents things like pressing buttons.
								if (!movement) {
									clearInterval(recurrenceLoop);
								} else {
									movement = false;
								}
							});
						} else {
							let runTimes = 0;
							item.addEventListener("touchstart", function (action) {
								action.preventDefault();
								if (!mouseDown) {
									recurrenceLoop = setInterval(function () {
										if (++runTimes == Math.round(options.triggerTime / options.recheckTime)) {
											behavior();
										}
									}, options.recheckTime);
								}
							});
							item.addEventListener("touchmove", function (action) {
								action.preventDefault();
								clearInterval(recurrenceLoop);
								runTimes = 0;
								movement = true;
							});
							item.addEventListener("touchend", function (action) {
								action.preventDefault();  // This prevents things like pressing buttons.
								if (!movement) {
									clearInterval(recurrenceLoop);
									runTimes = 0;
								} else {
									movement = false;
								}
							});
						}
					}
					// There are more touch events.
					break;
				default:
					if (options.listenOnce) {
						if (options.allowDefault) {
							item.addEventListener(event, function (action) {
								behavior.call(this, action);
								item.removeEventListener(event, arguments.callee);
							});
						} else {
							item.addEventListener(event, function (action) {
								action.preventDefault();
								behavior.call(this, action);
								item.removeEventListener(event, arguments.callee);
							});
						}
					} else {
						if (options.allowDefault) {
							item.addEventListener(event, behavior);
						} else {
							item.addEventListener(event, function (action) {
								action.preventDefault();
								behavior.call(this, action);
							});
						}
					}
			}
		},
		arguments: [item, event, behavior, options]
	});
};
/// There are more touch events.

Standards.general.safeWhile = function (condition, doStuff, loops) {
	/**
	runs a while loop with a maximum recursion depth
	prevents getting stuck in a while loop
	condition = a string of a condition for the while loop
		local variables used in the condition must be declared with "this"
		example: this.variable = value;
		usage of "this." before the variable within condition or doStuff is optional
	doStuff = what should be done in the while loop
	recursionDepth = how many times the loop is allowed to run (defaults to 1000)
	non-native functions = none
	*/
	loops = loops >= 0 ? loops : 1000;  // if I used loops = loops || 1000 it would reset to 1000 when loops = 0
	/*
	if (eval.call(doStuff, condition) && loops > 0) {
		doStuff();
		loops--;
		Standards.general.safeWhile(condition, doStuff, loops);
	} else if (loops <= 0) {
		throw "Recursion depth exceeded."
	}
	*/
	return new Promise(function (resolve, reject) {
		while (eval.call(doStuff, condition) && loops-- > 0) {
			doStuff();
		}
		reject(Error("Recursion depth exceeded"));
	});
};

Standards.general.toHTML = function (HTML) {
	/**
	converts a string representation of HTML into (an) actual element(s) inside a <div>
	argument:
		HTML = required; the HTML string to convert
	non-native functions = getType
	*/
	if (!HTML) {
		throw "No HTML was provided to convert.";
	} else if (Standards.general.getType(HTML) != "String") {
		throw "The provided argument is of an incorrect type.";
	}
	let container = document.createElement("div");
	HTML = HTML.replace(/<!--[^]*?-->/g, "");  // filters out comments, especially if they contain a script tag
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

Standards.general.makeDialog = function (message) {
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
		Standards.general.makeDialog(
			"Don't you think this dialog box is awesome?",
			["Yes", function () {console.log("You're awesome too!");}],
			["No", function () {console.log("Nobody cares what you think anyway!");}]
		);
		Standards.general.makeDialog(
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
		identifier = Standards.general.identifier++;
	return new Promise(function (resolve, reject) {
		if (Standards.general.getType(pairs[0]) == "Object") {
			let list = [];
			Standards.general.forEach(pairs[0], function (value, key) {
				if (Standards.general.getType(value) == "Function") {
					list.push([key, value]);
				} else if (!value) {
					list.push([key, function () { return; }]);
				} else {
					console.error('Behavior for the button "' + key + '" couldn\'t be recognized.');
				}
			});
			pairs = list;
			if (Standards.general.getType(pairs[0]) == "Object") {  // if the object was empty
				pairs = [];
			}
		}
		if (pairs.length < 1) {
			pairs = [["Okay", function () { return; }]];
		} else if (pairs.length == 1 && !pairs[0]) {  // if there's only one falsy extra argument (if a button isn't desired)
			pairs = [];
		}
		pairs.forEach(function (pair, index) {
			if (Standards.general.getType(pair) == "String") {
				pairs.splice(index, 1, [pair, function () { return; }]);
			} else if (Standards.general.getType(pair) != "Array") {
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
		if (Standards.general.getType(message) == "String") {
			contents = Standards.general.toHTML(message);
		} else if (Standards.general.getType(message) == "HTMLElement") {
			contents = message;
		} else {
			throw "The message is of an incorrect type.";
		}
		let placedButtonsNumber = contents.getElementsByClassName("replace").length - 1;
		darkener.className = "darkener";
		darkener.style.pointerEvents = "auto";
		dialog.className = "dialog";
		buttons.className = "buttons";
		pairs.forEach(function (pair, index) {
			if (Standards.general.getType(pair[0]) != "String") {
				console.error("The pair at position " + (index + 1) + " doesn't have a string as the first value.");
				reject(new Error("The pair at position " + (index + 1) + " doesn't have a string as the first value."));
			} else if (Standards.general.getType(pair[1]) != "Function") {
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

Standards.general.getFile = function (url, callback, convert) {
	/**
	asynchronously retieves a file as a string using an XMLHttpRequest
	only files from the same domain can be retrieved without CORS
	local files can only be accessed from a file selector
	arguments:
		url = required; the URL of the desired file
			can be absolute or relative
		callback = required; what to do after receiving the file
			one argument will be provided: the received file
		convert = optional; a boolean indicating whether the file should be converted to a different form
			URLs ending in ".html": converted into an HTML element
			URLs ending in ".json": converted into a JSON object
			URLs ending in ".txt": What are you trying to accomplish with this?
			other URLs: ignored
			default: true
	non-native functions = getType, toHTML, and makeDialog
	*/
	Standards.general.queue.add({
		runOrder: "first",
		arguments: [url, callback, convert],
		function: function (url, callback, convert) {
			return new Promise(function (resolve) {
				if (convert === undefined) {
					convert = true;
				}
				if (!url) {
					console.error("No resource was provided to get the file.");
				} else if (Standards.general.getType(url) != "String") {
					console.error("The provided URL wasn't a string.");
				} else if (!callback) {
					console.error("No callback was provided.");
				} else if (url.search(/^file:|^\w:/) > -1 || url.indexOf(":") == -1 && new URL(url, window.location.href).protocol == "file:") {  // if it's a local file
					let input = document.createElement("input");
					input.type = "file";
					if (url.slice(-1) == "/") {
						input.multiple = true;
					}
					let changed = false;
					input.addEventListener("change", function () {
						if (this.files.length > 0) {
							let reader = new FileReader();
							if (["png", "jpg", "jpeg", "gif", "css"].some(function (extension) { return url.slice(url.lastIndexOf(".") + 1).toLowerCase() == extension; })) {
								reader.addEventListener("loadend", function () {
									if (reader.error != null) {
										console.error(reader.error);
									}
									callback(reader.result);
									resolve(reader.result);
								});
								reader.readAsDataURL(this.files[0]);
							} else if (url.slice(-1) == "/") {
								let folder = [];
								for (let item of this.files) {
									reader = new FileReader();
									reader.addEventListener("loadend", function () {
										folder.push({
											name: item.name,
											lastModified: item.lastModified,
											size: item.size,
											type: item.type,
											content: this.result
										});
										if (folder.length == input.files.length) {  // when finished iterating
											callback(folder);
											resolve(folder);
										}
									});
									reader.readAsText(item);
								}
							} else {
								reader.addEventListener("loadend", function () {
									if (reader.error != null) {
										console.error(reader.error);
									}
									if (convert) {
										switch (url.slice(url.lastIndexOf(".") + 1).toLowerCase()) {
											case "html":
												callback(Standards.general.toHTML(reader.result));
												resolve(Standards.general.toHTML(reader.result));
												break;
											case "json":
												callback(JSON.parse(reader.result));
												resolve(JSON.parse(reader.result));
												break;
											case "txt":
												console.info("What do you think I'm supposed to convert a .txt file into?");
												callback(reader.result);
												resolve(reader.result);
												break;
											default:
												console.warn("The file doesn't have a convertible file extension.");
												callback(reader.result);
												resolve(reader.result);
										}
									} else {
										callback(reader.result);
										resolve(reader.result);
									}
								});
								reader.readAsText(this.files[0]);
							}
						} else {
							console.warn("No files were availible.");
						}
						changed = true;
					});
					Standards.general.makeDialog(url + " needs to be found on your computer.", ["Choose File", function () {
						input.click();
						function waitForDumbStuff() {  // This is necessary since selecting a file doesn't register sometimes.
							setTimeout(function () {
								if (!changed) {
									Standards.general.makeDialog(
										"It has been 20 seconds without recieving " + url + ". Do you want to reset the wait time, try loading the file again, or cancel?",
										["Wait", waitForDumbStuff],
										["Retry", function () {
											Standards.general.getFile(url, callback, convert);
										}],
										"Cancel"
									);
								}
							}, 20000);
						}
						waitForDumbStuff();
					}]);
				} else {  // if the file is online
					/*
					potential code for retrieving multiple files:
					var directory=<path>;  // the path of the folder you want listed
					var xmlHttp = new XMLHttpRequest();
					xmlHttp.open( "GET", directory, false ); // false for synchronous request
					xmlHttp.send( null );
					var ret=xmlHttp.responseText;
					var fileList=ret.split('\n');
					for(i=0;i<fileList.length;i++){
						var fileinfo=fileList[i].split(' ');
						if ( fileinfo[0] == "201:" ) {
							document.write(fileinfo[1]+"<br />");
							document.write("<img src=\""+directory+fileinfo[1]+"\" />");
						}
					}
					*/
					let file = new XMLHttpRequest();
					file.open("GET", url);  // Don't add false as an extra argument (browsers don't like it). (default: asynchronous=true)
					file.onreadystatechange = function () {
						if (file.readyState === 4) {  // Is it done?
							if (file.status === 200 || file.status === 0) {  // Was it successful?
								// file.responseXML might have something
								if (convert) {
									switch (url.slice(url.lastIndexOf(".") + 1).toLowerCase()) {
										case "html":
											callback(Standards.general.toHTML(file.responseText));
											resolve(Standards.general.toHTML(file.responseText));
											break;
										case "json":
											callback(JSON.parse(file.responseText));
											resolve(JSON.parse(file.responseText));
											break;
										case "txt":
											console.info("What do you think I'm supposed to convert a .txt file into?");
											callback(file.responseText);
											resolve(file.responseText);
											break;
										default:
											console.warn("The file doesn't have a convertible file extension.");
											callback(file.responseText);
											resolve(file.responseText);
									}
								} else {
									callback(file.responseText);
									resolve(file.responseText);
								}
							} else {
								console.error("The file couldn't be retieved.");
							}
						}
					}
					file.send();
				}
			});
		}
	});
};

Standards.general.http_build_query = function (options) {
	/**
	a replication of the PHP function http_build_query()
	turns an object into a URL-encoded string (returns the string)
	particularly useful when sending information in an XMLHttpRequest
	example:
		var options = {
			"greeting": "Hello!",
			"number": 42,
			"animal": "cuttlefish"
		};
		var result = Standards.general.http_build_query(options);
		// result --> "greeting=Hello!&number=42&animal=cuttlefish"
	non-native functions = forEach and getType
	*/
	var queryString = "";
	function iterateDeeper(value, key) {
		Standards.general.forEach(value, function (item, property) {
			if (Standards.general.getType(item) == "Array" || Standards.general.getType(item) == "Object") {
				iterateDeeper(item, key + "[" + encodeURIComponent(String(property)) + "]");
			} else {
				queryString += key + "[" + encodeURIComponent(String(property)) + "]=" + encodeURIComponent(String(item)) + "&";
			}
		});
	}
	Standards.general.forEach(options, function (value, key) {
		if (Standards.general.getType(value) == "Array" || Standards.general.getType(value) == "Object") {
			iterateDeeper(value, encodeURIComponent(String(key)));
		} else {
			queryString += encodeURIComponent(String(key)) + "=" + encodeURIComponent(String(value)) + "&";
		}
	});
	queryString = queryString.slice(0, -1);  // gets rid of the last "&"
	queryString = queryString.replace(/%20/g, "+");  // changes the encoded spaces into the correct form for application/x-www-form-urlencoded
	return queryString;
};

Standards.general.parse_str = function (encodedString) {
	/**
	a close approximation of the PHP function parse_str()
	turns a URL-encoded string into an object (returns the object)
	particularly useful when receiving information encoded into a string (as happens within Standards.storage.____.recall())
	example:
		var options = "greeting=Hello!&number=42&animal=cuttlefish";
		var result = Standards.general.parse_str(options);
		// result --> {"greeting": "Hello!", "number": "42", "animal": "cuttlefish"}
	non-native functions = forEach
	*/
	var decodedObject = {};
	encodedString = encodedString.replace(/\+/g, "%20");
	Standards.general.forEach(encodedString.split("&"), function (item) {
		var key = item.split("=")[0];
		var value = item.split("=")[1];
		if (key.slice(-1) == "]") {
			key = key.split("[");
			Standards.general.forEach(key, function (subkey, index) {
				if (subkey.slice(-1) == "]") {
					key[index] = subkey.slice(0, -1);
				}
			});
			let path = decodedObject;
			Standards.general.forEach(key.slice(0, -1), function (subkey) {
				subkey = decodeURIComponent(subkey);
				if (!path.hasOwnProperty(subkey)) {
					path[subkey] = {};
				}
				path = path[subkey];
			});
			path[decodeURIComponent(key[key.length - 1])] = decodeURIComponent(value);
			/// "decodedObject" doesn't need to be used because "path" is "decodedObject".
		} else {
			decodedObject[decodeURIComponent(key)] = decodeURIComponent(value);
		}
	});
	function recognizeArrays(candidate) {
		let returnValue;
		if (Object.keys(candidate).every(function (key) {
			return Standards.general.getType(Number(key)) == "Number";
		})) {
			returnValue = [];
			Standards.general.forEach(candidate, function (item) {
				returnValue.push(item);
			});
		} else {
			returnValue = candidate;
		}
		Standards.general.forEach(returnValue, function (item, property) {
			if (Standards.general.getType(item) == "Object") {
				returnValue[property] = recognizeArrays(item);
			}
		});
		return returnValue;
	}
	decodedObject = recognizeArrays(decodedObject);
	return decodedObject;
};



Standards.general.colorCode = function (element, conversion) {
	/**
	color codes an element
	conversion is either a number from 0 to 100, a function that returns a value in the same range, or null (if an applicable element)
		the number determines how the element will be colored
		if the element is null, a color is returned rather than applied
	colors specifications can be added after all of the arguments
		colors are an indefinite number of 3-item arrays listed as arguments
		(items are integers from 0 to 255)
		e.g. colorCode(element, null, [12,23,34], [45,56,67], [78,89,90]);
		default colors = red and green
	for tables, the type of data contained is determined by a sample of the fourth and/or seventh item
	a table needs to have at least 7 items before it's color-coded
	non-native functions = queue.add() and toArray()
	*/
	return Standards.general.queue.add({
		runOrder: "first",
		function: function (element, conversion, args) {
			var list = false;  // for whether "element" is a list (array)
			if (typeof element == "string") {
				element = document.getElementById(element);
			} else if (element instanceof Array) {  // using "typeof" always returns false because arrays are apparently objects (in this script)
				element.forEach(function (item, index) {
					if (typeof item == "string") {
						element[index] = document.getElementById(item);
					}
				});
				list = element;
				element = element[0];
			}
			var end1,
				end2;
			var colors = args.length>0 ? args : [[255, 0, 0], [255, 255, 0], [0, 255, 0]];  // Are there colors specified?
			function backgroundColor(value) {
				var ends = [end1];
				colors.slice(1).forEach(function (color, index, shortColors) {  // establishes the values where the different colors are centered
					ends.push(end1 + (end2 - end1) * ((index + 1) / shortColors.length));
					/// The parentheses are needed around the fraction to prevent rounding errors for the highest values.
					/// (The endIndex would be increase once too many times because "value" might be higher than the end value.)
					/// example: 42 > 41.9999999999999998 (<-- computer rounding error due to base-two storage)
				});
				var endIndex = 1,
					finalColors = [];
				while (value > ends[endIndex]) {  // determines which 2 colors the value falls between
					endIndex++;
				}
				[0, 1, 2].forEach(function (index) {  // determines what the color should be based on how close the value is to the two closest ends' colors
					finalColors.push(Math.round(colors[endIndex-1][index] + (colors[endIndex][index]-colors[endIndex-1][index]) * (value-ends[endIndex-1]) / (ends[endIndex]-ends[endIndex-1])));
				});
				if (finalColors.join(", ").indexOf("NaN") > -1) {  // if the math didn't work out (especially if both ends are the same)
					return "white";
				} else {
					return "rgb(" + finalColors.join(", ") + ")";
				}
			}
			if (element == null) {
				end1 = 0;
				end2 = 100;
				if (typeof conversion == "function") {
					return backgroundColor(conversion());
				} else if (typeof conversion == "number") {
					return backgroundColor(conversion);
				} else {
					console.error("No element was given and an improper conversion was provided.");
				}
			} else {
				if (element.tagName == "TABLE" || element.tagName == "TR") {  // This might have to be capitalized.
					var tds = [];  // This needs to be set to an array for it to be used in toArray().
						// tds[3] and tds[6] are representative samples of the type of data
					if (list) {
						list.forEach(function (table) {
							tds = Standards.general.toArray(tds, table.getElementsByTagName("td"));
						});
					} else {
						tds = Standards.general.toArray(element.getElementsByTagName("td"));
					}
					if (!isNaN(tds[3].textContent) || !isNaN(tds[6].textContent)) {  // Is the data numbers?  //// This should be improved. isNaN("") == false
						var lowest = Infinity,
							highest = -Infinity;
						tds.forEach(function (item) {  // determines the high and low ends of the data
							try {  // accounts for parts without data
								if (item.textContent.trim() != "") {  // Number(" ") == 0
									if (Number(item.textContent) < lowest) {
										lowest = Number(item.textContent);
									}
									if (Number(item.textContent) > highest) {
										highest = Number(item.textContent);
									}
								}
							} finally {  // a necessary accompanyment to try (although I could have used catch)
							}
						});
						end1 = lowest;
						end2 = highest;
						tds.forEach(function (data) {
							if (!isNaN(data.textContent.trim()) && data.textContent.trim()!="") {  // sets the background color of the tabular data
								data.style.backgroundColor = backgroundColor(Number(data.textContent.trim()));
							}
						});
					} else if (tds[3].textContent.indexOf(":") > -1 || tds[6].textContent.indexOf(":") > -1) {  // if the data has a : (if it's a time or ratio)
						function toTimeNumber(time) {
							// converts the time into hours (or possibly minutes if minutes:seconds)
							var hours = time.split(":")[0].trim(),
								minutes = time.split(":")[1] + "	";  // extra spaces ensure the index isn't exceeded later on
							if (isNaN(hours[hours.length-2])) {  // Is there not 2 digits in the hour?
								hours = hours.slice(-1);
							} else {
								hours = hours.slice(-2);
							}
							hours = Number(hours);
							minutes = minutes.slice(0,5).toLowerCase();
							if (minutes.indexOf("am") > -1 || minutes.indexOf("pm") > -1) {
								if (hours == 12) {
									hours -= 12;
								}
								if (minutes.indexOf("pm") > -1) { 
									hours += 12;
								}
							}
							minutes = Number(minutes.slice(0,2))/60;
							return hours + minutes;
						}
						if (tds[3].textContent.indexOf("-") > -1 || tds[6].textContent.indexOf("-") > -1) {  // if the data has a - (if it's a time range)
							function timeDifference(difference, unit) {  // converts a time difference into a number
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
							var lowest = Infinity,
								highest = -Infinity;
							tds.forEach(function (item) {  // determines the high and low ends of the data set
								try {  // accounts for parts that don't have data
									var difference = timeDifference(item.textContent);
									if (difference < lowest) {
										lowest = difference;
									}
									if (difference > highest) {
										highest = difference;
									}
								} finally {  // a necessary accompanyment to try (although I could have used catch)
								}
							});
							end1 = lowest;
							end2 = highest;
							tds.forEach(function (data) {  // assigns the background color of each of the tabular data
								try {  // accounts for parts that don't have data (doesn't color them)
									data.style.backgroundColor = backgroundColor(timeDifference(data.textContent));
								} finally {  // a necessary accompanyment to try (although I could have used catch)
								}
							});
						} else {
							
						}
					}
				} else if (["P", "H1", "H2", "H3", "H4", "H5", "H6", "SPAN"].some(function (tag) {
					return element.tagName == tag;
				})) {
					if (element.textContent.trim() != "") {  // if the text isn't empty
						end1 = 0;
						end2 = element.textContent.trim().length - 1;
						var replacement = document.createElement(element.tagName);  // makes sure the replacement uses the same tag / element type
						element.textContent.trim().split("").forEach(function (character, index) {  // puts a <span> between each letter and colors the text
							var span = document.createElement("span");
							span.textContent = character;
							span.style.display = "inline";
							span.style.color = backgroundColor(index);
							replacement.appendChild(span);
						});
						element.parentNode.insertBefore(replacement, element);  // inserts the set of colored <span>s in the same place as the original text
						element.parentNode.removeChild(element);  // gets rid of the original uncolored text
					}
				} else {
					end1 = 0;
					end2 = 100;
					if (typeof conversion == "function") {
						element.style.backgroundColor = backgroundColor(conversion());
					} else if (typeof conversion == "number") {
						element.style.backgroundColor = backgroundColor(conversion);
					} else {
						console.error("An improper conversion was provided.");
					}
				}
			}
		},
		arguments: [element, conversion, Array.prototype.slice.call(arguments, 2)]
	});
};



if (!(Standards.general.options.automation == "none")) {
	
	//This is able to run without waiting for anything else to load.
	
	let needsIcon = true;
	if (document.head.getElementsByTagName("link").length > 0) {
		Standards.general.forEach(document.head.getElementsByTagName("link"), function (link) {
			if (link.rel == "icon") {
				needsIcon = false;
			}
		});
	}
	if (needsIcon) {
		// links a favicon
		let icon = document.createElement("link");  // this uses "let" so "icon" is free to be used as a variable elsewhere
		icon.rel = "icon";
		document.head.insertBefore(icon, document.head.children[0]);
		
		// cycles the favicon
		let canvas = document.createElement("canvas");
		let context = canvas.getContext("2d");
		let color = 0;
		canvas.width = 64;
		canvas.height = 64;
		context.beginPath();
		context.arc(canvas.width/2, canvas.height/2, 32, 0, 2*Math.PI);
		setInterval(function () {
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



addEventListener("load", function () {  // This waits for everything past the script import to load before running.
	
	if (!Standards.general.options.hasOwnProperty("automation") || Standards.general.options.automation == "full") {
		
		// allows radio buttons to be unchecked
		let radioButtonNames = [];
		Standards.general.forEach(document.getElementsByTagName("input"), function (input) {
			if (input.type == "radio" && !radioButtonNames.includes(input.name)) {
				radioButtonNames.push(input.name);
			}
		});
		radioButtonNames.forEach(function (name) {
			if (!Standards.general.toArray(document.getElementsByName(name)).some(function (box) {
				return box.checked;
			})) {  // if none of the boxes are checked
				let previouslyChecked;
				Standards.general.forEach(document.getElementsByName(name), function (box) {
					box.addEventListener("click", function () {
						if (this == previouslyChecked) {
							this.checked = false;
							previouslyChecked = undefined;
						} else {
							previouslyChecked = this;
						}
					});
				});
			}
		});

		// interprets .summary substitutions for <summary>
		Standards.general.forEach(document.getElementsByClassName("summary"), function (element) {
			let hiddenCheckbox = document.createElement("input");
			hiddenCheckbox.type = "checkbox";
			hiddenCheckbox.id = "summaryCheckbox" + Standards.general.identifier++;
			let newSummary = document.createElement("label");
			newSummary.className = element.className;
			newSummary.htmlFor = hiddenCheckbox.id;
			newSummary.innerHTML = element.innerHTML;
			if (element.id) {
				newSummary.id = element.id;
			}
			element.parentNode.insertBefore(hiddenCheckbox, element.parentNode.children[0]);
			element.parentNode.insertBefore(newSummary, element);
			element.parentNode.removeChild(element);
		});
		
		// interprets condensed tables
		var tables = document.getElementsByClassName("compact");
		for (var counter=0; counter<tables.length; counter++) {
			var table = tables[counter];
			Standards.general.forEach(table.getElementsByTagName("th"), function (thList) {
				var parent = thList.parentNode;
				var newHeadings = thList.innerHTML.split("|");
				parent.removeChild(thList);
				Standards.general.forEach(newHeadings, function (heading) {
					parent.innerHTML += "<th>" + heading.trim() + "</th>";
				});
			}, true);
			Standards.general.forEach(table.getElementsByTagName("td"), function (tdList) {
				var parent = tdList.parentNode;
				var newData = tdList.innerHTML.split("|");
				parent.removeChild(tdList);
				Standards.general.forEach(newData, function (data) {
					parent.innerHTML += "<td>" + data.trim() + "</td>";
				});
			}, true);
			table.style.visibility = "visible";
		}

		// adds page jumping capabilities
		Standards.general.forEach(document.getElementsByClassName("page-jump-sections"), function (division) {
			let contents = document.createElement("div");
			contents.className = "page-jump-list";
			contents.innerHTML = "<h2>Jump to:</h2>";
			let sections = division.getElementsByTagName("h2");
			let toTop = document.createElement("p");  // This has to be a <p><a></a></p> rather than just a <a></a> because, otherwise, "To top" has the possibility of appearing in-line.
			toTop.className = "to-top";
			toTop.innerHTML = '<a href="#" target="_self">To top</a>';
			let listItems = document.createElement("ol");
			Standards.general.forEach(sections, function (heading, index, sections) {
				let inside = encodeURIComponent(sections[index].textContent.trim());
				let safety = 20;
				while (document.getElementById(inside) && safety) {  // while the ID is already used
					if (inside.search(/_\d+$/) > -1) {
						let _index = inside.lastIndexOf("_");
						inside = inside.slice(0,_index) + "_" + (Number(inside.slice(_index+1))+1);
					} else {
						inside = inside + "_2";
					}
					safety--;
				}
				sections[index].id = inside;
				let link = document.createElement("a");
				link.href = "#" + inside;
				link.textContent = decodeURIComponent(inside);
				link.target = "_self";
				let listItem = document.createElement("li");
				listItem.appendChild(link);
				listItems.appendChild(listItem);
				division.getElementsByTagName("h2")[index].parentNode.insertBefore(toTop.cloneNode(true), division.getElementsByTagName("h2")[index].nextSibling);
				// inserts after <h2>
				// toTop needs to be cloned so it doesn't keep getting reasigned to the next place (it also needs to have true to clone all children of the node, although it doesn't apply here)
			});
			contents.appendChild(listItems);
			division.parentNode.insertBefore(contents, division);  // .insertBefore() only works for the immediate descendants of the parent
		}, false);

		// This takes you to a certain part of the page after the IDs and links load. (if you were trying to go to a certain part of the page)
		if (window.location.href.indexOf("#") > -1) {
			let link = document.createElement("a");
			link.href = "#" + window.location.href.split("#")[1].trim();
			link.target = "_self";
			window.addEventListener("finished", function () {  //// something happens during script execution to undo the clicking if not done here
				link.click();
			});
		}
		
		// enables making use of elaborations
		Standards.general.forEach(document.getElementsByTagName("aside"), function (section) {
			section.tabIndex = section.tabIndex > -1 ? section.tabIndex : 0;
			if (!section.dataset.hasOwnProperty("heading") && !(section.firstElementChild && section.firstElementChild.tagName == "H2")) {  // if there's not a data-heading or an HTML heading
				section.dataset.heading = "Elaboration";
			}
			if (section.textContent.trim() == "") {  // if I forgot to fill the aside
				section.textContent = "Oops, I forgot to fill this.";
			}
			let button = document.createElement("button");
			button.className = "hide-aside";
			button.addEventListener("click", function () {
				if (section.parentElement) {  // if there's a parent element
					if (section.parentElement.tagName == "ASIDE") {
						section.parentElement.focus();  // shifts focus to the parent
						/// allows returning to the previous aside when an aside was triggered within an aside
						/// if the parent element doesn't have a tabIndex, it won't accept focus and the aside won't hide
					} else if (section.parentElement.parentElement) {
						// gives finding a parent aside another shot
						if (section.parentElement.parentElement.tagName == "ASIDE") {
							section.parentElement.parentElement.focus();  // shifts focus to the parent
						} else {
							this.blur();  // hides the aside
						}
					} else {
						this.blur();  // hides the aside
					}
				} else {
					this.blur();  // hides the aside
					/// this can't be section.blur() because, once the button is pressed, the focus has already shifted away from the parent aside
				}
			});
			section.appendChild(button);
		});
		Standards.general.forEach(document.getElementsByClassName("elaborate"), function (trigger) {
			trigger.tabIndex = trigger.tabIndex > -1 ? trigger.tabIndex : 0;
			trigger.addEventListener("click", function () {
				let aside = trigger;
				while (aside.nextSibling && aside.tagName != "ASIDE") {
					aside = aside.nextSibling;
				}
				if (aside.tagName != "ASIDE" && aside.parentNode) {
					aside = aside.parentNode;
					while (aside.nextSibling && aside.tagName != "ASIDE") {
						aside = aside.nextSibling;
					}
				}
				if (aside.tagName == "ASIDE") {
					aside.focus({ focusVisible: false });
				}
			});
		});

		// automatically loads seasonal themes
		let timeOfYear = new Date();
		let seasonalStyle = "";
		function timeIsNearby(month, day) {
			let timeDifference = timeOfYear.getTime() - new Date(timeOfYear.getFullYear(), month - 1, day).getTime();
			// if the date is < 2.5 weeks away or < 2 days past
			// (also takes into account if the date is coming up next year)
			if (-256000000 < timeDifference && timeDifference < 1500000000 || timeDifference < -30000000000) {
				return true;
			} else {
				return false;
			}
		}
		if (timeIsNearby(7, 4)) {
			seasonalStyle = "fourthofjuly.css";
		} else if (timeIsNearby(10, 31)) {
			seasonalStyle = "halloween.css";
		} else if (timeIsNearby(11, 26)) {
			seasonalStyle = "thanksgiving.css";
		} else if (timeIsNearby(12, 25)) {
			seasonalStyle = "christmas.css";
		}
		if (seasonalStyle) {
			setTimeout(function () {
				let extraStyle = document.createElement("link");
				extraStyle.rel = "stylesheet";
				extraStyle.href = "https://epicenterprograms.github.io/standards/formatting/" + seasonalStyle;
				let foundationStyle = document.querySelector("link[href='https://epicenterprograms.github.io/standards/formatting/foundation.css']");
				if (foundationStyle !== null) {
					foundationStyle.parentNode.insertBefore(extraStyle, foundationStyle.nextSibling);
				}
			}, 0);
		}
	}
	
	Standards.general.queue.run();
});

// remember new Function(), function*, and ``
