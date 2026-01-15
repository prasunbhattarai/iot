const video = document.getElementById("video");
const button = document.getElementById("button");

let audioStream = null;

button.addEventListener("click", async (e) => {
    e.preventDefault();

    if (!video.paused) video.pause();

    try {
        if (!audioStream) {
            audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }

        const recorder = new MediaRecorder(audioStream, {
            mimeType: "audio/webm"
        });

        const chunks = [];

        recorder.ondataavailable = e => chunks.push(e.data);

        recorder.onstop = async () => {
            const blob = new Blob(chunks, { type: "audio/webm" });
            const formData = new FormData();
            formData.append("audio", blob, "voice.webm");

            try {
                const res = await fetch("http://127.0.0.1:8000/ask_voice", {
                    method: "POST",
                    body: formData
                });

                if (!res.ok) throw new Error("Server error");

                const audioBlob = await res.blob();
                const audio = new Audio(URL.createObjectURL(audioBlob));
                audio.play();

            } catch (err) {
                console.error(err);
                showToast("Voice error ❌");
            }
        };

        recorder.start();
        button.disabled = true;
        button.textContent = "🎙 Listening...";

        setTimeout(() => {
            recorder.stop();
            button.disabled = false;
            button.textContent = "▶️ Talk";
        }, 5000);

    } catch (err) {
        console.error(err);
        showToast("Mic denied ❌");
    }
});

function showToast(msg) {
    const div = document.createElement("div");
    div.textContent = msg;
    Object.assign(div.style, {
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "#007bff",
        color: "#fff",
        padding: "10px 20px",
        borderRadius: "5px",
        zIndex: 9999
    });
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 2000);
}
