# Stage 1: Build React Frontend
FROM node:20-alpine AS frontend
WORKDIR /app
COPY frontend/package*.json ./
# Install dependencies
RUN npm install --legacy-peer-deps
COPY frontend ./
# Build the frontend (output is usually dist/)
RUN npm run build

# Stage 2: Build Go Backend
FROM golang:1.24-alpine AS backend
# Install build tools for CGO (SQLite)
RUN apk add --no-cache gcc musl-dev
WORKDIR /app
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend ./
# Build the application
RUN CGO_ENABLED=1 GOOS=linux go build -o server ./cmd/server/main.go

# Stage 3: Final Production Image
FROM alpine:latest
WORKDIR /app
# Install runtime libraries for SQLite
RUN apk add --no-cache sqlite-libs ca-certificates

# Copy binary from backend builder
COPY --from=backend /app/server .
# Copy built frontend assets
COPY --from=frontend /app/dist ./dist
# Create uploads directory (Must be mounted as volume in Railway)
RUN mkdir -p uploads

# Environment setup
ENV PORT=8080
ENV GIN_MODE=release

# Expose port
EXPOSE 8080

# Run the server
CMD ["./server"]
