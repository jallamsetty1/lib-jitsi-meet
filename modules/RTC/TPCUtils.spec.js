/* eslint-disable max-len */

import JitsiMeetJS from '../../JitsiMeetJS';
import SignalingLayerImpl from '../xmpp/SignalingLayerImpl';
import { MockPeerConnection, MockRTC } from './MockClasses';
import RTC from './RTC';
import { TPCUtils } from './TPCUtils';
import TraceablePeerConnection from './TraceablePeerConnection';
import FeatureFlags from '../flags/FeatureFlags';
import { DEFAULT_STUN_SERVERS } from '../xmpp/xmpp';
import { MockChatRoom } from '../xmpp/MockClasses';
import JingleSessionPC from '../xmpp/JingleSessionPC';
import SampleSdpStrings from '../sdp/SampleSdpStrings';

const TEST_VIDEO_BITRATES = {
    low: 200000,
    standard: 700000,
    high: 2500000
};

describe('TPCUtils', () => {
    describe('ensureCorrectOrderOfSsrcs()', () => {
        const commonSdpLines = [
            'v=0',
            'o=- 814997227879783433 5 IN IP4 127.0.0.1',
            's=-',
            't=0 0',
            'a=msid-semantic: WMS 0836cc8e-a7bb-47e9-affb-0599414bc56d',
            'a=group:BUNDLE video',
            'm=video 9 RTP/SAVPF 100 96',
            'c=IN IP4 0.0.0.0',
            'a=rtpmap:100 VP8/90000',
            'a=fmtp:96 apt=100',
            'a=rtcp:9 IN IP4 0.0.0.0',
            'a=rtcp-fb:100 ccm fir',
            'a=rtcp-fb:100 nack',
            'a=rtcp-fb:100 nack pli',
            'a=rtcp-fb:100 goog-remb',
            'a=extmap:3 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time',
            'a=setup:passive',
            'a=mid:video',
            'a=sendrecv',
            'a=ice-ufrag:adPg',
            'a=ice-pwd:Xsr05Mq8S7CR44DAnusZE26F',
            'a=fingerprint:sha-256 6A:39:DE:11:24:AD:2E:4E:63:D6:69:D3:85:05:53:C7:3C:38:A4:B7:91:74:C0:91:44:FC:94:63:7F:01:AB:A9'
        ];

        it('sort ssrcs associated with all FID ssrc-groups', () => {
            const pc = new MockPeerConnection();
            const tpcUtils = new TPCUtils(pc, TEST_VIDEO_BITRATES);

            const source = new RTCSessionDescription({
                type: 'offer',
                sdp: getSourceSdp()
            });
            const result = tpcUtils.ensureCorrectOrderOfSsrcs(source);

            expect(result.sdp).toBe(getExpectedSdp());

            /**
             * Test SDP with multiple FID groups
             */
            function getSourceSdp() {
                return `${[
                    ...commonSdpLines,
                    'a=ssrc:1757014965 msid:0836cc8e-a7bb-47e9-affb-0599414bc56d bdbd2c0a-7959-4578-8db5-9a6a1aec4ecf',
                    'a=ssrc:1757014965 cname:peDGrDD6WsxUOki/',
                    'a=ssrc:1479742055 msid:0836cc8e-a7bb-47e9-affb-0599414bc56d bdbd2c0a-7959-4578-8db5-9a6a1aec4ecf',
                    'a=ssrc:1479742055 cname:peDGrDD6WsxUOki/',
                    'a=ssrc:1089111804 msid:0836cc8e-a7bb-47e9-affb-0599414bc56d bdbd2c0a-7959-4578-8db5-9a6a1aec4ecf',
                    'a=ssrc:1089111804 cname:peDGrDD6WsxUOki/',
                    'a=ssrc:855213044 msid:0836cc8e-a7bb-47e9-affb-0599414bc56d bdbd2c0a-7959-4578-8db5-9a6a1aec4ecf',
                    'a=ssrc:855213044 cname:peDGrDD6WsxUOki/',
                    'a=ssrc:984899560 msid:0836cc8e-a7bb-47e9-affb-0599414bc56d bdbd2c0a-7959-4578-8db5-9a6a1aec4ecf',
                    'a=ssrc:984899560 cname:peDGrDD6WsxUOki/',
                    'a=ssrc:2963867077 msid:0836cc8e-a7bb-47e9-affb-0599414bc56d bdbd2c0a-7959-4578-8db5-9a6a1aec4ecf',
                    'a=ssrc:2963867077 cname:peDGrDD6WsxUOki/',
                    'a=ssrc-group:FID 1757014965 984899560',
                    'a=ssrc-group:FID 1479742055 855213044',
                    'a=ssrc-group:FID 1089111804 2963867077',
                    'a=ssrc-group:SIM 1757014965 1479742055 1089111804',
                    'a=rtcp-mux'
                ].join('\r\n')}\r\n`;
            }

            /**
             * Expected SDP: all ssrc must be present and ordered
             */
            function getExpectedSdp() {
                return `${[
                    ...commonSdpLines,
                    'a=ssrc:1757014965 msid:0836cc8e-a7bb-47e9-affb-0599414bc56d bdbd2c0a-7959-4578-8db5-9a6a1aec4ecf',
                    'a=ssrc:1757014965 cname:peDGrDD6WsxUOki/',
                    'a=ssrc:984899560 msid:0836cc8e-a7bb-47e9-affb-0599414bc56d bdbd2c0a-7959-4578-8db5-9a6a1aec4ecf',
                    'a=ssrc:984899560 cname:peDGrDD6WsxUOki/',
                    'a=ssrc:1479742055 msid:0836cc8e-a7bb-47e9-affb-0599414bc56d bdbd2c0a-7959-4578-8db5-9a6a1aec4ecf',
                    'a=ssrc:1479742055 cname:peDGrDD6WsxUOki/',
                    'a=ssrc:855213044 msid:0836cc8e-a7bb-47e9-affb-0599414bc56d bdbd2c0a-7959-4578-8db5-9a6a1aec4ecf',
                    'a=ssrc:855213044 cname:peDGrDD6WsxUOki/',
                    'a=ssrc:1089111804 msid:0836cc8e-a7bb-47e9-affb-0599414bc56d bdbd2c0a-7959-4578-8db5-9a6a1aec4ecf',
                    'a=ssrc:1089111804 cname:peDGrDD6WsxUOki/',
                    'a=ssrc:2963867077 msid:0836cc8e-a7bb-47e9-affb-0599414bc56d bdbd2c0a-7959-4578-8db5-9a6a1aec4ecf',
                    'a=ssrc:2963867077 cname:peDGrDD6WsxUOki/',
                    'a=ssrc-group:FID 1757014965 984899560',
                    'a=ssrc-group:FID 1479742055 855213044',
                    'a=ssrc-group:FID 1089111804 2963867077',
                    'a=ssrc-group:SIM 1757014965 1479742055 1089111804',
                    'a=rtcp-mux'
                ].join('\r\n')}\r\n`;
            }
        });

        it('sort ssrcs in case the first ssrc in the SIM group is not present at the top', () => {
            const pc = new MockPeerConnection();
            const tpcUtils = new TPCUtils(pc, TEST_VIDEO_BITRATES);

            const source = new RTCSessionDescription({
                type: 'offer',
                sdp: getSourceSdp()
            });
            const result = tpcUtils.ensureCorrectOrderOfSsrcs(source);

            expect(result.sdp).toBe(getExpectedSdp());

            /**
             * Test SDP with multiple FID groups where the first ssrc in the SIM group is not present at the top
             */
            function getSourceSdp() {
                return `${[
                    ...commonSdpLines,
                    'a=ssrc:1479742055 msid:0836cc8e-a7bb-47e9-affb-0599414bc56d bdbd2c0a-7959-4578-8db5-9a6a1aec4ecf',
                    'a=ssrc:1479742055 cname:peDGrDD6WsxUOki/',
                    'a=ssrc:1757014965 msid:0836cc8e-a7bb-47e9-affb-0599414bc56d bdbd2c0a-7959-4578-8db5-9a6a1aec4ecf',
                    'a=ssrc:1757014965 cname:peDGrDD6WsxUOki/',
                    'a=ssrc:1089111804 msid:0836cc8e-a7bb-47e9-affb-0599414bc56d bdbd2c0a-7959-4578-8db5-9a6a1aec4ecf',
                    'a=ssrc:1089111804 cname:peDGrDD6WsxUOki/',
                    'a=ssrc:855213044 msid:0836cc8e-a7bb-47e9-affb-0599414bc56d bdbd2c0a-7959-4578-8db5-9a6a1aec4ecf',
                    'a=ssrc:855213044 cname:peDGrDD6WsxUOki/',
                    'a=ssrc:984899560 msid:0836cc8e-a7bb-47e9-affb-0599414bc56d bdbd2c0a-7959-4578-8db5-9a6a1aec4ecf',
                    'a=ssrc:984899560 cname:peDGrDD6WsxUOki/',
                    'a=ssrc:2963867077 msid:0836cc8e-a7bb-47e9-affb-0599414bc56d bdbd2c0a-7959-4578-8db5-9a6a1aec4ecf',
                    'a=ssrc:2963867077 cname:peDGrDD6WsxUOki/',
                    'a=ssrc-group:FID 1757014965 984899560',
                    'a=ssrc-group:FID 1479742055 855213044',
                    'a=ssrc-group:FID 1089111804 2963867077',
                    'a=ssrc-group:SIM 1757014965 1479742055 1089111804',
                    'a=rtcp-mux'
                ].join('\r\n')}\r\n`;
            }

            /**
             * Expected SDP: all ssrc must be present and ordered
             */
            function getExpectedSdp() {
                return `${[
                    ...commonSdpLines,
                    'a=ssrc:1757014965 msid:0836cc8e-a7bb-47e9-affb-0599414bc56d bdbd2c0a-7959-4578-8db5-9a6a1aec4ecf',
                    'a=ssrc:1757014965 cname:peDGrDD6WsxUOki/',
                    'a=ssrc:984899560 msid:0836cc8e-a7bb-47e9-affb-0599414bc56d bdbd2c0a-7959-4578-8db5-9a6a1aec4ecf',
                    'a=ssrc:984899560 cname:peDGrDD6WsxUOki/',
                    'a=ssrc:1479742055 msid:0836cc8e-a7bb-47e9-affb-0599414bc56d bdbd2c0a-7959-4578-8db5-9a6a1aec4ecf',
                    'a=ssrc:1479742055 cname:peDGrDD6WsxUOki/',
                    'a=ssrc:855213044 msid:0836cc8e-a7bb-47e9-affb-0599414bc56d bdbd2c0a-7959-4578-8db5-9a6a1aec4ecf',
                    'a=ssrc:855213044 cname:peDGrDD6WsxUOki/',
                    'a=ssrc:1089111804 msid:0836cc8e-a7bb-47e9-affb-0599414bc56d bdbd2c0a-7959-4578-8db5-9a6a1aec4ecf',
                    'a=ssrc:1089111804 cname:peDGrDD6WsxUOki/',
                    'a=ssrc:2963867077 msid:0836cc8e-a7bb-47e9-affb-0599414bc56d bdbd2c0a-7959-4578-8db5-9a6a1aec4ecf',
                    'a=ssrc:2963867077 cname:peDGrDD6WsxUOki/',
                    'a=ssrc-group:FID 1757014965 984899560',
                    'a=ssrc-group:FID 1479742055 855213044',
                    'a=ssrc-group:FID 1089111804 2963867077',
                    'a=ssrc-group:SIM 1757014965 1479742055 1089111804',
                    'a=rtcp-mux'
                ].join('\r\n')}\r\n`;
            }
        });

        it('sort ssrcs in case there is a single FID group', () => {
            const pc = new MockPeerConnection();
            const tpcUtils = new TPCUtils(pc, TEST_VIDEO_BITRATES);

            const source = new RTCSessionDescription({
                type: 'offer',
                sdp: getSourceSdp()
            });
            const result = tpcUtils.ensureCorrectOrderOfSsrcs(source);

            expect(result.sdp).toBe(getExpectedSdp());

            /**
             * Test SDP with the single FID group
             */
            function getSourceSdp() {
                return `${[
                    ...commonSdpLines,
                    'a=ssrc:984899560 msid:0836cc8e-a7bb-47e9-affb-0599414bc56d bdbd2c0a-7959-4578-8db5-9a6a1aec4ecf',
                    'a=ssrc:984899560 cname:peDGrDD6WsxUOki/',
                    'a=ssrc:1757014965 msid:0836cc8e-a7bb-47e9-affb-0599414bc56d bdbd2c0a-7959-4578-8db5-9a6a1aec4ecf',
                    'a=ssrc:1757014965 cname:peDGrDD6WsxUOki/',
                    'a=ssrc-group:FID 1757014965 984899560',
                    'a=rtcp-mux'
                ].join('\r\n')}\r\n`;
            }

            /**
             * Expected SDP: all ssrc must be present and ordered
             */
            function getExpectedSdp() {
                return `${[
                    ...commonSdpLines,
                    'a=ssrc:1757014965 msid:0836cc8e-a7bb-47e9-affb-0599414bc56d bdbd2c0a-7959-4578-8db5-9a6a1aec4ecf',
                    'a=ssrc:1757014965 cname:peDGrDD6WsxUOki/',
                    'a=ssrc:984899560 msid:0836cc8e-a7bb-47e9-affb-0599414bc56d bdbd2c0a-7959-4578-8db5-9a6a1aec4ecf',
                    'a=ssrc:984899560 cname:peDGrDD6WsxUOki/',
                    'a=ssrc-group:FID 1757014965 984899560',
                    'a=rtcp-mux'
                ].join('\r\n')}\r\n`;
            }
        });
    });

    describe('replaceTrack tests', () => {
        let jingleSession, jingleSessionPeer;
        let rtc;
        let signalingLayer;
        let videoTrack1;
        let videoTrack2;
        let videoTrack3;
        const SID = 'sid12345';

        const remoteSdp = ''
        'v=0\r\n'
        'o=- 1644263843832 5 IN IP4 127.0.0.1\r\n'
        's=-\r\n'
        't=0 0\r\n'
        'a=group:BUNDLE 0 \r\n'
        'a=msid-semantic: WMS mixedmslabel\r\n'
        'm=video 10000 UDP/TLS/RTP/SAVPF 101 100 96 97\r\n'
        'a=rtcp:9 IN IP4 0.0.0.0\r\n'
        'a=candidate:2 1 udp 1694498815 129.213.110.77 10000 typ srflx raddr 0.0.0.0 rport 9 generation 0\r\n'
        'a=ice-ufrag:ae6ub1fras69o3\r\n'
        'a=ice-pwd:75omdatakrh82chchh89mk6suj\r\n'
        'a=fingerprint:sha-256 CB:D4:DD:2E:10:C2:40:DB:27:ED:15:34:C5:16:08:CB:8C:93:2D:B3:A3:DA:3D:FD:63:40:F0:F0:E0:1A:39:80\r\n'
        'a=setup:actpass\r\n'
        'a=mid:0\r\n'
        'a=extmap:3 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r\n'
        'a=extmap:5 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r\n'
        'a=sendrecv\r\n'
        'a=msid:mixedmslabel mixedlabelvideo0\r\n'
        'a=rtcp-mux\r\n'
        'a=rtpmap:101 VP9/90000\r\n'
        'a=rtcp-fb:101 ccm fir\r\n'
        'a=rtcp-fb:101 nack\r\n'
        'a=rtcp-fb:101 nack pli\r\n'
        'a=rtcp-fb:101 transport-cc\r\n'
        'a=fmtp:101 x-google-start-bitrate=800\r\n'
        'a=rtpmap:100 VP8/90000\r\n'
        'a=rtcp-fb:100 ccm fir\r\n'
        'a=rtcp-fb:100 nack\r\n'
        'a=rtcp-fb:100 nack pli\r\n'
        'a=rtcp-fb:100 transport-cc\r\n'
        'a=fmtp:100 x-google-start-bitrate=800\r\n'
        'a=rtpmap:96 rtx/90000\r\n'
        'a=rtcp-fb:96 ccm fir\r\n'
        'a=rtcp-fb:96 nack\r\n'
        'a=rtcp-fb:96 nack pli\r\n'
        'a=fmtp:96 apt=100\r\n'
        'a=rtpmap:97 rtx/90000\r\n'
        'a=rtcp-fb:97 ccm fir\r\n'
        'a=rtcp-fb:97 nack\r\n'
        'a=rtcp-fb:97 nack pli\r\n'
        'a=fmtp:97 apt=101\r\n'
        'a=ssrc:332512497 cname:\r\n'
        'a=ssrc:332512497 msid:mixedmslabel mixedlabelvideo0\r\n'
        'a=ssrc:332512497 mslabel:mixedmslabel\r\n'
        'a=ssrc:332512497 label:mixedlabelvideo0\r\n';

        beforeEach(async () => {
            FeatureFlags.init({ sourceNameSignaling: true, sendMultipleVideoStreams: true });

            const conferenceStub = {
                myUserId: () => ''
            };
            rtc = new RTC(conferenceStub, {});
            RTC.init({});

            [ videoTrack1 ] = await JitsiMeetJS.createLocalTracks({ devices: [ 'video' ] });
            [ videoTrack2 ] = await JitsiMeetJS.createLocalTracks({ devices: [ 'video' ] });
            [ videoTrack3 ] = await JitsiMeetJS.createLocalTracks({ devices: [ 'video' ] });

            signalingLayer = new SignalingLayerImpl();
            const connectionStub = {
                connected: true,
                jingle: {
                    terminate: () => {}
                },
                sendIQ: () => {},
                addEventListener: () => () => { }
            };
            const pcConfigStub = {
                iceServers: DEFAULT_STUN_SERVERS
            };

            jingleSession = new JingleSessionPC(
                SID, // sid
                'peer1', // localJid
                'peer2', // remoteJid
                connectionStub, // connection
                {
                    offerToReceiveAudio: false,
                    offerToReceiveVideo: true
                }, // mediaConstraints
                pcConfigStub, // pcConfig
                true, // isP2P
                true // isInitiator
            );
            jingleSession.initialize(new MockChatRoom(), rtc, signalingLayer, {usesUnifiedPlan: true})

            jingleSessionPeer = new JingleSessionPC(
                SID, // sid
                'peer2', // localJid
                'peer1', // remoteJid
                connectionStub, // connection
                {
                    offerToReceiveAudio: false,
                    offerToReceiveVideo: true
                }, // mediaConstraints
                pcConfigStub, // pcConfig
                true, // isP2P
                false // isInitiator
            );
            jingleSessionPeer.initialize(new MockChatRoom(), rtc, signalingLayer, {usesUnifiedPlan: true})

        });

        it('adds multiple tracks', async () => {
            await jingleSession.peerconnection.addTrack(videoTrack1);
            jingleSession.invite([ videoTrack1 ]);

            await jingleSessionPeer._renegotiate(jingleSession.peerconnection.peerconnection.localDescription.sdp);

            const video = jingleSession.peerconnection.peerconnection.getTransceivers()
                .filter(t => t.receiver.track.kind === 'video')?.length;
            
            expect(video).toEqual(1);

            await jingleSession.addTrack(videoTrack2);
            const video2 = jingleSession.peerconnection.peerconnection.getTransceivers()
                .filter(t => t.receiver.track.kind === 'video')?.length;

            expect(video2).toEqual(2);

        });

    });
});
