if (Standards) {
	if (!(Standards instanceof Object)) {
		var Standards = {};
		console.warn("typeof Standards is not an object");
	}
} else {
	var Standards = {};
}
if (Standards.firebaseinit) {
	if (!(Standards.firebaseinit instanceof Object)) {
		Standards.firebaseinit = {};
		console.warn("typeof Standards.firebaseinit is not an object");
	}
} else {
	Standards.firebaseinit = {};
}
if (Standards.firebaseinit.options) {
	if (!(Standards.firebaseinit.options instanceof Object)) {
		Standards.firebaseinit.options = {};
		console.warn("typeof Standards.firebaseinit.options is not an object");
	}
} else {
	Standards.firebaseinit.options = {};
}

if (Standards.firebaseinit.options.serverSettings) {
	if (typeof Standards.firebaseinit.options.serverSettings != "object") {
		Standards.firebaseinit.options.serverSettings = {
			apiKey: "AIzaSyDWDEU1NcHtuAi-Fg-ahu-o1CRHwAhVo_s",
			authDomain: "epicenterresources.firebaseapp.com",
			databaseURL: "https://epicenterresources.firebaseio.com",
			projectId: "epicenterresources",
			storageBucket: "",
			messagingSenderId: "705640376450"
		};
		console.warn("typeof Standards.firebaseinit.options.serverSettings is not an object");
	}
} else {
	Standards.firebaseinit.options.serverSettings = {
		apiKey: "AIzaSyDWDEU1NcHtuAi-Fg-ahu-o1CRHwAhVo_s",
		authDomain: "epicenterresources.firebaseapp.com",
		databaseURL: "https://epicenterresources.firebaseio.com",
		projectId: "epicenterresources",
		storageBucket: "",
		messagingSenderId: "705640376450"
	};
}

if (!(Standards.firebaseinit.options.serverSettings.initialization == "none" || Standards.firebaseinit.options.serverSettings.initialization == false)) {
	// initializes Firebase
	firebase.initializeApp(Standards.firebaseinit.options.serverSettings);
}
