"""Tests for taskmind. Run with: python3 -m unittest -v"""

import io
import json
import os
import tempfile
import unittest
from contextlib import redirect_stdout
from datetime import timedelta

import taskmind


class TaskmindTest(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        os.environ["TASKMIND_HOME"] = self._tmp.name

    def tearDown(self):
        del os.environ["TASKMIND_HOME"]
        self._tmp.cleanup()

    def run_cmd(self, *argv):
        out = io.StringIO()
        with redirect_stdout(out):
            code = taskmind.main(list(argv))
        return code, out.getvalue()

    def tasks(self):
        return taskmind.load()["tasks"]

    def test_add_and_now(self):
        code, _ = self.run_cmd("add", "water", "the", "plants")
        self.assertEqual(code, 0)
        code, out = self.run_cmd("now")
        self.assertEqual(code, 0)
        self.assertIn("water the plants", out)
        self.assertIn("only ever one", out)

    def test_add_records_why(self):
        self.run_cmd("add", "call", "mother", "--why", "she worries")
        task = self.tasks()[0]
        self.assertEqual(task["what"], "call mother")
        self.assertEqual(task["why"], "she worries")

    def test_add_without_text_fails_gently(self):
        code, out = self.run_cmd("add")
        self.assertEqual(code, 1)
        self.assertIn("one small thing", out)

    def test_now_shows_only_first_task(self):
        self.run_cmd("add", "first")
        self.run_cmd("add", "second")
        _, out = self.run_cmd("now")
        self.assertIn("first", out)
        self.assertNotIn("second", out)

    def test_done_removes_present_task(self):
        self.run_cmd("add", "first")
        self.run_cmd("add", "second")
        code, out = self.run_cmd("done")
        self.assertEqual(code, 0)
        self.assertIn("✓ first", out)
        self.assertEqual([t["what"] for t in self.tasks()], ["second"])

    def test_later_cycles_present_task_to_back(self):
        self.run_cmd("add", "first")
        self.run_cmd("add", "second")
        self.run_cmd("later")
        self.assertEqual([t["what"] for t in self.tasks()], ["second", "first"])

    def test_later_with_one_task_keeps_it(self):
        self.run_cmd("add", "only")
        code, out = self.run_cmd("later")
        self.assertEqual(code, 0)
        self.assertIn("Only one thing", out)
        self.assertEqual(len(self.tasks()), 1)

    def test_release_by_number(self):
        self.run_cmd("add", "first")
        self.run_cmd("add", "second")
        code, out = self.run_cmd("release", "2")
        self.assertEqual(code, 0)
        self.assertIn("second", out)
        self.assertEqual([t["what"] for t in self.tasks()], ["first"])

    def test_release_bad_number(self):
        self.run_cmd("add", "first")
        code, _ = self.run_cmd("release", "9")
        self.assertEqual(code, 1)
        self.assertEqual(len(self.tasks()), 1)

    def test_old_tasks_fade(self):
        self.run_cmd("add", "ancient intention")
        data = taskmind.load()
        old = taskmind.now_utc() - taskmind.FADE_AFTER - timedelta(hours=1)
        data["tasks"][0]["planted"] = old.isoformat()
        taskmind.save(data)
        _, out = self.run_cmd("garden")
        self.assertIn("faded quietly", out)
        self.assertEqual(self.tasks(), [])

    def test_empty_garden_is_not_an_error(self):
        for cmd in ("now", "done", "garden", "later"):
            code, out = self.run_cmd(cmd)
            self.assertEqual(code, 0, cmd)
            self.assertTrue(out.strip(), cmd)

    def test_garden_nudges_when_holding_many(self):
        for i in range(4):
            self.run_cmd("add", f"task{i}")
        _, out = self.run_cmd("garden")
        self.assertIn("holding 4 things", out)

    def test_unknown_command(self):
        code, out = self.run_cmd("hurry")
        self.assertEqual(code, 1)
        self.assertIn("Unknown command", out)

    def test_help(self):
        code, out = self.run_cmd("--help")
        self.assertEqual(code, 0)
        self.assertIn("non-attachment", out)

    def test_store_survives_corruption(self):
        with open(taskmind.store_path(), "w") as f:
            f.write("not json{")
        code, _ = self.run_cmd("now")
        self.assertEqual(code, 0)

    def test_store_is_valid_json(self):
        self.run_cmd("add", "a task")
        with open(taskmind.store_path()) as f:
            data = json.load(f)
        self.assertEqual(len(data["tasks"]), 1)


if __name__ == "__main__":
    unittest.main()
