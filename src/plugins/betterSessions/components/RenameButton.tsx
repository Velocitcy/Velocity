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

import { Button } from "@components/Button";
import { openModal } from "@utils/modal";

import { SessionInfo } from "../types";
import { RenameModal } from "./RenameModal";

export function RenameButton({ session, state }: { session: SessionInfo["session"], state: [string, React.Dispatch<React.SetStateAction<string>>]; }) {
    return (
        <Button
            variant="secondary"
            size="xs"
            className="vc-betterSessions-rename-btn"
            onClick={() =>
                openModal(props => (
                    <RenameModal
                        props={props}
                        session={session}
                        state={state}
                    />
                ))
            }
        >
            Rename
        </Button>
    );
}
