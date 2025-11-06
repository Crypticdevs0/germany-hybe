#!/usr/bin/env bash
set -euo pipefail

# Script to download common face-api.js model files into public/face-api/models
# This attempts to download from the jsDelivr CDN. If some filenames differ for the
# version you use, adjust the FILENAMES array accordingly.

MODEL_DIR="public/face-api/models"
CDN_BASE="https://cdn.jsdelivr.net/npm/face-api.js/models"

mkdir -p "$MODEL_DIR"
cd "$MODEL_DIR"

FILENAMES=(
  "tiny_face_detector_model-weights_manifest.json"
  "tiny_face_detector_model-shard1"
  "face_landmark_68_model-weights_manifest.json"
  "face_landmark_68_model-shard1"
  "face_expression_model-weights_manifest.json"
  "face_expression_model-shard1"
)

# Try common extensions for shards (bin) and try to download manifest and shards
for name in "${FILENAMES[@]}"; do
  # try exact name
  url="$CDN_BASE/$name"
  if curl -f -sS -O "$url"; then
    echo "Downloaded $url"
    continue
  fi

  # try adding .bin for shard files
  if [[ "$name" == *"shard1"* ]]; then
    for ext in ".bin" "-weights.bin"; do
      url2="$CDN_BASE/${name}${ext}"
      if curl -f -sS -O "$url2"; then
        echo "Downloaded $url2"
        continue 2
      fi
    done
  fi

  echo "Warning: failed to download $name (you may need to adjust filenames or download manually)"
done

echo "Download script finished. Verify the files in $MODEL_DIR and adjust as needed."
