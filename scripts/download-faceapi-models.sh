#!/usr/bin/env bash
set -euo pipefail

# Script to download common face-api.js model files into public/face-api/models
# This attempts to download from the jsDelivr CDN. If some filenames differ for the
# version you use, adjust the FILENAMES array accordingly.

MODEL_DIR="public/face-api/models"
CDN_BASE="https://justadudewhohacks.github.io/face-api.js/models"

mkdir -p "$MODEL_DIR"
cd "$MODEL_DIR"

FILENAMES=(
  # Manifests
  "tiny_face_detector_model-weights_manifest.json"
  "face_landmark_68_model-weights_manifest.json"
  "face_expression_model-weights_manifest.json"

  # Expected shard/bin files for face-api.js v0.22.2 (common names)
  "tiny_face_detector_model-shard1.bin"
  "face_landmark_68_model-shard1.bin"
  "face_expression_model-shard1.bin"
)

# Download each file if available
for name in "${FILENAMES[@]}"; do
  url="$CDN_BASE/$name"
  if curl -f -sS -O "$url"; then
    echo "Downloaded $url"
    continue
  fi

  # Some CDNs expose different naming for shards; try alternate patterns
  if [[ "$name" == *"-shard1.bin" ]]; then
    base=${name%%-shard1.bin}
    alt1="${base}_weights_manifest.json"
    alt2="${base}-weights.bin"
    for alt in "$alt1" "$alt2"; do
      url2="$CDN_BASE/$alt"
      if curl -f -sS -O "$url2"; then
        echo "Downloaded $url2"
        continue 2
      fi
    done
  fi

  echo "Warning: failed to download $name. You may need to download it manually and place it in $MODEL_DIR"
done

echo "Download script finished. Verify the files in $MODEL_DIR and adjust as needed."
