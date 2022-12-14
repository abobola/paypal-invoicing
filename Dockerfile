FROM node:14

ADD . /

ARG CLIENT_ID
ARG CLIENT_SECRET
ARG PAYPAL_API_BASE
ARG WEBHOOK_ID

ENV CLIENT_ID=$CLIENT_ID
ENV CLIENT_SECRET=$CLIENT_SECRET
ENV PAYPAL_API_BASE=$PAYPAL_API_BASE
ENV WEBHOOK_ID=$WEBHOOK_ID

RUN npm install --ignore-scripts

CMD node server/index.js