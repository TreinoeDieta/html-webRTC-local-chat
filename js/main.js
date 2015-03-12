'use strict';

var chat1 = {name: "chat1"};
var chat2 = {name: "chat2"};

function sendData1() {
	sendData(chat1);
}

function sendData2() {
	sendData(chat2);
}

function sendData(chat) {
	console.log("send from " + chat.name);
	var text = chat.entryText.value;
	if(text.length == 0) {
		return;
	}
	chat.entryText.value = '';
	chat.textWindow.value+= chat.name + ":" + text + "\n";
	chat.channel.send(text);
}

function createConnection() {
  	var servers = null;
	window.localPeerConnection =
    new webkitRTCPeerConnection(servers, {
      optional: [{
        RtpDataChannels: true
      }]
    });
	console.log('Created local peer connection');

	try {
		chat1.channel = window.localPeerConnection.createDataChannel('sendDataChannel', {
			reliable: true
		});
		console.log('Created send data channel');
	} catch (e) {
		alert('Failed to create data channel. ' +
		  'You need Chrome M25 or later with RtpDataChannel enabled');
		console.log('createDataChannel() failed with exception: ' + e.message);
	}
	window.localPeerConnection.onicecandidate = gotLocalCandidate;
	chat1.channel.onopen = function(){handleStateChanged(chat1)};
	chat1.channel.onclose = function(){handleStateChanged(chat1)};
	chat1.channel.onmessage = function(event){handleMessage(event,chat1)};

	window.remotePeerConnection =
    new webkitRTCPeerConnection(
      servers, {
        optional: [{
          RtpDataChannels: true
        }]
      }
    );
	console.log('Created remote peer connection object');

	window.remotePeerConnection.onicecandidate = gotRemoteIceCandidate;
	window.remotePeerConnection.ondatachannel = gotReceiveChannel;

	window.localPeerConnection.createOffer(gotLocalDescription);
}

function handleStateChanged(chat) {
	var readyState = chat.channel.readyState;
	if (readyState === 'open') {
		chat.textWindow.value+= "connected\n";
	} else {
		chat.textWindow.value+= "connection closed\n";
	}
}

function gotLocalCandidate(event) {
	console.log('gotLocalCandidate');
	if (event.candidate) {
    	window.remotePeerConnection.addIceCandidate(event.candidate);
    	console.log('local ICE candidate: \n ' + event.candidate.candidate);
  	}
}

function gotRemoteIceCandidate(event) {
	console.log('gotRemoteIceCandidate');
	if (event.candidate) {
    	window.localPeerConnection.addIceCandidate(event.candidate);
	    console.log('remote ICE candidate: \n ' + event.candidate.candidate);
  }
}

function gotReceiveChannel(event) {
	console.log('gotReceiveChannel');
	chat2.channel = event.channel;
	chat2.channel.onmessage = function(event){handleMessage(event,chat2)};
	chat2.channel.onopen = function(){handleStateChanged(chat2)};
	chat2.channel.onclose = function(){handleStateChanged(chat2)};
}

function gotLocalDescription(desc) {
	console.log('gotLocalDescription' + desc);
	window.localPeerConnection.setLocalDescription(desc);
  	window.remotePeerConnection.setRemoteDescription(desc);
  	window.remotePeerConnection.createAnswer(gotRemoteDescription);
}

function gotRemoteDescription(desc) {
	console.log('Answer from remotePeerConnection \n' + desc.sdp);
	window.remotePeerConnection.setLocalDescription(desc);
	window.localPeerConnection.setRemoteDescription(desc);
}

function handleMessage(event,chat) {
	var other = chat == chat1 ? chat2 : chat1;
	console.log('Received message: ' + event.data);
	chat.textWindow.value += other.name + ":" + event.data + "\n";
}

window.onload = function() {
	console.log('page load');
	chat1.sendButton = document.getElementById('sendButton1');
	chat2.sendButton = document.getElementById('sendButton2');

	chat1.textWindow = document.getElementById('chatWindow1');
	chat2.textWindow = document.getElementById('chatWindow2');

	chat1.entryText = document.getElementById('entry1');
	chat2.entryText = document.getElementById('entry2');
	
	chat1.textWindow.value = "connecting...\n";
	chat2.textWindow.value = "connecting...\n";
	createConnection();
}