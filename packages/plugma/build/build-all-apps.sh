#!/bin/sh

# Get the absolute path of the directory where this script is located
ROOT_DIR="$(cd "$(dirname "$0")" && cd .. && pwd)"

for config in "${ROOT_DIR}"/apps/*/vite.config.ts; do
	DIR=$(dirname "$config")
	APP=$(basename "$DIR")
	"${ROOT_DIR}/build/header.sh" "$APP"

	# Run in a subshell so that changing directories
	# doesn't affect other iterations
	(cd "$DIR" && vite build)
done
