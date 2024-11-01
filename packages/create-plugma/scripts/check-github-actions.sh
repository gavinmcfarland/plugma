# Example: Check GitHub Actions status
# Save this in a script file like `check-status.sh`
status=$(gh run list -w "Run create-plugma" -L 1 --json conclusion -q '.[0].conclusion')
if [ "$status" != "success" ]; then
  echo "Tests did not pass on GitHub Actions, aborting publish."
  exit 1
fi
