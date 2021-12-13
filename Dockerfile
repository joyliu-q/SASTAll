# syntax=docker/dockerfile:1

# Reference: https://docs.docker.com/language/nodejs/build-images/
# Reference: https://docs.github.com/en/actions/creating-actions/creating-a-docker-container-action
FROM alpine:3.10 as base

FROM base AS runtime

# Copy over files
COPY utils/agg.sh /agg.sh

ENTRYPOINT ["/agg.sh"]