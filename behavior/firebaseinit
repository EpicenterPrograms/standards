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
if (Standards.options.serverSettings) {
	if (typeof Standards.options.serverSettings != "object") {
		Standards.options.serverSettings = {
			apiKey: "AIzaSyDWDEU1NcHtuAi-Fg-ahu-o1CRHwAhVo_s",
			authDomain: "epicenterresources.firebaseapp.com",
			databaseURL: "https://epicenterresources.firebaseio.com",
			projectId: "epicenterresources",
			storageBucket: "",
			messagingSenderId: "705640376450"
		};
		console.warn("typeof Standards.options is not an object");
	}
} else {
	Standards.options.serverSettings = {
		apiKey: "AIzaSyDWDEU1NcHtuAi-Fg-ahu-o1CRHwAhVo_s",
		authDomain: "epicenterresources.firebaseapp.com",
		databaseURL: "https://epicenterresources.firebaseio.com",
		projectId: "epicenterresources",
		storageBucket: "",
		messagingSenderId: "705640376450"
	};
};

if (!(Standards.options.serverSettings.initialization == "none" || Standards.options.serverSettings.initialization == false)) {
	// initializes Firebase
	firebase.initializeApp(Standards.options.serverSettings);
}
