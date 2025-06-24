/*  This is being updated from 4.6.1 to 11.9.1. It now needs to use the "module" type in the script import.
This assumes you have previously imported the scripts:
https://www.gstatic.com/firebasejs/4.6.1/firebase.js
https://www.gstatic.com/firebasejs/4.6.1/firebase-firestore.js
and are making use of the project with the ID "epicenterresources"
*/

/*
import {  // imports modern authentication to prevent failures from using the old version
	getAuth,
	onAuthStateChanged,
	GoogleAuthProvider,
	signInWithRedirect,
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	signInAnonymously,
	signOut
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
*/

window.Standards ??= {};
Standards.firebaseinit ??= {};
Standards.firebaseinit.options ??= {};
Standards.firebaseinit.options.serverSettings ??= {
	apiKey: "AIzaSyDWDEU1NcHtuAi-Fg-ahu-o1CRHwAhVo_s",
	authDomain: "epicenterresources.firebaseapp.com",
	databaseURL: "https://epicenterresources.firebaseio.com",
	projectId: "epicenterresources",
	storageBucket: "",
	messagingSenderId: "705640376450",
	initialization: true
};

if (!(Standards.firebaseinit.options.serverSettings.initialization === "none" || Standards.firebaseinit.options.serverSettings.initialization === false)) {
	// initializes Firebase
	firebase.initializeApp(Standards.firebaseinit.options.serverSettings);
}
