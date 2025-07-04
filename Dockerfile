FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Create env from docker build arguments
# ARG 3000
ARG APP_ENV

# Set environment variables
ENV APP_ENV=${APP_ENV}
# ENV PORT=3000

# Copy and install dependencies
COPY package-lock.json ./
COPY package.json ./
RUN npm ci
# RUN apk update && apk add --no-cache  yt-dlp
# RUN apk update && apk add --no-cache ffmpeg


# Bundle app source
COPY . .

# Expose the application port
EXPOSE 3000

# Start the application
CMD [ "node", "main.js" ]
