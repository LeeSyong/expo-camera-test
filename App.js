{
  /* <WebView
      originWhitelist={['*']}
      source={{ html: '<h1>This is a static HTML source!</h1>' }}
      /> */
}

import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, Text, View, Button } from "react-native"; // react-native에서
import { Camera } from "expo-camera"; // expo-camera 이용
import { Video } from "expo-av";
import { WebView } from "react-native-webview";

export default function App() {
  const [hasAudioPermission, setHasAudioPermission] = useState(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [camera, setCamera] = useState(null);
  const [record, setRecord] = useState(null);
  const [status, setStatus] = useState({});
  const [type, setType] = useState(Camera.Constants.Type.back);
  const video = useRef(null);

  // 최초 렌더링 시 카메라 & 오디오 접근 권한 요청 => 권한 받아오면 state 변경
  useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === "granted");

      const audioStatus = await Camera.requestMicrophonePermissionsAsync();
      setHasAudioPermission(audioStatus.status === "granted");
    })();
  }, []);

  // 촬영하기 버튼 누르면 녹화가 시작됨
  // 아래 함수가 반환하는 녹화본 정보로부터 uri를 얻을 수 있음 
  const takeVideo = async () => {
    if (camera) {
      const data = await camera.recordAsync({
        maxDuration: 3,
        quality: "1080p",
      });
      const fileToUpload = {
        uri: data.uri,
      };
      setRecord(fileToUpload);
      console.log("uri", data.uri);
    }
  };

  // 녹화 중지 버튼을 누르면 녹화가 중지됨
  const stopVideo = async () => {
    camera.stopRecording();
  };

  // 카메라 접근 권한 받았다가 없어짐
  if (hasCameraPermission === null || hasAudioPermission === null) {
    console.log("permission null");
    return <View />;
  }
  // 카메라 접근 권한 받을 수 없음
  if (hasCameraPermission === false || hasAudioPermission === false) {
    return <Text>No access to camera</Text>;
  }

  const postDocument = () => {
    // const url = "https://10.0.2.2/upload";
    // const url = "http://192.168.0.69/upload";
    const url = "https://fec0-175-209-199-54.jp.ngrok.io/upload";
    const formData = new FormData();
    formData.append("video", record);
    console.log(formData);
    const options = {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
      },
    };

    fetch(url, options)
      .then((response) => response.json())
      .then((data) => console.log(data))
      .catch((error) => console.log(error));
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.cameraContainer}>
        <Camera
          ref={(ref) => setCamera(ref)}
          style={styles.fixedRatio}
          type={type}
          ratio={"4:3"}
        />
      </View>
      <Video
        ref={video}
        style={styles.video}
        source={{
          uri: record?.uri,
        }}
        useNativeControls
        resizeMode="contain"
        isLooping
        onPlaybackStatusUpdate={(status) => setStatus(() => status)}
      />
      <View style={styles.buttons}>
        <Button
          title={status.isPlaying ? "Pause" : "Play"}
          onPress={() =>
            status.isPlaying
              ? video.current.pauseAsync()
              : video.current.playAsync()
          }
        />
      </View>
      <Button
        title="Flip Video"
        onPress={() => {
          setType(
            type === Camera.Constants.Type.back
              ? Camera.Constants.Type.front
              : Camera.Constants.Type.back
          );
        }}
      ></Button>
      <Button title="Take video" onPress={() => takeVideo()} />
      <Button title="Stop Video" onPress={() => stopVideo()} />
      <Button title="send Video" onPress={() => postDocument()} />
    </View>
  );
}

const styles = StyleSheet.create({
  cameraContainer: {
    flex: 1,
    flexDirection: "row",
  },
  fixedRatio: {
    flex: 1,
    aspectRatio: 1,
  },
  video: {
    alignSelf: "center",
    width: 350,
    height: 220,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
});
