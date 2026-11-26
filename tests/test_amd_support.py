import importlib.util
import os
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "app" / "backend"))
import torch
from src.utils.BackendDetect import BackendDetect
from src.utils.Frame import Frame
from src.pytorch.UpscaleModelWrapper import UpscaleModelWrapper


class AMDRenderingTests(unittest.TestCase):
    def test_hip_runtime_detection_and_cpu_fallback(self):
        detect = BackendDetect.__new__(BackendDetect)
        detect._BackendDetect__torch = torch
        with patch.object(torch.cuda, 'is_available', return_value=True), patch.object(torch.version, 'hip', '7.2'):
            self.assertEqual(detect._BackendDetect__get_pytorch_device(), 'rocm')
        with patch.object(torch.cuda, 'is_available', return_value=False), patch.object(torch.xpu, 'is_available', return_value=False), patch.object(torch.backends.mps, 'is_available', return_value=False):
            self.assertEqual(detect._BackendDetect__get_pytorch_device(), 'CPU')
            detect.pytorch_device = 'CPU'
            self.assertEqual(detect.get_gpus_torch(), ['CPU'])

    def test_model_parameters_remain_normal_under_inference_context(self):
        with patch.dict(os.environ, {'RVE_FAST_INFERENCE': '1'}), torch.inference_mode():
            wrapper = UpscaleModelWrapper(str(ROOT / 'app/models/2x_OpenProteus_Compact_i2_70K.pth'), torch.device('cuda'), torch.float16)
            self.assertEqual(wrapper.get_precision(), torch.float16)
            self.assertTrue(all(not p.is_inference() for p in wrapper.get_model().parameters()))
            result = wrapper(torch.ones(1, 3, 64, 96, device='cuda', dtype=torch.float16))
            self.assertEqual(tuple(result.shape), (1, 3, 128, 192))
            self.assertTrue(torch.isfinite(result).all())

    def test_fast_profile_preserves_model_output(self):
        torch.manual_seed(10)
        x = torch.rand(1, 3, 64, 96, device='cuda', dtype=torch.float16)
        model_path = str(ROOT / 'app/models/2x_OpenProteus_Compact_i2_70K.pth')
        with torch.inference_mode():
            with patch.dict(os.environ, {'RVE_FAST_INFERENCE': '0'}):
                baseline = UpscaleModelWrapper(model_path, torch.device('cuda'), torch.float16)(x)
            with patch.dict(os.environ, {'RVE_FAST_INFERENCE': '1'}):
                optimized = UpscaleModelWrapper(model_path, torch.device('cuda'), torch.float16)(x)
        torch.testing.assert_close(optimized, baseline, rtol=0.002, atol=0.002)

    def test_precision_rejection_retests_with_float32_input(self):
        class RejectHalf(torch.nn.Module):
            def forward(self, x):
                if x.dtype == torch.float16:
                    raise RuntimeError('FP16 unsupported by this test model')
                return x
        wrapper = UpscaleModelWrapper.__new__(UpscaleModelWrapper)
        wrapper._UpscaleModelWrapper__device = torch.device('cpu')
        wrapper._UpscaleModelWrapper__precision = torch.float16
        wrapper._UpscaleModelWrapper__model = RejectHalf()
        wrapper.inference_helper = wrapper._UpscaleModelWrapper__model
        wrapper._UpscaleModelWrapper__test_model_precision()
        self.assertEqual(wrapper.get_precision(), torch.float32)

    def test_frame_clone_owns_its_tensor(self):
        with patch.dict(os.environ, {'RVE_FAST_INFERENCE': '1'}):
            original = Frame('pytorch', 8, 8, 'cuda', 0, False, 'float16')
            original.set_frame_tensor(torch.ones(1, 3, 8, 8, device='cuda', dtype=torch.float16))
            copied = original.clone()
            original._tensor.zero_()
            self.assertTrue(torch.all(copied.get_frame_tensor() == 1))

    def test_amf_uses_supported_rate_control(self):
        spec = importlib.util.spec_from_file_location('encoder', ROOT / 'app/src/GenerateFFMpegCommand.py')
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        for name in ('h264_amf', 'h265_amf', 'av1_amf'):
            command = module.FFMpegCommand(name, 'fastest', 'High', 'yuv420p', 'copy_audio', '192k', 'copy_subtitle', False, None, None, None).build_command()
            self.assertNotIn('-crf', command)
            self.assertIn('cqp', command)
            self.assertIn('-qp_i', command)
            self.assertIn('speed', command)


if __name__ == '__main__':
    unittest.main()
