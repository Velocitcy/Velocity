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

import { CopyIcon, DeleteIcon } from "@components/Icons";
import { copyToClipboard } from "@utils/clipboard";
import { Alerts, ContextMenuApi, Menu, UserStore } from "@webpack/common";

import { Decoration } from "../../lib/api";
import { useCurrentUserDecorationsStore } from "../../lib/stores/CurrentUserDecorationsStore";
import { cl } from "../";

export default function DecorationContextMenu({ decoration }: { decoration: Decoration; }) {
    const { delete: deleteDecoration } = useCurrentUserDecorationsStore();

    return <Menu.Menu
        navId={cl("decoration-context-menu")}
        onClose={ContextMenuApi.closeContextMenu}
        aria-label="Decoration Options"
    >
        <Menu.MenuItem
            id={cl("decoration-context-menu-copy-hash")}
            label="Copy Decoration Hash"
            icon={CopyIcon}
            action={() => copyToClipboard(decoration.hash)}
        />
        {decoration.authorId === UserStore.getCurrentUser().id &&
            <Menu.MenuItem
                id={cl("decoration-context-menu-delete")}
                label="Delete Decoration"
                color="danger"
                icon={DeleteIcon}
                action={() => Alerts.show({
                    title: "Delete Decoration",
                    body: `Are you sure you want to delete ${decoration.alt}?`,
                    confirmText: "Delete",
                    confirmColor: cl("danger-btn"),
                    cancelText: "Cancel",
                    onConfirm() {
                        deleteDecoration(decoration);
                    }
                })}
            />
        }
    </Menu.Menu>;
}
