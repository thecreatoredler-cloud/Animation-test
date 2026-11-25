#!/bin/bash
# One-variable-at-a-time ablation on the slowest pilot frame (110, macro cutaway), final res.
# Each run changes ONE setting vs baseline (Cycles, 16 samples, 1440x2560, denoise, motion blur).
B=${BLENDER_PY:-/opt/bvenv/bin/python}
BLEND=projects/pilot-01-padlock/blend/s01_padlock.blend
OUT=benchmarks/render_tests/s01_padlock/ablation
run() { name=$1; shift; $B scripts/render_manager.py $BLEND --profile final --engine CYCLES --samples 16 --frames 110 --force --out $OUT/$name "$@" 2>&1 | grep -E "frame 110|Error"; }
run baseline
run no_denoise       --set cycles.use_denoising=False
run no_motionblur    --set render.use_motion_blur=False
run samples8         --samples 8
run no_dof           --set camera.data.dof.use_dof=False
run bounces_2        --set cycles.max_bounces=2 cycles.glossy_bounces=1 cycles.diffuse_bounces=1
run res_1080         --res 1080x1920
run threads_4        --set render.threads_mode='FIXED' render.threads=4
