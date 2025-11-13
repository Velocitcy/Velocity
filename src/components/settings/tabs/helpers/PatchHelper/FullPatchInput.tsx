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
import { Patch, ReplaceFn } from "@utils/types";
import { Forms, TextArea, useEffect, useRef, useState } from "@webpack/common";

export interface FullPatchInputProps {
    setFind(v: string): void;
    setParsedFind(v: string | RegExp): void;
    setMatch(v: string): void;
    setReplacement(v: string | ReplaceFn): void;
}

export function FullPatchInput({ setFind, setParsedFind, setMatch, setReplacement }: FullPatchInputProps) {
    const [patch, setPatch] = useState<string>("");
    const [error, setError] = useState<string>("");

    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    function update() {
        if (patch === "") {
            setError("");

            setFind("");
            setParsedFind("");
            setMatch("");
            setReplacement("");
            return;
        }

        try {
            let { find, replacement } = (0, eval)(`([${patch}][0])`) as Patch;

            if (!find) throw new Error("No 'find' field");
            if (!replacement) throw new Error("No 'replacement' field");

            if (replacement instanceof Array) {
                if (replacement.length === 0) throw new Error("Invalid replacement");

                // Only test the first replacement
                replacement = replacement[0];
            }

            if (!replacement.match) throw new Error("No 'replacement.match' field");
            if (replacement.replace == null) throw new Error("No 'replacement.replace' field");

            setFind(find instanceof RegExp ? `/${find.source}/` : find);
            setParsedFind(find);
            setMatch(replacement.match instanceof RegExp ? replacement.match.source : replacement.match);
            setReplacement(replacement.replace);
            setError("");
        } catch (e) {
            setError((e as Error).message);
        }
    }

    useEffect(() => {
        const { current: textArea } = textAreaRef;
        if (textArea) {
            textArea.style.height = "auto";
            textArea.style.height = `${textArea.scrollHeight}px`;
        }
    }, [patch]);

    return (
        <>
            <Forms.FormText className={Margins.bottom8}>
                Paste your full JSON patch here to fill out the fields
            </Forms.FormText>
            <TextArea
                inputRef={textAreaRef}
                value={patch}
                onChange={setPatch}
                onBlur={update}
            />
            {error !== "" && <Forms.FormText style={{ color: "var(--text-danger)" }}>{error}</Forms.FormText>}
        </>
    );
}
