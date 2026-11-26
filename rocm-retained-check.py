import torch
assert torch.version.hip and torch.cuda.is_available(), 'Native ROCm GPU unavailable'
x = torch.arange(16, dtype=torch.float32, device='cuda').reshape(4, 4).requires_grad_()
actual = x @ x.T
torch.testing.assert_close(actual.detach().cpu(), x.detach().cpu() @ x.detach().cpu().T)
actual.sum().backward()
assert torch.isfinite(x.grad).all()
print('Retained native HIP forward/backward verified:', torch.__version__, torch.version.hip, torch.cuda.get_device_name(0), flush=True)
