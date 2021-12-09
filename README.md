# Gringott 2.0
*[Invite url](https://discord.com/api/oauth2/authorize?client_id=555311535392686083&permissions=2147551296&scope=applications.commands%20bot)*

A discord bot orginally written in Python to perform simple who owes whom tasks.
The bot has now been completely written in TypeScript and the backend has been replaced from a csv file to a proper MongoDB database.

## Usage

This bot exclusively uses Discord's new slash-commands, so just type `/` to see a complete list of the commands.

## Installation

```bash
$ echo "BOT_TOKEN=[BOT TOKEN]" > .env

# Docker
$ docker-compose up -d --build

# If no docker is installed
$ echo "MONGODB_URL=[MONGODB URL]" >> .env
$ export $(cat .env | xargs)
$ npm i
$ npm run prod

# Local development
$ npm run start # Run this instead of the previous statement
```
