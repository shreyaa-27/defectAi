#!/bin/bash
# Simple script to run the app with correct conda environment

cd "$(dirname "$0")/backend"

# Source conda
source /opt/miniconda3/etc/profile.d/conda.sh

# Deactivate any virtualenv first
deactivate 2>/dev/null || true

# Activate conda environment
conda activate defectai

# Run the app
python app.py
