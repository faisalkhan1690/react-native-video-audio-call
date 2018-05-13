import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
  TextInput,
  ListView,
  Platform,
} from 'react-native';

import {
  RTCPeerConnection,
  RTCMediaStream,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  MediaStreamTrack,
  getUserMedia,
} from 'react-native-webrtc';

import io from 'socket.io-client';

const socket = io.connect('https://react-native-webrtc.herokuapp.com', {transports: ['websocket']});
const configuration = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};
const pcPeers = {};
let localStream;

export default class VideoAudioUtil extends Component{
  
  constructor(props) {
    super(props)
    this.ds = new ListView.DataSource({rowHasChanged: (r1, r2) => true});
    this.state= {
      info: 'Initializing',
      status: 'init',
      roomID: 'kellton',
      isFront: true,
      selfViewSrc: null,
      remoteList: {},
      textRoomConnected: false,
      textRoomData: [],
      textRoomValue: '',
    };
  }

  componentDidMount(){
    socket.on('exchange',(data)=>{
      this.exchange(data);
    });
    socket.on('leave',(socketId)=>{
      this.leave(socketId);
    });
    
    socket.on('connect', (data)=> {
      console.warn('connect');
      this.getLocalStream(true, (stream)=> {
        console.warn('connect1')
        localStream = stream;
        console.warn("stream")
        console.warn(stream)
        this.setState({selfViewSrc: stream.toURL()});
        this.setState({status: 'ready', info: 'Please enter or create room ID'});
      });
    });
  }

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>
          {this.state.info}
        </Text>
        {this.state.textRoomConnected && this.renderTextRoom()}
        <View style={{flexDirection: 'row'}}>
          <Text>
            {this.state.isFront ? "Use front camera" : "Use back camera"}
          </Text>
          <TouchableHighlight
            style={{borderWidth: 1, borderColor: 'black'}}
            onPress={this.switchVideoType}>
            <Text>Switch camera</Text>
          </TouchableHighlight>
        </View>
        { this.state.status == 'ready' ?
          (<View>
            <TextInput
              ref='roomID'
              autoCorrect={false}
              style={{width: 200, height: 40, borderColor: 'gray', borderWidth: 1}}
              onChangeText={(text) => this.setState({roomID: text})}
              value={this.state.roomID}
            />
            <TouchableHighlight
              onPress={this.press}>
              <Text>Enter room</Text>
            </TouchableHighlight>
          </View>) : null
        }
        <RTCView streamURL={this.state.selfViewSrc} style={styles.selfView}/>
        {
          this.mapHash(this.state.remoteList, (remote, index)=> {
            return <RTCView key={index} streamURL={remote} style={styles.remoteView}/>
          })
        }
      </View>
    );
  } 
  
  press=(event)=> {
    this.setState({status: 'connect', info: 'Connecting'});
    this.join(this.state.roomID);
  }

  switchVideoType=()=> {
    console.warn(this.state.isFront)
    const isFront = !this.state.isFront;
    this.setState({isFront});
    this.getLocalStream(isFront, (stream)=> {
      if (localStream) {
        for (const id in pcPeers) {
          const pc = pcPeers[id];
          pc && pc.removeStream(localStream);
        }
        localStream.release();
      }
      localStream = stream;
      this.setState({selfViewSrc: stream.toURL()});

      for (const id in pcPeers) {
        const pc = pcPeers[id];
        pc && pc.addStream(localStream);
      }
    });
  }

  receiveTextData(data) {
    const textRoomData = this.state.textRoomData.slice();
    textRoomData.push(data);
    this.setState({textRoomData, textRoomValue: ''});
  }

  textRoomPress() {
    if (!this.state.textRoomValue) {
      return
    }
    const textRoomData = this.state.textRoomData.slice();
    textRoomData.push({user: 'Me', message: this.state.textRoomValue});
    for (const key in pcPeers) {
      const pc = pcPeers[key];
      pc.textDataChannel.send(this.state.textRoomValue);
    }
    this.setState({textRoomData, textRoomValue: ''});
  }

  renderTextRoom() {
    return (
      <View style={styles.listViewContainer}>
        <ListView
          dataSource={this.ds.cloneWithRows(this.state.textRoomData)}
          renderRow={rowData => <Text>{`${rowData.user}: ${rowData.message}`}</Text>}
          />
        <TextInput
          style={{width: 200, height: 30, borderColor: 'gray', borderWidth: 1}}
          onChangeText={value => this.setState({textRoomValue: value})}
          value={this.state.textRoomValue}
        />
        <TouchableHighlight
          onPress={this.textRoomPress}>
          <Text>Send</Text>
        </TouchableHighlight>
      </View>
    );
  }

  getLocalStream(isFront, callback) {

    let videoSourceId;
  
    // on android, you don't have to specify sourceId manually, just use facingMode
    // uncomment it if you want to specify
    if (Platform.OS === 'ios') {
      MediaStreamTrack.getSources(sourceInfos => {
        console.log("sourceInfos: ", sourceInfos);
  
        for (const i = 0; i < sourceInfos.length; i++) {
          const sourceInfo = sourceInfos[i];
          if(sourceInfo.kind == "video" && sourceInfo.facing == (isFront ? "front" : "back")) {
            videoSourceId = sourceInfo.id;
          }
        }
      });
    }
    getUserMedia({
      audio: true,
      video: {
        mandatory: {
          minWidth: 640, // Provide your own width, height and frame rate here
          minHeight: 360,
          minFrameRate: 30,
        },
        facingMode: (isFront ? "user" : "environment"),
        optional: (videoSourceId ? [{sourceId: videoSourceId}] : []),
      }
    }, (stream)=> {
      console.warn('getUserMedia success', stream);
      callback(stream);
    }, this.logError);
  }
  
  join(roomID) {
    socket.emit('join', roomID, (socketIds)=>{
      console.log('join', socketIds);
      for (const i in socketIds) {
        const socketId = socketIds[i];
        this.createPC(socketId, true);
      }
    });
  }
  
  createPC(socketId, isOffer) {
    const pc = new RTCPeerConnection(configuration);
    pcPeers[socketId] = pc;

    pc.onicecandidate = (event)=> {
      console.log('onicecandidate', event.candidate);
      if (event.candidate) {
        socket.emit('exchange', {'to': socketId, 'candidate': event.candidate });
      }
    };
  
    this.createOffer(pc);
    pc.onnegotiationneeded = ()=> {
      console.log('onnegotiationneeded');
      if (isOffer) {
        this.createOffer(pc);
      }
    }
  
    pc.oniceconnectionstatechange = (event) => {
      console.log('oniceconnectionstatechange', event.target.iceConnectionState);
      if (event.target.iceConnectionState === 'completed') {
        setTimeout(() => {
          getStats();
        }, 1000);
      }
      if (event.target.iceConnectionState === 'connected') {
        this.createDataChannel(pc);
      }
    };
    
    pc.onsignalingstatechange = (event)=> {
      console.log('onsignalingstatechange', event.target.signalingState);
    };
  
    pc.onaddstream = (event) => {
      console.log('onaddstream', event.stream);
      this.setState({info: 'One peer join!'});
  
      const remoteList = this.state.remoteList;
      remoteList[socketId] = event.stream.toURL();
      this.setState({ remoteList: remoteList });
    };
    pc.onremovestream = (event)=> {
      console.log('onremovestream', event.stream);
    };
  
    pc.addStream(localStream);
    this.createDataChannel(pc)
    return pc;
  }

  createOffer(pc) {
    pc.createOffer((desc)=> {
      console.log('createOffer', desc);
      pc.setLocalDescription(desc,() => {
        console.log('setLocalDescription', pc.localDescription);
        socket.emit('exchange', {'to': socketId, 'sdp': pc.localDescription });
      }, this.logError);
    }, this.logError);
  }

  createDataChannel(pc) {
    if (pc.textDataChannel) {
      return;
    }
    const dataChannel = pc.createDataChannel("text");

    dataChannel.onerror = (error)=> {
      console.log("dataChannel.onerror", error);
    };

    dataChannel.onmessage = (event)=> {
      console.log("dataChannel.onmessage:", event.data);
      this.receiveTextData({user: socketId, message: event.data});
    };

    dataChannel.onopen = ()=> {
      console.log('dataChannel.onopen');
      this.setState({textRoomConnected: true});
    };

    dataChannel.onclose = ()=> {
      console.log("dataChannel.onclose");
    };

    pc.textDataChannel = dataChannel;
  }
  
  exchange(data) {
    const fromId = data.from;
    let pc;
    if (fromId in pcPeers) {
      pc = pcPeers[fromId];
    } else {
      pc = this.createPC(fromId, false);
    }
  
    if (data.sdp) {
      console.log('exchange sdp', data);
      pc.setRemoteDescription(new RTCSessionDescription(data.sdp),()=> {
        if (pc.remoteDescription.type == "offer")
          pc.createAnswer((desc)=> {
            console.log('createAnswer', desc);
            pc.setLocalDescription(desc, ()=> {
              console.log('setLocalDescription', pc.localDescription);
              socket.emit('exchange', {'to': fromId, 'sdp': pc.localDescription });
            }, this.logError);
          }, this.logError);
      }, this.logError);
    } else {
      console.log('exchange candidate', data);
      pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  }
  
  leave(socketId) {
    console.log('leave', socketId);
    const pc = pcPeers[socketId];
    const viewIndex = pc.viewIndex;
    pc.close();
    delete pcPeers[socketId];
  
    const remoteList = this.state.remoteList;
    delete remoteList[socketId]
    this.setState({ remoteList: remoteList });
    this.setState({info: 'One peer leave!'});
  }
  
  logError(error) {
    console.log("logError", error);
  }
  
  mapHash(hash, func) {
    const array = [];
    for (const key in hash) {
      const obj = hash[key];
      array.push(func(obj, key));
    }
    return array;
  }
  
  getStats() {
    const pc = pcPeers[Object.keys(pcPeers)[0]];
    if (pc.getRemoteStreams()[0] && pc.getRemoteStreams()[0].getAudioTracks()[0]) {
      const track = pc.getRemoteStreams()[0].getAudioTracks()[0];
      console.log('track', track);
      pc.getStats(track,(report)=> {
        console.log('getStats report', report);
      }, this.logError);
    }
  }
}

const styles = StyleSheet.create({
  selfView: {
    width: 200,
    height: 150,
  },
  remoteView: {
    width: 200,
    height: 150,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  listViewContainer: {
    height: 150,
  },
});

