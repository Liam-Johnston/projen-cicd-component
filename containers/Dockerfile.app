ARG BUN_VERSION
FROM oven/bun:${BUN_VERSION}

RUN apk add --no-cache \
  git \
  make \
  bash

WORKDIR /app

ENTRYPOINT [ "" ]
