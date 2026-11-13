"""Stub torch module so the joblib bundle (which references torch types even for
a tabular decision-tree model) can be unpickled in environments without torch.

Only the names the bundle's pickled objects reference need to exist; the actual
model is a scikit-learn Pipeline, so torch is never executed at inference time.
"""


class _Tensor:
    def __init__(self, *a, **k):
        pass

    def to(self, *a, **k):
        return self

    def cpu(self):
        return self

    def numpy(self):
        import numpy as np

        return np.array([])


class nn:
    class Module:
        def __init__(self, *a, **k):
            pass

        def to(self, *a, **k):
            return self

        def cpu(self):
            return self


class utils:
    pass


# Minimal surface: anything the unpickler looks up resolves to something.
float32 = "float32"
float64 = "float64"
int64 = "int64"


def load(*a, **k):
    raise RuntimeError("torch.stub.load is not implemented")


def save(*a, **k):
    raise RuntimeError("torch.stub.save is not implemented")


def zeros(*a, **k):
    import numpy as np

    return np.zeros(*a, **k)


def ones(*a, **k):
    import numpy as np

    return np.ones(*a, **k)


def no_grad():
    class _Ctx:
        def __enter__(self):
            return self

        def __exit__(self, *a):
            return False

    return _Ctx()


device = "cpu"


class dtype:
    pass


__all__ = ["Tensor", "nn", "utils", "float32", "float64", "int64", "load", "save", "zeros", "ones", "no_grad", "device", "dtype"]
Tensor = _Tensor


class jit:
    class ScriptModule(nn.Module):
        pass


__all__ += ["jit"]
