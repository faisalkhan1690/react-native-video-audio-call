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


export default class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      userEmail: 'tarun@storm-devdb.zoylo.com',
      userPassword: 'tarun',
      receiver: 'swapnil@storm-devdb.zoylo.com',
      isLoggedIn:false,
      isVideoCallActive: false,
      isAudioCallActive: false,
    };
  }

  login() {
    //TODO
    this.setState({isLoggedIn:true})
   }


  logout() {
    this.setState({isLoggedIn:false})
  }

  startAudioCall(){
    if(!this.state.isVideoCallActive){
      this.setState({isAudioCallActive:true})
      //TODO
    }
  }

  stopAudioCall(){
    if(!this.state.isVideoCallActive){
      this.setState({isAudioCallActive:false})
      //TODO
    }
  }

  startVideoCall(){
    if(!this.state.isAudioCallActive){
      this.setState({isVideoCallActive:true})
      //TODO
    }
  }

  stopVideoCall(){
    if(!this.state.isAudioCallActive){
      this.setState({isVideoCallActive:false})
      //TODO
    }
  }

  render() {

    const isLoggedIn=this.state.isLoggedIn;
      const loginFeilds = isLoggedIn ? (
        <View>

          <TextInput style={styles.inputField}
            onChangeText={(text) => this.setState({ receiver: text })}
            value={this.state.receiver} />

          <View style={styles.marginButton}>
          <Button
            onPress={() => this.logout()}
            color='#841584'
            margin='10'
            title="Logout" />

          </View> 
          <View style={styles.marginButton}>
            <Button
              onPress={() => this.state.isAudioCallActive?this.stopAudioCall():this.startAudioCall()}
              color='#841584'
              margin='10'
              title={this.state.isAudioCallActive?("End Audio Call"):("Start Audio Call")}/>
          </View>

          <View style={styles.marginButton}>
            <Button
              onPress={() => this.state.isVideoCallActive?this.stopVideoCall():this.startVideoCall()}
              color='#841584'
              margin='10'
              title={this.state.isVideoCallActive?("Stop Video Call"):("Start Video Call")} />
          </View>
        </View>
      ) : (
        <View>
          <TextInput style={styles.inputField}
            onChangeText={(text) => this.setState({ userEmail: text })}
            value={this.state.userEmail} />

          <TextInput style={styles.inputField}
            onChangeText={(text) => this.setState({ userPassword: text })}
            value={this.state.userPassword} />

          <View style={styles.marginButton}>
            <Button
              onPress={() => this.login()}
              color='#841584'
              margin='10'
              title="Login" />
          </View>
      </View>
      );
    


    return (
      <View style={styles.container}>
       {loginFeilds}
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
