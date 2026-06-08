from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / ".github" / "workflows" / "repair_botsgsn_runner.yml"


def test_repair_uses_dedicated_control_runner():
    workflow = WORKFLOW.read_text(encoding="utf-8")

    assert "runs-on: [self-hosted, linux, yamal-control]" in workflow
    assert "runs-on: [self-hosted, linux, yamal-max-prod]" not in workflow


def test_repair_fails_fast_when_botsgsn_ssh_is_unreachable():
    workflow = WORKFLOW.read_text(encoding="utf-8")

    assert "Check BOTSGSN SSH reachability" in workflow
    assert "/dev/tcp/${BOTSGSN_HOST}/22" in workflow
    assert "BOTSGSN SSH is unreachable" in workflow
