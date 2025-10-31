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

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import { copyWithToast } from "@utils/misc";
import definePlugin, { OptionType } from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { Menu } from "@webpack/common";

const { convertNameToSurrogate } = findByPropsLazy("convertNameToSurrogate");

interface Emoji {
    type: string;
    id: string;
    name: string;
}

interface Target {
    dataset: Emoji;
    firstChild: HTMLImageElement;
}

function getEmojiMarkdown(target: Target, copyUnicode: boolean): string {
    const { id: emojiId, name: emojiName } = target.dataset;

    if (!emojiId) {
        return copyUnicode
            ? convertNameToSurrogate(emojiName)
            : `:${emojiName}:`;
    }

    const url = new URL(target.firstChild.src);
    const hasParam = url.searchParams.get("animated") === "true";
    const isGif = url.pathname.endsWith(".gif");

    return `<${(hasParam || isGif) ? "a" : ""}:${emojiName.replace(/~\d+$/, "")}:${emojiId}>`;
}

const settings = definePluginSettings({
    copyUnicode: {
        type: OptionType.BOOLEAN,
        description: "Copy the raw unicode character instead of :name: for default emojis (👽)",
        default: true,
    },
});

export default definePlugin({
    name: "CopyEmojiMarkdown",
    description: "Allows you to copy emojis as formatted string (<:blobcatcozy:1026533070955872337>)",
    authors: [Devs.HappyEnderman, Devs.Vishnya],
    settings,

    contextMenus: {
        "expression-picker"(children, { target }: { target: Target; }) {
            if (target.dataset.type !== "emoji") return;

            children.push(
                <Menu.MenuItem
                    id="vc-copy-emoji-markdown"
                    label="Copy Emoji Markdown"
                    action={() => {
                        copyWithToast(
                            getEmojiMarkdown(target, settings.store.copyUnicode),
                            "Success! Copied emoji markdown."
                        );
                    }}
                />
            );
        },
    },
});
