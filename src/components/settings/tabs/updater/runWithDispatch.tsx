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

import { ErrorCard } from "@components/ErrorCard";
import { UpdateLogger } from "@utils/updater";
import { Alerts, Parser } from "@webpack/common";

function getErrorMessage(e: any) {
    if (!e?.code || !e.cmd)
        return "An unknown error occurred.\nPlease try again or see the console for more info.";

    const { code, path, cmd, stderr } = e;

    if (code === "ENOENT")
        return `Command \`${path}\` not found.\nPlease install it and try again.`;

    const extra = stderr || `Code \`${code}\`. See the console for more info.`;

    return `An error occurred while running \`${cmd}\`:\n${extra}`;
}

export function runWithDispatch(dispatch: React.Dispatch<React.SetStateAction<boolean>>, action: () => any) {
    return async () => {
        dispatch(true);

        try {
            await action();
        } catch (e: any) {
            UpdateLogger.error(e);

            const err = getErrorMessage(e);

            Alerts.show({
                title: "Oops!",
                body: (
                    <ErrorCard>
                        {err.split("\n").map((line, idx) =>
                            <div key={idx}>{Parser.parse(line)}</div>
                        )}
                    </ErrorCard>
                )
            });
        } finally {
            dispatch(false);
        }
    };
}
