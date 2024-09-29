# Use the official Node.js LTS image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to leverage Docker caching
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Expose the port your app runs on (adjust if different)
EXPOSE 3000

# Set environment variables (can be overridden)
ENV NODE_ENV=production

# Define the command to run your app
CMD ["node", "server.js"]
