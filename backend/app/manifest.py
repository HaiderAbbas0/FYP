"""Public reproducibility metadata; credentials are never hashed or exported."""
import hashlib
import os
from pathlib import Path
from agents.detector.multiclass import detector_mode

from .config import settings
from .evaluation import digest
from .policy import POLICY_VERSION


def _code_identity() -> str:
    root = Path(__file__).resolve().parents[2]
    source_files = [*sorted((root / 'backend' / 'app').rglob('*.py')),
                    *sorted((root / 'agents').rglob('*.py')),
                    *sorted((root / 'backend' / 'gateway').glob('*.py')),
                    *sorted((root / 'backend' / 'migrations').glob('*.sql')),
                    root / 'backend' / 'worker.py', root / 'backend' / 'evaluate.py']
    code = {str(p.relative_to(root)): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in source_files if p.exists()}
    return digest(code)


# Capture identity at import, matching the code loaded by this process.
CODE_HASH = _code_identity()


def freeze(request: dict, cases: list[dict]) -> dict:
    root = Path(__file__).resolve().parents[2]
    artifacts = {}
    mode = detector_mode()
    if request['source_mode'] == 'capture_replay':
        if mode == 'multiclass':
            for name in ('detector_bundle.joblib', 'best_model.json'):
                path = root / 'agents' / 'detector' / 'artifacts' / 'multiclass' / name
                artifacts[name] = hashlib.sha256(path.read_bytes()).hexdigest() if path.exists() else 'missing'
        else:
            for name in ('tcp_flood_rf_model.joblib', 'tcp_flood_scaler.joblib', 'feature_schema.json', 'model_metadata.json'):
                path = root / 'agents' / 'detector' / 'artifacts' / 'legacy' / name
                artifacts[name] = hashlib.sha256(path.read_bytes()).hexdigest() if path.exists() else 'missing'
    config = {'thresholds': settings.thresholds.__dict__, 'verified_reuse': settings.enable_verified_reuse,
              'specialist_execution': os.getenv('SPECIALIST_EXECUTION', 'process'),
              'specialist_timeout_s': settings.specialist_timeout_s, 'policy_version': POLICY_VERSION,
              'outcome_version': 'outcomes-v1', 'llm_total_budget_s': os.getenv('LLM_TOTAL_BUDGET_S', '40'),
              'llm_chain': settings.llm.chain, 'llm_models': {name: provider.model for name, provider in settings.llm.providers.items()},
              'run_deadline_s': os.getenv('RUN_DEADLINE_S', '180'), 'detector': mode}
    result = {'schema_version': 1, 'source_mode': request['source_mode'], 'request_hash': digest(request),
              'code_hash': CODE_HASH, 'model_hash': digest(artifacts), 'model_artifacts': artifacts,
              'config_hash': digest(config), 'public_config': config, 'memory_hash': digest(cases),
              'seed': request.get('fixture_seed'), 'evaluation_profile': request.get('evaluation_profile', 'operational')}
    result['manifest_hash'] = digest(result)
    return result
