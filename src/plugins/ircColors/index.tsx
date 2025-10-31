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

import { findGroupChildrenByChildId, NavContextMenuPatchCallback } from "@api/ContextMenu";
import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { Menu, Toasts } from "@webpack/common";

import { CustomUserColorsSettings } from "./settings";

type UserColorRule = {
    userId: string;
    color: string;
};

const makeEmptyUserColorRule = (): UserColorRule => ({
    userId: "",
    color: ""
});

const makeEmptyUserColorArray = () => [makeEmptyUserColorRule()];

function calculateNameColorForUser(id?: string) {
    const { userColorRules } = settings.store;

    const customColor = userColorRules.find(rule => rule.userId === id && rule.userId !== "");
    if (customColor) {
        return `#${customColor.color}`;
    }

    return null;
}

const settings = definePluginSettings({
    memberListColors: {
        description: "Replace role colors in the member list",
        restartNeeded: true,
        type: OptionType.BOOLEAN,
        default: true
    },
    applyColorOnlyToUsersWithoutColor: {
        description: "Apply colors only to users who don't have a predefined color",
        restartNeeded: false,
        type: OptionType.BOOLEAN,
        default: false
    },
    applyColorOnlyInDms: {
        description: "Apply colors only in direct messages; do not apply colors in servers.",
        restartNeeded: false,
        type: OptionType.BOOLEAN,
        default: false
    },
    userColors: {
        type: OptionType.COMPONENT,
        component: () => {
            const { userColorRules } = settings.use(["userColorRules"]);
            return <CustomUserColorsSettings userColorRules={userColorRules} />;
        },
        description: "Custom colors for specific users"
    },
    userColorRules: {
        type: OptionType.CUSTOM,
        default: makeEmptyUserColorArray(),
    }
});

function userHasCustomColor(userId: string): boolean {
    return settings.store.userColorRules.some(r => r.userId === userId && r.userId !== "");
}

function addCustomUserColor(userId: string, color: string) {
    const rules = settings.store.userColorRules;
    const existingIndex = rules.findIndex(r => r.userId === userId);

    if (existingIndex !== -1 && existingIndex !== rules.length - 1) {
        rules[existingIndex].color = color;
    } else {
        const lastIndex = rules.length - 1;
        if (rules[lastIndex] && !rules[lastIndex].userId) {
            rules[lastIndex] = { userId, color };
        } else {
            rules.push({ userId, color });
        }
        rules.push(makeEmptyUserColorRule());
    }

    Toasts.show({
        message: "Added custom color for user",
        id: Toasts.genId(),
        type: Toasts.Type.SUCCESS
    });
}

function removeCustomUserColor(userId: string) {
    const rules = settings.store.userColorRules;
    const index = rules.findIndex(r => r.userId === userId);

    if (index !== -1 && index !== rules.length - 1) {
        rules.splice(index, 1);

        Toasts.show({
            message: "Removed custom color for user",
            id: Toasts.genId(),
            type: Toasts.Type.SUCCESS
        });
    }
}

const userContextMenuPatch: NavContextMenuPatchCallback = (children, props) => {
    const userId = props?.user?.id;
    if (!userId) return;

    const group = findGroupChildrenByChildId("devmode-copy-id", children);
    if (group) {
        const hasCustomColor = userHasCustomColor(userId);

        group.push(
            <Menu.MenuItem
                key="vc-custom-user-color"
                id="vc-custom-user-color"
                label={hasCustomColor ? "Remove Custom Color" : "Set Custom Color"}
                action={() => {
                    if (hasCustomColor) {
                        removeCustomUserColor(userId);
                    } else {
                        addCustomUserColor(userId, "ff0000");
                    }
                }}
            />
        );
    }
};

export default definePlugin({
    name: "IrcColors",
    description: "Custom username colors for specific users",
    authors: [Devs.Grzesiek11, Devs.jamesbt365],
    settings,

    contextMenus: {
        "user-context": userContextMenuPatch
    },

    patches: [
        {
            find: '="SYSTEM_TAG"',
            replacement: {
                match: /(?<=colorString:\i,colorStrings:\i,colorRoleName:\i.*?}=)(\i),/,
                replace: "$self.wrapMessageColorProps($1, arguments[0]),"
            }
        },
        {
            find: "#{intl::GUILD_OWNER}),children:",
            replacement: {
                match: /(?<=roleName:\i,)colorString:/,
                replace: "colorString:$self.calculateNameColorForListContext(arguments[0]),originalColor:"
            },
            predicate: () => settings.store.memberListColors
        }
    ],

    wrapMessageColorProps(colorProps: { colorString: string, colorStrings?: Record<"primaryColor" | "secondaryColor" | "tertiaryColor", string>; }, context: any) {
        try {
            const colorString = this.calculateNameColorForMessageContext(context);
            if (!colorString || colorString === colorProps.colorString) {
                return colorProps;
            }

            return {
                ...colorProps,
                colorString,
                colorStrings: colorProps.colorStrings && {
                    primaryColor: colorString,
                    secondaryColor: undefined,
                    tertiaryColor: undefined
                }
            };
        } catch (e) {
            console.error("Failed to calculate message color strings:", e);
            return colorProps;
        }
    },

    calculateNameColorForMessageContext(context: any) {
        const userId: string | undefined = context?.message?.author?.id;
        const colorString = context?.author?.colorString;
        const color = calculateNameColorForUser(userId);

        if (context?.message?.channel_id === "1337" && userId === "313337")
            return colorString;

        if (settings.store.applyColorOnlyInDms && !context?.channel?.isPrivate()) {
            return colorString;
        }

        return (!settings.store.applyColorOnlyToUsersWithoutColor || !colorString)
            ? color
            : colorString;
    },

    calculateNameColorForListContext(context: any) {
        try {
            const id = context?.user?.id;
            const colorString = context?.colorString;
            const color = calculateNameColorForUser(id);

            if (settings.store.applyColorOnlyInDms && !context?.channel?.isPrivate()) {
                return colorString;
            }

            return (!settings.store.applyColorOnlyToUsersWithoutColor || !colorString)
                ? color
                : colorString;
        } catch (e) {
            console.error("Failed to calculate name color for list context:", e);
        }
    }
});
