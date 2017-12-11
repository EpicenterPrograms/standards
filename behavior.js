if (Standards) {
	if (typeof Standards != "object") {
		var Standards = {};
		console.warn("typeof Standards is not an object");
	}
} else {
	var Standards = {};
}

if (Standards.options) {
	if (typeof Standards.options != "object") {
		Standards.options = {};
		console.warn("typeof Standards.options is not an object");
	}
} else {
	Standards.options = {};
};
	/**
	allows specifications to be added if the variable is already present
	(otherwise uses default values and settings)
	valid options =
		"automation" : "none", "basic", "full"
			runs a corresponding amount of code after defining everything
			default = "full"
		"icon" : URL
			gives the window the icon located at the URL
			default = a color-changing circle
		"navigation" : URL  ****deprecated****
			fills a <nav> section with the (HTML) document located at the URL
			default = none
		"simplification" : true, false  ****deprecated****
			determines whether "Standards" should also be imported as "S"
			default = false
	*/

Standards.help = function(item, part) {
	/**
	This prints out the source code of what you want to learn about
	which also includes my comments on usage.
	The part allows you pick a part of documentation.
		"all", "docstring", "function", or "non-natives"
	non-native functions = String.splice()
	*/
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
				content = content.splice(content.indexOf("/**"), content.indexOf("*/")+2);
			}
			break;
		case "non-natives":
			if (content.indexOf("non-native functions") > -1) {
				content = content.slice(content.lastIndexOf("non-native functions",content.indexOf("*/")), content.indexOf("*/"));
				content = content.slice(content.indexOf("=")+2, content.indexOf("\n"));
			} else {
				content = "undefined"
			}
	}
	console.info(content);
	return content;
};

Standards.finished = false;  // for keeping track of whether this script is finished running

Standards.identifier = 1;  // for anything that may need to have specific targeting

Standards.audio = new (window.AudioContext || window.webkitAudioContext || Object)();  // used in Sound()
	// Safari is dumb and doesn't like any form of AudioContext
	// Standards.audio.close() gets rid of the instance (if you used multiple instances, you'd max out at around 6)

if (Standards.queue) {
	if (Standards.queue instanceof Array) {
		Standards.queue.forEach(function(item, index) {
			if (typeof item != "object") {
				Standards.queue.splice(index, 1);
				console.warn("The item at the index of " + index + " in Standards.queue is not an object.");
			}
		});
	} else {
		Standards.queue = [];
		console.warn("Standards.queue is not an instance of an array");
	}
} else {
	Standards.queue = [];
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
	all functions in this script that make use of Standards.queue have a "first" runOrder
	example usage:
		var Standards = {};
		Standards.queue = [{"runOrder":"first", "function":pageJump, "arguments":["divID"]}];
	*/
Standards.queue.run = function() {
	/**
	runs the functions in the queue
	non-native functions = none
	*/
	Standards.queue.forEach(function(fn) {
		if (typeof fn.function == "string") {
			throw 'The value of "function" must not be a string.';
		}
		if (fn.runOrder == "first") {
			fn.function.apply(window, fn.arguments);
		}
	});
	Standards.queue.forEach(function(fn) {
		if (fn.runOrder == "later") {
			fn.function.apply(window, fn.arguments);
		}
	});
	Standards.queue.forEach(function(fn, index) {
		if (fn.runOrder == "last") {
			fn.function.apply(window, fn.arguments);
		} else if (!(fn.runOrder == "first" || fn.runOrder == "later")) {
			console.warn("The item at the index of " + index + " in Standards.queue wasn't run because it doesn't have a valid runOrder.");
		}
	});
	while (Standards.queue.length > 0) {  // gets rid of all of the items in Standards.queue (Standards.queue = []; would get rid of the functions as well)
		Standards.queue.pop();
	}
	/// The items in Standards.queue can't be deleted as they're run because Array.forEach() doesn't copy things like my .forEach() functions do.
	/// (Only every other item would be run because an item would be skipped every time the preceding item was deleted.)
};
Standards.queue.add = function(object) {
	/**
	adds an item to the queue
	non-native functions = Standards.queue.run()
	(Standards.finished also isn't native)
	*/
	Standards.queue.push(object);
	if (Standards.finished) {
		Standards.queue.run();
	}
};

Standards.Sound = function(specs) {
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
	playing (shouldn't be changed) = whether a sound is being played
	times for all subfunctions are in milliseconds
	*/
	var sound = this,
		osc1 = Standards.audio.createOscillator(),
		osc2 = Standards.audio.createOscillator(),
		gain1 = Standards.audio.createGain(),
		gain2 = Standards.audio.createGain(),
		playQueue = [];
	this.identifier = Standards.identifier++;
	this.frequency = 440;
	this.volume = 0
	this.waveform = "sine";
	this.modulation = 0;
	this.hertzChange = 0;
	this.changeWave = "sine";
	for (var spec in specs) {
		this[spec] = specs[spec];
	}
	this.playing = false;
	function setValues(time, shouldSetPlaying) {
		time = time===undefined ? 0 : time;
		shouldSetPlaying = shouldSetPlaying===undefined ? true : shouldSetPlaying;
		if (time > 0) {
			if (shouldSetPlaying) {
				setTimeout(function() {
					sound.playing = sound.volume==0 ? false : true;
				}, time);
			}
			time /= 1000;  // ramps use time in seconds
			if (sound.volume == 0) {
				gain1.gain.exponentialRampToValueAtTime(.0001, Standards.audio.currentTime + time);  // exponential ramping doesn't work with 0s
				setTimeout(function() {
					gain1.gain.value = 0;
				}, time*1000);
			} else {
				gain1.gain.exponentialRampToValueAtTime(sound.volume, Standards.audio.currentTime + time);
			}
			osc1.frequency.linearRampToValueAtTime(sound.frequency, Standards.audio.currentTime + time);
			gain2.gain.linearRampToValueAtTime(sound.hertzChange, Standards.audio.currentTime + time);
			osc2.frequency.linearRampToValueAtTime(sound.modulation, Standards.audio.currentTime + time);;
			//// The second set of transitions are linear because I want them to be able to have values of 0?
		} else if (time == 0) {
			gain1.gain.value = sound.volume;
			osc1.frequency.value = sound.frequency;
			gain2.gain.value = sound.hertzChange;
			osc2.frequency.value = sound.modulation;
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
	setValues();
	gain1.connect(Standards.audio.destination);
	osc1.connect(gain1);
	gain2.connect(osc1.frequency);
	osc2.connect(gain2);
	osc1.start();
	osc2.start();
	
	this.start = function(time, volume, shouldSetPlaying) {
		/**
		starts/unmutes the tone
		*/
		shouldSetPlaying = shouldSetPlaying===undefined ? true : shouldSetPlaying;
		if (shouldSetPlaying) {
			sound.playing = true;
		}
		time = time===undefined ? 0 : time;
		gain1.gain.value = sound.volume+.0001;
		sound.volume = volume || 1;  // This doesn't allow you to set the volume to 0 (and rightfully so).
		gain1.gain.exponentialRampToValueAtTime(sound.volume, Standards.audio.currentTime + time/1000);
	};
	this.stop = function(time, shouldSetPlaying) {
		/**
		stops/mutes the tone
		*/
		time = time===undefined ? 0 : time;
		shouldSetPlaying = shouldSetPlaying===undefined ? true : shouldSetPlaying;
		gain1.gain.exponentialRampToValueAtTime(.0001, Standards.audio.currentTime + time/1000);
		setTimeout(function() {
			gain1.gain.value = 0;
			sound.volume = 0;
			if (shouldSetPlaying) {
				sound.playing = false;
				window.dispatchEvent(new Event(sound.identifier+"StoppedPlaying"));
			}
		}, time);
	};
	this.change = function(property, value, time, shouldSetPlaying) {
		/**
		changes a property of the tone
		*/
		sound[property] = value;
		setValues(time, shouldSetPlaying);
	};
	this.play = function(noteString, newDefaults, callback) {
		/**
		plays a song based on notes you put in a string
		*/
		if (sound.playing) {
			playQueue.push([noteString, newDefaults, callback]);
			if (playQueue.length == 1) {
				window.addEventListener(sound.identifier+"StoppedPlaying", function() {
					sound.play(playQueue[0][0], playQueue[0][1], playQueue[0][2]);
					window.removeEventListener(sound.identifier+"StoppedPlaying", arguments.callee);
				});
			}
		} else if (arguments.length > 0) {
			if (playQueue.length > 0) {
				playQueue.splice(0, 1);
			}
			if (playQueue.length > 0) {
				window.addEventListener(sound.identifier+"StoppedPlaying", function() {
					sound.play(playQueue[0][0], playQueue[0][1], playQueue[0][2]);
					window.removeEventListener(sound.identifier+"StoppedPlaying", arguments.callee);
				});
			}
			noteString = noteString.trim().replace(/([A-G]{1}(?:#|N|b)?)|[a-g]/g, function(foundNote, properNote) {
				// makes sure the string is formatted correctly even when people want to be lazy
				if (foundNote == properNote) {
					return properNote;
				} else {
					return foundNote.toUpperCase();
				}
			});
			var defaults = {
				volume: 1,
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
						// maybe followed by the letter "s" which would have to be followed by a letter A-G
					if (note == null) {
						//// make a way for people to just put frequencies
						console.error("An attempt was made to play an invalid note.");
						return null;
					} else {
						note = note[0];
						let original = note;
						if (note.search(/#|N|b/) == -1) {  // if there's not a sharp, natural, or flat indication
							switch(defaults.key) {
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
							note = note.slice(0,2) + "4" + note.slice(2);
						}
						return {formatted: note, original: original};
					}
				} else {
					console.error("The provided index exceeded the length of the string.");
					return undefined;
				}
			}
			function noteToFrequency(note) {
				switch(note) {
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
				index = index===undefined ? 0 : index;
				if (index < noteString.length) {
					note = format(index);
					if (note == undefined) {
						// This should never happen.
					} else if (note == null) {
						interpret(index+1);
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
							setTimeout(function() {
                                if (slur == 0) {
    								sound.stop(defaults.decay, false);
	    							setTimeout(function() {
		    							interpret(index + originalLength + afterNote.length);
			    					}, defaults.decay + rest);
                                } else {
                                    sound.change("frequency", noteToFrequency(format(index+originalLength+afterNote.length).formatted), defaults.decay+slur, false);
                                    setTimeout(function() {
		    							interpret(index + originalLength + afterNote.length);
			    					}, defaults.decay + slur);
                                }
				  			}, defaults.attack + duration);
						} else {
							setTimeout(function() {
								sound.stop(defaults.decay, false);
								setTimeout(function() {  // makes sure the finishing block of code is called
									interpret(index + note.original.length);
								}, defaults.decay);
							}, defaults.attack + defaults.noteLength);
						}
					}
				} else {  // called when the song is finished
					sound.playing = false;
					window.dispatchEvent(new Event(sound.identifier+"StoppedPlaying"));
					if (callback) {
						callback();
					}
				}
			}
			sound.playing = true;
			interpret();
		} else {  // when you inevitably use Sound.play() instead of Sound.start() like you should have
			sound.start();
			console.warn("Sound.play() was called without any parameters.\nSound.start() was used instead.");
		}
	};
	this.destroy = function(time) {  // gets rid of the tone (can't be used again)
		time = time===undefined ? 0 : time;
		gain1.gain.exponentialRampToValueAtTime(.0001, Standards.audio.currentTime + time/1000);
		setTimeout(function() {
			sound.playing = false;
			osc1.stop();
			osc2.stop();
			osc2.disconnect(gain2);
			gain2.disconnect(osc1.frequency);
			osc1.disconnect(gain1);
			gain1.disconnect(Standards.audio.destination);
		}, time);
	};
};

Standards.Listenable = function () {
	/**
	creates an object which has a "value" property which can be listened to
	*/
	return {
		internalValue: undefined,
		callbacks: [],
		get value() {
			let self = this;
			setTimeout(function () {
				let index = 0;
				while (index < self.callbacks.length) {
					if (self.callbacks[index][0] == "get") {
						self.callbacks[index][1]();
					}
					if (self.callbacks[index] !== undefined && self.callbacks[index][2]) {  // The first test is needed in case a callback removes a listener.
						self.callbacks.splice(index, 1);
					} else {
						index++;
					}
				}
			}, 0);
			/// Putting the running of callbacks in a timeout ensures that the value is returned first.
			/// (Returning first would end function execution.)
			return this.internalValue;
		},
		set value(variable) {
			let originalValue = this.internalValue;
			this.internalValue = variable;
			let index = 0;
			while (index < this.callbacks.length) {
				if (this.callbacks[index][0] == "set") {
					this.callbacks[index][1](variable);
				} else if (this.callbacks[index][0] == "change" && originalValue !== this.internalValue) {
					this.callbacks[index][1](variable);
				}
				if (this.callbacks[index] !== undefined && this.callbacks[index][2]) {
					this.callbacks.splice(index, 1);
				} else {
					index++;
				}
			}
		},
		addEventListener: function (type, doStuff, listenOnce) {
			this.callbacks.push([type, doStuff, listenOnce]);
			//// add the ability to listen for adding listeners
		},
		removeEventListener: function (type, doStuff) {
			let index = 0;
			while (index < this.callbacks.length) {
				if (this.callbacks[index][0] == type && this.callbacks[index][1] == doStuff) {
					this.callbacks.splice(index, 1);
				} else {
					index++;
				}
			}
			//// add the ability to listen for removing listeners
		}
	};
};


if (!Array.prototype.includes) {
	Array.prototype.includes = function(searchItem, index) {
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
	String.prototype.includes = function(searchItem, index) {
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
	Array.prototype.every = function(callbackfn, thisArg) {
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

String.prototype.forEach = function(doStuff) {
	/**
	.forEach() for strings
	iterates through each character
	doStuff can return a value of "break" to break out of the loop
	non-native functions = none
	*/
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

String.prototype.format = function() {
	/**
	inserts specified items at a location indicated by an index number within curly braces
	takes an indefinite number of arguments
	example:
		"{0}'m super {2}. {0}'ve always been this {1}.".format("I", "cool", "awesome");
		"I'm super awesome. I've always been this cool."
	non-native functions = none
	*/
	var args = arguments;  // If "arguments" was used in place of "args", if would return the values of the inner function arguments.
	return this.replace(/{(\d+)}/g, function(match, number) {  // These function variables represent the match found and the number inside.
		return (typeof args[number]!="undefined") ? args[number] : match;  // only replaces things if there's something to replace it with
	});
};

String.prototype.splice = function(start, length, replacement) {
	/**
	acts like Array.splice() except that
	the value is returned instead of implemented
	because JavaScript is dumb and won't let me do that
	non-native functions = none
	*/
	replacement = replacement===undefined ? "" : replacement;
	return this.slice(0,start) + replacement + this.slice(start+length);
};

String.prototype.keepOnly = function(searchValue, replacement) {
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
	} else if (Standards.getType(searchValue) == "String") {
		searchValue = new RegExp(searchValue);
	} else if (Standards.getType(searchValue) == "RegExp") {
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
	return this.replace(searchValue, function(match, validMatch) {
		return validMatch===undefined ? replacement : validMatch;
	});
};

Array.prototype.move = function(currentIndex, newIndex) {
	/**
	moves an item from one index to another
	if no new index is specified, the item is placed at the end of the array
	non-native functions = none
	*/
	newIndex = newIndex===undefined ? this.length : newIndex;
	this.splice(newIndex, 0, this.splice(currentIndex, 1)[0]);
};

HTMLCollection.prototype.forEach = function(doStuff, copy) {
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
	*/
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

CSSRuleList.prototype.forEach = function(doStuff) {
	/**
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
	*/
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

NodeList.prototype.forEach = function(doStuff) {
	/**
	similar to HTMLCollection.forEach()
	non-native functions = none
	*/
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

/* Changing the object prototypes prevents the proper working of Google Firestore.
Object.prototype.forEach = function(doStuff, copy) {
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

Object.prototype.keyHasValue = function(key, value) {  // This was actually pretty pointless.
	// /**
	checks if an object has a property and then
	checks if the property equals the value
	non-native functions = none
	// *
	return (this.hasOwnProperty(key)&&this[key]==value) ? true : false;
};
*/

Standards.onLoad = function(doStuff) {
	/**
	does whatever the argument of the function says after the page loads and this script finishes running
	non-native functions = none
	*/
	return window.addEventListener("finished", doStuff);  // There's no () after doStuff because it would run right away (not when the page loads).
};

Standards.getId = function(ID) {
	/**
	gets an element by ID
	non-native functions = none
	*/
	return document.getElementById(ID);
};

Standards.getTag = function(tag) {
	/**
	gets all of the elements made by a certain tag
	non-native functions = none
	*/
	return document.getElementsByTagName(tag);
};

Standards.getClass = function(name) {
	/**
	gets elements with a certain class
	non-native functions = none
	*/
	return document.getElementsByClassName(name);
};

Standards.getName = function(name, specific) {
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

Standards.getType = function(item) {
	/**
	finds the type of an item since it's unnecessarily complicated to be sure normally
	non-native functions = none
	*/
	if (typeof item == "undefined") {
		return "undefined";
	} else if (typeof item == "null") {
		return "null";
	} else if (item.constructor === Boolean) {  // if it's a boolean
		return "Boolean";
	} else if (item.constructor === Number) {  // if it's a number
		return "Number";
	} else if (item.constructor === String) {  // if it's a string
		return "String";
	} else if (Array.isArray(item) || item instanceof Array) {  // if it's an array
		return "Array";
	} else if (item instanceof RegExp) {
		return "RegExp";
	} else if (item.constructor.toString().search(/HTML.*Element/) > -1) {  // if it's an HTML element
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
		console.error(item + " has no type");
		return undefined;
	}
};

Standards.insertBefore = function(insertion, place) {
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

Standards.insertAfter = function(insertion, place) {
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

Standards.toArray = function() {
	/**
	returns an array made from any number of elements with an index and length
	non-native functions = none
	*/
	var index1 = 0,
		index2,
		returnList = [];
	for (index1; index1<arguments.length; index1++) {
		if (arguments[index1][0] && arguments[index1].length) {
			for (index2=0; index2<arguments[index1].length; index2++) {
				returnList.push(arguments[index1][index2]);
			}
		} else if (arguments[index1].length == undefined || arguments[index1].length > 0) {  // filters out empty lists
			returnList.push(arguments[index1]);
		}
	}
	return returnList;
};

Standards.forEach = function(list, doStuff, shouldCopy) {
	/**
	does stuff for every item of an iterable list (or object)
	non-native functions = getType
	*/
	if (Standards.getType(doStuff) != "Function") {
		throw "The second arument provided in Standards.forEach isn't a function.";
	}
	if (Standards.getType(list) == "Object") {
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
	} else if (Standards.getType(list[Symbol.iterator]) == "Function") {
		let items = [],
			index,
			returnValue;
		while (index < list.length) {
			items.push(list[index]);
			index++;
		}
		index = 0;
		while (index < list.length) {
			returnValue = doStuff(list[index], index, list);
			if (returnValue == "break") {
				break;
			} else {
				index++;
			}
		}
	} else {
		throw "The item provided isn't iterable.";
	}
};

Standards.listen = function(item, event, behavior, listenOnce) {
	/**
	adds an event listener to the item
	waiting for an element to load is unnecessary if the item is a string (of an ID)
	item = what will be listening
	event = the event being listened for
	behavior = what to do when the event is triggered
		if the event is "hover", behavior needs to be an array with two functions, the first for hovering and the second for not hovering
	listenOnce = whether the event listener should only be triggered once
		default = false
	non-native functions = Standards.queue.add() and toArray()
	*/
	listenOnce = listenOnce===undefined ? false : listenOnce;
	Standards.queue.add({
		runOrder: "first",
		function: function(item, event, behavior) {
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
					item.addEventListener(event, function() {
						behavior();
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

Standards.safeWhile = function(condition, doStuff, loops) {
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
	loops = loops>=0 ? loops : 1000;  // if I used loops = loops || 1000 it would reset to 1000 when loops = 0
	if (eval.call(doStuff, condition) && loops > 0) {
		doStuff();
		loops--;
		Standards.safeWhile(condition, doStuff, loops);
	} else if (loops <= 0) {
		throw "Recursion depth exceeded."
	}
};

Standards.makeDialog = function(message) {
	/**
	makes a dialog box pop up
	message = the content of the dialog box (can be HTML)
	At least one argument is needed after the message.
	Arguments after the message are two-item arrays which form buttons.
		first item = text of the button
		second item = the function to run if that button is pressed
	The text of the button is passed to the functions,
	so the same function can be used for all of the buttons if the function checks the text.
	example:
		Standards.makeDialog(
			"Don't you think this dialog box is awesome?",
			["Yes", function() {console.log("You're awesome too!");}],
			["No", function() {console.log("Nobody cares what you think anyway!");}]
		);
	non-native functions = getType and getHTML
	*/
	let pairs = Array.prototype.slice.call(arguments, 1),
		identifier = Standards.identifier++;
	if (pairs.length < 1) {
		pairs = [["Okay", function () {return;}]];
	}
	pairs.forEach(function(pair, index) {
		if (Standards.getType(pair) == "String") {
			pairs.splice(index, 1, [pair, function () {return;}]);
		} else if (Standards.getType(pair) != "Array") {
			throw "The item at position " + (index+1) + " isn't a two-item array.";
		} else if (pair.length != 2) {
			throw "The item at position " + (index+1) + " needs to have exactly two items.";
		}
	});
	let darkener = document.createElement("div"),
		dialog = document.createElement("div"),  // This could be changed to make a <dialog> element (without a class) if there were more support for it.
		contents = Standards.getHTML("~" + message),
		buttons = document.createElement("div");
	darkener.className = "darkener";
	darkener.style.pointerEvents = "auto";
	dialog.className = "dialog";
	contents.className = "contents";
	buttons.className = "buttons";
	pairs.forEach(function(pair, index) {
		if (typeof pair[0] != "string") {
			throw "The pair at position " + (index+1) + " doesn't have a string as the first value.";
		} else if (typeof pair[1] != "function") {
			throw "The pair at position " + (index+1) + " doesn't have a function as the second value.";
		}
		let button = document.createElement("button");
		button.innerHTML = pair[0];
		buttons.appendChild(button);
		button.addEventListener("click", function() {
			pair[1](pair[0]);
			dialog.dispatchEvent(new Event("dialog" + identifier + "Answered"));
			this.removeEventListener("click", arguments.callee);
		});
	});
	contents.appendChild(buttons);
	dialog.appendChild(contents);
	darkener.appendChild(dialog);
	document.body.appendChild(darkener);
	dialog.addEventListener("dialog" + identifier + "Answered", function() {
		darkener.style.backgroundColor = "rgba(0, 0, 0, 0)";
		this.style.MsTransform = "scale(.001, .001)";
		this.style.WebkitTransform = "scale(.001, .001)";
		this.style.transform = "scale(.001, .001)";
		setTimeout(function() {  // waits until the dialog box is finished transitioning before removing it
			document.body.removeChild(darkener);
		}, 500);
	});
	setTimeout(function() {  // This breaks out of the execution block and allows transitioning to the states.
		darkener.style.backgroundColor = "rgba(0, 0, 0, .8)";
		dialog.style.MsTransform = "scale(1, 1)";
		dialog.style.WebkitTransform = "scale(1, 1)";
		dialog.style.transform = "scale(1, 1)";
	}, 0);
};

Standards.checkAll = function(item, comparator, comparisons, type) {
	/**
	This is deprecated.
	Use Array.each instead.
	
	comparisons = an array of things to be used in comparing things
	type = whether you need all of the comparisons to be true or just one ("&&" or "||")
	type must be a string
	when comparator isn't null:
		compares a given item to all items in an array
		comparator = how the items are being compared e.g. "==", ">", etc.
		comparator must be a string
		example:
			Standards.checkAll(document.getElementById("tester").innerHTML, "==", ["testing", "hello", "I'm really cool."], "||");
	when comparator is null:
		evaluates a formattable string (item) after formatting with the comparisons
		uses String.format() (my own function)
		items in comparisons = arguments to go in the () in .format()
			strings = one string is used per iteration
			arrays containing strings = one array is used per iteration
		variables don't work in the item string: they have to be used as one of the items in comparisons
		examples:
			Standards.checkAll("{0} > 0 ", null, [2,"6",7,4,"3"], "||");
			Standards.checkAll("('abc'+'{0}'+'{1}'+'xyz').length == {2}", null, [["def","ghi",12],["qrstu","vw",13]], "&&");  // notice quotation marks around {}s for insertion of a string
			// Don't do this.
			var number = 42;
			if (Standards.checkAll("number < {0}", null, [30,40,50], "||")) {
				console.log("It worked!");
			}
			// Instead, do this.
			var number = 42;
			if (Standards.checkAll("{0} < {1}", null, [[number,30],[number,40],[number,50]], "||")) {
				console.log("It worked!");
			}
			// Quotation marks must be added to the {} when the variable is a string.
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
};

Standards.getHTML = function(URL, callback) {
	/**
	reads the contents of the file at the URL,
	converts it into a string,
	puts the string into a <div>, and then
	calls the callback function (which has no arguments)
	with "this" equalling the <div>
	Preceeding the URL string with "~"
	causes it to be interpreted as the retrieved HTML.
	(That happens synchonously and returns the <div>.)
	non-native functions = none
	*/
	if (!URL) {
		console.error("No resource was provided to get HTML.");
	} else if (URL[0] == "~") {
		let container = document.createElement("div");
		container.innerHTML = URL.slice(1);
		// This is necessary because HTML5 doesn't think script tags and innerHTML should go together (for security reasons).
		let scripts = URL.slice(1).split("<script");  // adding the closing ">" in the splitting would close the script block
		if (scripts.length > 1) {
			scripts.forEach(function(script, index) {
				if (index > 0) {
					let scriptTag = document.createElement("script");
					scriptTag.appendChild(document.createTextNode(script.slice(script.indexOf(">")+1, script.indexOf("</script>"))));
					container.insertBefore(scriptTag, container.getElementsByTagName("script")[index-1]);
					let oldTag = container.getElementsByTagName("script")[index];
					oldTag.parentNode.removeChild(oldTag);
				}
			});
		}
		return container;  // a callback isn't needed here because you don't have to wait for a request
	} else {
		var file = new XMLHttpRequest();
		file.open("GET", URL);  // Don't add false as an extra argument (browsers don't like it). (default: asynchronous=true)
		file.onreadystatechange = function () {
			if(file.readyState === 4) {  // Is it done?
				if(file.status === 200 || file.status == 0) {  // Was it successful?
					// file.responseXML might have something
					let container = document.createElement("div");
					container.innerHTML = file.responseText;
					// This is necessary because HTML5 doesn't think script tags and innerHTML should go together (for security reasons).
					let scripts = file.responseText.split("<script");
					if (scripts.length > 1) {
						scripts.forEach(function(script, index) {
							if (index > 0) {
								let scriptTag = document.createElement("script");
								scriptTag.appendChild(document.createTextNode(script.slice(script.indexOf(">")+1, script.indexOf("</script>"))));
								container.insertBefore(scriptTag, container.getElementsByTagName("script")[index-1]);
								let oldTag = container.getElementsByTagName("script")[index];
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
};

Standards.pageJump = function(ID) {
	/**
	******** This is deprecated. Use the "page-jump-sections" class instead (interpreted when the page loads). ********
	makes a section to jump to certain parts of the page
	non-native functions = Standards.queue.add() and HTMLCollection.forEach()
	*/
	Standards.queue.add({
		runOrder: "first",
		function: function(ID) {
			console.warn('The function Standards.pageJump is deprecated. Instead, give the target container a class of "page-jump-sections".');
			let division = document.getElementById(ID);
			let contents = document.createElement("div");
			contents.id = "pageJump";
			contents.className = "page-jump-list";
			contents.innerHTML = "<h2>Jump to:</h2>";
			let sections = division.getElementsByTagName("h2");
			let toTop = document.createElement("p");  // This has to be a <p><a></a></p> rather than just a <a></a> because, otherwise, "To top" has the possibility of appearing in-line.
			toTop.innerHTML = "<a href='#'>To top</a>";
			let listItems = document.createElement("ol");
			sections.forEach(function(heading, index, sections) {
				let inside = sections[index].innerHTML.trim();  // The inner HTML has a bunch of whitespace probably because of carriage returns.
				sections[index].id = inside;
				let link = document.createElement("a");
				link.href = "#" + inside;
				link.innerHTML = inside;
				let listItem = document.createElement("li");
				listItem.appendChild(link);
				listItems.appendChild(listItem);
				division.insertBefore(toTop.cloneNode(true), division.getElementsByTagName("h2")[index].nextSibling);  // inserts after <h2>
				// toTop needs to be cloned so it doesn't keep getting reasigned to the next place (it also needs to have true to clone all children of the node, although it doesn't apply here)
			});
			contents.appendChild(listItems);
			division.parentNode.insertBefore(contents, division);  // .insertBefore() only works for the immediate descendants of the parent
			contents.outerHTML += "<br>";  // Elements need to have a parent node before the outer HTML can be modified. (This makes sure the "Jump to:" section appears on its own line.)
			// This takes you to a certain part of the page after the IDs and links load (if you were trying to go to a certain part of the page.
			if (window.location.href.indexOf("#") > -1) {
				let found = false;
				document.getElementById("pageJump").getElementsByTagName("a").forEach(function(link) {
					if (link.innerHTML.trim() == window.location.href.split("#")[1].trim()) {  // Does the URL match a destination?
						found = true;
						link.click();
						return "break";
					}
				});
				if (!found) {  // Was the section found?
					console.warn('The section "' + window.location.href.split("#")[1].trim() + '" doesn\'t exist on this page.');
				}
			}
		},
		arguments: [ID]
	});
};

Standards.http_build_query = function(options) {
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
		var result = Standards.http_build_query(options);
		// result --> "greeting=Hello!&number=42&animal=cuttlefish"
	non-native functions = Object.forEach
	*/
	var queryString = "";
	options.forEach(function(value, key) {
		if (value instanceof Object) {
			queryString += encodeURIComponent(key) + "=" + encodeURIComponent(JSON.stringify(value)) + "&";
		} else if (value instanceof Array) {
			queryString += encodeURIComponent(key) + "=" + encodeURIComponent(value.toString()) + "&";  // This might not be proper.
		} else {
			queryString += encodeURIComponent(key) + "=" + encodeURIComponent(String(value)) + "&";
		}
	});
	queryString.splice(0, -1);  // gets rid of the last "&"
	queryString.replace(/(%20)/g, "+");  // changes the encoded spaces into the correct form for application/x-www-form-urlencoded
	return queryString;
};

Standards.parse_str = function(encodedString) {
	/**
	a close approximation of the PHP function parse_str()
	turns a URL-encoded string into an object (returns the object)
	particularly useful when receiving information encoded into a string (as happens within Standards.recall())
	example:
		var options = "greeting=Hello!&number=42&animal=cuttlefish";
		var result = Standards.parse_str(options);
		// result --> {"greeting": "Hello!", "number": "42", "animal": "cuttlefish"}
	non-native functions = none
	*/
	var decodedObject = {};
	encodedString.split("&").forEach(function(item) {
		var key = item.split("=")[0];
		var value = item.split("=")[1];
		key = decodeURIComponent(key.replace(/\+/g, " "));
		value = decodeURIComponent(value.replace(/\+/g, " "));
		if (key.slice(-1) == "]") {
			key = key.split("[");
			key.forEach(function(subkey, index) {
				if (subkey.slice(-1) == "]") {
					key[index] = subkey.slice(0, -1);
				}
			});
			let path = decodedObject;
			key.slice(0, -1).forEach(function(subkey) {
				if (!path.hasOwnProperty(subkey)) {
					path[subkey] = {};
				}
				path = path[subkey];
			});
			path[key[key.length-1]] = value;
			/// "decodedObject" doesn't need to be used because "path" is "decodedObject".
		} else {
			decodedObject[key] = value;
		}
	});
	return decodedObject;
};

Standards.storage = {};

Standards.storage.session = {
	defaultLocation: null,
	store: function(key, item, location) {
		/**
		stores information in session storage
		any primitive data type can be stored
		string type tags are used behind the scenes to keep track of data types
		items stored with this function will always be recalled correctly with the recall() function
		non-native functions = none
		*/
		if (typeof Storage == "undefined") {
			alert("Your browser doesn't support the Storage object.");
			/// Alerting rather than just thowing an error notifies average users when things aren't working.
		} else {
			key = String(key);
			location = location || Standards.storage.session.defaultLocation;
			if (typeof item == "undefined") {
				item = "u~";
			} else if (item.constructor == String) {  // if the item is a string (typeof for new String() would return "object")
				item = "s~" + item;
			} else if (!isNaN(item)) {  // if the item is a number
				item = "n~" + item;
			} else if (item instanceof Array) {  // if the item is an array
				item = "a~" + JSON.stringify(item);
			} else if (item.constructor.toString().search(/HTML.*Element/) > -1) {  // if the item is an HTML object
				let container = document.createElement("div");
				container.appendChild(item.cloneNode(true));
				item = "h~" + container.innerHTML;
			} else if (item instanceof Object) {  // if the item is an object
				item = "o~" + JSON.stringify(item);
			} else {
				item = "z~" + String(item);
			}
			if (location == null) {
				sessionStorage.setItem(key, item);
			} else if (location.constructor == String) {
				sessionStorage.setItem(location + "/" + key, item);
			} else {
				console.error("Invalid storage location type");  // This tells programmers where things went wrong.
				alert("An invalid storage location has been set.");  // This tells average users that their information isn't being saved.
			}
		}
	},
	recall: function(key, location) {
		/**
		recalls information from session storage
		information is returned in its original form
			e.g. an array will be returned as an array, not a string representation
			null is considered a number and will return NaN (the number)
		if retrieving something that was stored directly into sessionStorage (without the store() function), there could be unexpected results
			items without "u~", "s~", "n~", "a~", "h~", "o~", or "z~" at the beginning should return as a string
			including any of those tags at the beginning will result in the tag being removed and the data type possibly being incorrectly determined
		non-native functions = none
		*/
		if (typeof Storage == "undefined") {
			alert("Your browser doesn't support the Storage object.");
		} else {
			key = String(key);
			location = location || Standards.storage.session.defaultLocation;
			var information = ""
			if (location == null) {
				information = sessionStorage.getItem(key);
			} else if (location.constructor == String) {
				information = sessionStorage.getItem(location + "/" + key);
			} else {
				console.error("Invalid storage location type");
				alert("The information requested can't be retrieved.");
			}
			switch (information.slice(0, 2)) {
				case "u~":
					return undefined;
				case "s~":
				case "z~":
					return information.slice(2);
				case "n~":
					return Number(information.slice(2));
				case "a~":
					return JSON.parse(information.slice(2));
				case "h~":
					let container = document.createElement("div");
					container.innerHTML = information.slice(2);
					return container.children[0];
				case "o~":
					return JSON.parse(information.slice(2));
				default:
					console.warn("The information accessed is missing a data type tag.");
					return information;
			}
		}
	},
	forget: function(key, location) {
		/**
		deletes information in session storage
		non-native functions = none
		*/
		if (typeof Storage == "undefined") {
			alert("Your browser doesn't support the Storage object.");
		} else {
			key = String(key);
			location = location || Standards.storage.session.defaultLocation;
			if (location == null) {
				sessionStorage.removeItem(key);
			} else if (location.constructor == String) {
				sessionStorage.removeItem(location + "/" + key);
			} else {
				console.error("Invalid storage location type");
				alert("The information couldn't be deleted.");
			}
		}
	},
	list: function(location) {
		/**
		lists the keys of everything in session storage
		non-native functions = none
		*/
		location = location || Standards.storage.session.defaultLocation;
		var keyList = [];
		for (let key in sessionStorage) {
			if (sessionStorage.propertyIsEnumerable(key)) {
				if (location == null) {
					keyList.push(key);
				} else if (key.indexOf(location) == 0 && key.length > location.length+1) {
					keyList.push(key.slice(location.length+1));
				}
			}
		}
		return keyList;
	}
};

Standards.storage.local = {
	defaultLocation: null,
	store: function(key, item, location) {
		/**
		stores information in local storage
		any primitive data type can be stored
		string type tags are used behind the scenes to keep track of data types
		items stored with this function will always be recalled correctly with the recall() function
		non-native functions = none
		*/
		if (typeof Storage == "undefined") {
			alert("Your browser doesn't support the Storage object.");
		} else {
			key = String(key);
			location = location || Standards.storage.local.defaultLocation;
			if (typeof item == "undefined") {
				item = "u~";
			} else if (item.constructor == String) {  // if the item is a string
				item = "s~" + item;
			} else if (!isNaN(item)) {  // if the item is a number
				item = "n~" + item;
			} else if (item instanceof Array) {  // if the item is an array
				item = "a~" + JSON.stringify(item);
			} else if (item.constructor.toString().search(/HTML.*Element/) > -1) {  // if the item is an HTML object
				let container = document.createElement("div");
				container.appendChild(item.cloneNode(true));
				item = "h~" + container.innerHTML;
			} else if (item instanceof Object) {  // if the item is an object
				item = "o~" + JSON.stringify(item);
			} else {
				item = "z~" + String(item);
			}
			if (location == null) {
				localStorage.setItem(key, item);
			} else if (location.constructor == String) {
				localStorage.setItem(location + "/" + key, item);
			} else {
				console.error("Invalid storage location type");
				alert("An invalid storage location has been set.");
			}
		}
	},
	recall: function(key, location) {
		/**
		recalls information from local storage
		information is returned in its original form
			e.g. an array will be returned as an array, not a string representation
			null is considered a number and will return NaN (the number)
		if retrieving something that was stored directly into sessionStorage (without the store() function), there could be unexpected results
			items without "u~", "s~", "n~", "a~", "h~", "o~", or "z~" at the beginning should return as a string
			including any of those tags at the beginning will result in the tag being removed and the data type possibly being incorrectly determined
		non-native functions = none
		*/
		if (typeof Storage == "undefined") {
			alert("Your browser doesn't support the Storage object.");
		} else {
			key = String(key);
			location = location || Standards.storage.local.defaultLocation;
			var information = "";
			if (location == null) {
				information = localStorage.getItem(key);
			} else if (location.constructor == String) {
				information = localStorage.getItem(location + "/" + key);
			} else {
				console.error("Invalid storage location type");
				alert("The information requested can't be retrieved.");
			}
			switch (information.slice(0, 2)) {
				case "u~":
					return undefined;
				case "s~":
				case "z~":
					return information.slice(2);
				case "n~":
					return Number(information.slice(2));
				case "a~":
					return JSON.parse(information.slice(2));
				case "h~":
					let container = document.createElement("div");
					container.innerHTML = information.slice(2);
					return container.children[0];
				case "o~":
					return JSON.parse(information.slice(2));
				default:
					console.warn("The information accessed is missing a data type tag.");
					return information;
			}
		}
	},
	forget: function(key, location) {
		/**
		deletes information in local storage
		non-native functions = none
		*/
		if (typeof Storage == "undefined") {
			alert("Your browser doesn't support the Storage object.");
		} else {
			key = String(key);
			location = location || Standards.storage.local.defaultLocation;
			if (location == null) {
				localStorage.removeItem(key);
			} else if (location.constructor == String) {
				localStorage.removeItem(location + "/" + key);
			} else {
				console.error("Invalid storage location type");
				alert("The information couldn't be deleted.");
			}
		}
	},
	list: function(location) {
		/**
		lists the keys of everything in local storage
		non-native functions = none
		*/
		location = location || Standards.storage.local.defaultLocation;
		var keyList = [];
		for (let key in localStorage) {
			if (localStorage.propertyIsEnumerable(key)) {
				if (location == null) {
					keyList.push(key);
				} else if (key.indexOf(location) == 0 && key.length > location.length+1) {
					keyList.push(key.slice(location.length+1));
				}
			}
		}
		return keyList;
	}
};

Standards.storage.server = {
	database: typeof firebase!="undefined" && firebase.firestore ? firebase.firestore() : undefined,  // Using "typeof" is the only way to check if a non-argument variable exists without an error.
	defaultLocation: "",
	user: undefined,  //// firebase.auth().currentUser,
	checkCompatibility: function(shouldNotCheckUser) {
		if (Standards.storage.server.database === undefined) {
			alert("There's no server to handle this action.");
			throw "Firebase or Firestore doesn't exist.";
		}
		if (window.location.href.slice(0,4) != "http") {
			alert("Access to the server isn't allowed from this URL.");
			throw 'The URL doesn\'t use the protocol "http" or "https".';
		}
		if (!shouldNotCheckUser && !Standards.storage.server.user) {
			alert("That action isn't allowed without logging in.");
			console.warn("The action couldn't be completed because the user wasn't logged on.");
			return false;
		}
		return true;
	},
	getReference: function(location) {
		/**
		creates a storage reference based on a provided location
		different paths are separated by slashes ("/")
		preceding a location with a tilde ("~") will allow absolute location setting
		(no optimization for user storage)
		non-native functions = getType
		*/
		let reference = Standards.storage.server.database;
		if (!location) {
			location = Standards.storage.server.defaultLocation;
			reference = reference.collection("users").doc(Standards.storage.server.user.uid);
		} else if (Standards.getType(location) == "String") {
			if (location[0] == "~") {
				if (location == "~") {
					alert("An invalid storage location was given");
					throw "An absolute storage location was indicated but not provided.";
				} else {
					location = location.slice(1);
				}
			} else {
				reference = reference.collection("users").doc(Standards.storage.server.user.uid);
			}
		} else {
			alert("The action couldn't be completed.");
			throw "The provided location is an invalid type.";
		}
		console.log(location);
		if (location != "") {
			location.split("/").forEach(function(place, index) {
				if (index % 2 == 0) {
					reference = reference.collection(place);
				} else {
					reference = reference.doc(place);
				}
			});
		}
		console.log("Returning reference");
		return reference;
	},
	signUp: function() {
		Standards.storage.server.checkCompatibility(true);
		Standards.makeDialog("Sign up with your prefered sign-in provider.",
			["Google", function() {
				firebase.auth().signInWithRedirect(new firebase.auth.GoogleAuthProvider());
			}],
			["Anonymous", function() {
				firebase.auth().signInAnonymously();
			}],
			["Cancel", function() {return;}]
		);
	},
	signIn: function() {
		Standards.storage.server.checkCompatibility(true);
		Standards.makeDialog("Sign in with your prefered sign-in provider.",
			["Google", function() {
				firebase.auth().signInWithRedirect(new firebase.auth.GoogleAuthProvider());
			}],
			["Anonymous", function() {
				firebase.auth().signInAnonymously();
			}],
			["Cancel", function() {return;}]
		);
	},
	signOut: function() {
		Standards.storage.server.checkCompatibility();
		Standards.makeDialog("Are you sure you want to log out?",
			["Yes", function() {
				firebase.auth().signOut();
			}],
			["No", function() {return;}]
		);
	},
	mergeAccounts: function() {
		if (Standards.storage.server.checkCompatibility()) {
			//// do stuff
		}
	},
	store: function(key, item, location, callback) {
		if (Standards.storage.server.checkCompatibility()) {
			if (location === undefined || location === "") {
				location = Standards.storage.server.defaultLocation;
			} else if (S.getType(location) == "String") {
				if (location.length > 0 && location[0] == "/") {
					if (location == "/") {
						alert("An invalid storage location was given");
						throw "An relative storage location was indicated but not provided.";
					} else {
						location = Standards.storage.server.defaultLocation + location;
					}
				}
			} else {
				alert("An invalid storage location was given");
				throw "The location given wasn't a string.";
			}
			if (location == "" || location.split("/").length % 2 == 0) {
				console.log("Setting server information");
				Standards.storage.server.getReference(location).set({
					[key]: item
				}, { merge: true }).then(function () {
					console.log("Finished storing");
					if (callback) {
						console.log("Running callback");
						callback();
					}
				}).catch(function (error) {
					alert("The information couldn't be stored.");
					console.error("There was an error storing the information.");
					console.error(error);
				});
			} else {
				if (Standards.getType(item) == "Object") {
					key = key ? "/"+key : "";
					Standards.storage.server.getReference(location+key).set(item).then(function () {
						console.log("Finished storing");
						if (callback) {
							console.log("Running callback");
							callback();
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
			}
		}
	},
	recall: function(key, location, callback) {
		if (!Standards.storage.server.checkCompatibility()) {
			return;
		}
		if (location === undefined || location === "") {
			location = Standards.storage.server.defaultLocation;
		} else if (S.getType(location) == "String") {
			if (location.length > 0 && location[0] == "/") {
				if (location == "/") {
					alert("An invalid storage location was given");
					throw "An relative storage location was indicated but not provided.";
				} else {
					location = Standards.storage.server.defaultLocation + location;
				}
			}
		} else {
			alert("An invalid storage location was given");
			throw "The location given wasn't a string.\nThe default location was used instead.";
		}
		if (location == "" || location.split("/").length % 2 == 0) {
			Standards.storage.server.getReference(location).get().then(function (document) {
				if (document.exists) {
					callback(document.data()[key]);
				} else {
					alert("A document doesn't exist at the given location.");
					console.warn("An attempt was made to access a non-existent document.");
				}
			}).catch(function (error) {
				alert("The information couldn't be retrieved.");
				console.error(error);
			});
		} else {
			Standards.storage.server.getReference(location).get().then(function (snapshot) {
				callback(snapshot.docs[key].data());
			}).catch(function (error) {
				alert("The information couldn't be retrieved.");
				console.error("An error occurred during recall.");
				console.error(error);
			});
		}
	},
	forget: function(key, location, callback) {
		if (!Standards.storage.server.checkCompatibility()) {
			return;
		}
		if (location === undefined || location === "") {
			location = Standards.storage.server.defaultLocation;
		} else if (S.getType(location) == "String") {
			if (location.length > 0 && location[0] == "/") {
				if (location == "/") {
					alert("An invalid storage location was given");
					throw "An relative storage location was indicated but not provided.";
				} else {
					location = Standards.storage.server.defaultLocation + location;
				}
			}
		} else {
			alert("An invalid storage location was given");
			throw "The location given wasn't a string.\nThe default location was used instead.";
		}
		if (location == "" || location.split("/").length % 2 == 0) {
			if (key === null) {
				Standards.storage.server.getReference(location).delete().then(function () {
					if (callback) {
						callback();
					}
				}).catch(function(error) {
					alert("The information couldn't be deleted.");
					console.error(error);
				});
			} else {
				Standards.storage.server.getReference(location).update({
					[key]: firebase.firestore.FieldValue.delete()
				}).then(function () {
					if (callback) {
						callback();
					}
				}).catch(function(error) {
					alert("The information couldn't be deleted.");
					console.error(error);
				});
			}
		} else {
			if (key === null) {
				Standards.storage.server.getReference(location).get().then(function(snapshot) {
					Standards.forEach(snapshot, function(document) {
						document.delete();
					});
				}).then(function () {
					if (callback) {
						callback();
					}
				}).catch(function(error) {
					alert("The information couldn't be deleted.");
					console.error(error);
				});
			} else {
				Standards.storage.server.getReference(location).doc(key).delete().then(function () {
					if (callback) {
						callback();
					}
				}).catch(function(error) {
					alert("The information couldn't be deleted.");
					console.error(error);
				});
			}
		}
	},
	list: function(location, callback) {
		if (!Standards.storage.server.checkCompatibility()) {
			return;
		}
		if (location === undefined || location === "") {
			location = Standards.storage.server.defaultLocation;
		} else if (S.getType(location) == "String") {
			if (location.length > 0 && location[0] == "/") {
				if (location == "/") {
					alert("An invalid storage location was given");
					throw "An relative storage location was indicated but not provided.";
				} else {
					location = Standards.storage.server.defaultLocation + location;
				}
			}
		} else {
			alert("An invalid storage location was given");
			throw "The location given wasn't a string.\nThe default location was used instead.";
		}
		if (location == "" || location.split("/").length % 2 == 0) {  // if the location goes to a document
			Standards.storage.server.getReference(location).get().then(function (document) {
				let keyList = [];
				if (document.exists) {
					Standards.forEach(document.data(), function(value, key) {
						keyList.push(key);
					});
					callback(keyList);
				} else {
					console.warn("An attempt was made to access a non-existent document.");
					callback(keyList);
				}
			}).catch(function(error) {
				alert("The list of information couldn't be retieved.");
				console.error("List retrieval or callback execution failed.");  // Putting an extra error here allows origin tracing when the error happens in Firebase.
				console.error(error);
			});
		} else {  // if the location goes to a collection
			Standards.storage.server.getReference(location).get().then(function(snapshot) {
				//// if snapshot.empty might need to be used here
				callback(snapshot.docs);
			}).catch(function(error) {
				alert("The list of information couldn't be retieved.");
				console.error(error);
			});
		}
	}
};

/*
Standards.storage.server = {
	"username": null,
	"password": null,
	"passwordLocation": null,
	"storageLocation": "volatileserver.appspot.com",
	"notificationType": "alert",
	"store": function(key, item, location) {
		// /**
		stores a user's information
		creators of information are the owners
		non-native functions = http_build_query() and parse_str()
		// *
		location = location || Standards.storage.server.storageLocation;
		var message = {
			"username": Standards.storage.server.username,
			"password": Standards.storage.server.password,
			"action": "store",
			"location": "gs://" + location + "/" + key,
			"information": item
		};
		if (Standards.storage.server.passwordLocation != null) {
			message["pwd_path"] = Standards.storage.server.passwordLocation;
		}
		var file = new XMLHttpRequest();
		file.open("POST", "https://" + location);
		file.setRequestHeader("Content-type", "application/x-www-form-urlencoded");  // This is the encoding type.  //// text/html
		file.onreadystatechange = function () {
			if(file.readyState === 4) {
				if(file.status === 200 || file.status == 0) {
					var response = Standards.parse_str(file.responseText);
					var notification = Standards.storage.server.notificationType.toLowerCase();
					if (response.hasOwnProperty("errors")) {
						response.errors.forEach(function(error) {
							console.error(error);
						});
					}
					if (response.hasOwnProperty("warnings")) {
						response.warnings.forEach(function(warning) {
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
		file.send(Standards.http_build_query(message));
	},
	"recall": function(key, location) {
		// /**
		recalls a user's information (if they have the correct permissions)
		non-native functions = http_build_query() and parse_str()
		// *
		location = location || Standards.storage.server.storageLocation;
		var message = {
			"username": Standards.storage.server.username,
			"password": Standards.storage.server.password,
			"action": "recall",
			"location": "gs://" + location + "/" + key
		};
		if (Standards.storage.server.passwordLocation != null) {
			message["pwd_path"] = Standards.storage.server.passwordLocation;
		}
		var file = new XMLHttpRequest();
		file.open("POST", "https://" + location);
		file.setRequestHeader("Content-type", "application/x-www-form-urlencoded");  // This is the encoding type.  //// text/html
		file.onreadystatechange = function () {
			if(file.readyState === 4) {
				if(file.status === 200 || file.status == 0) {
					var response = Standards.parse_str(file.responseText);
					var notification = Standards.storage.server.notificationType.toLowerCase();
					if (response.hasOwnProperty("errors")) {
						response.errors.forEach(function(error) {
							console.error(error);
						});
					}
					if (response.hasOwnProperty("warnings")) {
						response.warnings.forEach(function(warning) {
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
		file.send(Standards.http_build_query(message));
	},
	"forget": function(key, location) {
		// /**
		deletes a user's information (if they have owner permissions)
		non-native functions = http_build_query() and parse_str()
		// *
		location = location || Standards.storage.server.storageLocation;
		var message = {
			"username": Standards.storage.server.username,
			"password": Standards.storage.server.password,
			"action": "forget",
			"location": "gs://" + location + "/" + key
		};
		if (Standards.storage.server.passwordLocation != null) {
			message["pwd_path"] = Standards.storage.server.passwordLocation;
		}
		var file = new XMLHttpRequest();
		file.open("POST", "https://" + location);
		file.setRequestHeader("Content-type", "application/x-www-form-urlencoded");  // This is the encoding type.  //// text/html
		file.onreadystatechange = function () {
			if(file.readyState === 4) {
				if(file.status === 200 || file.status == 0) {
					var response = Standards.parse_str(file.responseText);
					var notification = Standards.storage.server.notificationType.toLowerCase();
					if (response.hasOwnProperty("errors")) {
						response.errors.forEach(function(error) {
							console.error(error);
						});
					}
					if (response.hasOwnProperty("warnings")) {
						response.warnings.forEach(function(warning) {
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
		file.send(Standards.http_build_query(message));
	},
	"list": function(location) {
		// /**
		lists a user's information
		non-native functions = http_build_query() and parse_str()
		// *
	},
	"permissions": function(user, level, key, location) {
		// /**
		changes the permissions of other users to the information owned by you
		non-native functions = http_build_query() and parse_str()
		// *
	}
};
*/

Standards.colorCode = function(element, conversion) {
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
	non-native functions = Standards.queue.add(), HTMLCollection.forEach(), toArray(), and checkAll()
	*/
	Standards.queue.add({
		runOrder: "first",
		function: function(element, conversion, args) {
			var list = false;  // for whether "element" is a list (array)
			if (typeof element == "string") {
				element = document.getElementById(element);
			} else if (element instanceof Array) {  // using "typeof" always returns false because arrays are apparently objects (in this script)
				element.forEach(function(item, index) {
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
				colors.slice(1).forEach(function(color, index, shortColors) {  // establishes the values where the different colors are centered
					ends.push(end1+(end2-end1)*(index+1)/shortColors.length);
				});
				var endIndex = 1,
					finalColors = [];
				while (value > ends[endIndex]) {  // determines which 2 colors the value falls between
					endIndex++;
				}
				[0, 1, 2].forEach(function(index) {  // determines what the color should be based on how close the value is to the two closest ends' colors
					finalColors.push(Math.round(colors[endIndex-1][index] + (colors[endIndex][index]-colors[endIndex-1][index]) * (value-ends[endIndex-1]) / (ends[endIndex]-ends[endIndex-1])));
				});
				return "rgb(" + finalColors[0] + ", " + finalColors[1] + ", " + finalColors[2] + ")";
			}
			if (element == null) {
				end1 = 0;
				end2 = 100;
				if (isNaN(conversion)) {
					return backgroundColor(conversion());
				} else {
					return backgroundColor(conversion);
				}
			} else {
				if (element.tagName == "TABLE") {  // This might have to be capitalized.
					var tds = [];  // This needs to be set to an array for it to be used in toArray().
						// tds[3] and tds[6] are representative samples of the type of data
					if (list) {
						list.forEach(function(table) {
							tds = Standards.toArray(tds, table.getElementsByTagName("td"));
						});
					} else {
						tds = element.getElementsByTagName("td");
					}
					if (!isNaN(tds[3].innerHTML) || !isNaN(tds[6].innerHTML)) {  // Is the data numbers?
						var lowest = Infinity,
							highest = -Infinity;
						tds.forEach(function(item) {  // determines the high and low ends of the data
							try {  // accounts for parts without data
								if (Number(item.innerHTML) < lowest) {
									lowest = Number(item.innerHTML);
								}
								if (Number(item.innerHTML) > highest) {
									highest = Number(item.innerHTML);
								}
							} finally {  // a necessary accompanyment to try (although I could have used catch)
							}
						});
						end1 = lowest;
						end2 = highest;
						tds.forEach(function(data) {
							if (!isNaN(data.innerHTML.trim()) && data.innerHTML.trim()!="") {  // sets the background color of the tabular data
								data.style.backgroundColor = backgroundColor(Number(data.innerHTML.trim()));
							}
						});
					} else if (tds[3].innerHTML.indexOf(":") > -1 || tds[6].innerHTML.indexOf(":") > -1) {  // if the data has a : (if it's a time or ratio)
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
						if (tds[3].innerHTML.indexOf("-") > -1 || tds[6].innerHTML.indexOf("-") > -1) {  // if the data has a - (if it's a time range)
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
							tds.forEach(function(item) {  // determines the high and low ends of the data set
								try {  // accounts for parts that don't have data
									var difference = timeDifference(item.innerHTML);
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
							tds.forEach(function(data) {  // assigns the background color of each of the tabular data
								try {  // accounts for parts that don't have data (doesn't color them)
									data.style.backgroundColor = backgroundColor(timeDifference(data.innerHTML));
								} finally {  // a necessary accompanyment to try (although I could have used catch)
								}
							});
						} else {
							
						}
					}
				} else if (Standards.checkAll(element.tagName, "==", ["P", "H1", "H2", "H3", "H4", "H5", "H6", "SPAN"], "||")) {
					if (element.innerHTML.trim() != "") {  // if the text isn't empty
						end1 = 0;
						end2 = element.innerHTML.trim().length - 1;
						var replacement = document.createElement(element.tagName);  // makes sure the replacement uses the same tag / element type
						element.innerHTML.trim().split("").forEach(function(character, index) {  // puts a <span> between each letter and colors the text
							var span = document.createElement("span");
							span.innerHTML = character;
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


// makes my custom tag which formats things as notes (not necessary in most browsers)
document.createElement("note-");  // The dash can't be at the beginning of the tag name or else an error will be thrown.
// makes my custom tag which overlines things (not necessary in most browsers)
document.createElement("over-");

// determines whether "Standards" should also be imported as "S"
if (!(Standards.options.simplification == true)) {
	var S = Standards;
}

if (!(Standards.options.automation == "none")) {
	
	//This is able to run without waiting for anything else to load.
	
	let needsIcon = true;
	if (document.head.getElementsByTagName("link").length > 0) {
		document.head.getElementsByTagName("link").forEach(function(link) {
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
		
		if (Standards.options.hasOwnProperty("icon")) {
			icon.href = Standards.options.icon;
		} else {
			// cycles the favicon
			let canvas = document.createElement("canvas");
			let context = canvas.getContext("2d");
			let color = 0;
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
}

if (!(Standards.options.runAuthCode == false) && typeof firebase != "undefined" && firebase.firestore) {
	firebase.auth().onAuthStateChanged(function(person) {  // listens for a change in authorization status (future onAuthStateChanged calls don't overwrite this one)
		if (person) {  // if the user is signed in
			if (Standards.getId("signIn")) {  // if there's a signIn button
				Standards.getId("signIn").style.display = "none";
			}
			if (Standards.getId("signUp")) {  // if there's a signUp button
				Standards.getId("signUp").style.display = "none";
			}
			if (Standards.getId("userSettings")) {  // if there's a userSettings button
				Standards.getId("userSettings").style.display = "inline-block";
			}
			if (Standards.getId("signOut")) {  // if there's a signOut button
				Standards.getId("signOut").style.display = "inline-block";
			}
		} else {
			if (Standards.getId("signIn")) {  // if there's a signIn button
				Standards.getId("signIn").style.display = "inline-block";
			}
			if (Standards.getId("signUp")) {  // if there's a signUp button
				Standards.getId("signUp").style.display = "inline-block";
			}
			if (Standards.getId("userSettings")) {  // if there's a userSettings button
				Standards.getId("userSettings").style.display = "none";
			}
			if (Standards.getId("signOut")) {  // if there's a signOut button
				Standards.getId("signOut").style.display = "none";
			}
		}
		Standards.storage.server.user = person;
	});
}

window.addEventListener("load", function() {  // This waits for everything past the script import to load before running.
	
	if (!Standards.options.hasOwnProperty("automation") || Standards.options.automation == "full") {
		
		// makes the target of every anchor tag "_blank"
		// (purposefully ignores yet-to-be-created links)
		document.getElementsByTagName("a").forEach(function(anchor) {
			if (!anchor.target) {
				anchor.target = "_blank";
			}
		});
		
		// allows radio buttons to be unchecked
		let radioButtonNames = [];
		document.getElementsByTagName("input").forEach(function(input) {
			if (input.type == "radio" && !radioButtonNames.includes(input.name)) {
				radioButtonNames.push(input.name);
			}
		});
		radioButtonNames.forEach(function(name) {
			let previouslyChecked;
			S.getName(name).forEach(function(button) {
				button.addEventListener("click", function() {
					if (this == previouslyChecked) {
						this.checked = false;
						previouslyChecked = undefined;
					} else {
						previouslyChecked = this;
					}
				});
			});
		});
		
		// interprets <note-> tags
		/*
		var noteNumber = 1;
		document.getElementsByTagName("note-").forEach(function(note, index, notes) {
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
		
		// gives the login/user buttons functionality
		if (Standards.getId("signIn")) {  // if there's a signIn button
			Standards.getId("signIn").addEventListener("click", Standards.storage.server.signIn);
		}
		if (Standards.getId("signUp")) {  // if there's a signUp button
			Standards.getId("signUp").addEventListener("click", Standards.storage.server.signUp);
		}
		if (Standards.getId("userSettings")) {  // if there's a userSettings button
			//// do stuff
		}
		if (Standards.getId("signOut")) {  // if there's a signOut button
			Standards.getId("signOut").addEventListener("click", Standards.storage.server.signOut);
		}
	}
	
	// adds navigation content
	if (document.getElementsByTagName("nav").length > 0) {  // This is deprecated. Use iframes with links with "_parent" targets instead.
		let navigation = document.getElementsByTagName("nav")[0];
		if (navigation.hasAttribute("data-href")) {
			Standards.getHTML(navigation.getAttribute("data-href"), function() {
				navigation.appendChild(this);
			});
		} else if (Standards.options.hasOwnProperty("navigation") && Standards.options.navigation != "") {  // This is deprecated.
			Standards.getHTML(Standards.options.navigation, function() {
				navigation.appendChild(this);
			});
		}
	}
		
	// adds page jumping capabilities
	// (This needs to be last in case other processing changes the length of the page, and the user wouldn't be able to be redirected to the place of the desired section.)
	document.getElementsByClassName("page-jump-sections").forEach(function(division) {
		let contents = document.createElement("div");
		contents.className = "page-jump-list";
		contents.innerHTML = "<h2>Jump to:</h2>";
		let sections = division.getElementsByTagName("h2");
		let toTop = document.createElement("p");  // This has to be a <p><a></a></p> rather than just a <a></a> because, otherwise, "To top" has the possibility of appearing in-line.
		toTop.className = "to-top";
		toTop.innerHTML = '<a href="#">To top</a>';
		let listItems = document.createElement("ol");
		sections.forEach(function(heading, index, sections) {
			let inside = sections[index].innerHTML.trim();  // The inner HTML has a bunch of whitespace probably because of carriage returns.
			sections[index].id = inside;
			let link = document.createElement("a");
			link.href = "#" + inside;
			link.innerHTML = inside;
			let listItem = document.createElement("li");
			listItem.appendChild(link);
			listItems.appendChild(listItem);
			division.insertBefore(toTop.cloneNode(true), division.getElementsByTagName("h2")[index].nextSibling);  // inserts after <h2>
			// toTop needs to be cloned so it doesn't keep getting reasigned to the next place (it also needs to have true to clone all children of the node, although it doesn't apply here)
		});
		contents.appendChild(listItems);
		division.parentNode.insertBefore(contents, division);  // .insertBefore() only works for the immediate descendants of the parent
		contents.outerHTML += "<br>";  // Elements need to have a parent node before the outer HTML can be modified. (This makes sure the "Jump to:" section appears on its own line.)
		// This takes you to a certain part of the page after the IDs and links load (if you were trying to go to a certain part of the page.
		if (window.location.href.indexOf("#") > -1) {
			let found = false;
			document.getElementById("pageJump").getElementsByTagName("a").forEach(function(link) {
				if (link.innerHTML.trim() == window.location.href.split("#")[1].trim()) {  // Does the URL match a destination?
					found = true;
					link.click();
					return "break";
				}
			});
			if (!found) {  // Was the section found?
				console.warn('The section "' + window.location.href.split("#")[1].trim() + '" doesn\'t exist on this page.');
			}
		}
	}, false);
	
	Standards.finished = true;
	Standards.queue.run();
	window.dispatchEvent(new Event("finished"));  // This can't be CustomEvent or else it won't work on any version of Internet Explorer.
});

// remember new Function(), function*, and ``
