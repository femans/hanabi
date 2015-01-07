Hanabi cardgame for 2-5 players
======
gameplay stolen from a cardgame owned by my brother; hope copyright holders will not be sad, but this game was never intended for any competitive use.
This was a project to learn how to use node.js, mongodb, socket.io. Project was written mainly in one long breath with some features/bugfix done after. 

game runs here: https://hanabi-cardgame.herokuapp.com/

it is built upon express.js framework. This was mainly useful for the project scaffold and router. 
installation:
- npm install dependencies 
- run local mongodb 
- node run the file bin/www

There is one model, Game. This has all the methods that do the game logic. This is all in one file, called models/index.js
I tried to keep it simple so I made no user registration or model. I know how to do that, and I know its a lot of work. Users only exist in Game instances, and if someone logs in, all games with their name as a player are produced. Everyone can log in with every name so it is very easy to cheat.

I built a socket, so there is direct response on all moves. The idea was to build a small framework that maps the updated models onto the client, so the frontend only has to know where to place the data, and wait for the data, while the backend produces the data. Node.js is explicitly practical for this because it is so easy to  create and ship json objects. 
What I did was create a framework where the jquery handles, like css updates or div insertions, can be operated from the backend, through a single call.

Things that could be improved:
  - better interface for login screens
  - maybe some better looking design or so
  - if stale position is reached before last card/turn, win game
  - errors in registration decent handling; now it just throws server error :)
  - complete async; no prerendering of the content.
  - improve correlation between frontend and backend.
Bugs:
  - when reloading the page, only 1 card is on visible the table for each color, even if there are more according to gamestate.
  - more bugs? 

