# /nginx/Dockerfile

# Use the official Nginx Alpine image for a lightweight build
FROM nginx:alpine

# Remove the default Nginx configuration to avoid conflicts
RUN rm /etc/nginx/conf.d/default.conf

# Copy the custom Nginx configuration into the container
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose ports 80 and 443 for HTTP and HTTPS traffic
EXPOSE 80 443

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
