/*
 * Velocity, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { getUserSettingLazy } from "@api/UserSettings";
import { AppearanceIcon, ImageIcon, PencilIcon } from "@components/Icons";
import { copyToClipboard } from "@utils/clipboard";
import { Devs } from "@utils/constants";
import { getCurrentGuild, openImageModal } from "@utils/discord";
import definePlugin, { OptionType } from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { GuildRoleStore, Menu, PermissionStore } from "@webpack/common";

const GuildSettingsActions = findByPropsLazy("open", "selectRole", "updateGuild");

const DeveloperMode = getUserSettingLazy("appearance", "developerMode")!;

const settings = definePluginSettings({
    roleIconFileFormat: {
        type: OptionType.SELECT,
        description: "File format to use when viewing role icons",
        options: [
            {
                label: "png",
                value: "png",
                default: true
            },
            {
                label: "webp",
                value: "webp",
            },
            {
                label: "jpg",
                value: "jpg"
            }
        ]
    }
});

export default definePlugin({
    name: "BetterRoleContext",
    description: "Adds options to copy role color / edit role / view role icon when right clicking roles in the user profile",
    authors: [Devs.Ven, Devs.goodbee],
    dependencies: ["UserSettingsAPI"],

    settings,

    start() {
        // DeveloperMode needs to be enabled for the context menu to be shown
        DeveloperMode.updateSetting(true);
    },

    contextMenus: {
        "dev-context"(children, { id }: { id: string; }) {
            const guild = getCurrentGuild();
            if (!guild) return;

            const role = GuildRoleStore.getRole(guild.id, id);
            if (!role) return;

            if (role.colorString) {
                children.unshift(
                    <Menu.MenuItem
                        id="vc-copy-role-color"
                        label="Copy Role Color"
                        action={() => copyToClipboard(role.colorString!)}
                        icon={AppearanceIcon}
                    />
                );
            }

            if (PermissionStore.getGuildPermissionProps(guild).canManageRoles) {
                children.unshift(
                    <Menu.MenuItem
                        id="vc-edit-role"
                        label="Edit Role"
                        action={async () => {
                            await GuildSettingsActions.open(guild.id, "ROLES");
                            GuildSettingsActions.selectRole(id);
                        }}
                        icon={PencilIcon}
                    />
                );
            }

            if (role.icon) {
                children.push(
                    <Menu.MenuItem
                        id="vc-view-role-icon"
                        label="View Role Icon"
                        action={() => {
                            openImageModal({
                                url: `${location.protocol}//${window.GLOBAL_ENV.CDN_HOST}/role-icons/${role.id}/${role.icon}.${settings.store.roleIconFileFormat}`,
                                height: 128,
                                width: 128
                            });
                        }}
                        icon={ImageIcon}
                    />

                );
            }
        }
    }
});
