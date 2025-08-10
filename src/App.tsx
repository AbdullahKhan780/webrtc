import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import React from "react";
import Peer from "peerjs";

type MediaConnection = ReturnType<Peer["call"]>;

function App() {
  // Holds the PeerJS instance
  const PeerJS = React.useRef<Peer | null>(null);
  // Store streams for recording
  const LocalStream = React.useRef<MediaStream | null>(null);
  const RemoteStream = React.useRef<MediaStream | null>(null);

  const [ActiveCall, setActiveCall] = React.useState<
    MediaConnection | null | undefined
  >(null);

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

      if (Stream) {
        LocalStream.current = Stream;

        // Display local video
        if (CurrentUserVideoRef.current) {
          CurrentUserVideoRef.current.srcObject = Stream;
        }

        call.answer(Stream);
        setActiveCall(call);

        // Handle incoming remote stream
        call.on("stream", (remoteStream) => {
          console.log("Received remote stream");
          RemoteStream.current = remoteStream;

          if (RemoteVideoRef.current) {
            RemoteVideoRef.current.srcObject = remoteStream;
          }
        });

        call.on("close", () => {
          console.log("Call closed by remote peer");
          CloseCall();
        });
      } else {
        console.error("getUserMedia is not supported in this browser");
      }
    });

    console.log('hello', RemoteStream.current, LocalStream.current);

    return () => {
      PeerJS.current?.off("open");
      PeerJS.current?.off("call");
      PeerJS.current = null;
    };
  }, []);

  const getUserMedia = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        return await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
      } else {
        throw new Error("getUserMedia is not supported in this browser.");
      }
    } catch (error) {
      console.error("Error accessing media devices", error);
      return null;
    }
  };

  const InitCall = async (id: string) => {
    if (!id.trim()) {
      console.error("Please enter a valid peer ID");
      return;
    }

    const Stream = await getUserMedia();

    if (Stream) {
      LocalStream.current = Stream;

      // Display local video
      if (CurrentUserVideoRef.current) {
        CurrentUserVideoRef.current.srcObject = Stream;
      }

      const Call = PeerJS.current?.call(id, Stream);

      setActiveCall(Call);

      if (Call) {
        Call.on("stream", (remoteStream) => {
          console.log("Received remote stream");
          RemoteStream.current = remoteStream;

          if (RemoteVideoRef.current) {
            RemoteVideoRef.current.srcObject = remoteStream;
          }
        });

        Call.on("close", () => {
          console.log("Call closed");
          CloseCall();
        });

        Call.on("error", (err) => {
          console.error("Call error:", err);
        });
      }
    } else {
      console.error("Could not get user media");
    }
  };

  const CloseCall = () => {
    // Stop local stream tracks
    if (LocalStream.current) {
      LocalStream.current.getTracks().forEach((track) => {
        track.stop();
      });
      LocalStream.current = null;
    }

    // Clear remote stream reference
    RemoteStream.current = null;

    // Close the PeerJS call
    setActiveCall(null);

    // Clear video elements
    if (CurrentUserVideoRef.current) {
      CurrentUserVideoRef.current.srcObject = null;
    }
    if (RemoteVideoRef.current) {
      RemoteVideoRef.current.srcObject = null;
    }

    console.log("Call ended and resources released.");
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
            placeholder="Enter remote peer ID"
            style={{ padding: 8, width: "100%" }}
            onChange={(e) => setRemotePeerID(e.target.value)}
          />
          <div style={{ display: "flex", gap: 10, width: "100%" }}>
            <button
              onClick={() => InitCall(RemotePeerID)}
              style={{ flex: 1 }}
              disabled={!RemotePeerID.trim() || !!ActiveCall}
            >
              Start call
            </button>
            <button
              onClick={() => CloseCall()}
              style={{ flex: 1, backgroundColor: "red" }}
              disabled={!ActiveCall}
            >
              Stop call
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 20, width: "100%" }}>
          <div>
            <h3>Your Video</h3>
            <video
              ref={CurrentUserVideoRef}
              autoPlay
              muted
              width="300"
              height="200"
              style={{ border: "2px solid #ccc" }}
            />
          </div>
          <div>
            <h3>Remote Video</h3>
            <video
              ref={RemoteVideoRef}
              autoPlay
              width="300"
              height="200"
              style={{ border: "2px solid #ccc" }}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
