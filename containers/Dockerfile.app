ARG BUN_VERSION
FROM oven/bun:${BUN_VERSION}

RUN apk add --no-cache \
  git \
  make \
  bash \
  npm

RUN git config --global --add safe.directory /app

WORKDIR /app

ENTRYPOINT [ "" ]
