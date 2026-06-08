from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / ".github" / "workflows" / "repair_botsgsn_runner.yml"
STOP_WORKFLOW = ROOT / ".github" / "workflows" / "stop_yamal_max_bot.yml"


def test_repair_uses_dedicated_control_runner():
    workflow = WORKFLOW.read_text(encoding="utf-8")

    assert "runs-on: [self-hosted, linux, yamal-control]" in workflow
    assert "runs-on: [self-hosted, linux, yamal-max-prod]" not in workflow


def test_repair_fails_fast_when_botsgsn_ssh_is_unreachable():
    workflow = WORKFLOW.read_text(encoding="utf-8")

    assert "Check BOTSGSN SSH reachability" in workflow
    assert "/dev/tcp/${BOTSGSN_HOST}/22" in workflow
    assert "BOTSGSN SSH is unreachable" in workflow


def test_stop_workflow_targets_active_botsgsn_legacy_services():
    workflow = STOP_WORKFLOW.read_text(encoding="utf-8")

    assert "runs-on: [self-hosted, linux, yamal-botsgsn]" in workflow
    assert "yamal-max-prod" not in workflow
    assert "BRAND_SERVICE_NAME: max_yamal_bot.service" in workflow
    assert "YAMALBREND_SERVICE_NAME: yamalbrend_bot.service" in workflow
    assert "/home/localadmin/yamal_brand" in workflow
    assert "/home/localadmin/yamalbrend_bot" in workflow
    assert "MAX_BOT_TOKEN=disabled-yamal-token" in workflow
