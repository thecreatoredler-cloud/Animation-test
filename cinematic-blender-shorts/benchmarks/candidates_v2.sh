#!/bin/bash
# Combined optimisation candidates for pilot-02, rendered as sequences (steady state, persistent data),
# same frames as the 16-sample reference in render_tests/s01_padlock_v2/cycles_final_s16.
B=${BLENDER_PY:-/opt/bvenv/bin/python}
BLEND=projects/pilot-02-padlock/blend/s01_padlock_v2.blend
OUT=benchmarks/render_tests/s01_padlock_v2
F=12,100,165,190,230
FAST="cycles.denoising_prefilter='FAST' cycles.denoising_quality='BALANCED'"
run() { name=$1; shift; $B scripts/render_manager.py $BLEND --profile final --engine CYCLES --frames $F --force --out $OUT/$name "$@" 2>&1 | grep -E "SUMMARY|Error"; }
run c1_s8_dnfast   --samples 8 --set cycles.denoising_prefilter=\'FAST\' cycles.denoising_quality=\'BALANCED\'
run c2_s4_dnfast_nolt --samples 4 --set cycles.denoising_prefilter=\'FAST\' cycles.denoising_quality=\'BALANCED\' cycles.use_light_tree=False
run c3_s6_dnfast_nolt --samples 6 --set cycles.denoising_prefilter=\'FAST\' cycles.denoising_quality=\'BALANCED\' cycles.use_light_tree=False
run c4_s4_dnfastest_nolt --samples 4 --set cycles.denoising_prefilter=\'FAST\' cycles.denoising_quality=\'FAST\' cycles.use_light_tree=False
