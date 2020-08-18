import MSSQL from 'react-native-mssql';

export default class SqlManager {
  connectSql() {
    const config = {
      server: '82.130.38.95', //ip address of the mssql database
      username: 'ppUser', //username to login to the database
      password: 'admintest', //password to login to the database
      database: 'protopajaDatabase01', //the name of the database to connect to
      //port: 1234, //OPTIONAL, port of the database on the server
      timeout: 5, //OPTIONAL, login timeout for the server
    };
    MSSQL.connect(config);
  }
  disconnectSql() {
    MSSQL.close();
  }
}
