FROM node:20-alpine AS build
WORKDIR /app
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Install dependencies - fix rollup optional dependencies issue
COPY package*.json ./
RUN rm -rf node_modules package-lock.json && \
    npm install --legacy-peer-deps --no-optional && \
    npm install @rollup/rollup-linux-x64-musl --save-optional --legacy-peer-deps || true && \
    npm install --legacy-peer-deps

COPY . .
RUN npm run build

FROM nginx:alpine
RUN apk add --no-cache openssl && mkdir -p /etc/nginx/certs
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
CMD ["/bin/sh", "-c", "if [ ! -f /etc/nginx/certs/server.crt ] || [ ! -f /etc/nginx/certs/server.key ]; then \
  echo 'Generating self-signed certificate...'; \
  openssl req -x509 -nodes -days 365 -subj '/CN=localhost' -newkey rsa:2048 -keyout /etc/nginx/certs/server.key -out /etc/nginx/certs/server.crt; \
fi; \
nginx -g 'daemon off;'"]
# TLS certs can be mounted at /etc/nginx/certs
EXPOSE 80 443
