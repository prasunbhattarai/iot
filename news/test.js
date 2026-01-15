/* =======================
   AUDIO SETUP
======================= */
const audioPlayer = new Audio();
audioPlayer.autoplay = true;

let audioUnlocked = localStorage.getItem("audioUnlocked") === "true";

/* =======================
   WEBSOCKET
======================= */
const ws = new WebSocket(
  "wss://simplified-engineer-gary-forests.trycloudflare.com/ws"
);

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "audio") {
    audioPlayer.src = data.url;

    audioPlayer.play().catch(() => {
      enableSoundBtn.style.display = "block";
    });

    console.log("AI:", data.text);
  }
};

/* =======================
   ELEMENTS
======================= */
const video = document.getElementById("video");
const talkBtn = document.getElementById("talkBtn");
const enableSoundBtn = document.getElementById("enableSoundBtn");

enableSoundBtn.style.display = audioUnlocked ? "none" : "block";

/* =======================
   UNLOCK AUDIO
======================= */
async function unlockAudio() {
  try {
    audioPlayer.src = "";
    await audioPlayer.play();
    audioUnlocked = true;
    localStorage.setItem("audioUnlocked", "true");
    enableSoundBtn.style.display = "none";
  } catch (err) {
    console.error("Audio unlock failed", err);
  }
}

enableSoundBtn.addEventListener("click", unlockAudio);
talkBtn.addEventListener("click", unlockAudio);

/* =======================
   MIC RECORDING
======================= */
let audioStream = null;

talkBtn.addEventListener("click", async (e) => {
  e.preventDefault();

  if (!video.paused) video.pause();

  try {
    if (!audioStream) {
      audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }

    const recorder = new MediaRecorder(audioStream, {
      mimeType: "audio/webm",
    });

    const chunks = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);

    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      const formData = new FormData();
      formData.append("audio", blob, "voice.webm");

      await fetch(
        "https://simplified-engineer-gary-forests.trycloudflare.com/ask_voice",
        {
          method: "POST",
          body: formData,
        }
      );
    };

    recorder.start();
    talkBtn.disabled = true;
    talkBtn.textContent = "🎙 Listening...";

    setTimeout(() => {
      recorder.stop();
      talkBtn.disabled = false;
      talkBtn.textContent = "▶️ Talk";
    }, 5000);
  } catch (err) {
    console.error(err);
  }
});
