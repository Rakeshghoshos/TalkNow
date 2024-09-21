class WebRtcServices {
    public peer: RTCPeerConnection;

    constructor() {

            this.peer = new RTCPeerConnection({
                iceServers: [
                    { urls: "stun:stun.l.google.com:19302" },
                  ]
        });
    }

    // Add local track to the peer connection
    addTrack(track: MediaStreamTrack, stream: MediaStream) {
        if (this.peer) {
            this.peer.addTrack(track, stream);
            console.log("Track added to peer connection:", track);
        } else {
            console.error("Peer connection not initialized.");
        }
    }

    // Create and send offer
    async sendOffer() {
        try {
            if (this.peer) {
                const offer = await this.peer.createOffer();
                await this.peer.setLocalDescription(offer);
                return offer;
            }
        } catch (error) {
            console.error("Error creating offer:", error);
        }
    }

    // Set remote description and send answer
    async sendAnswer(offer: RTCSessionDescriptionInit) {
        try {
            if (this.peer) {
                await this.peer.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await this.peer.createAnswer();
                await this.peer.setLocalDescription(answer);
                return answer;
            }
        } catch (error) {
            console.error("Error creating answer:", error);
        }
    }

    // Set local description with error handling
    async setLocalDescription(sdp: RTCSessionDescriptionInit) {
        try {
            if (this.peer) {
                if (this.peer.signalingState !== 'stable') {
                    console.warn('Attempting to set local description in invalid signaling state:', this.peer.signalingState);
                    return;
                }
                await this.peer.setLocalDescription(sdp);
            }
        } catch (error) {
            console.error("Error setting local description:", error);
        }
    }

    // Set remote description with error handling
    async setRemoteDescription(sdp: RTCSessionDescriptionInit) {
        try {
            if (this.peer) {
                await this.peer.setRemoteDescription(new RTCSessionDescription(sdp));
            }
        } catch (error) {
            console.error("Error setting remote description:", error);
        }
    }

    // Add received ICE candidate to the peer connection
    async addIceCandidate(candidate: RTCIceCandidateInit) {
        try {
            if (this.peer) {
                await this.peer.addIceCandidate(new RTCIceCandidate(candidate));
            }
        } catch (error) {
            console.error("Error adding ICE candidate:", error);
        }
    }

    // Close the peer connection
    closeConnection() {
        if (this.peer) {
            this.peer.close();
        }
    }
}

export default new WebRtcServices();
