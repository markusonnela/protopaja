import React, {Component} from 'react';
import {Alert} from 'react-native';
import MSSQL from 'react-native-mssql';

const config = {};
export default class SqlManager extends Component {
  constructor() {
    super();
    this.state = {
      server: '', //ip address of the mssql database
      username: '', //username to login to the database
      password: '', //password to login to the database
      database: '', //the name of the database to connect to
      port: 1433, //OPTIONAL, port of the database on the server
      timeout: 5, //OPTIONAL, login timeout for the server
    };
  }

  connectSql = () => {
    console.log('Connecting');
    MSSQL.connect(this.state)
      .then((result) => {
        console.log('Login success:\n ' + result);
        Alert.alert(result);
        MSSQL.close();
      })
      .catch((error) => {
        console.log('Login fail:\n ' + error);
        Alert.alert(JSON.stringify(error.message));
      });
  };

  updateState = (pass) => {
    this.setState({password: pass});
    Alert.alert('Password changed');
    console.log(this.state.password);
  };

  updateDatabase = () => {
    MSSQL.connect(this.state)
      .then(() => {
        const id = 'NewID2';
        const char = 'NewChar2';
        const value = 50.2;
        const time = 'NewTime';

        const update =
          "UPDATE dbo.testData SET deviceID='NewID3', charac='NewChar3', value=50.3, time='NewTime3'";

        MSSQL.executeUpdate(update)
          .then((result) => {
            Alert.alert('Sent');
            console.log('Sent');
            MSSQL.close();
          })
          .catch((error) => {
            console.log('Found error1: ' + error);
            Alert.alert(JSON.stringify(error.message));
            MSSQL.close();
          });
      })
      .catch((error) => {
        Alert.alert(JSON.stringify(error.message));
        console.log('Found error2: ' + error);
      });
  };
}
