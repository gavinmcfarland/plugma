#!/bin/bash

workflow_name="Run create-plugma"
max_attempts=30    # Number of attempts before timing out
delay=30           # Delay between checks (in seconds)
attempt=0

while [ "$attempt" -lt "$max_attempts" ]; do
  status=$(gh run list -w "$workflow_name" -L 1 --json conclusion,status -q '.[0] | .conclusion + " " + .status')

  # Separate the status components
  conclusion=$(echo "$status" | awk '{print $1}')
  run_status=$(echo "$status" | awk '{print $2}')

  # Check if the workflow has completed and succeeded
  if [ "$run_status" = "completed" ]; then
    if [ "$conclusion" = "success" ]; then
      echo "Tests passed on GitHub Actions. Proceeding with publish."
      exit 0
    else
      echo "Tests did not pass on GitHub Actions, aborting publish."
      exit 1
    fi
  fi

  # Wait and retry
  echo "Waiting for GitHub Actions to complete... ($((attempt + 1))/$max_attempts)"
  attempt=$((attempt + 1))
  sleep "$delay"
done

echo "Timeout waiting for GitHub Actions to complete. Aborting publish."
exit 1
