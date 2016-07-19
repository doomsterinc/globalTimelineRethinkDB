"use strict";
const r = require('rethinkdb');
const config = require('./config.json');
let conn;

r.connect(config.rethinkdb)
  .then(connection => {
    console.log('Conectado no RethinkDB...');
    conn = connection;
    return r.dbCreate('timeline').run(conn);
  })
  .then(() => {
    console.log('Database "timeline" criado com sucesso!');
    return r.db('timeline').tableCreate('messages').run(conn);
  })
  .then(() => console.log('Tabela "messages" criada com sucesso!'))
  .error(err => console.log(err))
  .finally(() => process.exit(0));
