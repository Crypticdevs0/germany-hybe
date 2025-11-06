#!/usr/bin/env bash
# Deprecated: this repository no longer uses face-api.js for liveness checks.
# The liveness implementation has been migrated to TensorFlow.js face-landmarks-detection
# (MediaPipe FaceMesh). The old download script for face-api models is kept for
# historical reference but no longer downloads or places model files.

echo "Deprecated: face-api.js model download script — no action taken."
echo "Liveness now uses @tensorflow-models/face-landmarks-detection (MediaPipe FaceMesh)."
