# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (incluindo devDependencies para o build)
RUN npm ci

# Copy source code
COPY . .

# Accept build args
ARG VITE_API_URL
ARG VITE_MASTER_ADMIN_EMAIL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_MASTER_ADMIN_EMAIL=$VITE_MASTER_ADMIN_EMAIL

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]