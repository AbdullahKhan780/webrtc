import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import React from "react";
import Peer from "peerjs";

type MediaConnection = ReturnType<Peer["call"]>;

function App() {
  // Holds the PeerJS instance
  const PeerJS = React.useRef<Peer | null>(null);
  // Holds the current call state
  const ActiveCall = React.useRef<MediaConnection | null | undefined>(null);

  const [PeerID, setPeerID] = React.useState("");
  const [RemotePeerID, setRemotePeerID] = React.useState("");

  const RemoteVideoRef = React.useRef<HTMLVideoElement>(null);
  const CurrentUserVideoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    PeerJS.current = new Peer();

    PeerJS.current.on("open", (id) => {
      console.log("PEER ID", id);
      setPeerID(id);
    });

    PeerJS.current.on("call", async (call) => {
      const Stream = await getUserMedia();

      if (Stream) call.answer(Stream);
      else console.error("getUserMedia is not supported in this browser");
    });

    return () => {
      PeerJS.current?.off("open");
      PeerJS.current?.off("call");

      PeerJS.current = null;
    };
  }, []);

  const getUserMedia = async () => {
    try {
      // Directly use the standard API (most browsers support this)
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        return await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true,
        });
      } else {
        throw new Error("getUserMedia is not supported in this browser.");
      }
    } catch (error) {
      console.error("Error accessing media devices", error);
    }
  };

  const InitCall = async (id: string) => {
    const Stream = await getUserMedia();

    if (CurrentUserVideoRef.current)
      CurrentUserVideoRef.current.srcObject = Stream ?? null;

    if (Stream) {
      const Call = PeerJS.current?.call(id, Stream);

      ActiveCall.current = Call;

      Call?.on("stream", (remoteStream) => {
        if (RemoteVideoRef.current)
          RemoteVideoRef.current.srcObject = remoteStream;
      });
    } else console.error("getUserMedia is not supported in this browser");
  };

  const CloseCall = () => {
    // Stop the local stream tracks
    if (ActiveCall.current) {
      // Stop all the local media tracks (audio/video)
      const senders = ActiveCall.current.peerConnection.getSenders();
      senders.forEach((sender) => {
        const track = sender.track;
        if (track) {
          track.stop(); // Stop each media track
        }
      });

      // Close the PeerJS call
      ActiveCall.current.close();
      ActiveCall.current = null; // Clear the current call reference

      // Optionally reset video elements
      if (CurrentUserVideoRef.current) {
        CurrentUserVideoRef.current.srcObject = null;
      }
      if (RemoteVideoRef.current) {
        RemoteVideoRef.current.srcObject = null;
      }

      console.log("Call ended and resources released.");
    }
  };

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Web-RTC</h1>
      {PeerID && <p>ID:: {PeerID}</p>}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div className="card" style={{ width: "100%" }}>
          <input
            name="remotePeer"
            type="text"
            value={RemotePeerID}
            style={{ padding: 10, flex: 2 }}
            onChange={(e) => setRemotePeerID(e.target.value)}
          />
          <button onClick={() => InitCall(RemotePeerID)} style={{ flex: 1 }}>
            Start call
          </button>
          <button
            onClick={() => CloseCall()}
            style={{ flex: 1, backgroundColor: "red" }}
          >
            Stop call
          </button>
        </div>

        <div style={{ display: "flex" }}>
          <video ref={CurrentUserVideoRef} autoPlay />
          <video ref={RemoteVideoRef} autoPlay />
        </div>
      </div>
    </>
  );
}

export default App;
