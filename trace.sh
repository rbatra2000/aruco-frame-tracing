#!/bin/bash

keep=false
while getopts "k" opt; do
    case $opt in
        k) keep=true ;;
    esac
done
shift $((OPTIND-1))

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 [-k] <input_file> <output_file>"
    echo "  -k: keep intermediate files"
    exit 1
fi

input_file_noext="${1%.*}"
output_file_noext="${2%.*}"

input_file="$1"
output_file="$2"

# Run aruco-frame.py with the input and output files
uv run aruco-frame.py -i "$input_file" -o "$input_file_noext"__flattened.png

magick "$input_file_noext"__flattened.png "$input_file_noext"__flattened.bmp
potrace -s "$input_file_noext"__flattened.bmp -o "$output_file_noext".svg

if [ "$keep" != "true" ]; then
    rm "$input_file_noext"__flattened.png
    rm "$input_file_noext"__flattened.bmp
fi
