import assert from "node:assert/strict";
import { test } from "node:test";
import { EventError, parseSurveyUrl } from "./events";

test("空文字は未設定として扱う", () => {
  assert.equal(parseSurveyUrl("  "), null);
});

test("httpsのURLをそのまま返す", () => {
  assert.equal(
    parseSurveyUrl(" https://forms.gle/example "),
    "https://forms.gle/example",
  );
});

test("http以外はエラー", () => {
  assert.throws(() => parseSurveyUrl("javascript:alert(1)"), EventError);
});

test("形式不正はエラー", () => {
  assert.throws(() => parseSurveyUrl("not a url"), EventError);
});
