#!/bin/bash

# Create output directory
mkdir -p output

# Generate TypeScript project with key=value format
combino \
	templates/base \
	templates/typescript \
	-o output/ts-project \
	-c example.combino \
	--data language=ts

# Generate JavaScript project with JSON object format
combino \
	templates/base \
	templates/typescript \
	-o output/js-project \
	-c example.combino \
	--data '{"language":"js","features":{"typescript":false,"eslint":true}}'

echo "Generated projects in output/ts-project and output/js-project"
