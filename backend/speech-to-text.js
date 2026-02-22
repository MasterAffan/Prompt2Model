const micBtn = document.getElementById('micBtn');
const textOutput = document.getElementById('textOutput');

let recognition;
let isListening = false;

// Check for Web Speech API
if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    alert('Sorry, your browser does not support speech recognition. Please use Chrome.');
} else {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();

    recognition.continuous = false; // Stop automatically after user stops speaking
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        isListening = true;
        micBtn.classList.add('active');
    };

    recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        textOutput.textContent = transcript;
    };

    recognition.onend = () => {
        isListening = false;
        micBtn.classList.remove('active');
    };

    recognition.onerror = (event) => {
        console.error('Error occurred: ' + event.error);
        isListening = false;
        micBtn.classList.remove('active');
    };
}

// Toggle mic on click
micBtn.addEventListener('click', () => {
    if (!isListening) {
        recognition.start();
    } else {
        recognition.stop();
    }
});
