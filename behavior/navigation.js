if (Standards) {
	if (!(Standards instanceof Object)) {
		var Standards = {};
		console.warn("typeof Standards is not an object");
	}
} else {
	var Standards = {};
}
if (Standards.navigation) {
	if (!(Standards.navigation instanceof Object)) {
		Standards.navigation = {};
		console.warn("typeof Standards.navigation is not an object");
	}
} else {
	Standards.navigation = {};
}
if (Standards.navigation.options) {
	if (!(Standards.navigation.options instanceof Object)) {
		Standards.navigation.options = {};
		console.warn("typeof Standards.navigation.options is not an object");
	}
} else {
	Standards.navigation.options = {};
}



function createNestedElements(parent, obj, prepath) {
	Object.keys(obj).forEach(function (key) {
		let item = document.createElement("li");
		let path = key;
		if (prepath) {
			path = prepath + "/" + path;
		}
		if (obj[key] instanceof Object) {
			let details = document.createElement("details");
			let summary = document.createElement("summary");
			if (Object.keys(obj[key])[0] == "summary") {
				summary.textContent = obj[key]["summary"];
				delete obj[key]["summary"];
			} else {
				summary.textContent = "Expand for more";
			}
			details.appendChild(summary);
			let sublist = document.createElement("ul");
			createNestedElements(sublist, obj[key], path);
			details.appendChild(sublist);
			item.appendChild(details);
		} else {
			let link = document.createElement("a");
			link.href = path;
			link.textContent = obj[key];
			item.appendChild(link);
		}
		parent.appendChild(item);
	});
}

window.addEventListener("load", function () {
	if (!Standards.navigation.contents) {
		Standards.navigation.contents = {};
	}
	if (Standards.navigation.contents.constructor === Array) {
		var temporaryContainer = [];
		Standards.navigation.contents.forEach(function (pair) {
			let listItem = document.createElement("li");
			let hiddenListItem = document.createElement("li");  // allows bolding without shifting the list
			hiddenListItem.className = "nav-list-expander";
			if (pair[0].constructor === Array) {  // if the item should be expandable
				listItem.className = "expandable";
				let itemHTML = "";
				pair.forEach(function (subpair, index) {
					if (index === 0) {  // if it's the displayed item
						itemHTML += "<a href='" + subpair[0];
						try {  // allows finishing the script when Google Chrome doesn't allow accessing iframe parents which are local files
							if (subpair[1] === window.parent.document.getElementsByClassName("main-title")[0].textContent.trim()) {
								itemHTML += "' class='current-selection";
							}
						} catch (error) {}
						itemHTML += "'>" + subpair[1] + "</a><ul>";
					} else {
						itemHTML += "<li";
						try {
							if (subpair[1] === window.parent.document.getElementsByClassName("main-title")[0].textContent.trim()) {
								itemHTML += " class='current-selection'"
							}
						} catch (error) {}
						itemHTML += "><a href='" + subpair[0] + "'>" + subpair[1] + "</a></li>";
					}
				});
				itemHTML += "</ul>";
				listItem.innerHTML = itemHTML;
				document.getElementById("contentsList").appendChild(listItem);
				hiddenListItem.innerHTML = itemHTML;
				temporaryContainer.push(hiddenListItem);
			} else {
				listItem.innerHTML = "<a href='" + pair[0] + "'>" + pair[1] + "</a>";
				try {  // allows finishing the script when Google Chrome doesn't allow accessing iframe parents which are local files
					if (pair[1] === window.parent.document.getElementsByClassName("main-title")[0].textContent.trim()) {
						listItem.className = "current-selection";
					}
				} catch (error) {}
				document.getElementById("contentsList").appendChild(listItem);
				hiddenListItem.innerHTML = pair[1];
				temporaryContainer.push(hiddenListItem);
			}
		});
		temporaryContainer.forEach(function (item) {
			document.getElementById("contentsList").appendChild(item);
		});
	} else if (Standards.navigation.contents instanceof Object) {
		// creates the table of contents
		createNestedElements(document.getElementById("contentsList"), Standards.navigation.contents);
	} else {
		console.error("An improper type of contents was provided.")
	}

	// modifies URLs for links when they go to local files
	if (window.location.protocol == "file:") {
		let anchorList = document.getElementsByTagName("a");
		let url;
		for (let index = 0; index < anchorList.length; index++) {
			url = anchorList[index].href;
			if (!url.split("/")[url.split("/").length - 1].includes(".")) {  // if there's not a file extension
				if (url.split("/")[url.split("/").length - 1] == "") {
					anchorList[index].href += "index.html";
				} else {
					anchorList[index].href += ".html";
				}
			}
		}
	}

	// tries to find the current page in the contents
	let currentPage;
	try {  // allows finishing the script when Google Chrome doesn't allow accessing iframe parents which are local files
		currentPage = window.parent.location.href;
	} catch (error) {}
	if (currentPage) {
		let anchorList = document.getElementsByTagName("a");
		let anchor;
		for (let index = 0; index < anchorList.length; index++) {  // for every anchor
			anchor = anchorList[index];
			let urlLength = anchor.href.length;
			if (currentPage.slice(-urlLength) == anchor.href) {  // if the anchor href aligns with the end of the parent's href
				anchor.className = "current-selection";  // mark the anchor as leading to the current page
				if (Standards.navigation.contents instanceof Object) {
					// opens details blocks containing the link to the current page
					let currentElement = anchor;
					let contentsList = document.getElementById("contentsList");
					while (currentElement !== contentsList) {
						if (currentElement.tagName == "DETAILS") {
							currentElement.open = true;
						}
						currentElement = currentElement.parentElement;
					}
				}
			}
		}
	}
});

addEventListener("message", function (information) {
	if (information instanceof Object) {
		let base = window.location.href;
		base = base.slice(0, base.lastIndexOf("/") + 1);
		let path = information.url;
		path = path.slice(base.length, path.lastIndexOf("."));
		// base + path = URL of page
	}
});
