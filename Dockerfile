FROM node:16
WORKDIR /app
COPY package.json /app
RUN npm install
COPY . /app
# Values can be changed to suit environment
ENV PORT 8443
ENV HOSTNAME '172.18.0.3'
# -----------------------------------------
CMD ["npm", "start"]