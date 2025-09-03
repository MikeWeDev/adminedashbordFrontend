# Step 1: Build the Next.js application
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

# Step 2: Create the production image
FROM node:22-alpine AS runner
WORKDIR /app

# Copy the standalone output from the build stage.
# The 'public' directory is now included within the standalone output,
# so you don't need a separate copy command for it.
COPY --from=build /app/.next/standalone ./

# Copy the 'static' assets to the correct location
COPY --from=build /app/.next/static ./.next/static

# Set environment variables for the server host and port
ENV HOST=0.0.0.0
ENV PORT=3000

# Expose the port the Next.js app will listen on
EXPOSE 3000

# Command to run the production server
CMD ["node", "server.js"]