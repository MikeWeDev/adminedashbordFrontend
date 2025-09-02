# Step 1: Build the Next.js application
# Use the Node.js 22 Alpine image for a lightweight build environment.
FROM node:22-alpine AS build

# Set the working directory inside the container
WORKDIR /app

# Copy the dependency manifest files
COPY package.json package-lock.json ./

# Install project dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Build the Next.js application
# Using 'standalone' output is a best practice for Dockerized Next.js apps
RUN npm run build

# Step 2: Create the production image
# Use a fresh, lightweight Node.js 22 Alpine image for the final runtime
FROM node:22-alpine AS runner

# Set the working directory
WORKDIR /app

# Copy the standalone output from the build stage
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

# Set environment variables for the server host and port
ENV HOST=0.0.0.0
ENV PORT=3000

# Expose the port the Next.js app will listen on
EXPOSE 3000

# Command to run the production server
CMD ["node", "server.js"]