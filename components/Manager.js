import React, { Component } from 'react';
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
	Modal
} from 'react-native';
import BleManager from 'react-native-ble-manager';
import Device from './Device';
import TimeZone from 'react-native-timezone';
import LineChart from './LineChart';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Header } from 'react-native/Libraries/NewAppScreen';
var Buffer = require('buffer').Buffer;
const window = Dimensions.get('window');

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
			modalOpen: false,
			width: Dimensions.get('window').width,
			height: Dimensions.get('window').height
		};
	}

	componentDidMount = () => {
		AppState.addEventListener('change', this.handleAppStateChange);
		BleManager.start({ showAlert: false });
		this.startListeneres();
		this.checkPermissions();
	};
	componentWillUnmount = () => {
		this.removeListeneres();
	};
	checkPermissions = () => {
		if (Platform.OS === 'android' && Platform.Version >= 23) {
			PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION).then((result) => {
				if (result) {
					console.log('Permission is OK');
				} else {
					PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION).then((result) => {
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
			this.handleDiscoverPeripheral
		);
		this.handlerStop = bleManagerEmitter.addListener('BleManagerStopScan', this.handleStopScan);
		this.handlerDisconnect = bleManagerEmitter.addListener(
			'BleManagerDisconnectPeripheral',
			this.handleDisconnectedPeripheral
		);
		this.handlerUpdate = bleManagerEmitter.addListener(
			'BleManagerDidUpdateValueForCharacteristic',
			this.handleUpdateValueForCharacteristic
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
			height: Dimensions.get('window').height
		});
	};
	handleAppStateChange = (nextAppState) => {
		if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
			console.log('App has come to the foreground!');
			BleManager.getConnectedPeripherals([]).then((peripheralsArray) => {
				console.log('Connected peripherals: ' + peripheralsArray.length);
			});
		}
		this.setState({ appState: nextAppState });
	};

	handleDisconnectedPeripheral = (data) => {
		let peripherals = this.state.peripherals;
		let peripheral = peripherals.get(data.peripheral);
		if (peripheral) {
			peripheral.connected = false;
			peripherals.set(peripheral.id, peripheral);
			this.setState({ peripherals });
		}
		console.log('Disconnected from ' + data.peripheral);
	};

	handleUpdateValueForCharacteristic = ({ value, peripheral, characteristic, service }) => {
		// Convert bytes array to stringonst buffer = Buffer.from(readData);

		const buffer = Buffer.from(value);
		const sensorData = buffer.readFloatLE(0, true);
		console.log(`Received ${sensorData} for characteristic ${characteristic}`);
		let data = this.state.data;
		let prevValue = data.get(characteristic) ? data.get(characteristic) : [];
		data.set(characteristic, [
			...prevValue,
			{
				value: sensorData,
				time: new Date().getTime(),
				timeString: new Date().toLocaleString('en-GB', { timeZone: TimeZone.getTimeZone() }),
				label: new Date().toLocaleString('en-GB', { timeZone: TimeZone.getTimeZone() })
			}
		]);
		this.setState({
			data: data
		});
	};

	handleStopScan = () => {
		console.log('Scan is stopped');
		this.setState({ scanning: false });
	};

	startScan = () => {
		console.log('STARTING SCAN');
		if (!this.state.scanning) {
			//this.setState({peripherals: new Map()});
			BleManager.scan([], 5, true).then((results) => {
				console.log('Scanning...');
				this.setState({ scanning: true });
			});
		}
	};
	openModal = () => {
		this.setState({
			modalOpen: true
		});
	};
	closeModal = () => {
		this.setState({
			modalOpen: false
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
				this.setState({ peripherals });
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
		this.setState({ peripherals });
	};

	updatePeripherals = (peripheral) => {
		let peripherals = this.state.peripherals;
		let p = peripherals.get(peripheral.id);
		if (p) {
			p.connected = true;
			peripherals.set(peripheral.id, p);
			this.setState({ peripherals });
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
				<View style={[ styles.row, { backgroundColor: color } ]}>
					<Text style={styles.titleText}>{item.name}</Text>
					<Text style={styles.paragraph}>RSSI: {item.rssi}</Text>
					<Text style={{ fontSize: 8, textAlign: 'center', color: '#333333', padding: 2, paddingBottom: 20 }}>
						{item.id}
					</Text>
				</View>
			</TouchableHighlight>
		);
	}

	render = () => {
		const list = Array.from(this.state.peripherals.values());
		const btnScanTitle = 'Scan Bluetooth (' + (this.state.scanning ? 'on' : 'off') + ')';
		const data = Array.from(this.state.data.values());
		const windowWidth = () => this.state.width;
		const windowHeight = () => this.state.height;
		// const listData = Array.from(this.state.data.values());

		return (
			<SafeAreaView style={{ width: windowWidth(), height: windowHeight() }}>
				<View style={styles.header}>
					<Text style={styles.headerText}>ProtoCamp THT</Text>
					<Icon
						name="bluetooth"
						style={styles.icon}
						size={30}
						onPress={() => {
							this.openModal();
							this.retrieveConnected();
						}}
					/>
				</View>
				<View style={styles.content}>
					<ScrollView style={styles.list}>
						{data.map((item, index) => (
							<View style={styles.graphContainer} keyExtractor={() => 'Chart' + index}>
								<LineChart data={item} round={100} unit="" />
							</View>
						))}
					</ScrollView>
					<Modal visible={this.state.modalOpen}>
						<View
							style={{
								...styles.container,
								...styles.modalContent,
								width: windowWidth(),
								height: windowHeight()
							}}
						>
							<Icon name="close" style={styles.modalClose} size={30} onPress={() => this.closeModal()} />
							<View style={styles.buttonContainer}>
								<Button title={btnScanTitle} color="#3b5998" onPress={() => this.startScan()} />
							</View>
							{/* 
							<View style={{ margin: 10 }}>
								<Button
									title="Retrieve connected peripherals"
									onPress={() => this.retrieveConnected()}
								/>
							</View> */}
							<FlatList
								styles={styles.list}
								data={list}
								renderItem={({ item }) => this.renderItem(item)}
								keyExtractor={(item) => item.id}
							/>
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
		justifyContent: 'center'
	},
	headerText: {
		fontWeight: 'bold',
		fontSize: 26
	},
	icon: {
		backgroundColor: '#3b5998',
		position: 'absolute',
		right: 0,
		margin: 0,
		padding: 5,
		color: 'white',
		borderRadius: 5
	},
	container: {
		flex: 1,
		width: window.width,
		height: window.height,
		flexDirection: 'column'
	},
	content: {
		flex: 1
	},
	list: {
		flex: 1,
		margin: 20
	},
	graphContainer: {
		flex: 1
	},
	buttonContainer: {
		margin: 10
	},
	row: {
		backgroundColor: '#3b5998',
		margin: 10
	},
	titleText: {
		fontSize: 12,
		textAlign: 'center',
		color: '#333333',
		padding: 10
	},
	paragraph: { fontSize: 10, textAlign: 'center', color: '#333333', padding: 2 },
	modalContent: {
		flex: 1,
		width: window.width,
		height: window.height
	},
	modalClose: {
		margin: 10,
		textAlign: 'right'
	}
});
