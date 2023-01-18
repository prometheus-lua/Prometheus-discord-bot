FROM debian:latest

# install nodejs
RUN apt-get update && apt-get install -y curl
RUN apt-get install -y nodejs
RUN apt-get install -y npm

# install lua
RUN apt-get install -y lua5.3

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

RUN npm run build

CMD [ "npm", "start" ]