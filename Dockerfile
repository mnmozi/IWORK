FROM node:14-stretch as prod

ENV TINI_VERSION v0.18.0

ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /tini
RUN chmod +x /tini
ENTRYPOINT [ "/tini","--" ]
ENV NODE_ENV=production
WORKDIR /node
COPY package*.json package-lock*.json ./
RUN mkdir app && chown -R node:node .
USER node
RUN npm install --only=production && npm cach clean --force
WORKDIR /node/app
COPY --chown=node:node . .
CMD ["node", "./bin/www"]

##dev 
FROM prod as dev

ENV NODE_ENV=development
WORKDIR /node
RUN npm install --only=development
CMD ["node_modules/nodemon/bin/nodemon.js","-L", "./app/bin/www"]

