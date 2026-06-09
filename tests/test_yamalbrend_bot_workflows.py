from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEPLOY_WORKFLOW = ROOT / ".github" / "workflows" / "deploy_yamalbrend_bot.yml"
DIAGNOSE_WORKFLOW = ROOT / ".github" / "workflows" / "diagnose_yamalbrend_bot.yml"
PRODUCTION_BOT_DIR = "/home/localadmin/yamalbrend_bot_runtime"
CATALOG_DIR = "/home/localadmin/yamal_brand"


def test_yamalbrend_deploy_defaults_to_separate_runtime_dir():
    workflow = DEPLOY_WORKFLOW.read_text(encoding="utf-8")

    assert f'default: "{PRODUCTION_BOT_DIR}"' in workflow
    assert f"DEPLOY_DIR: ${{{{ github.event.inputs.deploy_dir || '{PRODUCTION_BOT_DIR}' }}}}" in workflow
    assert f"CATALOG_DIR: ${{{{ github.event.inputs.catalog_dir || '{CATALOG_DIR}' }}}}" in workflow
    assert "DEPLOY_SERVICE: yamalbrend_bot.service" in workflow


def test_yamalbrend_diagnose_defaults_to_separate_runtime_dir():
    workflow = DIAGNOSE_WORKFLOW.read_text(encoding="utf-8")

    assert f'default: "{PRODUCTION_BOT_DIR}"' in workflow
    assert f"DEPLOY_DIR: ${{{{ github.event.inputs.deploy_dir || '{PRODUCTION_BOT_DIR}' }}}}" in workflow
    assert "SERVICE_NAME: yamalbrend_bot.service" in workflow
    assert "MAX_BOT_TOKEN=).*" in workflow
    assert "<redacted>" in workflow
