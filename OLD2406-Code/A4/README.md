# README for Assignment 4

### Requires
- pug
- express
- express-session
- connect-mongodb-session
- mongodb

### Setup
- In server directory run the command  `npm install`.
- Next run `node .\database-initializer.js` in terminal.
- Then run `npm start` in terminal.

### Usage
- Go to http://127.0.0.1:3000/ to interact with the program.
- To search query users modify the following link: http://localhost:3000/users?name= 
  you can add any string phrase after the equal sign and the server will query that phrase.
- To close server: hit CTRL+C, type 'y', and hit enter.
