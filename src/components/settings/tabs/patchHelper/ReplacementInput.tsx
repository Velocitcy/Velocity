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

import { FormSwitch } from "@components/FormSwitch";
import { Margins } from "@components/margins";
import { Forms, Parser, TextInput, useEffect, useState } from "@webpack/common";

const RegexGuide = {
    "\\i": "Special regex escape sequence that matches identifiers (varnames, classnames, etc.)",
    "$$": "Insert a $",
    "$&": "Insert the entire match",
    "$`\u200b": "Insert the substring before the match",
    "$'": "Insert the substring after the match",
    "$n": "Insert the nth capturing group ($1, $2...)",
    "$self": "Insert the plugin instance",
} as const;

export function ReplacementInput({ replacement, setReplacement, replacementError }) {
    const [isFunc, setIsFunc] = useState(false);
    const [error, setError] = useState<string>();

    function onChange(v: string) {
        setError(void 0);

        if (isFunc) {
            try {
                const func = (0, eval)(v);
                if (typeof func === "function")
                    setReplacement(() => func);

                else
                    setError("Replacement must be a function");
            } catch (e) {
                setReplacement(v);
                setError((e as Error).message);
            }
        } else {
            setReplacement(v);
        }
    }

    useEffect(() => {
        if (isFunc)
            onChange(replacement);
        else
            setError(void 0);
    }, [isFunc]);

    return (
        <>
            {/* FormTitle adds a class if className is not set, so we set it to an empty string to prevent that */}
            <Forms.FormTitle className="">Replacement</Forms.FormTitle>
            <TextInput
                value={replacement?.toString()}
                onChange={onChange}
                error={error ?? replacementError}
            />
            {!isFunc && (
                <div>
                    <Forms.FormTitle className={Margins.top8}>Cheat Sheet</Forms.FormTitle>

                    {Object.entries(RegexGuide).map(([placeholder, desc]) => (
                        <Forms.FormText key={placeholder}>
                            {Parser.parse("`" + placeholder + "`")}: {desc}
                        </Forms.FormText>
                    ))}
                </div>
            )}

            <FormSwitch
                className={Margins.top16}
                value={isFunc}
                onChange={setIsFunc}
                title={"Treat Replacement as function"}
                description='"Replacement" will be evaluated as a function if this is enabled'
                hideBorder
            />
        </>
    );
}
