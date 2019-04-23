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
		part = part || "all";
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
					content = content.slice(0, content.indexOf("/**")) + content.slice(content.indexOf("*/")+2);
				}
				break;
			case "non-natives":
				if (content.indexOf("non-native functions") > -1) {
					content = content.slice(content.lastIndexOf("non-native functions", content.indexOf("*/")), content.indexOf("*/"));
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
	if (Standards.general.queue.constructor === Array) {
		Standards.general.queue.forEach(function (item, index) {
			if (item.constructor === Object) {
				Standards.general.queue.splice(index, 1);
				console.warn("The item at the index of " + index + " in Standards.general.queue is not an Object.");
			}
		});
	} else {
		Standards.general.queue = [];
		console.warn("Standards.general.queue is not an Array");
	}
} else {
	Standards.general.queue = [];
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
		if (typeof Standards.general.queue[0].function == "string") {
			throw 'The value of "function" must not be a string.';
		}
		let returnValue = Standards.general.queue[0].function.apply(window, Standards.general.queue[0].arguments);
		Standards.general.queue.pop();
		return returnValue;
	} else {
		Standards.general.queue.forEach(function (fn) {
			if (typeof fn.function == "string") {
				throw 'The value of "function" must not be a string.';
			}
			if (fn.runOrder == "first") {
				fn.function.apply(window, fn.arguments);
			}
		});
		Standards.general.queue.forEach(function (fn) {
			if (fn.runOrder == "later") {
				fn.function.apply(window, fn.arguments);
			}
		});
		Standards.general.queue.forEach(function (fn, index) {
			if (fn.runOrder == "last") {
				fn.function.apply(window, fn.arguments);
			} else if (!(fn.runOrder == "first" || fn.runOrder == "later")) {
				console.warn("The item at the index of " + index + " in Standards.general.queue wasn't run because it doesn't have a valid runOrder.");
			}
		});
		while (Standards.general.queue.length > 0) {  // gets rid of all of the items in Standards.general.queue (Standards.general.queue = []; would get rid of the functions as well)
			Standards.general.queue.pop();
		}
		/// The items in Standards.general.queue can't be deleted as they're run because Array.forEach() doesn't copy things like my .forEach() function does.
		/// (Only every other item would be run because an item would be skipped every time the preceding item was deleted.)
	}
};
Standards.general.queue.add = function (object) {
	/**
	adds an item to the queue
	non-native functions = Standards.general.queue.run()
	(Standards.general.finished also isn't native)
	*/
	Standards.general.queue.push(object);
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
		time = time===undefined ? 0 : time;
		shouldSetPlaying = shouldSetPlaying===undefined ? true : shouldSetPlaying;
		if (time > 0) {
			if (shouldSetPlaying) {
				setTimeout(function () {
					sound.playing = sound.volume==0 ? false : true;
				}, time);
			}
			time /= 1000;  // ramps use time in seconds
			if (sound.volume == 0) {
				gain1.gain.exponentialRampToValueAtTime(.0001, Standards.general.audio.currentTime + time);  // exponential ramping doesn't work with 0s
				setTimeout(function () {
					gain1.gain.setValueAtTime(0, Standards.general.audio.currentTime);
				}, time*1000);
			} else {
				gain1.gain.exponentialRampToValueAtTime(Math.pow(10,sound.volume) / 10, Standards.general.audio.currentTime + time);
			}
			osc1.frequency.linearRampToValueAtTime(sound.frequency, Standards.general.audio.currentTime + time);
			gain2.gain.linearRampToValueAtTime(sound.hertzChange, Standards.general.audio.currentTime + time);
			osc2.frequency.linearRampToValueAtTime(sound.modulation, Standards.general.audio.currentTime + time);;
			//// The second set of transitions are linear because I want them to be able to have values of 0?
		} else if (time == 0) {
			if (sound.volume == 0) {
				gain1.gain.setValueAtTime(0, Standards.general.audio.currentTime);
			} else {
				gain1.gain.setValueAtTime(Math.pow(10,sound.volume) / 10, Standards.general.audio.currentTime);
			}
			osc1.frequency.setValueAtTime(sound.frequency, Standards.general.audio.currentTime);
			gain2.gain.setValueAtTime(sound.hertzChange, Standards.general.audio.currentTime);
			osc2.frequency.setValueAtTime(sound.modulation, Standards.general.audio.currentTime);
			if (shouldSetPlaying) {
				sound.playing = sound.volume==0 ? false : true;
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
				window.addEventListener(sound.identifier+"StoppedPlaying", function () {
					sound.play(playQueue[0][0], playQueue[0][1], playQueue[0][2]);
					window.removeEventListener(sound.identifier+"StoppedPlaying", arguments.callee);
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
		return (typeof args[number]!="undefined") ? args[number] : match;  // only replaces things if there's something to replace it with
	});
};

String.prototype.splice = function (start, length, replacement) {
	/**
	acts like Array.splice() except that
	the value is returned instead of implemented
	because JavaScript is dumb and won't let me do that
	non-native functions = none
	*/
	replacement = replacement===undefined ? "" : replacement;
	return this.slice(0,start) + replacement + this.slice(start+length);
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
			searchValue = new RegExp("(" + searchValue.slice(1,flagIndex) + ")|.", searchValue.slice(flagIndex+1));
		} else {
			searchValue = new RegExp("(" + searchValue.slice(1,-1) + ")|.");
		}
	} else {
		console.error("Invalid searchValue type");
		return undefined;
	}
	replacement = replacement===undefined ? "" : replacement;
	return this.replace(searchValue, function (match, validMatch) {
		return validMatch===undefined ? replacement : validMatch;
	});
};

Array.prototype.move = function (currentIndex, newIndex) {
	/**
	moves an item from one index to another
	if no new index is specified, the item is placed at the end of the array
	non-native functions = none
	*/
	newIndex = newIndex===undefined ? this.length : newIndex;
	this.splice(newIndex, 0, this.splice(currentIndex, 1)[0]);
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
	where = where===undefined ? "all" : where;
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

/*
HTMLCollection.prototype.forEach = function (doStuff, copy) {
	/**
	HTMLCollection elements = stuff like the list in document.getElementsByClassName() or document.getElementsByTagName()
	creates a static list of HTMLCollection elements
	and does stuff for each one like Array.forEach()
	(.forEach() doesn't work for these lists without this code)
	implication of static list = you can remove the elements in doStuff without messing everything up
	doStuff will be run with the arguments (value, index, list)
	doStuff can return a value of "break" to break out of the loop
	if "copy" is set to true, the items of the list will be cloned then looped through
		default = false
	non-native functions = none
	*
	copy = copy===true ? true : false;  // This variable can't be set with || notation because false is falsy (what a thought).
	var elements = [],
		index = 0,
		returnValue;
	if (copy) {
		for (index; index<this.length; index++) {
			elements.push(this[index].cloneNode(true));
		}
		for (index=0; index<elements.length; index++) {
			returnValue = doStuff(elements[index], index, elements);
			if (returnValue && returnValue.constructor == String && returnValue.toLowerCase() == "break") {
				break;
			}
		}
	} else {
		for (index; index<this.length; index++) {  // makes the static list from the live HTMLCollection
			elements.push(this[index]);
		}
		for (index=0; index<elements.length; index++) {
			returnValue = doStuff(elements[index], index, elements);
			if (returnValue && returnValue.constructor == String && returnValue.toLowerCase() == "break") {
				break;
			}
		}
	}
};
/*

/*
CSSRuleList.prototype.forEach = function (doStuff) {
	// /**
	CSSRuleList = a list of rules for a stylesheet
	creates a static list of CSSRuleList elements
	and does stuff for each one like Array.forEach()
	(.forEach() doesn't work for these lists without this code)
	implication of static list = you can remove the elements in doStuff without messing everything up
	doStuff will be run with the arguments (value, index, list)
	doStuff can return a value of "break" to break out of the loop
	the .selectorText of a stylesheet rule will return something like p, .class, #ID, etc.
	the properties and values of a stylesheet rule can be accessed and set like a normal object
	non-native functions = none
	// *
	var elements = [];
	for (var index=0; index<this.length; index++) {
		elements.push(this[index]);
	}
	for (index=0; index<elements.length; index++) {
		let returnValue = doStuff(elements[index], index, elements);
		if (typeof returnValue == "string" && returnValue.toLowerCase() == "break") {
			break;
		}
	}
};

NodeList.prototype.forEach = function (doStuff) {
	// /**
	similar to HTMLCollection.forEach()
	non-native functions = none
	// *
	var elements = [];
	for (var index=0; index<this.length; index++) {
		elements.push(this[index]);
	}
	for (index=0; index<elements.length; index++) {
		let returnValue = doStuff(elements[index], index, elements);
		if (typeof returnValue == "string" && returnValue.toLowerCase() == "break") {
			break;
		}
	}
};

// Changing the object prototypes prevents the proper working of Google Firestore.
Object.prototype.forEach = function (doStuff, copy) {
	// /**
	loops through every property of the object
	-->> USE THIS TO LOOP THROUGH PROPERTIES INSTEAD OF A FOR LOOP <<--
	if a for loop is used in place of this, the prototype properties from this script will also be included
	doStuff will be run with the arguments (property value, property, original object, arbitrary index)
	properites that are numbers only are at the beginning in ascending order no matter what
		e.g. {0:"value1", 3:"value2", 7:"value3", 42:"value4, "oranges":"value5", "apples":"value6"}
	doStuff can return a value of "break" to break out of the loop
	if "copy" is set to true, a copy of the object will be looped through
		default = false
	non-native functions = none
	// *
	copy = copy===undefined ? false : copy;
	let keys = Object.keys(this),
		index = 0,
		returnValue;
	if (copy) {
		let newObject = JSON.parse(JSON.stringify(this));
		while (index < keys.length) {
			returnValue = doStuff(newObject[keys[index]], keys[index], newObject, index);
			if (returnValue && returnValue.constructor == String && returnValue.toLowerCase() == "break") {
				break;
			} else {
				index++;
			}
		}
	} else {
		while (index < keys.length) {
			returnValue = doStuff(this[keys[index]], keys[index], this, index);
			if (returnValue && returnValue.constructor == String && returnValue.toLowerCase() == "break") {
				break;
			} else {
				index++;
			}
		}
	}
	/// Using Object.keys() and a while loop is about 100 times faster than a for...in... loop.
	/// That's not to mention the fact that this.propertyIsEnumerable() would also need to be used which is also slow.
	/// This is still about 10 times slower than looping through things with number indicies, though.
	/// (These time comparisons are based on usage outside of this function;
	/// doing things by referencing a function makes things about 10 times longer.)
};

Object.prototype.keyHasValue = function (key, value) {  // This was actually pretty pointless.
	// /**
	checks if an object has a property and then
	checks if the property equals the value
	non-native functions = none
	// *
	return (this.hasOwnProperty(key)&&this[key]==value) ? true : false;
};
*/

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
		return item.querySelector("#"+ID);
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
				for (let index=0; index<elements.length; index++) {
					if (elements[index].checked) {
						return elements[index];
					}
				}
				return null;
			} else if (elements[0].type == "checkbox") {
				let list = [];
				for (let index=0; index<elements.length; index++) {
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
			return iterable[iterable.length-1-index];
		} else {
			return iterable[iterable.length+index];
		}
	} else {
		throw "The provided item isn't iterable.";
	}
};
Standards.general.getLast = Standards.general.getEnd;

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

Standards.general.toArray = function () {
	/**
	returns an array made from any number of elements with an index and length
	non-native functions = none
	*/
	var index1 = 0,
		index2,
		returnList = [];
	for (index1; index1<arguments.length; index1++) {
		if (arguments[index1][0] && arguments[index1].length) {  //// Standards.general.getType(list[Symbol.iterator]) == "Function"
			for (index2=0; index2<arguments[index1].length; index2++) {
				returnList.push(arguments[index1][index2]);
			}
		} else if (arguments[index1].length == undefined || arguments[index1].length > 0) {  // filters out empty lists
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
	non-native functions = getType
	*/
	if (Standards.general.getType(doStuff) != "Function") {
		throw "The second arument provided in Standards.general.forEach isn't a function.";
	}
	if (Standards.general.getType(list) == "Object") {
		let associativeList,
			keys = Object.keys(list),
			index = 0,
			returnValue;
		shouldCopy = shouldCopy===undefined ? false : shouldCopy;
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
	} else if (Standards.general.getType(list[Symbol.iterator]) == "Function") {
		let index = 0;
		let returnValue;
		if (shouldCopy) {
			let items = [];
			while (index < list.length) {
				items.push(list[index]);
				index++;
			}
			index = 0;
			while (index < items.length) {
				returnValue = doStuff(items[index], index, items);
				if (returnValue == "break") {
					break;
				} else {
					index++;
				}
			}
		} else {
			while (index < list.length) {
				returnValue = doStuff(list[index], index, list);
				if (returnValue == "break") {
					break;
				} else {
					index++;
				}
			}
		}
	} else if (Standards.general.getType(list) == "Number") {
		let index = 0,
			returnValue;
		while (index < list) {
			returnValue = doStuff(list-index, index, list);
			if (returnValue == "break") {
				break;
			} else {
				index++;
			}
		}
	} else {
		throw "The item provided isn't iterable.";
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
				if (iterable1[x-1] == iterable2[y-1]) {  // if the iterables are the same at the current indices
					sc = 0;
				} else {
					sc = 1;
				}
				// fills the current item with the number of changes needed in the most efficient method of modification
				matrix[x][y] = Math.min(
					matrix[x-1][y] + 1,    // if a deletion is used
					matrix[x][y-1] + 1,    // if an insertion is used
					matrix[x-1][y-1] + sc  // if a substitution is used
				);
			}
		}
		// returns the lat item of the matrix
		return matrix[iterable1.length][iterable2.length];
	} else {
		console.error("At least one of the items to be compared isn't iterable.");
	}
};

Standards.general.listen = function (item, event, behavior, listenOnce) {
	/**
	adds an event listener to the item
	waiting for an element to load is unnecessary if the item is a string (of an ID)
	arguments:
		item = what will be listening
		event = the event being listened for
		behavior = what to do when the event is triggered
			if the event is "hover", behavior needs to be an array with two functions, the first for hovering and the second for not hovering
		listenOnce = whether the event listener should only be triggered once
			default = false
	non-native functions = Standards.general.queue.add() and toArray()
	*/
	listenOnce = listenOnce===undefined ? false : listenOnce;
	Standards.general.queue.add({
		runOrder: "first",
		function: function (item, event, behavior) {
			if (typeof item == "string") {
				item = document.getElementById(item);
			} else if (typeof item == "function") {
				item = item();
			}
			if (event == "hover") {
				if (behavior instanceof Array) {
					if (typeof behavior[0] == "string" || typeof behavior[1] == "string") {
						console.error('The value of "function" must not be a string.');
					}
					item.addEventListener("mouseenter", behavior[0]);
					item.addEventListener("mouseleave", behavior[1]);
				} else {
					console.error('Trying to listen for the event "hover" without a second function isn\'t supported yet.');
				}
			} else {
				if (listenOnce) {
					item.addEventListener(event, function () {
						behavior.call(this);
						item.removeEventListener(event, arguments.callee);
					});
				} else {
					item.addEventListener(event, behavior);
				}
			}
		},
		arguments: [item, event, behavior]
	});
};

Standards.general.onKeyDown = function (key, doStuff, allowDefault) {
	/**
	allows actions when a key is pressed down
	this doesn't replace any previous uses
	arguments:
		key = required; the key or array of keys of interest
			keys are designated by the "key" property of a KeyboardEvent object
			special values:
				"letter" = all capital and lowercase letters
				"number" = a key that produces a number
				"character" = any key that produces a character (includes whitespace characters)
				"any" = when any key is pressed
		doStuff = required; the function to call when the desired key(s) is/are pressed
			the KeyboardEvent object of the keydown listener is passed to the function as an argument
		allowDefault = optional; whether the default action of the key press should be allowed
			default: false
	non-native functions = getType
	*/
	if (key == "letter") {
		key = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcbdefghijklmnopqrstuvwxyz".split();
	} else if (key == "number") {
		key = "0123456789".split();
	} else if (key == "character") {
		key = "~!@#$%^&*()_+QWERTYUIOP{}|ASDFGHJKL:\"ZXCVBNM<>?`1234567890-=qwertyuiop[]\\asdfghjkl;'zxcvbnm,./ ".split();
		key.push("Enter");
		key.push("Tab");
	}
	if (Standards.general.getType(key) == "Array") {
		if (allowDefault) {
			document.addEventListener("keydown", function (event) {
				if (key.includes(event.key)) {
					doStuff(event);
				}
			});
		} else {
			document.addEventListener("keydown", function (event) {
				if (key.includes(event.key)) {
					event.preventDefault();
					doStuff(event);
				}
			});
		}
	} else if (Standards.general.getType(key) == "String") {
		if (key == "any") {
			if (allowDefault) {
				document.addEventListener("keydown", doStuff);
			} else {
				document.addEventListener("keydown", function (event) {
					event.preventDefault();
					doStuff(event);
				});
			}
		} else {
			if (allowDefault) {
				document.addEventListener("keydown", function (event) {
					if (event.key == key) {
						doStuff(event);
					}
				});
			} else {
				document.addEventListener("keydown", function (event) {
					if (event.key == key) {
						event.preventDefault();
						doStuff(event);
					}
				});
			}
		}
	} else {
		console.error("An invalid key type was given.");
	}
};

Standards.general.onKeyHold = function (key, doStuff, allowDefault, triggerTime, intervalTime) {
	/**
	allows actions when a key is held down
	this doesn't replace any previous uses
	there's no distinction between a press and a hold
	arguments:
		key = required; the key or array of keys of interest
			keys are designated by the "key" property of a KeyboardEvent object
			special values:
				"letter" = all capital and lowercase letters
				"number" = a key that produces a number
				"character" = any key that produces a character (includes whitespace characters)
				"any" = when any key is pressed
		doStuff = required; the function to call when the desired key(s) is/are pressed
			an array of pressed keys is passed the the function as an argument
				(that includes modifier keys such as "Control" or "Alt")
			no argument is passed if only one key is being listened to (and it's not in an array)
		allowDefault = optional; whether the default action of the key press should be allowed
			default: false
		intervalTime = optional; the number of milliseconds before doStuff is called again
			default: 15
	non-native functions = getType
	*/
	if (key == "letter") {
		key = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcbdefghijklmnopqrstuvwxyz".split();
	} else if (key == "number") {
		key = "0123456789".split();
	} else if (key == "character") {
		key = "~!@#$%^&*()_+QWERTYUIOP{}|ASDFGHJKL:\"ZXCVBNM<>?`1234567890-=qwertyuiop[]\\asdfghjkl;'zxcvbnm,./ ".split();
		key.push("Enter");
		key.push("Tab");
	}
	intervalTime = intervalTime || 15;
	var recurrenceLoop;
	if (key == "any") {
		var activeKeys = [];
		if (allowDefault) {
			document.addEventListener("keydown", function (event) {
				if (!activeKeys.includes(event.key)) {
					activeKeys.push(event.key);
					if (activeKeys.length == 1) {
						recurrenceLoop = setInterval(function () {
							doStuff(activeKeys);
						}, intervalTime);
					}
				}
			});
			document.addEventListener("keyup", function (event) {
				activeKeys.splice(activeKeys.indexOf(event.key), 1);
				if (activeKeys.length == 0) {
					clearInterval(recurrenceLoop);
				}
			});
		} else {
			document.addEventListener("keydown", function (event) {
				event.preventDefault();
				if (!activeKeys.includes(event.key)) {
					activeKeys.push(event.key);
					if (activeKeys.length == 1) {
						recurrenceLoop = setInterval(function () {
							doStuff(activeKeys);
						}, intervalTime);
					}
				}
			});
			document.addEventListener("keyup", function (event) {
				event.preventDefault();
				activeKeys.splice(activeKeys.indexOf(event.key), 1);
				if (activeKeys.length == 0) {
					clearInterval(recurrenceLoop);
				}
			});
		}
	} else if (Standards.general.getType(key) == "Array") {
		var activeKeys = [];
		if (allowDefault) {
			document.addEventListener("keydown", function (event) {
				if (key.includes(event.key) && !activeKeys.includes(event.key)) {
					activeKeys.push(event.key);
					if (activeKeys.length == 1) {
						recurrenceLoop = setInterval(function () {
							doStuff(activeKeys);
						}, intervalTime);
					}
				}
			});
			document.addEventListener("keyup", function (event) {
				if (key.includes(event.key)) {
					activeKeys.splice(activeKeys.indexOf(event.key), 1);
					if (activeKeys.length == 0) {
						clearInterval(recurrenceLoop);
					}
				}
			});
		} else {
			document.addEventListener("keydown", function (event) {
				if (key.includes(event.key)) {
					event.preventDefault();
					if (!activeKeys.includes(event.key)) {
						activeKeys.push(event.key);
						if (activeKeys.length == 1) {
							recurrenceLoop = setInterval(function () {
								doStuff(activeKeys);
							}, intervalTime);
						}
					}
				}
			});
			document.addEventListener("keyup", function (event) {
				if (key.includes(event.key)) {
					event.preventDefault();
					activeKeys.splice(activeKeys.indexOf(event.key), 1);
					if (activeKeys.length == 0) {
						clearInterval(recurrenceLoop);
					}
				}
			});
		}
	} else if (Standards.general.getType(key) == "String") {
		var keyActive = false;
		if (allowDefault) {
			document.addEventListener("keydown", function (event) {
				if (event.key == key && !keyActive) {
					keyActive = true;
					recurrenceLoop = setInterval(doStuff, intervalTime);
				}
			});
			document.addEventListener("keyup", function (event) {
				if (event.key == key) {
					keyActive = false;
					clearInterval(recurrenceLoop);
				}
			});
		} else {
			document.addEventListener("keydown", function (event) {
				if (event.key == key) {
					event.preventDefault();
					if (!keyActive) {
						keyActive = true;
						recurrenceLoop = setInterval(doStuff, intervalTime);
					}
				}
			});
			document.addEventListener("keyup", function (event) {
				if (event.key == key) {
					event.preventDefault();
					keyActive = false;
					clearInterval(recurrenceLoop);
				}
			});
		}
	} else {
		console.error("An invalid key type was given.");
	}
};

Standards.general.onKeyUp = function (key, doStuff, allowDefault) {
	/**
	allows actions when a key is let up
	this doesn't replace any previous uses
	arguments:
		key = required; the key or array of keys of interest
			keys are designated by the "key" property of a KeyboardEvent object
			special values:
				"letter" = all capital and lowercase letters
				"number" = a key that produces a number
				"character" = any key that produces a character (includes whitespace characters)
				"any" = when any key is pressed
		doStuff = required; the function to call when the desired key(s) is/are pressed
			the KeyboardEvent object of the keyup listener is passed to the function as an argument
		allowDefault = optional; whether the default action of the key press should be allowed
			default: false
	non-native functions = getType
	*/
	if (key == "letter") {
		key = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcbdefghijklmnopqrstuvwxyz".split();
	} else if (key == "number") {
		key = "0123456789".split();
	} else if (key == "character") {
		key = "~!@#$%^&*()_+QWERTYUIOP{}|ASDFGHJKL:\"ZXCVBNM<>?`1234567890-=qwertyuiop[]\\asdfghjkl;'zxcvbnm,./ ".split();
		key.push("Enter");
		key.push("Tab");
	}
	if (Standards.general.getType(key) == "Array") {
		if (allowDefault) {
			document.addEventListener("keyup", function (event) {
				if (key.includes(event.key)) {
					doStuff(event);
				}
			});
		} else {
			document.addEventListener("keyup", function (event) {
				if (key.includes(event.key)) {
					event.preventDefault();
					doStuff(event);
				}
			});
		}
	} else if (Standards.general.getType(key) == "String") {
		if (key == "any") {
			if (allowDefault) {
				document.addEventListener("keyup", doStuff);
			} else {
				document.addEventListener("keyup", function (event) {
					event.preventDefault();
					doStuff(event);
				});
			}
		} else {
			if (allowDefault) {
				document.addEventListener("keyup", function (event) {
					if (event.key == key) {
						doStuff(event);
					}
				});
			} else {
				document.addEventListener("keyup", function (event) {
					if (event.key == key) {
						event.preventDefault();
						doStuff(event);
					}
				});
			}
		}
	} else {
		console.error("An invalid key type was given.");
	}
};

Standards.general.onMouseDown = function (element, doStuff, allowDefault) {
	/**
	does something when the mouse is pressed down
	doesn't replace previous uses
	arguments:
		element = required; the HTML element to place the listener on
			types of values:
				falsy value = uses the "document" object
				HTML element = not converted
				string = uses the element with an ID of that string
				HTML collection = uses the first item of the collection
				node list = uses the first item of the list
				function = uses the result of the function
		doStuff = required; the stuff to do
		allowDefault = optional; whether the default behavior of the action should be allowed
			default: false
	non-native functions = queue.add and getType
	*/
	Standards.general.queue.add({
		runOrder: "first",
		function: function (element, doStuff, allowDefault) {
			if (element) {
				switch (Standards.general.getType(element)) {
					case "HTMLElement":
						break;
					case "String":
						element = document.getElementById(element);
						break;
					case "HTMLCollection":
						element = element[0];
						break;
					case "NodeList":
						element = element[0];
						break;
					case "Function":
						element = element();
						break;
					default:
						throw "The element reference provided isn't a valid type.";
				}
			} else {
				element = document;
			}
			if (allowDefault) {
				element.addEventListener("mousedown", function (event) {
					doStuff(event);
				});
			} else {
				element.addEventListener("mousedown", function (event) {
					event.preventDefault();
					doStuff(event);
				});
			}
		},
		arguments: [element, doStuff, allowDefault]
	});
};

Standards.general.onMouseHold = function (element, doStuff, allowDefault, triggerTime, intervalTime) {
	/**
	does something while the mouse is held down
	there's no distinction between a press and a hold
	doesn't replace previous uses
	arguments:
		element = required; the HTML element to place the listener on
			types of values:
				falsy value = uses the "document" object
				HTML element = not converted
				string = uses the element with an ID of that string
				HTML collection = uses the first item of the collection
				node list = uses the first item of the list
				function = uses the result of the function
		doStuff = required; the stuff to do
		allowDefault = optional; whether the default behavior of the action should be allowed
			default: false
		triggerTime = optional; the time, in milliseconds, after which the provided function should be called
			falsy values (or Infinity) cause the function to be continually called
			causes the need for the hold to be sustained for a certain amount of time before executing doStuff
			default: undefined
		intervalTime = optional; the number of milliseconds before doStuff is (potentially) called again
			doesn't call the function every time if a triggerTime is provided
			default: 15;
	non-native functions = queue.add and getType
	*/
	Standards.general.queue.add({
		runOrder: "first",
		function: function (element, doStuff, allowDefault, triggerTime, intervalTime) {
			if (element) {
				switch (Standards.general.getType(element)) {
					case "String":
						element = document.getElementById(element);
						break;
					case "HTMLElement":
						break;
					case "HTMLCollection":
						element = element[0];
						break;
					case "NodeList":
						element = element[0];
						break;
					case "Function":
						element = element();
						break;
					default:
						throw "The element reference provided isn't a valid type.";
				}
			} else {
				element = document;
			}
			intervalTime = intervalTime || 15;
			let recurrenceLoop,
				mouseDown = false;
			if (allowDefault) {
				if (!triggerTime || triggerTime == Infinity) {
					element.addEventListener("mousedown", function () {
						if (!mouseDown) {
							recurrenceLoop = setInterval(doStuff, intervalTime);
						}
					});
					element.addEventListener("mouseup", function () {
						clearInterval(recurrenceLoop);
					});
				} else {
					if (Standards.general.getType(triggerTime) != "Number") {
						throw "The trigger time isn't a number.";
					} else if (triggerTime < 0) {
						throw "Negative trigger times aren't allowed.";
					}
					let runTimes = 0;
					element.addEventListener("mousedown", function () {
						if (!mouseDown) {
							recurrenceLoop = setInterval(function () {
								if (++runTimes == Math.round(triggerTime / intervalTime)) {
									doStuff();
								}
							}, intervalTime);
						}
					});
					element.addEventListener("mouseup", function () {
						clearInterval(recurrenceLoop);
						runTimes = 0;
					});
				}
			} else {
				if (!triggerTime || triggerTime == Infinity) {
					element.addEventListener("mousedown", function (event) {
						event.preventDefault();
						if (!mouseDown) {
							recurrenceLoop = setInterval(doStuff, intervalTime);
						}
					});
					element.addEventListener("mouseup", function (event) {
						event.preventDefault();
						clearInterval(recurrenceLoop);
					});
				} else {
					if (Standards.general.getType(triggerTime) != "Number") {
						throw "The trigger time isn't a number.";
					} else if (triggerTime < 0) {
						throw "Negative trigger times aren't allowed.";
					}
					let runTimes = 0;
					element.addEventListener("mousedown", function (event) {
						event.preventDefault();
						if (!mouseDown) {
							recurrenceLoop = setInterval(function () {
								if (++runTimes == Math.round(triggerTime / intervalTime)) {
									doStuff();
								}
							}, intervalTime);
						}
					});
					element.addEventListener("mouseup", function (event) {
						event.preventDefault();
						clearInterval(recurrenceLoop);
						runTimes = 0;
					});
				}
			}
		},
		arguments: [element, doStuff, allowDefault, triggerTime, intervalTime]
	});
};

Standards.general.onMouseUp = function (element, doStuff, allowDefault) {
	/**
	does something when the mouse is let up
	doesn't replace previous uses
	arguments:
		element = required; the HTML element to place the listener on
			types of values:
				falsy value = uses the "document" object
				HTML element = not converted
				string = uses the element with an ID of that string
				HTML collection = uses the first item of the collection
				node list = uses the first item of the list
				function = uses the result of the function
		doStuff = required; the stuff to do
		allowDefault = whether the default behavior of the action should be allowed
			default: false
	non-native functions = queue.add and getType
	*/
	Standards.general.queue.add({
		runOrder: "first",
		function: function (element, doStuff, allowDefault) {
			if (element) {
				switch (Standards.general.getType(element)) {
					case "String":
						element = document.getElementById(element);
						break;
					case "HTMLElement":
						break;
					case "HTMLCollection":
						element = element[0];
						break;
					case "NodeList":
						element = element[0];
						break;
					case "Function":
						element = element();
						break;
					default:
						throw "The element reference provided isn't a valid type.";
				}
			} else {
				element = document;
			}
			if (allowDefault) {
				element.addEventListener("mouseup", function (event) {
					doStuff(event);
				});
			} else {
				element.addEventListener("mouseup", function (event) {
					event.preventDefault();
					doStuff(event);
				});
			}
		},
		arguments: [element, doStuff, allowDefault]
	});
};

Standards.general.onTouchStart = function (element, doStuff, allowDefault) {
	/**
	does something when a screen touch begins
	doesn't replace previous uses
	arguments:
		element = required; the HTML element to place the listener on
			types of values:
				falsy value = uses the "document" object
				HTML element = not converted
				string = uses the element with an ID of that string
				HTML collection = uses the first item of the collection
				node list = uses the first item of the list
				function = uses the result of the function
		doStuff = required; the stuff to do
		allowDefault = whether the default behavior of the action should be allowed
			default: false
	non-native functions = queue.add and getType
	*/
	Standards.general.queue.add({
		runOrder: "first",
		function: function (element, doStuff, allowDefault) {
			if (element) {
				switch (Standards.general.getType(element)) {
					case "String":
						element = document.getElementById(element);
						break;
					case "HTMLElement":
						break;
					case "HTMLCollection":
						element = element[0];
						break;
					case "NodeList":
						element = element[0];
						break;
					case "Function":
						element = element();
						break;
					default:
						throw "The element reference provided isn't a valid type.";
				}
			} else {
				element = document;
			}
			if (allowDefault) {
				element.addEventListener("touchstart", function (event) {
					doStuff(event);
				});
			} else {
				element.addEventListener("touchstart", function (event) {
					event.preventDefault();
					doStuff(event);
				});
			}
		},
		arguments: [element, doStuff, allowDefault]
	});
};

Standards.general.onTouchHold = function (element, doStuff, allowDefault, triggerTime, intervalTime) {
	/**
	does something while a touch is sustained
	there's no distinction between a tap and a hold
	doesn't replace previous uses
	arguments:
		element = required; the HTML element to place the listener on
			types of values:
				falsy value = uses the "document" object
				HTML element = not converted
				string = uses the element with an ID of that string
				HTML collection = uses the first item of the collection
				node list = uses the first item of the list
				function = uses the result of the function
		doStuff = required; the stuff to do
		allowDefault = optional; whether the default behavior of the action should be allowed
			default: false
		triggerTime = optional; the time, in milliseconds, after which the provided function should be called
			falsy values (or Infinity) cause the function to be continually called
			causes the need for the hold to be sustained for a certain amount of time before executing doStuff
			default: undefined
		intervalTime = optional; the number of milliseconds before doStuff is (potentially) called again
			doesn't call the function every time if a triggerTime is provided
			default: 15;
	non-native functions = queue.add and getType
	*/
	Standards.general.queue.add({
		runOrder: "first",
		function: function (element, doStuff, allowDefault, triggerTime, intervalTime) {
			if (element) {
				switch (Standards.general.getType(element)) {
					case "String":
						element = document.getElementById(element);
						break;
					case "HTMLElement":
						break;
					case "HTMLCollection":
						element = element[0];
						break;
					case "NodeList":
						element = element[0];
						break;
					case "Function":
						element = element();
						break;
					default:
						throw "The element reference provided isn't a valid type.";
				}
			} else {
				element = document;
			}
			intervalTime = intervalTime || 15;
			let recurrenceLoop,
				mouseDown = false,
				movement = false;
			if (allowDefault) {
				if (!triggerTime || triggerTime == Infinity) {
					element.addEventListener("touchstart", function () {
						if (!mouseDown) {
							recurrenceLoop = setInterval(doStuff, intervalTime);
						}
					});
					element.addEventListener("touchmove", function () {
						clearInterval(recurrenceLoop);
						movement = true;
					});
					element.addEventListener("touchend", function () {
						if (!movement) {
							clearInterval(recurrenceLoop);
						} else {
							movement = false;
						}
					});
				} else {
					if (Standards.general.getType(triggerTime) != "Number") {
						throw "The trigger time isn't a number.";
					} else if (triggerTime < 0) {
						throw "Negative trigger times aren't allowed.";
					}
					let runTimes = 0;
					element.addEventListener("touchstart", function () {
						if (!mouseDown) {
							recurrenceLoop = setInterval(function () {
								if (++runTimes == Math.round(triggerTime / intervalTime)) {
									doStuff();
								}
							}, intervalTime);
						}
					});
					element.addEventListener("touchmove", function () {
						clearInterval(recurrenceLoop);
						runTimes = 0;
						movement = true;
					});
					element.addEventListener("touchend", function () {
						if (!movement) {
							clearInterval(recurrenceLoop);
							runTimes = 0;
						} else {
							movement = false;
						}
					});
				}
			} else {
				if (!triggerTime || triggerTime == Infinity) {
					element.addEventListener("touchstart", function (event) {
						//// event.preventDefault();
						if (!mouseDown) {
							recurrenceLoop = setInterval(doStuff, intervalTime);
						}
					});
					element.addEventListener("touchmove", function (event) {
						//// event.preventDefault();
						clearInterval(recurrenceLoop);
						movement = true;
					});
					element.addEventListener("touchend", function (event) {
						event.preventDefault();  // This prevents things like pressing buttons.
						if (!movement) {
							clearInterval(recurrenceLoop);
						} else {
							movement = false;
						}
					});
				} else {
					if (Standards.general.getType(triggerTime) != "Number") {
						throw "The trigger time isn't a number.";
					} else if (triggerTime < 0) {
						throw "Negative trigger times aren't allowed.";
					}
					let runTimes = 0;
					element.addEventListener("touchstart", function (event) {
						//// event.preventDefault();
						if (!mouseDown) {
							recurrenceLoop = setInterval(function () {
								if (++runTimes == Math.round(triggerTime / intervalTime)) {
									doStuff();
								}
							}, intervalTime);
						}
					});
					element.addEventListener("touchmove", function (event) {
						//// event.preventDefault();
						clearInterval(recurrenceLoop);
						runTimes = 0;
						movement = true;
					});
					element.addEventListener("touchend", function (event) {
						event.preventDefault();  // This prevents things like pressing buttons.
						if (!movement) {
							clearInterval(recurrenceLoop);
							runTimes = 0;
						} else {
							movement = false;
						}
					});
				}
			}
		},
		arguments: [element, doStuff, allowDefault, triggerTime, intervalTime]
	});
};

Standards.general.onTouchMove = function (element, doStuff, allowDefault) {
	/**
	does something when a screen touch is moved
	doesn't replace previous uses
	arguments:
		element = required; the HTML element to place the listener on
			types of values:
				falsy value = uses the "document" object
				HTML element = not converted
				string = uses the element with an ID of that string
				HTML collection = uses the first item of the collection
				node list = uses the first item of the list
				function = uses the result of the function
		doStuff = required; the stuff to do
		allowDefault = whether the default behavior of the action should be allowed
			default: false
	non-native functions = queue.add and getType
	*/
	Standards.general.queue.add({
		runOrder: "first",
		function: function (element, doStuff, allowDefault) {
			if (element) {
				switch (Standards.general.getType(element)) {
					case "String":
						element = document.getElementById(element);
						break;
					case "HTMLElement":
						break;
					case "HTMLCollection":
						element = element[0];
						break;
					case "NodeList":
						element = element[0];
						break;
					case "Function":
						element = element();
						break;
					default:
						throw "The element reference provided isn't a valid type.";
				}
			} else {
				element = document;
			}
			if (allowDefault) {
				element.addEventListener("touchmove", function (event) {
					doStuff(event);
				});
			} else {
				element.addEventListener("touchmove", function (event) {
					event.preventDefault();
					doStuff(event);
				});
			}
		},
		arguments: [element, doStuff, allowDefault]
	});
};

Standards.general.onTouchEnd = function (element, doStuff, allowDefault) {
	/**
	does something when a screen touch ends
	doesn't replace previous uses
	arguments:
		element = required; the HTML element to place the listener on
			types of values:
				falsy value = uses the "document" object
				HTML element = not converted
				string = uses the element with an ID of that string
				HTML collection = uses the first item of the collection
				node list = uses the first item of the list
				function = uses the result of the function
		doStuff = required; the stuff to do
		allowDefault = whether the default behavior of the action should be allowed
			default: false
	non-native functions = queue.add and getType
	*/
	Standards.general.queue.add({
		runOrder: "first",
		function: function (element, doStuff, allowDefault) {
			if (element) {
				switch (Standards.general.getType(element)) {
					case "String":
						element = document.getElementById(element);
						break;
					case "HTMLElement":
						break;
					case "HTMLCollection":
						element = element[0];
						break;
					case "NodeList":
						element = element[0];
						break;
					case "Function":
						element = element();
						break;
					default:
						throw "The element reference provided isn't a valid type.";
				}
			} else {
				element = document;
			}
			if (allowDefault) {
				element.addEventListener("touchend", function (event) {
					doStuff(event);
				});
			} else {
				element.addEventListener("touchend", function (event) {
					event.preventDefault();
					doStuff(event);
				});
			}
		},
		arguments: [element, doStuff, allowDefault]
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
		first item = text of the button
		second item = the function to run if that button is pressed
	The two-item arrays can be replaced with a single dictionary object.
		key = text of the button
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
				reject();
			} else if (pair.length != 2) {
				console.error("The item at position " + (index + 1) + " needs to have exactly two items.");
				reject();
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
				reject();
			} else if (Standards.general.getType(pair[1]) != "Function") {
				console.error("The pair at position " + (index + 1) + " doesn't have a function as the second value.");
				reject();
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
		let x = document.createElement("div");
		x.className = "x";
		x.textContent = "X";
		x.addEventListener("click", function () {
			container.dispatchEvent(new Event("dialog" + identifier + "Answered"));
			this.removeEventListener("click", arguments.callee);
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
	});
};

Standards.general.getFile = function (url, callback, convert) {  ////
	/**
	asynchronously retieves a file as a string using an XMLHttpRequest
	only files from the same domain can be retrieved without CORS
	local files can only be accessed from a file selector
	arguments:
		URL = required; the URL of the desired file
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
		} else if (new URL(url, window.location.href).protocol == "file:") {
			let input = document.createElement("input");
			input.type = "file";
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
							resolve();
						});
						reader.readAsDataURL(this.files[0]);
					} else {
						reader.addEventListener("loadend", function () {
							if (reader.error != null) {
								console.error(reader.error);
							}
							if (convert) {
								switch (url.slice(url.lastIndexOf(".") + 1).toLowerCase()) {
									case "html":
										callback(Standards.general.toHTML(reader.result));
										break;
									case "json":
										callback(JSON.parse(reader.result));
										break;
									case "txt":
										console.info("What do you think I'm supposed to convert a .txt file into?");
										callback(reader.result);
										break;
									default:
										console.warn("The file doesn't have a convertible file extension.");
										callback(reader.result);
								}
							} else {
								callback(reader.result);
							}
							resolve();
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
		} else {
			var file = new XMLHttpRequest();
			file.open("GET", url);  // Don't add false as an extra argument (browsers don't like it). (default: asynchronous=true)
			file.onreadystatechange = function () {
				if (file.readyState === 4) {  // Is it done?
					if (file.status === 200 || file.status === 0) {  // Was it successful?
						// file.responseXML might have something
						if (convert) {
							switch (url.slice(url.lastIndexOf(".") + 1).toLowerCase()) {
								case "html":
									callback(Standards.general.toHTML(file.responseText));
									break;
								case "json":
									callback(JSON.parse(file.responseText));
									break;
								case "txt":
									console.info("What do you think I'm supposed to convert a .txt file into?");
									callback(file.responseText);
									break;
								default:
									console.warn("The file doesn't have a convertible file extension.");
									callback(file.responseText);
							}
						} else {
							callback(file.responseText);
						}
						resolve();
					} else {
						console.error("The file couldn't be retieved.");
					}
				}
			}
			file.send();
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
	particularly useful when receiving information encoded into a string (as happens within Standards.general.storage.____.recall())
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
			path[decodeURIComponent(key[key.length-1])] = decodeURIComponent(value);
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

Standards.general.storage = {};

Standards.general.storage.session = {
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
							} catch {
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

Standards.general.storage.local = {
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
							} catch {
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

Standards.general.storage.location = Standards.general.storage.local;
// allows one reference to be used for any storage location
// especially useful for switching to session storage for testing

Standards.general.storage.server = {
	database: typeof firebase!="undefined" && firebase.firestore ? firebase.firestore() : undefined,  // Using "typeof" is the only way to check if a non-argument variable exists without an error.
	defaultLocation: "",
	user: undefined,  //// firebase.auth().currentUser
	checkCompatibility: function (shouldNotCheckUser) {
		if (Standards.general.storage.server.database === undefined) {
			alert("There's no server to handle this action.");
			throw "Firebase or Firestore doesn't exist.";
		}
		if (window.location.protocol != "http:" && window.location.protocol != "https:") {
			alert("Access to the server isn't allowed from this URL.");
			throw 'The URL doesn\'t use the protocol "http" or "https".';
		}
		if (!shouldNotCheckUser && !Standards.general.storage.server.user) {
			alert("That action isn't allowed without logging in.");
			console.warn("The action couldn't be completed because the user wasn't logged on.");
			return false;
		}
		return true;
	},
	formatLocation: function (location, key) {
		/**
		formats the location
		preceding a location with a slash ("/") will allow location setting from the top of the user's directory
		".." goes up a level from the default location
		non-native functions = getType
		*/
		if (location === undefined) {
			location = Standards.general.storage.server.defaultLocation;
		} else if (Standards.general.getType(location) == "String") {
			if (location === "" || location[0] == "/") {
				if (location == "/" || location === "") {
					alert("An invalid storage location was given");
					throw "An absolute storage location was indicated but not provided.";
				} else {
					location = location.slice(1);
				}
			} else {
				let prelocation = Standards.general.storage.server.defaultLocation.split("/");
				while (location.slice(0, 2) == "..") {
					prelocation.pop();
					location = location.slice(3);
				}
				if (location === "") {
					location = prelocation.join("/");
				} else {
					location = prelocation.join("/") + "/" + location;
				}
			}
		} else {
			alert("An invalid storage location was given");
			throw "The location given wasn't a string.";
		}
		if (Standards.general.getType(key) == "String" && key.split("/").length > 1) {
			if (key[0] === "/") {
				throw "An invalid key was given.";
			} else {
				key = key.split("/");
				key.pop();
				location = location + "/" + key.join("/");
			}
		}
		return location;
	},
	getReference: function (location) {  //// make all location setting done here
		/**
		creates a storage reference based on a provided location
		different paths are separated by slashes ("/")
		preceding a location with a tilde ("~") will allow absolute location setting (not within a user's directory)
		(no optimization for user storage)
		uses Google Firebase
		non-native functions = getType
		*/
		/*  // This is from when storage switched between collections and documents.
		let reference = Standards.general.storage.server.database;
		if (!location) {
			location = Standards.general.storage.server.defaultLocation;
			reference = reference.collection("users").doc(Standards.general.storage.server.user.uid);
		} else if (Standards.general.getType(location) == "String") {
			if (location[0] == "~") {
				if (location == "~") {
					alert("An invalid storage location was given");
					throw "An absolute storage location was indicated but not provided.";
				} else {
					location = location.slice(1);
				}
			} else {
				reference = reference.collection("users").doc(Standards.general.storage.server.user.uid);
			}
		} else {
			alert("The action couldn't be completed.");
			throw "The provided location is an invalid type.";
		}
		if (location != "") {
			location.split("/").forEach(function (place, index) {
				if (index % 2 == 0) {
					reference = reference.collection(place);
				} else {
					reference = reference.doc(place);
				}
			});
		}
		return reference;
		*/
		let reference = Standards.general.storage.server.database;
		if (!location) {
			location = Standards.general.storage.server.defaultLocation;
			reference = reference.collection("<collection>").doc("users").collection("<collection>").doc(Standards.general.storage.server.user.uid);
		} else if (Standards.general.getType(location) == "String") {
			if (location[0] == "~") {
				if (location == "~") {
					alert("An invalid storage location was given");
					throw "An absolute storage location was indicated but not provided.";
				} else {
					location = location.slice(1);
				}
			} else {
				reference = reference.collection("<collection>").doc("users").collection("<collection>").doc(Standards.general.storage.server.user.uid);
			}
		} else {
			alert("The action couldn't be completed.");
			throw "The provided location is an invalid type.";
		}
		location.split("/").forEach(function (place) {
			reference = reference.collection("<collection>").doc(place);
		});
		return reference;
	},
	signUp: function (methods) {
		Standards.general.storage.server.checkCompatibility(true);
		let buttons = {};
		if (methods.includes("Google")) {
			buttons.Google = function () {
				firebase.auth().signInWithRedirect(new firebase.auth.GoogleAuthProvider());
			};
		}
		if (methods.includes("Anonymous")) {
			buttons.Anonymous = function () {
				firebase.auth().signInAnonymously();
			};
		}
		buttons.Cancel = function () { return; };
		Standards.general.makeDialog("Sign up with your prefered sign-in provider.", buttons);
	},
	signIn: function (methods) {
		Standards.general.storage.server.checkCompatibility(true);
		let buttons = {};
		if (methods.includes("Google")) {
			buttons.Google = function () {
				firebase.auth().signInWithRedirect(new firebase.auth.GoogleAuthProvider());
			};
		}
		if (methods.includes("Anonymous")) {
			buttons.Anonymous = function () {
				firebase.auth().signInAnonymously();
			};
		}
		buttons.Cancel = function () { return; };
		Standards.general.makeDialog("Sign in with your prefered sign-in provider.", buttons);
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
		if (Standards.general.storage.server.checkCompatibility()) {
			//// do stuff
		}
	},
	store: function (key, item, location, callback) {
		if (Standards.general.storage.server.checkCompatibility()) {
			location = Standards.general.storage.server.formatLocation(location, key);
			if (Standards.general.getType(key) == "String" && key.split("/").length > 1) {
				key = key.split("/")[key.split("/").length-1];
			}
			let reference = Standards.general.storage.server.database;
			if (!location) {
				location = Standards.general.storage.server.defaultLocation;
				reference = reference.collection("<collection>").doc("users").collection("<collection>").doc(Standards.general.storage.server.user.uid);
			} else if (Standards.general.getType(location) == "String") {
				if (location[0] == "~") {
					if (location == "~") {
						alert("An invalid storage location was given");
						throw "An absolute storage location was indicated but not provided.";
					} else {
						location = location.slice(1);
					}
				} else {
					reference = reference.collection("<collection>").doc("users").collection("<collection>").doc(Standards.general.storage.server.user.uid);
				}
			} else {
				alert("The action couldn't be completed.");
				throw "The provided location is an invalid type.";
			}
			location.split("/").forEach(function (place) {
				reference = reference.collection("<collection>").doc(place);
				reference.set({ "<document>": "exists" }, { merge: true });
			});
			if (key == null) {
				if (Standards.general.getType(item) == "Object") {
					reference.set(item, { merge: true }).then(function () {
						if (callback) {
							callback()/*.catch(function (error) {
								console.error("There was a problem running the callback.");
								console.error(error);
							})*/;
						}
					}).catch(function (error) {
						console.error("There was an error storing the information.");  // Putting an extra error here allows origin tracing when the error happens in Firebase.
						console.error(error);
					});
				} else {
					console.error("The item to store wasn't an object.");
				}
			} else {
				reference.set({
					[key]: item
				}, { merge: true }).then(function () {
					if (callback) {
						callback()/*.catch(function (error) {
							console.error("There was a problem running the callback.");
							console.error(error);
						})*/;
					}
				}).catch(function (error) {
					console.error("There was an error storing the information.");  // Putting an extra error here allows origin tracing when the error happens in Firebase.
					console.error(error);
				});
			}
			/*  // This was for handling collections.
			if (Standards.general.getType(item) == "Object") {
				key = key ? "/"+key : "";
				Standards.general.storage.server.getReference(location+key).set(item).then(function () {
					if (callback) {
						callback()/*.catch(function (error) {
							console.error("There was a problem running the callback.");
							console.error(error);
						})*;
					}
				}).catch(function (error) {
					alert("The information couldn't be stored.");
					console.error("There was an error storing the information.");
					console.error(error);
				});
			} else {
				alert("The information couldn't be stored.");
				throw "The item to be stored wasn't an object.";
			}
			*/
		}
	},
	recall: function (key, location, callback) {
		if (!Standards.general.storage.server.checkCompatibility()) {
			return;
		}
		location = Standards.general.storage.server.formatLocation(location, key);
		if (Standards.general.getType(key) == "String" && key.split("/").length > 1) {
			key = key.split("/")[key.split("/").length-1];
		}
		if (key == null) {
			Standards.general.storage.server.getReference(location).get().then(function (doc) {
				if (doc.exists) {
					let data = doc.data();
					delete data["<document>"];
					callback(data)/*.catch(function (error) {
						console.error("There was a problem running the callback.");
						console.error(error);
					})*/;
				} else {
					console.warn("An attempt was made to access a non-existent document.");
				}
			}).catch(function (error) {
				console.log("There was an error retrieving the information.");  // Putting an extra error here allows origin tracing when the error happens in Firebase.
				console.error(error);
			});
		} else {
			Standards.general.storage.server.getReference(location).get().then(function (doc) {
				if (doc.exists) {
					callback(doc.data()[key])/*.catch(function (error) {
						console.error("There was a problem running the callback.");
						console.error(error);
					})*/;
				} else {
					console.warn("An attempt was made to access a non-existent document.");
				}
			}).catch(function (error) {
				console.log("There was an error retrieving the information.");  // Putting an extra error here allows origin tracing when the error happens in Firebase.
				console.error(error);
			});
		}
		/*  // This was for handling collections.
		Standards.general.storage.server.getReference(location).get().then(function (snapshot) {
			snapshot.forEach(function (doc) {
				if (doc.id == key) {
					callback(doc.data())/*.catch(function (error) {
						console.error("There was a problem running the callback.");
						console.error(error);
					})*;
				}
			});
		}).catch(function (error) {
			alert("The information couldn't be retrieved.");
			console.error("An error occurred during recall.");
			console.error(error);
		});
		*/
	},
	forget: function (key, location, callback) {
		if (!Standards.general.storage.server.checkCompatibility()) {
			return;
		}
		location = Standards.general.storage.server.formatLocation(location, key);
		if (Standards.general.getType(key) == "String" && key.split("/").length > 1) {
			key = key.split("/")[key.split("/").length-1];
		}
		let reference = Standards.general.storage.server.getReference(location);
		if (key === null) {
			reference.collection("<collection>").get().then(function (collectionProbe) {
				if (collectionProbe.docs.length > 0) {  // if there's sub-documents
					let listener = new Standards.general.Listenable();
					listener.value = 1;
					listener.addEventListener("change", function (value) {
						if (value == 0) {  // once all items have been deleted
							if (callback) {
								callback()/*.catch(function (error) {
									console.error("There was a problem running the callback.");
									console.error(error);
								})*/;
							}
							listener.removeEventListener("change", arguments.callee);
						}
					});
					/// when a new document is encountered, listener.value is incremented
					/// when a document is deleted, listener.value is decremented
					function deleteCollection(collection) {
						Standards.general.forEach(collection.docs, function (doc) {
							listener.value++;
							doc.ref.collection("<collection>").get().then(function (subcollection) {
								if (subcollection.docs.length > 0) {  // if there's sub-sub-documents
									deleteCollection(subcollection);
								}
								doc.ref.delete().then(function () {
									listener.value--;
								}).catch(function (error) {
									console.error("The information couldn't be deleted.");
									console.error(error);
								});
							});
						});
					}
					deleteCollection(collectionProbe);
					reference.delete().then(function () {
						listener.value--;
					}).catch(function (error) {
						console.error("The information couldn't be deleted.");
						console.error(error);
					});
				} else {
					reference.delete().then(function () {
						if (callback) {
							callback()/*.catch(function (error) {
								console.error("There was a problem running the callback.");
								console.error(error);
							})*/;
						}
					}).catch(function (error) {
						console.error("The information couldn't be deleted.");
						console.error(error);
					});
				}
			});
		} else {
			reference.update({
				[key]: firebase.firestore.FieldValue.delete()
			}).then(function () {
				if (callback) {
					callback()/*.catch(function (error) {
						console.error("There was a problem running the callback.");
						console.error(error);
					})*/;
				}
			}).catch(function (error) {
				console.error("The information couldn't be deleted.");
				console.error(error);
			});
		}
	},
	move: function (oldPlace, newPlace, location, callback) {
		////
	},
	list: function (location, callback) {
		if (!Standards.general.storage.server.checkCompatibility()) {
			return;
		}
		location = Standards.general.storage.server.formatLocation(location);
		let reference = Standards.general.storage.server.getReference(location);
		reference.collection("<collection>").get().then(function (collectionProbe) {
			if (collectionProbe.docs.length > 0) {  // if there's sub-documents
				let keyList = [];
				let listener = new Standards.general.Listenable();
				listener.value = 1;
				listener.addEventListener("change", function (value) {
					if (value == 0) {  // once all items have been listed
						if (callback) {
							callback(keyList)/*.catch(function (error) {
								console.error("There was a problem running the callback.");
								console.error(error);
							})*/;
						}
						listener.removeEventListener("change", arguments.callee);
					}
				});
				/// when a new document is encountered, listener.value is incremented
				/// when a document's keys have been iterated, listener.value is decremented
				function exploreCollection(collection, path) {
					Standards.general.forEach(collection.docs, function (doc) {
						listener.value++;
						doc.ref.collection("<collection>").get().then(function (subcollection) {
							if (subcollection.docs.length > 0) {  // if there's sub-sub-documents
								exploreCollection(subcollection, path + doc.id + "/");
							}
							Standards.general.forEach(doc.data(), function (value, key) {
								if (key != "<document>") {
									keyList.push(path + doc.id + "/" + key);
								}
							});
							listener.value--;
						});
					});
				}
				exploreCollection(collectionProbe, "");
				reference.get().then(function (doc) {
					if (Object.keys(doc).length > 1) {  // if the document has any field values
						Standards.general.forEach(doc.data(), function (value, key) {
							if (key != "<document>") {
								keyList.push(key);
							}
						});
					}
					listener.value--;
				}).catch(function (error) {
					alert("The list of information couldn't be retieved.");
					console.error("List retrieval failed.");  // Putting an extra error here allows origin tracing when the error happens in Firebase.
					console.error(error);
				});
			} else {  // if there's not sub-documents
				reference.get().then(function (doc) {
					let keyList = [];
					if (doc.exists) {
						Standards.general.forEach(doc.data(), function (value, key) {
							if (key != "<document>") {
								keyList.push(key);
							}
						});
						callback(keyList)/*.catch(function (error) {
							console.error("There was a problem running the callback.");
							console.error(error);
						})*/;
					} else {
						console.warn("An attempt was made to access a non-existent document.");
						callback(keyList)/*.catch(function (error) {
							console.error("There was a problem running the callback.");
							console.error(error);
						})*/;
					}
				}).catch(function (error) {
					alert("The list of information couldn't be retieved.");
					console.error("List retrieval failed.");  // Putting an extra error here allows origin tracing when the error happens in Firebase.
					console.error(error);
				});
			}
		});
		/*
		if (location.split("/")[location.split("/").length - 1] == "<collection>") {
			location.splice(location.split("/").length - 1, 1);
			Standards.general.storage.server.getReference(location).collection("<collection>").get().then(function (snapshot) {
				let keyList = [];
				if (snapshot.empty) {
					console.warn("An attempt was made to access a non-existent collection.");
					callback(keyList)/*.catch(function (error) {
						console.error("There was a problem running the callback.");
						console.error(error);
					})*;
				} else {
					Standards.general.forEach(snapshot.docs, function (doc) {
						keyList.push(doc.id);
					});
					callback(keyList)/*.catch(function (error) {
						console.error("There was a problem running the callback.");
						console.error(error);
					})*;
				}
			}).catch(function (error) {
				alert("The list of information couldn't be retieved.");
				console.error(error);
			});
		} else {
			Standards.general.storage.server.getReference(location).get().then(function (doc) {
				let keyList = [];
				if (doc.exists) {
					Standards.general.forEach(doc.data(), function (value, key) {
						keyList.push(key);
					});
					callback(keyList)/*.catch(function (error) {
					console.error("There was a problem running the callback.");
					console.error(error);
				})*;
				} else {
					console.warn("An attempt was made to access a non-existent document.");
					callback(keyList)/*.catch(function (error) {
					console.error("There was a problem running the callback.");
					console.error(error);
				})*;
				}
			}).catch(function (error) {
				alert("The list of information couldn't be retieved.");
				console.error("List retrieval failed.");  // Putting an extra error here allows origin tracing when the error happens in Firebase.
				console.error(error);
			});
		}
		*/
	}
};

/*
Standards.general.storage.server = {
	"username": null,
	"password": null,
	"passwordLocation": null,
	"storageLocation": "volatileserver.appspot.com",
	"notificationType": "alert",
	"store": function (key, item, location) {
		// /**
		stores a user's information
		creators of information are the owners
		non-native functions = http_build_query() and parse_str()
		// *
		location = location || Standards.general.storage.server.storageLocation;
		var message = {
			"username": Standards.general.storage.server.username,
			"password": Standards.general.storage.server.password,
			"action": "store",
			"location": "gs://" + location + "/" + key,
			"information": item
		};
		if (Standards.general.storage.server.passwordLocation != null) {
			message["pwd_path"] = Standards.general.storage.server.passwordLocation;
		}
		var file = new XMLHttpRequest();
		file.open("POST", "https://" + location);
		file.setRequestHeader("Content-type", "application/x-www-form-urlencoded");  // This is the encoding type.  //// text/html
		file.onreadystatechange = function () {
			if(file.readyState === 4) {
				if(file.status === 200 || file.status == 0) {
					var response = Standards.general.parse_str(file.responseText);
					var notification = Standards.general.storage.server.notificationType.toLowerCase();
					if (response.hasOwnProperty("errors")) {
						response.errors.forEach(function (error) {
							console.error(error);
						});
					}
					if (response.hasOwnProperty("warnings")) {
						response.warnings.forEach(function (warning) {
							if (notification == "alert") {
								alert(warning);
							} else if (notification == "return") {
								// only changes things later
							} else if (notification == "none") {
								// does nothing
							} else {
								console.error(notification + " is an invalid type of notification.");
							}
						});
					}
					if (notification == "return") {
						return response;
					}
				}
			}
		}
		// file.onload might also be able to be used without the states and statuses
		file.send(Standards.general.http_build_query(message));
	},
	"recall": function (key, location) {
		// /**
		recalls a user's information (if they have the correct permissions)
		non-native functions = http_build_query() and parse_str()
		// *
		location = location || Standards.general.storage.server.storageLocation;
		var message = {
			"username": Standards.general.storage.server.username,
			"password": Standards.general.storage.server.password,
			"action": "recall",
			"location": "gs://" + location + "/" + key
		};
		if (Standards.general.storage.server.passwordLocation != null) {
			message["pwd_path"] = Standards.general.storage.server.passwordLocation;
		}
		var file = new XMLHttpRequest();
		file.open("POST", "https://" + location);
		file.setRequestHeader("Content-type", "application/x-www-form-urlencoded");  // This is the encoding type.  //// text/html
		file.onreadystatechange = function () {
			if(file.readyState === 4) {
				if(file.status === 200 || file.status == 0) {
					var response = Standards.general.parse_str(file.responseText);
					var notification = Standards.general.storage.server.notificationType.toLowerCase();
					if (response.hasOwnProperty("errors")) {
						response.errors.forEach(function (error) {
							console.error(error);
						});
					}
					if (response.hasOwnProperty("warnings")) {
						response.warnings.forEach(function (warning) {
							if (notification == "alert") {
								alert(warning);
							} else if (notification == "return") {
								// only changes things later
							} else if (notification == "none") {
								// does nothing
							} else {
								console.error(notification + " is an invalid type of notification.");
							}
						});
					}
					if (notification == "return") {
						return response;
					} else {
						return response.value;
					}
				}
			}
		}
		// file.onload might also be able to be used without the states and statuses
		file.send(Standards.general.http_build_query(message));
	},
	"forget": function (key, location) {
		// /**
		deletes a user's information (if they have owner permissions)
		non-native functions = http_build_query() and parse_str()
		// *
		location = location || Standards.general.storage.server.storageLocation;
		var message = {
			"username": Standards.general.storage.server.username,
			"password": Standards.general.storage.server.password,
			"action": "forget",
			"location": "gs://" + location + "/" + key
		};
		if (Standards.general.storage.server.passwordLocation != null) {
			message["pwd_path"] = Standards.general.storage.server.passwordLocation;
		}
		var file = new XMLHttpRequest();
		file.open("POST", "https://" + location);
		file.setRequestHeader("Content-type", "application/x-www-form-urlencoded");  // This is the encoding type.  //// text/html
		file.onreadystatechange = function () {
			if(file.readyState === 4) {
				if(file.status === 200 || file.status == 0) {
					var response = Standards.general.parse_str(file.responseText);
					var notification = Standards.general.storage.server.notificationType.toLowerCase();
					if (response.hasOwnProperty("errors")) {
						response.errors.forEach(function (error) {
							console.error(error);
						});
					}
					if (response.hasOwnProperty("warnings")) {
						response.warnings.forEach(function (warning) {
							if (notification == "alert") {
								alert(warning);
							} else if (notification == "return") {
								// only changes things later
							} else if (notification == "none") {
								// does nothing
							} else {
								console.error(notification + " is an invalid type of notification.");
							}
						});
					}
					if (notification == "return") {
						return response;
					}
				}
			}
		}
		// file.onload might also be able to be used without the states and statuses
		file.send(Standards.general.http_build_query(message));
	},
	"list": function (location) {
		// /**
		lists a user's information
		non-native functions = http_build_query() and parse_str()
		// *
	},
	"permissions": function (user, level, key, location) {
		// /**
		changes the permissions of other users to the information owned by you
		non-native functions = http_build_query() and parse_str()
		// *
	}
};
*/

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
				return "rgb(" + finalColors.join(", ") + ")";
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
				if (element.tagName == "TABLE") {  // This might have to be capitalized.
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
					if (isNaN(conversion)) {
						element.style.backgroundColor = backgroundColor(conversion());
					} else {
						element.style.backgroundColor = backgroundColor(conversion);
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

if (!(Standards.general.options.runAuthCode == false) && typeof firebase != "undefined" && firebase.firestore) {
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
		Standards.general.storage.server.user = person;
	});
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
					if (box.nextSibling && box.nextSibling.nodeName == "LABEL") {
						box.nextSibling.addEventListener("click", function () {
							if (box == previouslyChecked) {
								box.checked = false;
								previouslyChecked = undefined;
							} else {
								previouslyChecked = box;
							}
						});
					}
				});
			}
		});
		
		// interprets <note-> tags
		/*
		var noteNumber = 1;
		document.getElementsByTagName("note-").forEach(function (note, index, notes) {
			if (note.innerHTML[0] == "[" && note.innerHTML[note.innerHTML.length-1] == "]") {
				var reference = document.getElementById(note.innerHTML.slice(1,-1));
				note.title = reference.title;
				note.innerHTML = reference.innerHTML;
			} else {
				note.title = note.innerHTML;
				note.innerHTML = "<sup>[" + noteNumber + "]</sup>";
				noteNumber++;
			}
		});
		*/

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
		
		// gives the login/user buttons functionality
		if (document.getElementById("signIn")) {  // if there's a signIn button
			document.getElementById("signIn").addEventListener("click", function () {
				Standards.general.storage.server.signIn(["Google"]);
			});
		}
		if (document.getElementById("signUp")) {  // if there's a signUp button
			document.getElementById("signUp").addEventListener("click", function () {
				Standards.general.storage.server.signUp(["Google"]);
			});
		}
		if (document.getElementById("userSettings")) {  // if there's a userSettings button
			document.getElementById("userSettings").addEventListener("click", function () {
				Standards.general.makeDialog("You're currently signed in as " + Standards.general.storage.server.user.displayName +
					"<br>with the email " + Standards.general.storage.server.user.email + ".");
			});
		}
		if (document.getElementById("signOut")) {  // if there's a signOut button
			document.getElementById("signOut").addEventListener("click", Standards.general.storage.server.signOut);
		}

		// adds page jumping capabilities
		Standards.general.forEach(document.getElementsByClassName("page-jump-sections"), function (division) {
			let contents = document.createElement("div");
			contents.className = "page-jump-list";
			contents.innerHTML = "<h2>Jump to:</h2>";
			let sections = division.getElementsByTagName("h2");
			let toTop = document.createElement("p");  // This has to be a <p><a></a></p> rather than just a <a></a> because, otherwise, "To top" has the possibility of appearing in-line.
			toTop.className = "to-top";
			toTop.innerHTML = '<a href="#">To top</a>';
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
			link.href = window.location.href.split("#")[1].trim();
			link.click();
		}
	}
	
	Standards.general.queue.run();
	Standards.general.finished = true;
	window.dispatchEvent(new Event("finished"));  // This can't be CustomEvent or else it won't work on any version of Internet Explorer.
});

// remember new Function(), function*, and ``
