Hanabi cardgame for 2-5 players
======
gameplay stolen from a cardgame owned by my brother
this was a project to learn how to use node.js, mongodb. I am also learning a lot about frontend, which is not really my thing. 

A lot can still be improved, but the game in its simplicity works.

it is built upon express.js framework. This was mainly useful for the project scaffold and router. 
installation:
- npm install dependencies 
- run local mongodb 
- node run the file bin/www

There is one model, the game. I tried to keep it simple so I made no user registration or model. Users only exist in games, and if someone logs in with only their name, all games with their name as a player are produced.

Things that need to be fixed:
- interface; 
 - update screen directly on successful api calls, without refresh
 - keep socket open or sth to see if opponent has played, in stead of ugly refresh
 
- correct game rules:
  - end game, when last card is drawn each player gets one more turn
  - if stale position is reached before last card/turn, win game
  - 4 cards for game with 4 or 5 players

- stupid things like:
  - you can't log in with a name that contains commas, I honestly don't know what happens if you do this. 
  - more bugs? 

