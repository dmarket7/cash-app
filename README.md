This project was bootstrapped with NodeJS and PostgreSQL.

To create database be sure to have PSQL installed. Then run the following commands to create the database needed to run the API server.

```
createdb cashapp

psql < data.sql
```

To start the server (Nodemon will automatically restart server):
```
nodemon
```