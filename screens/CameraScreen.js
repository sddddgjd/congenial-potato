import React from 'react';
import { StyleSheet } from 'react-native';
import { Text, View, ListView, TouchableOpacity } from 'react-native';
import { Camera, Permissions } from 'expo';
import { getByLines } from '../ocr/lineSegmentation'

import * as axios from 'axios';


export default class CameraView extends React.Component {
  constructor() {
    super()

    const nutritionDataSource = new ListView.DataSource({
      rowHasChanged: (r1, r2) => r1 !== r2
    });

    this.state = {
      hasCameraPermission: null,
      type: Camera.Constants.Type.back,
      text: '',
      displayText: false,
      nutritionDataSource
    }

    this.snap = this.snap.bind(this)
  }

  async componentWillMount() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({ hasCameraPermission: status === 'granted' });
  }

  snap = async () => {
    if (this.camera) {
      const photo = await this.camera.takePictureAsync({ base64: true });
      const reqBody = {
        "requests": [
          {
            "image": {
              "content": photo.base64
            },
            "features": [
              {
                "type": "DOCUMENT_TEXT_DETECTION"
              }
            ]
          }
        ]
      }
      try {
        const res = await axios.post('https://vision.googleapis.com/v1/images:annotate?key=AIzaSyBuSz_thzosxMH9g7zBNBumBKZUPW8ZZAA', reqBody)
        this.setState({ nutritionDataSource: this.state.nutritionDataSource.cloneWithRows(getByLines(res.data.responses[0])), displayText: true })
      } catch (err) {
        console.log(err)
      }
    }
  };

  render() {
    const { hasCameraPermission } = this.state;
    if (hasCameraPermission === null) {
      return <View />;
    } else if (hasCameraPermission === false) {
      return <Text>No access to camera</Text>;
    } else {
      return (
        <View style={{ flex: 1 }}>
          <Camera style={{ flex: 1 }} type={this.state.type} ref={ref => { this.camera = ref; }}>
            <View
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                flexDirection: 'row',
              }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  alignItems: 'center',
                }}
                onPress={this.snap}>
                <Text
                  style={{ fontSize: 18, marginBottom: 10, color: 'white' }}>
                  {' '}Take photo{' '}
                </Text>
              </TouchableOpacity>
            </View>
          </Camera>
          {this.state.displayText &&
            <View style={styles.text}>
              <ListView
                dataSource={this.state.nutritionDataSource}
                renderRow={(item) => <View style={{ paddingTop: 5, paddingBottom: 5 }}><Text>{item}</Text></View>}
              />
              <TouchableOpacity onPress={() => { this.setState({ displayText: false }) }}>
                <Text style={{ color: 'red' }}> Close </Text>
              </TouchableOpacity>
            </View>
          }
        </View>
      );
    }
  }
}

const styles = StyleSheet.create({
  text: {
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
    position: 'absolute',
    top: 0,
    left: 0,
    paddingLeft: 20
  },
});
