from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


def _stable_normalize(value: Any) -> Any:
    if isinstance(value, dict):
        return {k: _stable_normalize(value[k]) for k in sorted(value.keys())}
    if isinstance(value, list):
        return [_stable_normalize(item) for item in value]
    return value


def _assert_equal(label: str, left: Any, right: Any, errors: list[str]) -> None:
    if _stable_normalize(left) != _stable_normalize(right):
        errors.append(f"{label}_mismatch")


def validate_replay_parity(baseline_rows: list[dict[str, Any]], replay_rows: list[dict[str, Any]]) -> dict[str, Any]:
    errors: list[str] = []

    if len(baseline_rows) != len(replay_rows):
        errors.append("event_count_mismatch")

    row_pairs = zip(baseline_rows, replay_rows)
    for index, (baseline, replay) in enumerate(row_pairs):
        prefix = f"row_{index}"

        _assert_equal(f"{prefix}_event_ordering", baseline.get("eventId"), replay.get("eventId"), errors)
        _assert_equal(f"{prefix}_commentary", baseline.get("commentary"), replay.get("commentary"), errors)
        _assert_equal(f"{prefix}_planner", baseline.get("plannerOutput"), replay.get("plannerOutput"), errors)
        _assert_equal(f"{prefix}_ranking", baseline.get("ranking"), replay.get("ranking"), errors)
        _assert_equal(f"{prefix}_retrieval", baseline.get("retrieval"), replay.get("retrieval"), errors)

        baseline_seed = baseline.get("seed")
        replay_seed = replay.get("seed")
        if baseline_seed != replay_seed:
            errors.append(f"{prefix}_seed_mismatch")

        baseline_retrieval = baseline.get("retrieval", {}).get("candidates", [])
        replay_retrieval = replay.get("retrieval", {}).get("candidates", [])
        if baseline_retrieval != sorted(baseline_retrieval, key=lambda item: (-(item.get("score", 0)), str(item.get("id", "")))):
            errors.append(f"{prefix}_baseline_retrieval_not_deterministically_sorted")
        if replay_retrieval != sorted(replay_retrieval, key=lambda item: (-(item.get("score", 0)), str(item.get("id", "")))):
            errors.append(f"{prefix}_replay_retrieval_not_deterministically_sorted")

    return {
        "passed": len(errors) == 0,
        "errors": errors,
        "baselineRows": len(baseline_rows),
        "replayRows": len(replay_rows),
        "checks": [
            "commentary_equality",
            "planner_equality",
            "ranking_equality",
            "retrieval_consistency",
            "event_ordering",
            "stable_seed_enforcement",
        ],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate deterministic replay parity for commentary outputs")
    parser.add_argument("--baseline", required=True, help="Baseline replay JSON rows")
    parser.add_argument("--replay", required=True, help="Replay JSON rows")
    parser.add_argument("--out", default="ml/commentary/evaluation/replay_validation_report.json")
    args = parser.parse_args()

    baseline_rows = json.loads(Path(args.baseline).read_text(encoding="utf-8"))
    replay_rows = json.loads(Path(args.replay).read_text(encoding="utf-8"))

    report = validate_replay_parity(baseline_rows, replay_rows)

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))

    if not report["passed"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
