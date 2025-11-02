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

import { NavContextMenuPatchCallback } from "@api/ContextMenu";
import { CopyIcon } from "@components/Icons";
import { Devs } from "@utils/constants";
import { copyWithToast } from "@utils/misc";
import definePlugin from "@utils/types";
import { Menu } from "@webpack/common";

const UserInfoPatch: NavContextMenuPatchCallback = (children, { user }) => {
    if (!user) return;

    children.push(
        <Menu.MenuItem
            id="vc-copy-user-data"
            label="Copy User Data"
            icon={() => <CopyIcon height="24" width="24" viewBox="0 0 24 24" className="icon_c1e9c4" />}
            action={() => {
                const json = JSON.stringify(user, null, 2);
                copyWithToast(json, "User data copied to clipboard!");
            }}
        />
    );
};

export default definePlugin({
    name: "ViewUserRaw",
    description: "Copy the raw data of a user",
    authors: [Devs.Velocity],

    contextMenus: {
        "user-profile-overflow-menu": UserInfoPatch
    }
});
