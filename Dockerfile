# Step 1: Build the Next.js application
FROM node:22-alpine AS build
WORKDIR /app

# --- FIX: Pass NEXT_PUBLIC_API_BASE_URL to the build environment ---
# 1. Define the variable as a Build Argument (ARG) to receive the value from CapRover.
ARG NEXT_PUBLIC_API_BASE_URL

# 2. Set the variable as an Environment Variable (ENV). This makes it available 
#    during the 'npm run build' command, allowing Next.js to hardcode the value 
#    into the client-side JavaScript.
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
# ------------------------------------------------------------------

COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

# Step 2: Create the production image
FROM node:22-alpine AS runner
WORKDIR /app

# Copy the standalone output from the build stage.
COPY --from=build /app/.next/standalone ./

# Copy the 'static' assets to the correct location
COPY --from=build /app/.next/static ./.next/static

# Re-set the environment variable for the runner stage. 
# While the client-side URL is already hardcoded, this is good practice 
# for any server-side usage (e.g., API routes).
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

# Set environment variables for the server host and port
ENV HOST=0.0.0.0
ENV PORT=3000

# Expose the port the Next.js app will listen on
EXPOSE 3000

# Command to run the production server
CMD ["node", "server.js"]