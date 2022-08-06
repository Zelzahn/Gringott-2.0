FROM node:latest
WORKDIR /app
ENV NODE_ENV=production

# Install dependencies
COPY ["package.json", "package-lock.json*", "./"]
RUN npm i
RUN npm install -g typescript
# Run the bot
COPY . .
CMD ["npm", "run", "prod"]