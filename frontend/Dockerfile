# ===== BUILD STAGE =====
FROM node:18-alpine AS build

WORKDIR /app

# Copy package trước để cache
COPY package*.json ./

RUN npm install

# Copy source
COPY . .

# Giảm RAM khi build
ENV GENERATE_SOURCEMAP=false
ENV NODE_OPTIONS=--max-old-space-size=384

RUN npm run build


# ===== RUN STAGE =====
FROM nginx:alpine

# Xóa config mặc định
RUN rm /etc/nginx/conf.d/default.conf

# Copy config nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build React
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
