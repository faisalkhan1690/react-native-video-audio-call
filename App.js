/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import { Button } from 'react-native';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  TextInput,
} from 'react-native';
import VideoAudioUtil from './VideoAudioUtil';


export default class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      chatGroup: 'kellton_chat_room',
      isGroupJoined:false,
      isBackCamera:false
    };
    
    videoAudioUtil=new VideoAudioUtil();  
  }


  joinGroup(){
    this.setState({isGroupJoined:true})
    videoAudioUtil.join(this.state.chatGroup);

  }

  leaveGroup(){
    //TODO end call and leave group 
    this.setState({isGroupJoined:false});
  }


  switchCamera() {
    if(this.state.isBackCamera){
      //TODO swich to front 
    }else{
      //TODO swich to back
    }
    this.setState({isBackCamera:!this.state.isBackCamera})
  }

  render() {

    const cameraView=this.state.isGroupJoined?(
      <View style={styles.marginButton}>
        <Button
          onPress={() => this.switchCamera()}
          color='#841584'
          margin='10'
          title={this.state.isBackCamera?("Switch to front"):("Switch to back")} />
      </View> 
      ):(<View></View>);


    return (
      <View style={styles.container}>

        <TextInput style={styles.inputField}
          onChangeText={(text) => this.setState({ chatGroup: text })}
          value={this.state.chatGroup} />

        <View style={styles.marginButton}>
          <Button
            onPress={() => this.state.isGroupJoined?this.leaveGroup():this.joinGroup()}
            color='#841584'
            margin='10'
            title={this.state.isGroupJoined?("Leave Group"):("Join Group")} />
        </View> 
        {cameraView}
         
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1
  },
  inputField: {
    borderColor: 'gray',
    marginTop: 10,
    borderWidth: 1
  },
  marginButton: {
    marginTop: 10,
  }
});