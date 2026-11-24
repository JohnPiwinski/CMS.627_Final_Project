#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

source_revision=4bf796d29ea775edd5a7cc5ee3a6806b3c3b91f6
model_revision=5fe06641d0afecb3c04bc9faca2cf64d9b2b1600
mkdir -p .cache
if [[ ! -d .cache/tiny-voca/.git ]]; then
  git clone https://github.com/n4ze3m/tiny-voca.git .cache/tiny-voca
fi
git -C .cache/tiny-voca checkout --detach "$source_revision"
if [[ ! -x .cache/tts/bin/python ]]; then
  uv venv --python 3.12 .cache/tts
fi
if ! .cache/tts/bin/python -c 'import torch, tiny_voca, huggingface_hub'; then
  uv pip install --python .cache/tts/bin/python torch --index-url https://download.pytorch.org/whl/cpu
  uv pip install --python .cache/tts/bin/python './.cache/tiny-voca[own]' huggingface_hub
fi
.cache/tts/bin/hf download n4ze3m/tiny-voca tiny-voca.pt 'phonemizer/*' \
  --revision "$model_revision" --local-dir .cache/weights
touch .cache/narration-ready
