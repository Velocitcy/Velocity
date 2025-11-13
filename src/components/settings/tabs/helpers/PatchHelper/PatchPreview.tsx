/*
 * Velocity, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Margins } from "@components/margins";
import { canonicalizeMatch, canonicalizeReplace } from "@utils/patches";
import { makeCodeblock } from "@utils/text";
import { ReplaceFn } from "@utils/types";
import { Button, Forms, Parser, useMemo, useState } from "@webpack/common";
import type { Change } from "diff";

// Do not include diff in non dev builds (side effects import)
if (IS_DEV) {
    var differ = require("diff") as typeof import("diff");
}

interface PatchPreviewProps {
    module: [id: number, factory: Function];
    match: string;
    replacement: string | ReplaceFn;
    setReplacementError(error: any): void;
}

function makeDiff(original: string, patched: string, match: RegExpMatchArray | null) {
    if (!match || original === patched) return null;

    const changeSize = patched.length - original.length;

    // Use 200 surrounding characters of context
    const start = Math.max(0, match.index! - 200);
    const end = Math.min(original.length, match.index! + match[0].length + 200);
    // (changeSize may be negative)
    const endPatched = end + changeSize;

    const context = original.slice(start, end);
    const patchedContext = patched.slice(start, endPatched);

    return differ.diffWordsWithSpace(context, patchedContext);
}

function Match({ matchResult }: { matchResult: RegExpMatchArray | null; }) {
    if (!matchResult)
        return null;

    const fullMatch = matchResult[0]
        ? makeCodeblock(matchResult[0], "js")
        : "";
    const groups = matchResult.length > 1
        ? makeCodeblock(matchResult.slice(1).map((g, i) => `Group ${i + 1}: ${g}`).join("\n"), "yml")
        : "";

    return (
        <>
            <Forms.FormTitle>Match</Forms.FormTitle>
            <div style={{ userSelect: "text" }}>{Parser.parse(fullMatch)}</div>
            <div style={{ userSelect: "text" }}>{Parser.parse(groups)}</div>
        </>
    );
}

function Diff({ diff }: { diff: Change[] | null; }) {
    if (!diff?.length)
        return null;

    const diffLines = diff.map((p, idx) => {
        const color = p.added
            ? "lime"
            : p.removed
                ? "red"
                : "grey";

        return (
            <div
                key={idx}
                style={{ color, userSelect: "text", wordBreak: "break-all", lineBreak: "anywhere" }}
            >
                {p.value}
            </div>
        );
    });

    return (
        <>
            <Forms.FormTitle>Diff</Forms.FormTitle>
            {diffLines}
        </>
    );
}

export function PatchPreview({ module, match, replacement, setReplacementError }: PatchPreviewProps) {
    const [id, fact] = module;
    const [compileResult, setCompileResult] = useState<[boolean, string]>();

    const [patchedCode, matchResult, diff] = useMemo<[string, RegExpMatchArray | null, Change[] | null]>(() => {
        const src: string = fact.toString().replaceAll("\n", "");

        try {
            new RegExp(match);
        } catch (e) {
            return ["", null, null];
        }

        const canonicalMatch = canonicalizeMatch(new RegExp(match));
        try {
            const canonicalReplace = canonicalizeReplace(replacement, 'Velocity.Plugins.plugins["YourPlugin"]');
            var patched = src.replace(canonicalMatch, canonicalReplace as string);
            setReplacementError(void 0);
        } catch (e) {
            setReplacementError((e as Error).message);
            return ["", null, null];
        }

        const m = src.match(canonicalMatch);
        return [patched, m, makeDiff(src, patched, m)];
    }, [id, match, replacement]);

    return (
        <>
            <Forms.FormTitle>Module {id}</Forms.FormTitle>

            <Match matchResult={matchResult} />
            <Diff diff={diff} />

            {!!diff?.length && (
                <Button
                    className={Margins.top20}
                    onClick={() => {
                        try {
                            Function(patchedCode.replace(/^(?=function\()/, "0,"));
                            setCompileResult([true, "Compiled successfully"]);
                        } catch (err) {
                            setCompileResult([false, (err as Error).message]);
                        }
                    }}
                >
                    Compile
                </Button>
            )}

            {compileResult && (
                <Forms.FormText style={{ color: compileResult[0] ? "var(--status-positive)" : "var(--text-danger)" }}>
                    {compileResult[1]}
                </Forms.FormText>
            )}
        </>
    );
}
