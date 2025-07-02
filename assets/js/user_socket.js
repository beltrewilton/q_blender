// NOTE: The contents of this file will only be executed if
// you uncomment its entry in "assets/js/app.js".

// Bring in Phoenix channels client library:
import { Socket } from "phoenix";

// And connect to the path in "lib/q_blender_web/endpoint.ex". We pass the
// token for authentication. Read below how it should be used.
let socket = new Socket("/socket", { params: { token: window.userToken } });

// When you connect, you'll often need to authenticate the client.
// For example, imagine you have an authentication plug, `MyAuth`,
// which authenticates the session and assigns a `:current_user`.
// If the current user exists you can assign the user's token in
// the connection for use in the layout.
//
// In your "lib/q_blender_web/router.ex":
//
//     pipeline :browser do
//       ...
//       plug MyAuth
//       plug :put_user_token
//     end
//
//     defp put_user_token(conn, _) do
//       if current_user = conn.assigns[:current_user] do
//         token = Phoenix.Token.sign(conn, "user socket", current_user.id)
//         assign(conn, :user_token, token)
//       else
//         conn
//       end
//     end
//
// Now you need to pass this token to JavaScript. You can do so
// inside a script tag in "lib/q_blender_web/templates/layout/app.html.heex":
//
//     <script>window.userToken = "<%= assigns[:user_token] %>";</script>
//
// You will need to verify the user token in the "connect/3" function
// in "lib/q_blender_web/channels/user_socket.ex":
//
//     def connect(%{"token" => token}, socket, _connect_info) do
//       # max_age: 1209600 is equivalent to two weeks in seconds
//       case Phoenix.Token.verify(socket, "user socket", token, max_age: 1_209_600) do
//         {:ok, user_id} ->
//           {:ok, assign(socket, :user, user_id)}
//
//         {:error, reason} ->
//           :error
//       end
//     end
//
// Finally, connect to the socket:
socket.connect();

let channel = null;

const connectBtn = document.getElementById("connect-btn");
const userIdInput = document.getElementById("user-id");
const fileNameDisplay = document.getElementById("file-name");
const framesCounter = document.getElementById("frames-counter");
const progressContainer = document.getElementById("progress-container");
const userInputSection = document.getElementById("user-input");
const circle = document.querySelector(".circle");
const progressText = document.getElementById("progress-text");
const renderPreview = document.getElementById("reder-preview");
const remoteMachine = document.getElementById("remote-machine");
const docsamples = document.getElementById("samples");
const remainingEstimation = document.getElementById("remaining-estimation");
const futureTime = document.getElementById("future-time");
const blenderVersion = document.getElementById("blender-version");
const remoteOutputFile = document.getElementById("remote-output-file");
const mainDisplay = document.getElementById("main-display");


const radius = 90;
const circumference = 2 * Math.PI * radius;

function setProgress(current, end) {
  const ratio = Math.min(current / end, 1);
  const offset = circumference * (1 - ratio);
  circle.style.strokeDashoffset = offset;
  const percent = Math.floor(ratio * 100);
  progressText.innerText = `${percent}%`;
  framesCounter.innerText = `Frame: ${current} / ${end}`;
}

connectBtn.addEventListener("click", () => {
  const userId = userIdInput.value.trim();
  if (!userId) return;

  if (channel) {
    channel.leave();
  }

  channel = socket.channel(`room_channel:${userId}`, {});

  channel.on("new_msg", (payload) => {
    const {
      frame_current,
      frame_end,
      file_name,
      compressed_img_b64,
      samples,
      preview_samples,
      remote_machine,
      blender_version,
      remote_output_file,
      d_future_time,
      td_remaining_estimation
    } = payload.body;
    if (typeof frame_current === "number" && typeof frame_end === "number") {
      setProgress(frame_current, frame_end);
    }
    if (typeof file_name === "string") {
      fileNameDisplay.textContent = file_name;
    }
    renderPreview.style.display = "block";
    renderPreview.src = `data:image/png;base64,${compressed_img_b64}`;
    remoteMachine.textContent = `Connected to: ${remote_machine} @ ${userId}`;
    docsamples.textContent = `Samples Viewport/Render: ${samples}/${preview_samples}`;
    remainingEstimation.textContent = `Remaining Estimation: ${td_remaining_estimation}`;
    futureTime.textContent = `Ending Estimation Time: ${d_future_time}`;
    remoteOutputFile.textContent = remote_output_file;
    blenderVersion.textContent = `Remote Blender Version: ${blender_version}`;
  });

  channel
    .join()
    .receive("ok", (resp) => {
      console.log("Joined successfully", resp);
      progressContainer.style.display = "block";
      userInputSection.style.display = "none";
      fileNameDisplay.style.display = "block";
      framesCounter.style.display = "block";
      remoteMachine.style.display = "block";
      docsamples.style.display = "block";
      remainingEstimation.style.display = "block";
      futureTime.style.display = "block";
      blenderVersion.style.display = "block";
      remoteOutputFile.style.display = "block";
      mainDisplay.style.display = "flex";
    })
    .receive("error", (resp) => console.error("Unable to join", resp));
});

export default socket;
