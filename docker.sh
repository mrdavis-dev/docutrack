#!/bin/bash
# Script to run docker compose with BuildKit disabled to avoid hangs
export DOCKER_BUILDKIT=0
export COMPOSE_DOCKER_CLI_BUILD=1
docker compose "$@"
