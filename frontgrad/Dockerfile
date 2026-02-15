# Stage 1: Build the Vite React app
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./

# Fix for Apple Silicon/Vite: Install the specific Linux ARM64 binary
RUN npm install @rollup/rollup-linux-arm64-musl

RUN npm install
COPY . .

RUN npm run build

# Stage 2: Serve the app with a static server
FROM node:20-alpine
WORKDIR /app

RUN npm install -g serve
COPY --from=build /app/dist ./dist

EXPOSE 5000
CMD ["serve", "-s", "dist", "-l", "5000"]