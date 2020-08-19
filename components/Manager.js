import React, {Component} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableHighlight,
  NativeEventEmitter,
  NativeModules,
  Platform,
  PermissionsAndroid,
  ScrollView,
  AppState,
  FlatList,
  Dimensions,
  Button,
  SafeAreaView,
  Modal,
} from 'react-native';
import BleManager from 'react-native-ble-manager';
import Device from './Device';
import TimeZone from 'react-native-timezone';
import LineChart from './LineChart';
import SqlManager from './SqlManager';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Header} from 'react-native/Libraries/NewAppScreen';
var Buffer = require('buffer').Buffer;
const window = Dimensions.get('window');
const DatabaseManager = new SqlManager();
const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);
export default class Manager extends Component {
  constructor() {
    super();

    this.state = {
      scanning: false,
      peripherals: new Map(),
      appState: '',
      data: new Map(),
      openPeriferal: '',
      connectedSQL: false,
      modalOpenBLE: false,
      modalOpenDATA: false,
      modalOpenGRAPH: false,
      modalOpenSQL: false,
      width: Dimensions.get('window').width,
      height: Dimensions.get('window').height,
    };
  }

  componentDidMount = () => {
    AppState.addEventListener('change', this.handleAppStateChange);
    BleManager.start({showAlert: false});
    this.startListeneres();
    this.checkPermissions();
  };
  componentWillUnmount = () => {
    this.removeListeneres();
  };
  checkPermissions = () => {
    if (Platform.OS === 'android' && Platform.Version >= 23) {
      PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ).then((result) => {
        if (result) {
          console.log('Permission is OK');
        } else {
          PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
          ).then((result) => {
            if (result) {
              console.log('User accept');
            } else {
              console.log('User refuse');
            }
          });
        }
      });
    }
  };
  startListeneres = () => {
    this.handlerDiscover = bleManagerEmitter.addListener(
      'BleManagerDiscoverPeripheral',
      this.handleDiscoverPeripheral,
    );
    this.handlerStop = bleManagerEmitter.addListener(
      'BleManagerStopScan',
      this.handleStopScan,
    );
    this.handlerDisconnect = bleManagerEmitter.addListener(
      'BleManagerDisconnectPeripheral',
      this.handleDisconnectedPeripheral,
    );
    this.handlerUpdate = bleManagerEmitter.addListener(
      'BleManagerDidUpdateValueForCharacteristic',
      this.handleUpdateValueForCharacteristic,
    );
    Dimensions.addEventListener('change', this.handleWindowSizeChange);
  };
  removeListeneres = () => {
    this.handlerDiscover.remove();
    this.handlerStop.remove();
    this.handlerDisconnect.remove();
    this.handlerUpdate.remove();
    Dimensions.removeEventListener('change', this.handleWindowSizeChange);
  };
  handleWindowSizeChange = (win, scr) => {
    this.setState({
      width: Dimensions.get('window').width,
      height: Dimensions.get('window').height,
    });
  };
  handleAppStateChange = (nextAppState) => {
    if (
      this.state.appState.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      console.log('App has come to the foreground!');
      BleManager.getConnectedPeripherals([]).then((peripheralsArray) => {
        console.log('Connected peripherals: ' + peripheralsArray.length);
      });
    }
    this.setState({appState: nextAppState});
  };

  handleDisconnectedPeripheral = (data) => {
    let peripherals = this.state.peripherals;
    let peripheral = peripherals.get(data.peripheral);
    if (peripheral) {
      peripheral.connected = false;
      peripherals.set(peripheral.id, peripheral);
      this.setState({peripherals});
    }
    console.log('Disconnected from ' + data.peripheral);

    //Testing data content:
    console.log('Logged data:');
    this.state.data.forEach((i) => {
      i.forEach((e) => {
        console.log(e);
      });
    });
  };

  handleConnectionUpdate = async () => {
    if (!this.state.connectedSQL) {
      let x = DatabaseManager.connectSql();
      this.setState({connectedSQL: x});
    } else {
      let x = DatabaseManager.disconnectSql();
      this.setState({connectedSQL: x});
    }
  };

  handleUpdateValueForCharacteristic = ({
    value,
    peripheral,
    characteristic,
    service,
  }) => {
    // Convert bytes array to stringonst buffer = Buffer.from(readData);

    const buffer = Buffer.from(value);
    const sensorData = buffer.readFloatLE(0, true);

    console.log(
      `Received ${sensorData} for characteristic ${characteristic} from device: ${peripheral}`,
    );

    let thisData = this.state.data.get(peripheral)
      ? this.state.data.get(peripheral)
      : new Map();

    let prevValue = thisData.get(characteristic)
      ? thisData.get(characteristic)
      : [];

    thisData.set(characteristic, [
      ...prevValue,
      {
        value: sensorData,
        time: new Date().getTime(),
        timeString: new Date().toLocaleString('en-GB', {
          timeZone: TimeZone.getTimeZone(),
        }),
        label: new Date().toLocaleString('en-GB', {
          timeZone: TimeZone.getTimeZone(),
        }),
      },
    ]);
    if (this.state.data[characteristic] != null) {
      console.log('Duplicate found');
    }

    let mappedData = this.state.data.set(peripheral, thisData);

    this.setState({data: mappedData});
  };

  handleStopScan = () => {
    console.log('Scan is stopped');
    this.setState({scanning: false});
  };

  startScan = () => {
    console.log('STARTING SCAN');
    if (!this.state.scanning) {
      //this.setState({peripherals:  new Map()});
      BleManager.scan([], 5, false).then((results) => {
        console.log('Scanning...');
        this.setState({scanning: true});
      });
    }
  };
  //Open modals
  openModalBLE = () => {
    console.log('Openned ble');
    this.setState({
      modalOpenBLE: true,
    });
  };
  openModalDATA = (device) => {
    console.log('Openned data');
    this.setState({
      modalOpenDATA: true,
      openPeriferal: device,
    });
  };
  openModalGRAPH = () => {
    console.log('Openned graph');
    this.setState({
      modalOpenGRAPH: true,
      modalOpenDATA: false,
    });
  };
  openModalSQL = () => {
    console.log('Openned sql');
    this.setState({
      modalOpenSQL: true,
    });
  };
  //Close modals
  closeModalBLE = () => {
    console.log('Closed ble');
    this.setState({
      modalOpenBLE: false,
    });
  };
  closeModalDATA = () => {
    console.log('Closed data');
    this.setState({
      modalOpenDATA: false,
    });
  };
  closeModalGRAPH = () => {
    console.log('Closed graph');
    this.setState({
      modalOpenGRAPH: false,
    });
  };
  closeModalSQL = () => {
    console.log('Closed sql');
    this.setState({
      modalOpenSQL: false,
    });
  };

  retrieveConnected = () => {
    BleManager.getConnectedPeripherals([]).then((results) => {
      if (results.length == 0) {
        console.log('No connected peripherals');
      }
      var peripherals = this.state.peripherals;
      for (var i = 0; i < results.length; i++) {
        var peripheral = results[i];
        peripheral.connected = true;
        peripherals.set(peripheral.id, peripheral);
        this.setState({peripherals});
      }
    });
  };

  handleDiscoverPeripheral = (peripheral) => {
    var peripherals = this.state.peripherals;
    console.log('Got ble peripheral', peripheral);
    if (!peripheral.name) {
      peripheral.name = 'NO NAME';
    }
    peripherals.set(peripheral.id, peripheral);
    this.setState({peripherals});
  };

  updatePeripherals = (peripheral) => {
    let peripherals = this.state.peripherals;
    let p = peripherals.get(peripheral.id);
    if (p) {
      p.connected = true;
      peripherals.set(peripheral.id, p);
      this.setState({peripherals});
    }
  };
  handleClick = async (peripheral) => {
    if (peripheral) {
      if (peripheral.connected) {
        await peripheral.disconnect();
      } else {
        await peripheral.connect();
        this.updatePeripherals(peripheral);
        await peripheral.retrieveServices();
        await peripheral.subscribeAll();
      }
    }
  };

  renderItem(item) {
    const color = item.connected ? 'green' : '#fff';
    let device = new Device(item);
    return (
      <TouchableHighlight onPress={() => this.handleClick(device)}>
        <View style={[styles.row, {backgroundColor: color}]}>
          <Text style={styles.titleText}>{item.name}</Text>
          <Text style={styles.paragraph}>RSSI: {item.rssi}</Text>
          <Text
            style={{
              fontSize: 8,
              textAlign: 'center',
              color: '#333333',
              padding: 2,
              paddingBottom: 20,
            }}>
            {item.id}
          </Text>
        </View>
      </TouchableHighlight>
    );
  }

  renderData(item) {
    return (
      <View style={[styles.row, {backgroundColor: '#fff'}]}>
        <Text style={styles.titleText}>{item.value}</Text>
      </View>
    );
  }

  renderItemConnected(item) {
    if (item.connected) {
      const color = '#3164b5';
      return (
        <TouchableHighlight onPress={() => this.openModalDATA(item.id)}>
          <View style={[styles.row, {backgroundColor: color}]}>
            <Text style={styles.connectedText}>{item.name}</Text>
            <Text style={styles.connectedText}>View data and options</Text>
            <Text
              style={{
                fontSize: 8,
                textAlign: 'center',
                color: 'white',
                padding: 2,
                paddingBottom: 20,
              }}>
              {item.id}
            </Text>
          </View>
        </TouchableHighlight>
      );
    }
  }

  render = () => {
    const list = Array.from(this.state.peripherals.values());
    const btnScanTitle = this.state.scanning
      ? 'Scanning (wait)'
      : 'Start BLE scan';
    const data = this.state.data.get(this.state.openPeriferal)
      ? this.state.data.get(this.state.openPeriferal)
      : new Map();
    const windowWidth = () => this.state.width;
    const windowHeight = () => this.state.height;
    // const listData = Array.from(this.state.data.values());

    return (
      <SafeAreaView style={{width: windowWidth(), height: windowHeight()}}>
        <View style={styles.header}>
          <Text style={styles.headerText}>BLE Client - Protopaja</Text>
          <Icon
            name="bluetooth"
            style={styles.icon}
            size={30}
            onPress={() => {
              this.openModalBLE();
              this.retrieveConnected();
            }}
          />
        </View>
        <View style={styles.content}>
          <View style={styles.buttonContainer}>
            <Button
              title="SQL controls"
              color="#3b5998"
              onPress={() => this.openModalSQL()}
            />
          </View>
          <FlatList
            style={styles.list}
            data={list}
            renderItem={({item}) => this.renderItemConnected(item)}
            keyExtractor={(item) => item.id}
          />

          <Modal visible={this.state.modalOpenBLE}>
            <View
              style={{
                ...styles.container,
                ...styles.modalContent,
                width: windowWidth(),
                height: windowHeight(),
              }}>
              <Icon
                name="close"
                style={styles.modalClose}
                size={30}
                onPress={() => this.closeModalBLE()}
              />
              <View style={styles.buttonContainer}>
                <Button
                  title={btnScanTitle}
                  color="#3b5998"
                  onPress={() => this.startScan()}
                />
              </View>
              {/* 
							<View style={{ margin: 10 }}>
								<Button
									title="Retrieve connected peripherals"
									onPress={() => this.retrieveConnected()}
								/>
							</View> */}
              <FlatList
                style={styles.list}
                data={list}
                renderItem={({item}) => this.renderItem(item)}
                keyExtractor={(item) => item.id}
              />
            </View>
          </Modal>

          <Modal visible={this.state.modalOpenSQL}>
            <View
              style={{
                ...styles.container,
                ...styles.modalContent,
                width: windowWidth(),
                height: windowHeight(),
              }}>
              <Icon
                name="close"
                style={styles.modalClose}
                size={30}
                onPress={() => this.closeModalSQL()}
              />
              <View style={styles.buttonContainer}>
                <Button
                  title={
                    this.state.connectedSQL
                      ? 'Connected to database'
                      : 'Disconnected from database'
                  }
                  color="grey"
                />
              </View>
              <View style={styles.buttonContainer}>
                <Button
                  title={this.state.connectedSQL ? 'Disconnect' : 'Connect'}
                  color="#3b5998"
                  onPress={() => this.handleConnectionUpdate()}
                />
              </View>
            </View>
          </Modal>
          <Modal visible={this.state.modalOpenDATA}>
            <View
              style={{
                ...styles.container,
                ...styles.modalContent,
                width: windowWidth(),
                height: windowHeight(),
              }}>
              <Icon
                name="close"
                style={styles.modalClose}
                size={30}
                onPress={() => this.closeModalDATA()}
              />
              <View style={styles.buttonContainer}>
                <Button
                  title="Open graph"
                  color="#3b5998"
                  onPress={() => this.openModalGRAPH()}
                />
              </View>
              <FlatList
                style={styles.list}
                data={data.get(this.state.openPeriferal)}
                renderItem={({item}) => this.renderData(item)}
                keyExtractor={(item) => item.id}
              />
            </View>
          </Modal>

          <Modal visible={this.state.modalOpenGRAPH}>
            <View
              style={{
                ...styles.container,
                ...styles.modalContent,
                width: windowWidth(),
                height: windowHeight(),
              }}>
              <Icon
                name="close"
                style={styles.modalClose}
                size={30}
                onPress={() => this.closeModalGRAPH()}
              />
              <ScrollView style={styles.list}>
                {Array.from(data.values()).map((item, index) => (
                  <View
                    //D1:6E:E7:3C:B7:C4
                    style={styles.graphContainer}
                    keyExtractor={() => 'Chart' + index}>
                    <LineChart data={item} round={100} unit="" />
                  </View>
                ))}
              </ScrollView>
            </View>
          </Modal>
        </View>
      </SafeAreaView>
    );
  };
}

const styles = StyleSheet.create({
  header: {
    margin: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 26,
  },
  icon: {
    backgroundColor: '#3b5998',
    position: 'absolute',
    right: 0,
    margin: 0,
    padding: 5,
    color: 'white',
    borderRadius: 5,
  },
  container: {
    flex: 1,
    width: window.width,
    height: window.height,
    flexDirection: 'column',
  },
  content: {
    flex: 1,
  },
  list: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    margin: 20,
  },
  graphContainer: {
    flex: 1,
  },
  buttonContainer: {
    margin: 10,
  },
  row: {
    backgroundColor: '#3b5998',
    margin: 10,
  },
  titleText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#333333',
    padding: 10,
  },
  connectedText: {
    fontSize: 12,
    textAlign: 'center',
    color: 'white',
    padding: 5,
  },
  paragraph: {fontSize: 10, textAlign: 'center', color: '#333333', padding: 2},
  modalContent: {
    flex: 1,
    width: window.width,
    height: window.height,
  },
  modalClose: {
    margin: 10,
    textAlign: 'right',
  },
});
