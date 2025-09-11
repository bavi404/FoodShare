#!/bin/sh

# Replace environment variables in the built files
# This allows us to inject environment variables at runtime

# Function to replace environment variables in files
replace_env_vars() {
    local file="$1"
    if [ -f "$file" ]; then
        # Replace environment variables in the format ${VAR_NAME}
        envsubst '${REACT_APP_API_URL} ${REACT_APP_WS_URL} ${REACT_APP_MAPBOX_ACCESS_TOKEN}' < "$file" > "$file.tmp" && mv "$file.tmp" "$file"
    fi
}

# Replace environment variables in HTML files
find /usr/share/nginx/html -name "*.html" -type f -exec sh -c 'replace_env_vars "$1"' _ {} \;

# Replace environment variables in JS files
find /usr/share/nginx/html -name "*.js" -type f -exec sh -c 'replace_env_vars "$1"' _ {} \;

# Start nginx
exec "$@"
