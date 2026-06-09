from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WORKFLOWS_DIR = ROOT / ".github" / "workflows"
ACTIVE_DEPLOY_WORKFLOW = WORKFLOWS_DIR / "deploy.yml"
DISABLED_BOTSGSN_WORKFLOWS = (
    "deploy_yamalbrend_bot.yml.disabled",
    "diagnose_yamalbrend_bot.yml.disabled",
    "deploy_botsgsn_bot.yml.disabled",
    "diagnose_botsgsn.yml.disabled",
    "migrate_botsgsn.yml.disabled",
    "recover_botsgsn_max_token.yml.disabled",
)


def test_yamalbrend_active_deploy_uses_yamal_max_prod_runner():
    workflow = ACTIVE_DEPLOY_WORKFLOW.read_text(encoding="utf-8")

    assert "runs-on: [self-hosted, linux, yamal-max-prod]" in workflow
    assert "DEPLOY_DIR: /home/sergey/yamal_brand" in workflow
    assert "DEPLOY_SERVICE: max_yamal_bot.service" in workflow
    assert "yamal-botsgsn" not in workflow
    assert "yamalbrend_bot.service" not in workflow


def test_botsgsn_runtime_workflows_are_disabled():
    active_workflow_names = {path.name for path in WORKFLOWS_DIR.glob("*.yml")}

    for workflow_name in DISABLED_BOTSGSN_WORKFLOWS:
        disabled_path = WORKFLOWS_DIR / workflow_name
        active_name = workflow_name.removesuffix(".disabled")
        assert disabled_path.exists(), f"{workflow_name} must remain disabled"
        assert active_name not in active_workflow_names


def test_active_workflows_do_not_deploy_yamalbrend_to_botsgsn():
    active_workflows = "\n".join(
        path.read_text(encoding="utf-8") for path in WORKFLOWS_DIR.glob("*.yml")
    )

    assert "Deploy Yamalbrend MAX Bot To BOTSGSN" not in active_workflows
    assert "Migrate Yamal MAX Bot To BOTSGSN" not in active_workflows
    assert "Recover BOTSGSN MAX Bot Token" not in active_workflows
    assert "DEPLOY_SERVICE: yamalbrend_bot.service" not in active_workflows
