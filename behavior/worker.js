addEventListener("message", function (message) {
	setTimeout(function () {
		postMessage(message.data.content);
	}, message.data.ms);
});
